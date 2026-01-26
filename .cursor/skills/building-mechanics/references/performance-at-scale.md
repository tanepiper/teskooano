# Performance at Scale

Building systems face exponential complexity as component counts grow. A naive approach that works for 100 pieces will collapse at 1,000 and become unplayable at 10,000. This reference covers the spatial data structures, chunking strategies, and optimization patterns used by production games to handle massive player-built structures.

## The Scale Problem

Every building operation involves spatial queries: "What's near this position?", "Does this overlap anything?", "What supports this piece?" Without optimization, these queries scan every object—O(n) per query. With n queries per frame, you get O(n²) complexity.

**Real-world limits from production games:**

- Rust: ~150,000-200,000 colliders practical limit (Unity physics "goes nuts" beyond ~150k)
- Fortnite: 30Hz server tick to manage build/destruction load for 100 players
- Minecraft: 16×16×256 chunk system enabling effectively infinite worlds
- Valheim: New terrain system in patch 0.150.3 specifically to reduce network instances

The solution is spatial partitioning—organizing objects by location so queries only examine nearby candidates.

## Spatial Data Structures

### Spatial Hash Grid

The simplest spatial structure. Divide world space into a uniform grid of cells. Each cell stores references to objects within it. Query time becomes O(1) for cell lookup plus O(k) for objects in that cell.

**Best for:**

- Uniform object distribution
- 2D or 2.5D games (terrain-based building)
- Simple implementation needs
- Component counts under 5,000

**Implementation pattern:**

```javascript
class SpatialHashGrid {
  constructor(cellSize = 10) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  _hash(x, y, z) {
    const cx = Math.floor(x / this.cellSize);
    const cy = Math.floor(y / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    return `${cx},${cy},${cz}`;
  }

  insert(object, position) {
    const key = this._hash(position.x, position.y, position.z);
    if (!this.cells.has(key)) {
      this.cells.set(key, new Set());
    }
    this.cells.get(key).add(object);
    object._spatialKey = key;
  }

  query(position, radius) {
    const results = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(position.x / this.cellSize);
    const cy = Math.floor(position.y / this.cellSize);
    const cz = Math.floor(position.z / this.cellSize);

    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dy = -cellRadius; dy <= cellRadius; dy++) {
        for (let dz = -cellRadius; dz <= cellRadius; dz++) {
          const key = `${cx + dx},${cy + dy},${cz + dz}`;
          const cell = this.cells.get(key);
          if (cell) {
            results.push(...cell);
          }
        }
      }
    }
    return results;
  }
}
```

**Tradeoffs:**

- Fixed cell size means wasted memory in sparse areas, overcrowded cells in dense areas
- Cell size tuning is critical: too small = many cells to check, too large = many objects per cell
- Rule of thumb: cell size ≈ 2-4× typical object size

### Octree

A tree structure that recursively subdivides 3D space into eight octants. Adapts to object density—sparse regions stay as large nodes while dense regions subdivide further.

**Best for:**

- Non-uniform object distribution (bases clustered in certain areas)
- True 3D queries (tall structures, flying/underwater building)
- Component counts 5,000-10,000+
- When memory efficiency matters

**Key insight from research:** Octrees are "more performant for large differences in spatial density" due to adaptive scaling.

**Implementation pattern:**

```javascript
class OctreeNode {
  constructor(bounds, depth = 0, maxDepth = 8, maxObjects = 8) {
    this.bounds = bounds; // { min: Vector3, max: Vector3 }
    this.depth = depth;
    this.maxDepth = maxDepth;
    this.maxObjects = maxObjects;
    this.objects = [];
    this.children = null; // Array of 8 OctreeNodes when subdivided
  }

  insert(object, position) {
    if (!this._containsPoint(position)) return false;

    if (this.children) {
      for (const child of this.children) {
        if (child.insert(object, position)) return true;
      }
      return false;
    }

    this.objects.push({ object, position });

    if (this.objects.length > this.maxObjects && this.depth < this.maxDepth) {
      this._subdivide();
    }
    return true;
  }

  queryRadius(center, radius, results = []) {
    if (!this._intersectsSphere(center, radius)) return results;

    for (const { object, position } of this.objects) {
      if (center.distanceTo(position) <= radius) {
        results.push(object);
      }
    }

    if (this.children) {
      for (const child of this.children) {
        child.queryRadius(center, radius, results);
      }
    }
    return results;
  }

  _subdivide() {
    const { min, max } = this.bounds;
    const mid = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);

    this.children = [];
    const corners = [
      [min.x, min.y, min.z],
      [mid.x, min.y, min.z],
      [min.x, mid.y, min.z],
      [mid.x, mid.y, min.z],
      [min.x, min.y, mid.z],
      [mid.x, min.y, mid.z],
      [min.x, mid.y, mid.z],
      [mid.x, mid.y, mid.z],
    ];

    for (let i = 0; i < 8; i++) {
      const [x, y, z] = corners[i];
      const childMin = new THREE.Vector3(x, y, z);
      const childMax = new THREE.Vector3(
        x + (max.x - min.x) / 2,
        y + (max.y - min.y) / 2,
        z + (max.z - min.z) / 2,
      );
      this.children.push(
        new OctreeNode(
          { min: childMin, max: childMax },
          this.depth + 1,
          this.maxDepth,
          this.maxObjects,
        ),
      );
    }

    // Redistribute existing objects
    for (const { object, position } of this.objects) {
      for (const child of this.children) {
        if (child.insert(object, position)) break;
      }
    }
    this.objects = [];
  }
}
```

### Decision Framework

| Component Count | Distribution | Recommendation                    |
| --------------- | ------------ | --------------------------------- |
| < 1,000         | Any          | Simple array with distance checks |
| 1,000 - 5,000   | Uniform      | Spatial hash grid                 |
| 1,000 - 5,000   | Clustered    | Octree                            |
| 5,000 - 10,000  | Any          | Octree                            |
| 10,000+         | Any          | Chunk system + octree per chunk   |

## Chunk-Based Loading

For open worlds, keep the entire structure in memory is impossible. Chunk systems divide the world into discrete regions that load/unload based on player proximity.

**Minecraft's approach:** 16×16×256 block chunks. Only chunks within render distance are loaded. This enables infinite horizontal worlds while keeping memory bounded.

**Key implementation concerns:**

1. **Chunk boundaries:** Objects spanning multiple chunks need special handling. Either assign to primary chunk or duplicate references.

2. **Loading priority:** Not all chunks are equal. Prioritize:
   - Chunks player is moving toward
   - Chunks containing player-owned structures
   - Chunks with recent activity

3. **Async loading:** Never block the main thread. Load chunk data in workers, then integrate on main thread.

```javascript
class ChunkManager {
  constructor(chunkSize = 64, loadDistance = 3) {
    this.chunkSize = chunkSize;
    this.loadDistance = loadDistance;
    this.chunks = new Map();
    this.loadQueue = [];
  }

  update(playerPosition) {
    const playerChunk = this._worldToChunk(playerPosition);

    // Queue chunks that should be loaded
    for (let dx = -this.loadDistance; dx <= this.loadDistance; dx++) {
      for (let dz = -this.loadDistance; dz <= this.loadDistance; dz++) {
        const key = `${playerChunk.x + dx},${playerChunk.z + dz}`;
        if (!this.chunks.has(key) && !this.loadQueue.includes(key)) {
          this.loadQueue.push(key);
        }
      }
    }

    // Unload distant chunks
    for (const [key, chunk] of this.chunks) {
      const [cx, cz] = key.split(",").map(Number);
      const dist = Math.max(
        Math.abs(cx - playerChunk.x),
        Math.abs(cz - playerChunk.z),
      );
      if (dist > this.loadDistance + 1) {
        this._unloadChunk(key);
      }
    }

    // Process load queue (limit per frame)
    this._processLoadQueue(2);
  }
}
```

## GPU Instancing

When thousands of building pieces use the same mesh (walls, floors, etc.), GPU instancing renders them in a single draw call. Instead of sending geometry repeatedly, send it once with a list of transformation matrices.

**Three.js implementation:**

```javascript
class InstancedBuildingRenderer {
  constructor(maxInstances = 10000) {
    this.maxInstances = maxInstances;
    this.instancedMeshes = new Map(); // meshType -> InstancedMesh
  }

  createInstancedMesh(type, geometry, material) {
    const mesh = new THREE.InstancedMesh(geometry, material, this.maxInstances);
    mesh.count = 0;
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.instancedMeshes.set(type, mesh);
    return mesh;
  }

  addInstance(type, position, rotation, scale) {
    const mesh = this.instancedMeshes.get(type);
    if (!mesh || mesh.count >= this.maxInstances) return -1;

    const matrix = new THREE.Matrix4();
    matrix.compose(position, rotation, scale);
    mesh.setMatrixAt(mesh.count, matrix);
    mesh.instanceMatrix.needsUpdate = true;
    return mesh.count++;
  }

  updateInstance(type, index, position, rotation, scale) {
    const mesh = this.instancedMeshes.get(type);
    if (!mesh || index >= mesh.count) return;

    const matrix = new THREE.Matrix4();
    matrix.compose(position, rotation, scale);
    mesh.setMatrixAt(index, matrix);
    mesh.instanceMatrix.needsUpdate = true;
  }
}
```

**Performance impact:** Fortnite's "Performance Mode" uses ultra-simplified "bubble wrap" meshes combined with aggressive instancing to maintain framerate during intense build battles.

## Occlusion Culling

Don't render what the camera can't see. For building interiors, this is critical—a large base might have 1,000 pieces but only 50 visible from inside a room.

**Rust's approach:** Dynamic occlusion system treating all world geometry as potential occluders. Trades one frame of latency for significant CPU savings on visibility calculations. The developers noted it cut a "good chunk of CPU-side overhead."

**Implementation strategies:**

1. **Frustum culling:** Built into Three.js. Objects outside camera view aren't rendered.

2. **Distance culling:** Simple but effective. Don't render objects beyond a threshold.

3. **Portal-based:** Define portals (doorways, windows) between rooms. Only render rooms visible through portals from camera position.

```javascript
class OcclusionSystem {
  constructor(camera) {
    this.camera = camera;
    this.frustum = new THREE.Frustum();
    this.projMatrix = new THREE.Matrix4();
  }

  update() {
    this.projMatrix.multiplyMatrices(
      this.camera.projectionMatrix,
      this.camera.matrixWorldInverse,
    );
    this.frustum.setFromProjectionMatrix(this.projMatrix);
  }

  isVisible(object, maxDistance = 500) {
    // Distance check
    const distance = this.camera.position.distanceTo(object.position);
    if (distance > maxDistance) return false;

    // Frustum check
    if (object.geometry?.boundingSphere) {
      const sphere = object.geometry.boundingSphere.clone();
      sphere.applyMatrix4(object.matrixWorld);
      return this.frustum.intersectsSphere(sphere);
    }

    return this.frustum.containsPoint(object.position);
  }
}
```

## Level of Detail (LOD)

Replace detailed meshes with simpler versions at distance. A wall might have 500 triangles up close, 50 at medium range, and 8 at far range.

**Three.js LOD setup:**

```javascript
function createBuildingLOD(detailedGeo, mediumGeo, simpleGeo, material) {
  const lod = new THREE.LOD();

  lod.addLevel(new THREE.Mesh(detailedGeo, material), 0); // 0-20 units
  lod.addLevel(new THREE.Mesh(mediumGeo, material), 20); // 20-50 units
  lod.addLevel(new THREE.Mesh(simpleGeo, material), 50); // 50+ units

  return lod;
}
```

**Combining with instancing:** At distance, switch from individual LOD objects to instanced batches of the simplest mesh. This gives you the best of both worlds—detail up close, massive throughput at distance.

## Memory Management

Building systems can consume gigabytes if not careful. Key strategies:

1. **Object pooling:** Reuse removed pieces instead of garbage collecting them.

2. **Geometry sharing:** Never duplicate geometry. Store one copy per piece type.

3. **Lazy loading:** Don't load textures/materials until a piece type is actually placed.

4. **Building IDs:** Rust uses building IDs for fast queries—all pieces in a structure share an ID, enabling efficient ownership checks and grouped operations.

```javascript
class BuildingPool {
  constructor() {
    this.pools = new Map(); // type -> array of inactive objects
  }

  acquire(type, createFn) {
    const pool = this.pools.get(type);
    if (pool && pool.length > 0) {
      const obj = pool.pop();
      obj.visible = true;
      return obj;
    }
    return createFn();
  }

  release(type, object) {
    object.visible = false;
    if (!this.pools.has(type)) {
      this.pools.set(type, []);
    }
    this.pools.get(type).push(object);
  }
}
```

## Performance Targets

Based on industry benchmarks:

| Platform             | Target FPS | Max Active Colliders | Draw Calls |
| -------------------- | ---------- | -------------------- | ---------- |
| Desktop (RTX 3060)   | 60         | 10,000               | < 500      |
| Desktop (integrated) | 30         | 2,000                | < 200      |
| Mobile (iPhone 12)   | 30-60      | 1,000                | < 100      |
| Mobile (older)       | 30         | 500                  | < 50       |

**Measuring in Three.js:**

```javascript
const stats = new Stats();
document.body.appendChild(stats.dom);

// In render loop
stats.begin();
renderer.render(scene, camera);
stats.end();

// Log renderer info periodically
console.log("Draw calls:", renderer.info.render.calls);
console.log("Triangles:", renderer.info.render.triangles);
console.log("Geometries:", renderer.info.memory.geometries);
```

## Integration Checklist

When implementing performance systems in your building mechanics:

- [ ] Choose spatial structure based on expected component count and distribution
- [ ] Implement chunk loading for open-world games
- [ ] Use instancing for repeated building pieces (walls, floors, etc.)
- [ ] Add distance-based culling as minimum optimization
- [ ] Pool frequently created/destroyed objects
- [ ] Profile regularly with target hardware
- [ ] Set hard limits and degrade gracefully when exceeded

## Related References

- `octree.js` - Complete octree implementation
- `spatial-hash-grid.js` - Spatial hash grid implementation
- `chunk-manager.js` - Chunk loading/unloading system
- `performance-profiler.js` - Benchmarking utilities
- `structural-validation.md` - How spatial queries support structural checks
