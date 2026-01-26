/**
 * Octree - Adaptive spatial partitioning for building systems
 *
 * Best for: Non-uniform object distribution, true 3D queries, 5000-10000+ components
 * Automatically subdivides dense regions while keeping sparse regions as large nodes
 *
 * Usage:
 *   const bounds = { min: new THREE.Vector3(-500, 0, -500), max: new THREE.Vector3(500, 100, 500) };
 *   const octree = new Octree(bounds);
 *   octree.insert(buildingPiece, piece.position);
 *   const nearby = octree.queryRadius(position, 15);
 */

import * as THREE from "three";

export class OctreeNode {
  constructor(bounds, depth = 0, config = {}) {
    this.bounds = bounds; // { min: Vector3, max: Vector3 }
    this.depth = depth;
    this.maxDepth = config.maxDepth ?? 8;
    this.maxObjects = config.maxObjects ?? 8;
    this.minSize = config.minSize ?? 1;

    this.objects = [];
    this.children = null;
    this.objectCount = 0;
  }

  /**
   * Get center point of this node
   */
  get center() {
    return new THREE.Vector3()
      .addVectors(this.bounds.min, this.bounds.max)
      .multiplyScalar(0.5);
  }

  /**
   * Get size of this node
   */
  get size() {
    return new THREE.Vector3().subVectors(this.bounds.max, this.bounds.min);
  }

  /**
   * Check if point is within bounds
   */
  containsPoint(point) {
    return (
      point.x >= this.bounds.min.x &&
      point.x <= this.bounds.max.x &&
      point.y >= this.bounds.min.y &&
      point.y <= this.bounds.max.y &&
      point.z >= this.bounds.min.z &&
      point.z <= this.bounds.max.z
    );
  }

  /**
   * Check if bounds intersect a sphere
   */
  intersectsSphere(center, radius) {
    const closest = new THREE.Vector3(
      Math.max(this.bounds.min.x, Math.min(center.x, this.bounds.max.x)),
      Math.max(this.bounds.min.y, Math.min(center.y, this.bounds.max.y)),
      Math.max(this.bounds.min.z, Math.min(center.z, this.bounds.max.z)),
    );
    return closest.distanceToSquared(center) <= radius * radius;
  }

  /**
   * Check if bounds intersect another AABB
   */
  intersectsBounds(other) {
    return (
      this.bounds.min.x <= other.max.x &&
      this.bounds.max.x >= other.min.x &&
      this.bounds.min.y <= other.max.y &&
      this.bounds.max.y >= other.min.y &&
      this.bounds.min.z <= other.max.z &&
      this.bounds.max.z >= other.min.z
    );
  }

  /**
   * Insert object at position
   */
  insert(object, position) {
    if (!this.containsPoint(position)) {
      return false;
    }

    // If subdivided, insert into appropriate child
    if (this.children) {
      for (const child of this.children) {
        if (child.insert(object, position)) {
          this.objectCount++;
          return true;
        }
      }
      return false;
    }

    // Add to this node
    this.objects.push({ object, position: position.clone() });
    this.objectCount++;

    // Check if we should subdivide
    const nodeSize = this.size;
    const canSubdivide =
      this.objects.length > this.maxObjects &&
      this.depth < this.maxDepth &&
      nodeSize.x > this.minSize &&
      nodeSize.y > this.minSize &&
      nodeSize.z > this.minSize;

    if (canSubdivide) {
      this._subdivide();
    }

    return true;
  }

  /**
   * Insert object with bounding box (may span multiple nodes)
   */
  insertWithBounds(object, objectBounds) {
    if (!this.intersectsBounds(objectBounds)) {
      return false;
    }

    // If subdivided, try children first
    if (this.children) {
      let inserted = false;
      for (const child of this.children) {
        if (child.insertWithBounds(object, objectBounds)) {
          inserted = true;
        }
      }
      if (inserted) {
        this.objectCount++;
        return true;
      }
    }

    // Store at this level if bounds span multiple children or we're a leaf
    this.objects.push({
      object,
      position: new THREE.Vector3()
        .addVectors(objectBounds.min, objectBounds.max)
        .multiplyScalar(0.5),
      bounds: objectBounds,
    });
    this.objectCount++;
    return true;
  }

  /**
   * Remove object from octree
   */
  remove(object) {
    // Check this node's objects
    const index = this.objects.findIndex((entry) => entry.object === object);
    if (index !== -1) {
      this.objects.splice(index, 1);
      this.objectCount--;
      this._tryCollapse();
      return true;
    }

    // Check children
    if (this.children) {
      for (const child of this.children) {
        if (child.remove(object)) {
          this.objectCount--;
          this._tryCollapse();
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Update object position
   */
  update(object, newPosition) {
    if (this.remove(object)) {
      return this.insert(object, newPosition);
    }
    return false;
  }

  /**
   * Query objects within radius of position
   */
  queryRadius(center, radius, results = []) {
    if (!this.intersectsSphere(center, radius)) {
      return results;
    }

    const radiusSq = radius * radius;

    // Check objects at this level
    for (const { object, position } of this.objects) {
      if (position.distanceToSquared(center) <= radiusSq) {
        results.push(object);
      }
    }

    // Check children
    if (this.children) {
      for (const child of this.children) {
        child.queryRadius(center, radius, results);
      }
    }

    return results;
  }

  /**
   * Query objects within AABB bounds
   */
  queryBounds(queryBounds, results = []) {
    if (!this.intersectsBounds(queryBounds)) {
      return results;
    }

    // Check objects at this level
    for (const { object, position } of this.objects) {
      if (
        position.x >= queryBounds.min.x &&
        position.x <= queryBounds.max.x &&
        position.y >= queryBounds.min.y &&
        position.y <= queryBounds.max.y &&
        position.z >= queryBounds.min.z &&
        position.z <= queryBounds.max.z
      ) {
        results.push(object);
      }
    }

    // Check children
    if (this.children) {
      for (const child of this.children) {
        child.queryBounds(queryBounds, results);
      }
    }

    return results;
  }

  /**
   * Find all objects along a ray
   */
  queryRay(ray, maxDistance = Infinity, results = []) {
    // Quick rejection test using ray-box intersection
    const invDir = new THREE.Vector3(
      1 / ray.direction.x,
      1 / ray.direction.y,
      1 / ray.direction.z,
    );

    const t1 = (this.bounds.min.x - ray.origin.x) * invDir.x;
    const t2 = (this.bounds.max.x - ray.origin.x) * invDir.x;
    const t3 = (this.bounds.min.y - ray.origin.y) * invDir.y;
    const t4 = (this.bounds.max.y - ray.origin.y) * invDir.y;
    const t5 = (this.bounds.min.z - ray.origin.z) * invDir.z;
    const t6 = (this.bounds.max.z - ray.origin.z) * invDir.z;

    const tmin = Math.max(Math.min(t1, t2), Math.min(t3, t4), Math.min(t5, t6));
    const tmax = Math.min(Math.max(t1, t2), Math.max(t3, t4), Math.max(t5, t6));

    if (tmax < 0 || tmin > tmax || tmin > maxDistance) {
      return results;
    }

    // Check objects at this level
    for (const { object, position } of this.objects) {
      const closestPoint = new THREE.Vector3();
      ray.closestPointToPoint(position, closestPoint);
      const dist = position.distanceTo(closestPoint);
      const rayDist = ray.origin.distanceTo(closestPoint);

      if (dist < 1 && rayDist <= maxDistance) {
        // 1 unit tolerance
        results.push({ object, distance: rayDist });
      }
    }

    // Check children
    if (this.children) {
      for (const child of this.children) {
        child.queryRay(ray, maxDistance, results);
      }
    }

    return results;
  }

  /**
   * Find nearest object to position
   */
  findNearest(position, maxDistance = Infinity) {
    let nearest = null;
    let nearestDistSq = maxDistance * maxDistance;

    const search = (node) => {
      // Check objects at this level
      for (const { object, position: objPos } of node.objects) {
        const distSq = objPos.distanceToSquared(position);
        if (distSq < nearestDistSq) {
          nearestDistSq = distSq;
          nearest = object;
        }
      }

      // Check children, prioritizing by distance to bounds
      if (node.children) {
        const sortedChildren = [...node.children].sort((a, b) => {
          const distA = this._distToBounds(position, a.bounds);
          const distB = this._distToBounds(position, b.bounds);
          return distA - distB;
        });

        for (const child of sortedChildren) {
          // Skip if closest possible point is farther than current best
          const minDist = this._distToBounds(position, child.bounds);
          if (minDist * minDist >= nearestDistSq) continue;

          search(child);
        }
      }
    };

    search(this);
    return nearest;
  }

  /**
   * Get all objects in octree
   */
  getAllObjects(results = []) {
    for (const { object } of this.objects) {
      results.push(object);
    }

    if (this.children) {
      for (const child of this.children) {
        child.getAllObjects(results);
      }
    }

    return results;
  }

  /**
   * Subdivide this node into 8 children
   */
  _subdivide() {
    const { min, max } = this.bounds;
    const mid = this.center;

    this.children = [];

    // Create 8 children for each octant
    const octants = [
      {
        min: new THREE.Vector3(min.x, min.y, min.z),
        max: new THREE.Vector3(mid.x, mid.y, mid.z),
      },
      {
        min: new THREE.Vector3(mid.x, min.y, min.z),
        max: new THREE.Vector3(max.x, mid.y, mid.z),
      },
      {
        min: new THREE.Vector3(min.x, mid.y, min.z),
        max: new THREE.Vector3(mid.x, max.y, mid.z),
      },
      {
        min: new THREE.Vector3(mid.x, mid.y, min.z),
        max: new THREE.Vector3(max.x, max.y, mid.z),
      },
      {
        min: new THREE.Vector3(min.x, min.y, mid.z),
        max: new THREE.Vector3(mid.x, mid.y, max.z),
      },
      {
        min: new THREE.Vector3(mid.x, min.y, mid.z),
        max: new THREE.Vector3(max.x, mid.y, max.z),
      },
      {
        min: new THREE.Vector3(min.x, mid.y, mid.z),
        max: new THREE.Vector3(mid.x, max.y, max.z),
      },
      {
        min: new THREE.Vector3(mid.x, mid.y, mid.z),
        max: new THREE.Vector3(max.x, max.y, max.z),
      },
    ];

    for (const octant of octants) {
      this.children.push(
        new OctreeNode(octant, this.depth + 1, {
          maxDepth: this.maxDepth,
          maxObjects: this.maxObjects,
          minSize: this.minSize,
        }),
      );
    }

    // Redistribute objects to children
    const objectsToRedistribute = this.objects;
    this.objects = [];

    for (const { object, position } of objectsToRedistribute) {
      let inserted = false;
      for (const child of this.children) {
        if (child.containsPoint(position)) {
          child.objects.push({ object, position });
          child.objectCount++;
          inserted = true;
          break;
        }
      }
      // Keep objects that don't fit in children (edge cases)
      if (!inserted) {
        this.objects.push({ object, position });
      }
    }
  }

  /**
   * Try to collapse children back into this node
   */
  _tryCollapse() {
    if (!this.children) return;

    // Check if we should collapse
    let totalObjects = this.objects.length;
    for (const child of this.children) {
      if (child.children) return; // Don't collapse if any child is subdivided
      totalObjects += child.objects.length;
    }

    if (totalObjects <= this.maxObjects / 2) {
      // Collect all objects from children
      for (const child of this.children) {
        this.objects.push(...child.objects);
      }
      this.children = null;
    }
  }

  /**
   * Distance from point to bounds
   */
  _distToBounds(point, bounds) {
    const closest = new THREE.Vector3(
      Math.max(bounds.min.x, Math.min(point.x, bounds.max.x)),
      Math.max(bounds.min.y, Math.min(point.y, bounds.max.y)),
      Math.max(bounds.min.z, Math.min(point.z, bounds.max.z)),
    );
    return point.distanceTo(closest);
  }

  /**
   * Get statistics about octree structure
   */
  getStats() {
    let nodeCount = 1;
    let leafCount = 0;
    let maxDepthReached = this.depth;
    let objectsInLeaves = 0;
    let objectsInBranches = this.objects.length;

    const traverse = (node) => {
      if (node.children) {
        objectsInBranches += node.objects.length;
        for (const child of node.children) {
          nodeCount++;
          maxDepthReached = Math.max(maxDepthReached, child.depth);
          traverse(child);
        }
      } else {
        leafCount++;
        objectsInLeaves += node.objects.length;
      }
    };

    if (this.children) {
      for (const child of this.children) {
        nodeCount++;
        maxDepthReached = Math.max(maxDepthReached, child.depth);
        traverse(child);
      }
    } else {
      leafCount = 1;
      objectsInLeaves = this.objects.length;
      objectsInBranches = 0;
    }

    return {
      nodeCount,
      leafCount,
      maxDepth: maxDepthReached,
      totalObjects: this.objectCount,
      objectsInLeaves,
      objectsInBranches,
      avgObjectsPerLeaf: leafCount > 0 ? objectsInLeaves / leafCount : 0,
    };
  }

  /**
   * Clear all data
   */
  clear() {
    this.objects = [];
    this.children = null;
    this.objectCount = 0;
  }

  /**
   * Create debug visualization
   */
  createDebugMesh(scene, options = {}) {
    const {
      showEmpty = false,
      leafColor = 0x00ff00,
      branchColor = 0x0088ff,
      opacity = 0.2,
    } = options;

    const group = new THREE.Group();
    group.name = "OctreeDebug";

    const traverse = (node) => {
      const hasObjects = node.objects.length > 0;
      const isLeaf = !node.children;

      if (hasObjects || showEmpty) {
        const size = node.size;
        const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
          color: isLeaf ? leafColor : branchColor,
          transparent: true,
          opacity: hasObjects ? opacity : opacity * 0.3,
        });
        const line = new THREE.LineSegments(edges, material);
        line.position.copy(node.center);
        group.add(line);
      }

      if (node.children) {
        for (const child of node.children) {
          traverse(child);
        }
      }
    };

    traverse(this);
    scene.add(group);
    return group;
  }
}

/**
 * Convenience wrapper with common configuration
 */
export class Octree extends OctreeNode {
  constructor(bounds, config = {}) {
    super(bounds, 0, {
      maxDepth: config.maxDepth ?? 8,
      maxObjects: config.maxObjects ?? 8,
      minSize: config.minSize ?? 1,
    });
  }

  /**
   * Create octree with automatic bounds from objects
   */
  static fromObjects(objects, getPosition, padding = 10) {
    if (objects.length === 0) {
      return new Octree({
        min: new THREE.Vector3(-100, -100, -100),
        max: new THREE.Vector3(100, 100, 100),
      });
    }

    const min = new THREE.Vector3(Infinity, Infinity, Infinity);
    const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

    for (const obj of objects) {
      const pos = getPosition(obj);
      min.min(pos);
      max.max(pos);
    }

    min.subScalar(padding);
    max.addScalar(padding);

    const octree = new Octree({ min, max });

    for (const obj of objects) {
      octree.insert(obj, getPosition(obj));
    }

    return octree;
  }
}

export default Octree;
