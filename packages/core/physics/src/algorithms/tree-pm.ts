import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "@teskooano/data-types";
import { GRAVITATIONAL_CONSTANT } from "@teskooano/data-values";
import {
  ForceCalculationAlgorithm,
  AlgorithmConfig,
} from "./force-calculation-algorithm";

/**
 * Configuration for Tree-PM hybrid algorithm
 */
export interface TreePMConfig {
  /** Density threshold above which to use Tree method (particles/grid_cell) */
  treeThreshold: number;
  /** PM grid size (number of cells per dimension) */
  pmGridSize: number;
  /** Force smoothing length for PM calculation */
  smoothingLength: number;
  /** Tree opening angle (theta parameter) */
  treeOpeningAngle: number;
  /** Maximum tree depth */
  maxTreeDepth: number;
  /** Direct sum cutoff (below this distance, use direct sum) */
  directCutoff: number;
}

/**
 * Default Tree-PM configuration
 */
export const DEFAULT_TREE_PM_CONFIG: TreePMConfig = {
  treeThreshold: 5.0, // 5 particles per cell threshold
  pmGridSize: 16, // 16^3 grid (4,096 cells instead of 262,144)
  smoothingLength: 1.0, // Smoothing length in simulation units
  treeOpeningAngle: 0.5, // Standard Barnes-Hut opening angle
  maxTreeDepth: 20, // Maximum tree recursion depth
  directCutoff: 2.5, // Direct sum below 2.5 smoothing lengths
};

/**
 * Grid cell data for PM calculation
 */
interface PMCell {
  density: number;
  potential: number;
  force: OSVector3;
  centerOfMass: OSVector3;
  totalMass: number;
  particleCount: number;
}

/**
 * Tree node for high-density regions
 */
interface TreeNode {
  bounds: {
    min: OSVector3;
    max: OSVector3;
  };
  centerOfMass: OSVector3;
  totalMass: number;
  particleCount: number;
  particles: string[];
  children?: TreeNode[];
  isLeaf: boolean;
}

/**
 * Tree-PM Hybrid Algorithm using WASM spatial partitioning
 *
 * This algorithm combines the strengths of both Tree and Particle-Mesh methods:
 * - Uses PM method for long-range forces in low-density regions (faster)
 * - Uses Tree method for short-range forces in high-density regions (more accurate)
 *
 * The algorithm uses WASM spatial partitioning for efficient neighbor finding
 * and automatically partitions space based on density thresholds.
 */
export class TreePMAlgorithm implements ForceCalculationAlgorithm {
  private tempPositions: Float32Array = new Float32Array(1000 * 3); // Pre-allocate for performance
  private bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;

  // Pre-allocated vectors for mesh creation to avoid memory allocation
  private tempMin = new OSVector3();
  private tempMax = new OSVector3();
  private tempCellMin = new OSVector3();
  private tempCellMax = new OSVector3();
  private tempCenterOfMass = new OSVector3();
  private tempPosition = new OSVector3();

  private config: TreePMConfig;
  private pmGrid: PMCell[][][];
  private gridSpacing: number;
  private simulationBounds: { min: OSVector3; max: OSVector3 };

  constructor(
    private spatialPartitioning: any,
    dependencies?: {
      bodiesToFloat32Array?: (bodies: PhysicsStateReal[]) => Float32Array;
    },
    config: Partial<TreePMConfig> = {},
  ) {
    this.bodiesToFloat32Array = dependencies?.bodiesToFloat32Array;
    this.config = { ...DEFAULT_TREE_PM_CONFIG, ...config };
    this.pmGrid = [];
    this.gridSpacing = 0;
    this.simulationBounds = {
      min: new OSVector3(0, 0, 0),
      max: new OSVector3(0, 0, 0),
    };
  }

  /**
   * Calculate acceleration for a target body using Tree-PM hybrid method
   */
  calculateAcceleration(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    config: AlgorithmConfig,
  ): OSVector3 {
    if (!this.spatialPartitioning.isInitialized()) {
      console.warn(
        "WASM spatial partitioning not initialized, skipping acceleration calculation",
      );
      return new OSVector3(0, 0, 0);
    }

    // Use WASM spatial partitioning to build neighbor graph
    const positions = this.bodiesToFloat32Array
      ? this.bodiesToFloat32Array(allBodies)
      : this.bodiesToFloat32ArrayFallback(allBodies);
    const threshold = config.neighborDistance || 1000 * 1.496e11; // Default 1000 AU
    const neighborGraph = this.spatialPartitioning.createNearByGraph(
      positions,
      threshold,
    );

    // Validate that neighbor graph indices are within bounds
    if (neighborGraph.length !== allBodies.length) {
      console.warn(
        `Neighbor graph length (${neighborGraph.length}) doesn't match bodies length (${allBodies.length})`,
      );
    }

    // Additional validation: check if any neighbor indices are out of bounds
    for (let i = 0; i < neighborGraph.length; i++) {
      const neighbors = neighborGraph[i];
      for (const neighborIndex of neighbors) {
        if (neighborIndex >= allBodies.length) {
          console.error(
            `CRITICAL: Neighbor graph contains invalid index ${neighborIndex} for body ${i} (${allBodies[i]?.id}), bodies length: ${allBodies.length}`,
          );
          console.error(
            `Positions array length: ${positions.length / 3}, Bodies count: ${allBodies.length}`,
          );
          break;
        }
      }
    }

    // Find the index of the target body
    const targetIndex = allBodies.findIndex(
      (body) => body.id === targetBody.id,
    );

    if (targetIndex === -1) {
      return new OSVector3(0, 0, 0);
    }

    // Calculate Tree-PM forces using neighbor graph
    return this.calculateTreePMForces(
      targetBody,
      allBodies,
      neighborGraph,
      targetIndex,
      threshold,
    );
  }

  /**
   * Calculate Tree-PM forces for a target body
   * Optimized to reduce vector allocations and improve performance
   */
  private calculateTreePMForces(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    neighborGraph: number[][],
    targetIndex: number,
    threshold: number,
  ): OSVector3 {
    const acceleration = new OSVector3(0, 0, 0);
    const G = GRAVITATIONAL_CONSTANT;
    const softeningSquared = 0.1 * 1.496e11 * (0.1 * 1.496e11); // Pre-calculate softening squared

    // Get neighbors from the graph
    const neighbors = neighborGraph[targetIndex] || [];

    // Tree-PM method combines:
    // 1. Direct particle-particle calculation for nearby particles (Tree method)
    // 2. Particle-mesh calculation for long-range forces (PM method)

    // Direct calculation for neighbors (short-range forces using Tree method)
    for (const neighborIndex of neighbors) {
      if (neighborIndex === targetIndex) continue;

      // Bounds check to ensure neighborIndex is valid
      if (neighborIndex < 0 || neighborIndex >= allBodies.length) {
        console.warn(
          `Invalid neighbor index: ${neighborIndex}, bodies length: ${allBodies.length}`,
        );
        continue;
      }

      const neighborBody = allBodies[neighborIndex];

      // Additional safety check
      if (!neighborBody || !neighborBody.position_m) {
        console.warn(
          `Invalid neighbor body at index ${neighborIndex}:`,
          neighborBody,
        );
        continue;
      }

      // Calculate distance vector components directly
      const dx = neighborBody.position_m.x - targetBody.position_m.x;
      const dy = neighborBody.position_m.y - targetBody.position_m.y;
      const dz = neighborBody.position_m.z - targetBody.position_m.z;

      const rMagSquared = dx * dx + dy * dy + dz * dz;

      if (rMagSquared > 0) {
        // Apply softening to avoid singularities (using squared values)
        const rSoftSquared = rMagSquared + softeningSquared;
        const forceMag = (G * neighborBody.mass_kg) / rSoftSquared;

        // Calculate force components directly without creating intermediate vectors
        const rMag = Math.sqrt(rMagSquared);
        const forceScale = forceMag / rMag;

        acceleration.x += dx * forceScale;
        acceleration.y += dy * forceScale;
        acceleration.z += dz * forceScale;
      }
    }

    // Particle-mesh calculation for long-range forces
    const meshForce = this.calculateMeshForce(
      targetBody,
      allBodies,
      neighbors,
      targetIndex,
    );
    acceleration.add(meshForce);

    return acceleration;
  }

  /**
   * Calculate long-range forces using particle-mesh method
   */
  private calculateMeshForce(
    targetBody: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    neighbors: number[],
    targetIndex: number,
  ): OSVector3 {
    // Simplified particle-mesh calculation
    const meshForce = new OSVector3(0, 0, 0);
    const G = GRAVITATIONAL_CONSTANT;

    // Calculate forces from distant particles (not in neighbors)
    const distantBodies = allBodies.filter(
      (_, index) => !neighbors.includes(index) && index !== targetIndex,
    );

    if (distantBodies.length === 0) return meshForce;

    // Create a simple mesh representation
    const mesh = this.createMesh(distantBodies);

    // Calculate force from mesh
    for (const cell of mesh) {
      if (cell.totalMass > 0) {
        const r = cell.centerOfMass.clone().sub(targetBody.position_m);
        const rMag = r.length();

        if (rMag > 1000 * 1.496e11) {
          // Only for very distant particles
          const forceMag = (G * cell.totalMass) / (rMag * rMag);
          meshForce.add(r.clone().multiplyScalar(forceMag / rMag));
        }
      }
    }

    return meshForce;
  }

  /**
   * Create a simple mesh representation of distant bodies (optimized version)
   */
  private createMesh(bodies: PhysicsStateReal[]): Array<{
    centerOfMass: OSVector3;
    totalMass: number;
  }> {
    if (bodies.length === 0) return [];

    // Adaptive grid size based on number of bodies to balance performance vs accuracy
    const adaptiveGridSize = Math.min(
      this.config.pmGridSize,
      Math.max(8, Math.floor(Math.cbrt(bodies.length * 4))), // Scale with body count
    );

    // Find bounding box using pre-allocated vectors
    const firstBody = bodies[0];
    this.tempMin.set(
      firstBody.position_m.x,
      firstBody.position_m.y,
      firstBody.position_m.z,
    );
    this.tempMax.set(
      firstBody.position_m.x,
      firstBody.position_m.y,
      firstBody.position_m.z,
    );

    // Single pass through bodies to find bounds
    for (let i = 1; i < bodies.length; i++) {
      const pos = bodies[i].position_m;
      this.tempMin.x = Math.min(this.tempMin.x, pos.x);
      this.tempMin.y = Math.min(this.tempMin.y, pos.y);
      this.tempMin.z = Math.min(this.tempMin.z, pos.z);
      this.tempMax.x = Math.max(this.tempMax.x, pos.x);
      this.tempMax.y = Math.max(this.tempMax.y, pos.y);
      this.tempMax.z = Math.max(this.tempMax.z, pos.z);
    }

    // Calculate cell size using adaptive grid size
    const cellSize = Math.max(
      (this.tempMax.x - this.tempMin.x) / adaptiveGridSize,
      (this.tempMax.y - this.tempMin.y) / adaptiveGridSize,
      (this.tempMax.z - this.tempMin.z) / adaptiveGridSize,
    );

    // Pre-allocate mesh array with reasonable size estimate
    const mesh: Array<{
      centerOfMass: OSVector3;
      totalMass: number;
    }> = [];

    // Use spatial indexing instead of filtering all bodies for each cell
    const gridSize = adaptiveGridSize;
    const cellSizeInv = 1.0 / cellSize;

    // Pre-calculate cell indices for all bodies
    const bodyCellIndices: number[] = [];
    for (let i = 0; i < bodies.length; i++) {
      const pos = bodies[i].position_m;
      const cellX = Math.floor((pos.x - this.tempMin.x) * cellSizeInv);
      const cellY = Math.floor((pos.y - this.tempMin.y) * cellSizeInv);
      const cellZ = Math.floor((pos.z - this.tempMin.z) * cellSizeInv);

      // Clamp to valid range
      const clampedX = Math.max(0, Math.min(gridSize - 1, cellX));
      const clampedY = Math.max(0, Math.min(gridSize - 1, cellY));
      const clampedZ = Math.max(0, Math.min(gridSize - 1, cellZ));

      bodyCellIndices[i] =
        clampedX * gridSize * gridSize + clampedY * gridSize + clampedZ;
    }

    // Group bodies by cell index
    const cellBodies: { [cellIndex: number]: number[] } = {};
    for (let i = 0; i < bodies.length; i++) {
      const cellIndex = bodyCellIndices[i];
      if (!cellBodies[cellIndex]) {
        cellBodies[cellIndex] = [];
      }
      cellBodies[cellIndex].push(i);
    }

    // Process only cells that have bodies
    for (const cellIndexStr in cellBodies) {
      const cellIndex = parseInt(cellIndexStr);
      const bodyIndices = cellBodies[cellIndex];

      if (bodyIndices.length > 0) {
        // Calculate cell center of mass using pre-allocated vector
        let totalMass = 0;
        this.tempCenterOfMass.set(0, 0, 0);

        for (const bodyIndex of bodyIndices) {
          const body = bodies[bodyIndex];
          totalMass += body.mass_kg;

          // Use pre-allocated vector for position calculation
          this.tempPosition.set(
            body.position_m.x * body.mass_kg,
            body.position_m.y * body.mass_kg,
            body.position_m.z * body.mass_kg,
          );
          this.tempCenterOfMass.add(this.tempPosition);
        }

        if (totalMass > 0) {
          this.tempCenterOfMass.multiplyScalar(1 / totalMass);
          mesh.push({
            centerOfMass: this.tempCenterOfMass.clone(),
            totalMass,
          });
        }
      }
    }

    return mesh;
  }

  /**
   * Check if a position is within a cell
   */
  private isInCell(
    pos: OSVector3,
    cellMin: OSVector3,
    cellMax: OSVector3,
  ): boolean {
    return (
      pos.x >= cellMin.x &&
      pos.x < cellMax.x &&
      pos.y >= cellMin.y &&
      pos.y < cellMax.y &&
      pos.z >= cellMin.z &&
      pos.z < cellMax.z
    );
  }

  /**
   * Convert bodies to Float32Array for WASM library (fallback implementation)
   */
  private bodiesToFloat32ArrayFallback(
    bodies: PhysicsStateReal[],
  ): Float32Array {
    // Reuse pre-allocated array if possible
    if (bodies.length * 3 > this.tempPositions.length) {
      this.tempPositions = new Float32Array(bodies.length * 3);
    }

    for (let i = 0; i < bodies.length; i++) {
      const body = bodies[i];
      const idx = i * 3;
      this.tempPositions[idx] = body.position_m.x;
      this.tempPositions[idx + 1] = body.position_m.y;
      this.tempPositions[idx + 2] = body.position_m.z;
    }

    return this.tempPositions.slice(0, bodies.length * 3);
  }

  /**
   * Initialize the algorithm with the given bodies
   */
  initialize(bodies: PhysicsStateReal[]): void {
    // Tree-PM specific initialization if needed
    console.log(`Tree-PM Algorithm initialized with ${bodies.length} bodies`);
  }

  /**
   * Update the algorithm's internal state
   */
  update(bodies: PhysicsStateReal[]): void {
    // Tree-PM specific updates if needed
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Clean up Tree-PM specific resources
  }

  /**
   * Calculate the bounding box of all particles
   */
  private calculateSimulationBounds(
    bodies: Record<string, PhysicsStateReal>,
  ): void {
    const positions = Object.values(bodies).map((body) => body.position_m);

    if (positions.length === 0) return;

    const min = positions[0].clone();
    const max = positions[0].clone();

    positions.forEach((pos) => {
      min.x = Math.min(min.x, pos.x);
      min.y = Math.min(min.y, pos.y);
      min.z = Math.min(min.z, pos.z);
      max.x = Math.max(max.x, pos.x);
      max.y = Math.max(max.y, pos.y);
      max.z = Math.max(max.z, pos.z);
    });

    // Add some padding
    const padding = max.clone().sub(min).length() * 0.1;
    min.sub(new OSVector3(padding, padding, padding));
    max.add(new OSVector3(padding, padding, padding));

    this.simulationBounds = { min, max };
    this.gridSpacing = (max.x - min.x) / this.config.pmGridSize;
  }

  /**
   * Initialize the PM grid with empty cells
   */
  private initializePMGrid(): void {
    const size = this.config.pmGridSize;
    this.pmGrid = [];

    for (let i = 0; i < size; i++) {
      this.pmGrid[i] = [];
      for (let j = 0; j < size; j++) {
        this.pmGrid[i][j] = [];
        for (let k = 0; k < size; k++) {
          this.pmGrid[i][j][k] = {
            density: 0,
            potential: 0,
            force: new OSVector3(0, 0, 0),
            centerOfMass: new OSVector3(0, 0, 0),
            totalMass: 0,
            particleCount: 0,
          };
        }
      }
    }
  }

  /**
   * Assign particles to grid cells and calculate density
   */
  private assignParticlesToGrid(
    bodies: Record<string, PhysicsStateReal>,
  ): number[][][] {
    const densityMap: number[][][] = [];
    const size = this.config.pmGridSize;

    // Initialize density map
    for (let i = 0; i < size; i++) {
      densityMap[i] = [];
      for (let j = 0; j < size; j++) {
        densityMap[i][j] = new Array(size).fill(0);
      }
    }

    // Assign particles using Cloud-in-Cell (CIC) method
    Object.entries(bodies).forEach(([id, body]) => {
      const pos = body.position_m;
      const mass = body.mass_kg;

      // Convert position to grid coordinates
      const gx = (pos.x - this.simulationBounds.min.x) / this.gridSpacing;
      const gy = (pos.y - this.simulationBounds.min.y) / this.gridSpacing;
      const gz = (pos.z - this.simulationBounds.min.z) / this.gridSpacing;

      // CIC assignment to 8 nearest cells
      const i0 = Math.floor(gx),
        i1 = i0 + 1;
      const j0 = Math.floor(gy),
        j1 = j0 + 1;
      const k0 = Math.floor(gz),
        k1 = k0 + 1;

      const dx = gx - i0,
        dy = gy - j0,
        dz = gz - k0;
      const dx1 = 1 - dx,
        dy1 = 1 - dy,
        dz1 = 1 - dz;

      // Weights for 8 corners
      const weights = [
        dx1 * dy1 * dz1,
        dx * dy1 * dz1,
        dx1 * dy * dz1,
        dx * dy * dz1,
        dx1 * dy1 * dz,
        dx * dy1 * dz,
        dx1 * dy * dz,
        dx * dy * dz,
      ];

      const corners = [
        [i0, j0, k0],
        [i1, j0, k0],
        [i0, j1, k0],
        [i1, j1, k0],
        [i0, j0, k1],
        [i1, j0, k1],
        [i0, j1, k1],
        [i1, j1, k1],
      ];

      corners.forEach(([i, j, k], idx) => {
        if (i >= 0 && i < size && j >= 0 && j < size && k >= 0 && k < size) {
          const weight = weights[idx];
          this.pmGrid[i][j][k].density += mass * weight;
          this.pmGrid[i][j][k].totalMass += mass * weight;
          this.pmGrid[i][j][k].particleCount += weight;
          densityMap[i][j][k] += weight;
        }
      });
    });

    return densityMap;
  }

  /**
   * Identify high-density regions that should use tree method
   */
  private identifyHighDensityRegions(densityMap: number[][][]): Set<string> {
    const highDensityRegions = new Set<string>();
    const size = this.config.pmGridSize;

    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        for (let k = 0; k < size; k++) {
          if (densityMap[i][j][k] > this.config.treeThreshold) {
            highDensityRegions.add(`${i},${j},${k}`);
          }
        }
      }
    }

    return highDensityRegions;
  }

  /**
   * Calculate long-range forces using Particle-Mesh method
   */
  private calculatePMForces(
    bodies: Record<string, PhysicsStateReal>,
    forces: Record<string, OSVector3>,
    G: number,
  ): void {
    // Simplified PM force calculation
    // In a full implementation, this would use FFT to solve Poisson equation
    const size = this.config.pmGridSize;

    Object.entries(bodies).forEach(([id, body]) => {
      const pos = body.position_m;
      const pmForce = new OSVector3(0, 0, 0);

      // Calculate force from distant grid cells
      for (let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
          for (let k = 0; k < size; k++) {
            const cell = this.pmGrid[i][j][k];
            if (cell.totalMass === 0) continue;

            // Grid cell center position
            const cellPos = new OSVector3(
              this.simulationBounds.min.x + (i + 0.5) * this.gridSpacing,
              this.simulationBounds.min.y + (j + 0.5) * this.gridSpacing,
              this.simulationBounds.min.z + (k + 0.5) * this.gridSpacing,
            );

            const r = pos.clone().sub(cellPos);
            const rMag = r.length();

            if (rMag > this.config.smoothingLength) {
              // Apply softened gravitational force
              const softening = this.config.smoothingLength;
              const rSoft = Math.sqrt(rMag * rMag + softening * softening);
              const forceMag =
                (G * body.mass_kg * cell.totalMass) / (rSoft * rSoft * rSoft);
              pmForce.sub(r.clone().multiplyScalar(forceMag / rMag));
            }
          }
        }
      }

      forces[id].add(pmForce);
    });
  }

  /**
   * Calculate short-range forces using Tree method for high-density regions
   */
  private calculateTreeForces(
    bodies: Record<string, PhysicsStateReal>,
    forces: Record<string, OSVector3>,
    highDensityRegions: Set<string>,
    G: number,
  ): void {
    if (highDensityRegions.size === 0) return;

    // Build tree for particles in high-density regions
    const treeBodies: Record<string, PhysicsStateReal> = {};

    Object.entries(bodies).forEach(([id, body]) => {
      const pos = body.position_m;
      const gx = Math.floor(
        (pos.x - this.simulationBounds.min.x) / this.gridSpacing,
      );
      const gy = Math.floor(
        (pos.y - this.simulationBounds.min.y) / this.gridSpacing,
      );
      const gz = Math.floor(
        (pos.z - this.simulationBounds.min.z) / this.gridSpacing,
      );

      if (highDensityRegions.has(`${gx},${gy},${gz}`)) {
        treeBodies[id] = body;
      }
    });

    // Build octree for tree bodies
    const tree = this.buildOctree(treeBodies);

    // Calculate tree forces
    Object.entries(treeBodies).forEach(([id, body]) => {
      const treeForce = this.calculateTreeForce(body, tree, G);
      forces[id].add(treeForce);
    });
  }

  /**
   * Build octree for tree calculation
   */
  private buildOctree(bodies: Record<string, PhysicsStateReal>): TreeNode {
    const bodyIds = Object.keys(bodies);
    if (bodyIds.length === 0) {
      throw new Error("Cannot build tree with no particles");
    }

    const root: TreeNode = {
      bounds: { ...this.simulationBounds },
      centerOfMass: new OSVector3(0, 0, 0),
      totalMass: 0,
      particleCount: bodyIds.length,
      particles: bodyIds,
      isLeaf: false,
    };

    this.subdivideNode(root, bodies, 0);
    return root;
  }

  /**
   * Recursively subdivide tree node
   */
  private subdivideNode(
    node: TreeNode,
    bodies: Record<string, PhysicsStateReal>,
    depth: number,
  ): void {
    // Calculate center of mass and total mass
    let totalMass = 0;
    const weightedPos = new OSVector3(0, 0, 0);

    node.particles.forEach((id) => {
      const body = bodies[id];
      totalMass += body.mass_kg;
      weightedPos.add(body.position_m.clone().multiplyScalar(body.mass_kg));
    });

    node.totalMass = totalMass;
    node.centerOfMass = weightedPos.multiplyScalar(1 / totalMass);

    // Stop subdivision conditions
    if (node.particles.length <= 1 || depth >= this.config.maxTreeDepth) {
      node.isLeaf = true;
      return;
    }

    // Subdivide into 8 octants
    const center = node.bounds.min
      .clone()
      .add(node.bounds.max)
      .multiplyScalar(0.5);
    node.children = [];

    for (let i = 0; i < 8; i++) {
      const child: TreeNode = {
        bounds: {
          min: new OSVector3(
            i & 1 ? center.x : node.bounds.min.x,
            i & 2 ? center.y : node.bounds.min.y,
            i & 4 ? center.z : node.bounds.min.z,
          ),
          max: new OSVector3(
            i & 1 ? node.bounds.max.x : center.x,
            i & 2 ? node.bounds.max.y : center.y,
            i & 4 ? node.bounds.max.z : center.z,
          ),
        },
        centerOfMass: new OSVector3(0, 0, 0),
        totalMass: 0,
        particleCount: 0,
        particles: [],
        isLeaf: false,
      };

      // Assign particles to child
      node.particles.forEach((id) => {
        const pos = bodies[id].position_m;
        if (this.isInBounds(pos, child.bounds)) {
          child.particles.push(id);
        }
      });

      if (child.particles.length > 0) {
        node.children.push(child);
        this.subdivideNode(child, bodies, depth + 1);
      }
    }

    node.isLeaf = node.children.length === 0;
  }

  /**
   * Check if point is within bounds
   */
  private isInBounds(
    pos: OSVector3,
    bounds: { min: OSVector3; max: OSVector3 },
  ): boolean {
    return (
      pos.x >= bounds.min.x &&
      pos.x < bounds.max.x &&
      pos.y >= bounds.min.y &&
      pos.y < bounds.max.y &&
      pos.z >= bounds.min.z &&
      pos.z < bounds.max.z
    );
  }

  /**
   * Calculate force on a particle using tree traversal
   */
  private calculateTreeForce(
    body: PhysicsStateReal,
    node: TreeNode,
    G: number,
  ): OSVector3 {
    if (node.totalMass === 0) return new OSVector3(0, 0, 0);

    const r = body.position_m.clone().sub(node.centerOfMass);
    const rMag = r.length();

    if (rMag === 0) return new OSVector3(0, 0, 0);

    // Opening angle criterion
    const boxSize = node.bounds.max.clone().sub(node.bounds.min).length();
    const theta = boxSize / rMag;

    if (node.isLeaf || theta < this.config.treeOpeningAngle) {
      // Use this node's center of mass
      const forceMag =
        (G * body.mass_kg * node.totalMass) / (rMag * rMag * rMag);
      return r.clone().multiplyScalar(-forceMag);
    } else {
      // Recurse to children
      let force = new OSVector3(0, 0, 0);
      if (node.children) {
        node.children.forEach((child) => {
          force.add(this.calculateTreeForce(body, child, G));
        });
      }
      return force;
    }
  }

  /**
   * Apply corrections to avoid double-counting forces
   */
  private applyForceCorrections(
    bodies: Record<string, PhysicsStateReal>,
    forces: Record<string, OSVector3>,
    highDensityRegions: Set<string>,
    G: number,
  ): void {
    // Remove PM forces that were already calculated by tree method
    // This is a simplified correction - full implementation would be more sophisticated
    Object.entries(forces).forEach(([id, force]) => {
      const body = bodies[id];
      const pos = body.position_m;
      const gx = Math.floor(
        (pos.x - this.simulationBounds.min.x) / this.gridSpacing,
      );
      const gy = Math.floor(
        (pos.y - this.simulationBounds.min.y) / this.gridSpacing,
      );
      const gz = Math.floor(
        (pos.z - this.simulationBounds.min.z) / this.gridSpacing,
      );

      if (highDensityRegions.has(`${gx},${gy},${gz}`)) {
        // Reduce PM force contribution in high-density regions
        const correctionFactor = 0.5; // Simplified correction
        force.multiplyScalar(correctionFactor);
      }
    });
  }
}
