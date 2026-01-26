# Physics System Optimization Plan

Based on comprehensive analysis of the physics lifecycle and comparison with particle physics best practices.

## Executive Summary

The physics system is well-architected with O(N log N) algorithms but has significant optimization opportunities:

1. **Immediate Wins**: Fix vector allocation hell (21k+ allocations/sec)
2. **Medium-Term**: Web Worker parallelization, incremental octree updates
3. **Long-Term**: GPU compute shaders for N-body calculations

---

## Current Architecture

```
Frame Start
    ↓
SimulationOrchestrator.createPhysicsCallback()
    ↓
SimulationManager.simulate()
    ├─ WASM Spatial Partitioning Update (O(N log N))
    ├─ Barnes-Hut Force Calculation (O(N log N))
    │   └─ Octree rebuild (if positions changed)
    ├─ Velocity Verlet Integration (O(N))
    │   └─ 7+ vector clones PER BODY PER FRAME ← BOTTLENECK
    └─ Collision Detection (O(N log N))
    ↓
State Update
```

---

## Phase 1: Immediate Wins (1-2 days)

### 1.1 Eliminate Vector Allocation in Verlet Integrator

**Problem**: `velocityVerletIntegrate()` creates 7+ cloned vectors per body per frame.

```typescript
// CURRENT (7 allocations per call)
const pos = currentState.position_m.clone();      // 1
const vel = currentState.velocity_mps.clone();    // 2
const acc = acceleration.clone();                  // 3
const newPosition = pos.clone()...                // 4
const halfVel = vel.clone()...                    // 5
const newVelocity = halfVel.clone()...           // 6
// Plus intermediate vectors in chained operations
```

**Solution**: Use pre-allocated vectors or vector pool:

```typescript
// OPTIMIZED (0 allocations in hot path)
export class VelocityVerletIntegrator {
  // Pre-allocated working vectors
  private readonly pos = new OSVector3();
  private readonly vel = new OSVector3();
  private readonly acc = new OSVector3();
  private readonly newPos = new OSVector3();
  private readonly halfVel = new OSVector3();
  private readonly newVel = new OSVector3();
  private readonly newAcc = new OSVector3();

  integrate(
    currentState: PhysicsStateReal,
    acceleration: OSVector3,
    calculateNewAcceleration: (state: PhysicsStateReal) => OSVector3,
    dt: number,
    out: PhysicsStateReal, // Reuse output object
  ): PhysicsStateReal {
    if (dt === 0) return currentState;

    const halfDt = 0.5 * dt;
    const halfDtSq = 0.5 * dt * dt;

    // Copy to working vectors (no allocation)
    this.pos.copy(currentState.position_m);
    this.vel.copy(currentState.velocity_mps);
    this.acc.copy(acceleration);

    // newPos = pos + vel*dt + 0.5*acc*dt²
    this.newPos
      .copy(this.pos)
      .addScaledVector(this.vel, dt)
      .addScaledVector(this.acc, halfDtSq);

    // halfVel = vel + 0.5*acc*dt
    this.halfVel.copy(this.vel).addScaledVector(this.acc, halfDt);

    // Calculate new acceleration at predicted position
    out.position_m.copy(this.newPos);
    out.velocity_mps.copy(this.halfVel);
    const newAccResult = calculateNewAcceleration(out);
    this.newAcc.copy(newAccResult);

    // newVel = halfVel + 0.5*newAcc*dt
    this.newVel.copy(this.halfVel).addScaledVector(this.newAcc, halfDt);

    // Update output (reuse object)
    out.id = currentState.id;
    out.mass_kg = currentState.mass_kg;
    out.position_m.copy(this.newPos);
    out.velocity_mps.copy(this.newVel);

    return out;
  }
}
```

**Impact**: ~95% reduction in vector allocations → reduced GC pauses

### 1.2 Use Vector Pool in Gravity Calculations

**Current**: `calculateNewtonianGravitationalForce()` already has `out` parameter but it's optional.

**Fix**: Always pass output vector from pool:

```typescript
// In force calculation loop
const forceVec = vectorPool.get();
calculateNewtonianGravitationalForce(body1, body2, G, forceVec);
// ... use forceVec ...
vectorPool.release(forceVec);
```

### 1.3 Pre-allocate State Arrays

**Problem**: `PhysicsStateReal[]` arrays created each frame.

**Solution**: Maintain pre-allocated state buffer:

```typescript
class StateBuffer {
  private states: PhysicsStateReal[] = [];
  private positions: OSVector3[] = [];
  private velocities: OSVector3[] = [];

  ensureCapacity(count: number): void {
    while (this.states.length < count) {
      const pos = new OSVector3();
      const vel = new OSVector3();
      this.positions.push(pos);
      this.velocities.push(vel);
      this.states.push({
        id: "",
        mass_kg: 0,
        position_m: pos,
        velocity_mps: vel,
      });
    }
  }

  getState(index: number): PhysicsStateReal {
    return this.states[index];
  }
}
```

---

## Phase 2: Medium-Term Optimizations (1-2 weeks)

### 2.1 Incremental Octree Updates

**Problem**: Octree is fully rebuilt when any body moves.

**Current hash check is too coarse**:

```typescript
// Only checks body count and first/last IDs
return `${bodies.length}_${bodies[0]?.id}_${bodies[bodies.length - 1]?.id}`;
```

**Solution**: Incremental octree with dirty tracking:

```typescript
class IncrementalOctree {
  private nodePool: OctreeNode[] = [];
  private dirtyNodes: Set<OctreeNode> = new Set();

  // Track body position changes
  updateBody(body: PhysicsStateReal, oldPosition: OSVector3): void {
    const oldNode = this.findNode(oldPosition);
    const newNode = this.findNode(body.position_m);

    if (oldNode !== newNode) {
      // Body moved to different node
      oldNode.removeBody(body);
      newNode.addBody(body);
      this.dirtyNodes.add(oldNode);
      this.dirtyNodes.add(newNode);
    }
  }

  // Only recalculate mass distributions for dirty nodes
  updateMassDistributions(): void {
    for (const node of this.dirtyNodes) {
      node.recalculateMassDistribution();
      // Propagate up to parent
      let parent = node.parent;
      while (parent) {
        parent.recalculateMassDistribution();
        parent = parent.parent;
      }
    }
    this.dirtyNodes.clear();
  }
}
```

**Impact**: O(k log N) updates where k = number of bodies that changed nodes (usually << N)

### 2.2 Web Worker for Force Calculations

**Pattern from existing code**: Trail system already uses Web Workers effectively.

```typescript
// physics.worker.ts
self.onmessage = (e: MessageEvent) => {
  const { type, bodies, config } = e.data;

  switch (type) {
    case "CALCULATE_FORCES": {
      // Bodies arrive as ArrayBuffer for zero-copy transfer
      const positions = new Float32Array(e.data.positionBuffer);
      const masses = new Float32Array(e.data.massBuffer);
      const accelerations = new Float32Array(bodies.length * 3);

      // Calculate forces (can be parallelized further)
      calculateBarnesHutForces(positions, masses, accelerations, config);

      // Transfer back (zero-copy)
      self.postMessage(
        {
          type: "FORCES_CALCULATED",
          accelerationBuffer: accelerations.buffer,
        },
        [accelerations.buffer],
      );
      break;
    }
  }
};
```

**Main thread**:

```typescript
class PhysicsWorkerManager {
  private worker: Worker;
  private pendingResolve?: (accelerations: Float32Array) => void;

  async calculateForcesAsync(
    bodies: PhysicsStateReal[],
  ): Promise<Float32Array> {
    // Pack data into typed arrays
    const positionBuffer = new Float32Array(bodies.length * 3);
    const massBuffer = new Float32Array(bodies.length);

    for (let i = 0; i < bodies.length; i++) {
      positionBuffer[i * 3] = bodies[i].position_m.x;
      positionBuffer[i * 3 + 1] = bodies[i].position_m.y;
      positionBuffer[i * 3 + 2] = bodies[i].position_m.z;
      massBuffer[i] = bodies[i].mass_kg;
    }

    return new Promise((resolve) => {
      this.pendingResolve = resolve;
      this.worker.postMessage(
        {
          type: "CALCULATE_FORCES",
          positionBuffer: positionBuffer.buffer,
          massBuffer: massBuffer.buffer,
          config: { theta: 0.5 },
        },
        [positionBuffer.buffer, massBuffer.buffer],
      );
    });
  }
}
```

### 2.3 SIMD Optimizations for Vector Operations

Check for SIMD support and use optimized paths:

```typescript
// Check SIMD availability (WebAssembly SIMD or WASM)
const hasSIMD =
  typeof WebAssembly !== "undefined" &&
  WebAssembly.validate(
    new Uint8Array([
      0x00, 0x61, 0x73, 0x6d, 0x01, 0x00, 0x00, 0x00,
      // ... SIMD feature detection bytes
    ]),
  );

// SIMD-optimized batch operations
function batchAddScaledVector(
  positions: Float32Array,
  velocities: Float32Array,
  scale: number,
  count: number,
): void {
  // Process 4 at a time with SIMD
  // Fallback to scalar for remainder
}
```

---

## Phase 3: GPU Acceleration (2-4 weeks)

### 3.1 GPU N-Body Force Calculation

**Existing pattern to follow**: Asteroid field uses GPU instancing with shader-based movement.

```glsl
// nbody-forces.compute.glsl (WebGPU compute shader)
@group(0) @binding(0) var<storage, read> positions: array<vec3f>;
@group(0) @binding(1) var<storage, read> masses: array<f32>;
@group(0) @binding(2) var<storage, read_write> accelerations: array<vec3f>;

@compute @workgroup_size(64)
fn main(@builtin(global_invocation_id) id: vec3u) {
  let i = id.x;
  if (i >= arrayLength(&positions)) { return; }

  var acc = vec3f(0.0);
  let myPos = positions[i];

  // Barnes-Hut approximation on GPU would require octree in buffer
  // Simpler: direct summation with softening (works for < 1000 bodies)
  for (var j = 0u; j < arrayLength(&positions); j++) {
    if (i == j) { continue; }

    let dir = positions[j] - myPos;
    let distSq = dot(dir, dir) + SOFTENING;
    let invDist = inverseSqrt(distSq);
    let invDistCube = invDist * invDist * invDist;

    acc += dir * masses[j] * invDistCube;
  }

  accelerations[i] = acc * G;
}
```

### 3.2 Hybrid CPU/GPU Approach

For planetary systems (< 100 bodies), CPU Barnes-Hut is sufficient.
For asteroid fields (1000+ bodies), use GPU direct summation.

```typescript
class HybridPhysicsEngine {
  private gpuThreshold = 100; // Bodies above this use GPU

  async calculateForces(
    bodies: PhysicsStateReal[],
  ): Promise<Map<string, OSVector3>> {
    if (bodies.length < this.gpuThreshold || !this.gpuAvailable) {
      return this.cpuBarnesHut(bodies);
    }

    // Separate into gravitational centers (planets) and particles (asteroids)
    const centers = bodies.filter((b) => b.mass_kg > ASTEROID_MASS_THRESHOLD);
    const particles = bodies.filter(
      (b) => b.mass_kg <= ASTEROID_MASS_THRESHOLD,
    );

    // CPU: Calculate forces between centers (high accuracy needed)
    const centerForces = await this.cpuBarnesHut(centers);

    // GPU: Calculate forces on particles from centers (can approximate)
    const particleForces = await this.gpuParticleForces(particles, centers);

    return new Map([...centerForces, ...particleForces]);
  }
}
```

---

## Performance Comparison

| Optimization       | Current          | Optimized             | Speedup         |
| ------------------ | ---------------- | --------------------- | --------------- |
| Vector allocations | 21k/sec          | ~0                    | ∞ (GC freed)    |
| Octree rebuild     | O(N) every frame | O(k log N)            | 10-100x         |
| Web Worker         | Single thread    | Off main thread       | Smoother frames |
| GPU forces         | N/A              | < 1ms for 1000 bodies | 10-100x         |

---

## Implementation Priority

### Week 1

- [ ] Refactor `velocityVerletIntegrate` to use pre-allocated vectors
- [ ] Integrate `vectorPool` into force calculations
- [ ] Add state buffer pre-allocation

### Week 2

- [ ] Implement incremental octree updates
- [ ] Add position change tracking

### Week 3-4

- [ ] Create physics Web Worker
- [ ] Implement zero-copy ArrayBuffer transfer
- [ ] Add SIMD detection and optimized paths

### Future

- [ ] WebGPU compute shader prototype
- [ ] Hybrid CPU/GPU engine
- [ ] Adaptive algorithm selection

---

## Files to Modify

1. **`packages/core/physics/src/integrators/verlet.ts`**
   - Convert to class with pre-allocated vectors
   - Add output parameter for state reuse

2. **`packages/core/physics/src/forces/gravity.ts`**
   - Make `out` parameter required in hot paths

3. **`packages/core/physics/src/spatial/octree.ts`**
   - Add incremental update support
   - Implement dirty node tracking

4. **`packages/core/physics/src/simulation/simulation-manager.ts`**
   - Add state buffer management
   - Integrate with Web Worker

5. **New files**:
   - `packages/core/physics/src/workers/physics.worker.ts`
   - `packages/core/physics/src/gpu/gpu-forces.ts` (future)

---

## Relation to Particle Physics Skills

The attached skills provide excellent patterns that apply directly:

| Skill Pattern                          | Physics Application                    |
| -------------------------------------- | -------------------------------------- |
| `particles-gpu` Buffer Geometry        | State arrays as typed arrays           |
| `particles-gpu` Instance Attributes    | Body properties as attributes          |
| `particles-physics` Verlet Integration | Already using, optimize allocations    |
| `particles-physics` Force Fields       | Barnes-Hut as hierarchical force field |
| `structural-physics` Stability         | Orbital stability validation           |
| `structural-physics` Cascade           | Collision cascade resolution           |

---

## Recorded in Nous

- `obs-physics-allocation-bottleneck`: Vector allocation issue
- `obs-physics-no-gpu`: CPU-only calculations
- `learn-existing-gpu-patterns`: Reusable patterns from particle systems
