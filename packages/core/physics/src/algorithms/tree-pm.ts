import { OSVector3 } from "@teskooano/core-math";
import type { PhysicsStateReal } from "@teskooano/data-types";
import type { IAlgorithmStrategy, SimulationParameters } from "../interfaces/simulation-strategy";
import { AlgorithmStrategy } from "../interfaces/algorithm-strategy";

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
  treeThreshold: 5.0,      // 5 particles per cell threshold
  pmGridSize: 64,          // 64^3 grid
  smoothingLength: 1.0,    // Smoothing length in simulation units
  treeOpeningAngle: 0.5,   // Standard Barnes-Hut opening angle
  maxTreeDepth: 20,        // Maximum tree recursion depth
  directCutoff: 2.5,       // Direct sum below 2.5 smoothing lengths
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
 * Tree-PM Hybrid Algorithm Strategy
 * 
 * This algorithm combines the strengths of both Tree and Particle-Mesh methods:
 * - Uses PM method for long-range forces in low-density regions (faster)
 * - Uses Tree method for short-range forces in high-density regions (more accurate)
 * 
 * The algorithm automatically partitions space based on density thresholds,
 * providing optimal performance across different density scales.
 */
export class TreePMStrategy extends AlgorithmStrategy {
  readonly name = "tree-pm";
  readonly complexity = "O(N log N)";
  readonly recommendedMinBodies = 1000;
  readonly recommendedMaxBodies = 1000000;

  private config: TreePMConfig;
  private pmGrid: PMCell[][][];
  private gridSpacing: number;
  private simulationBounds: { min: OSVector3; max: OSVector3 };

  constructor(config: Partial<TreePMConfig> = {}) {
    super();
    this.config = { ...DEFAULT_TREE_PM_CONFIG, ...config };
    this.pmGrid = [];
    this.gridSpacing = 0;
    this.simulationBounds = { min: new OSVector3(0, 0, 0), max: new OSVector3(0, 0, 0) };
  }

  calculateForces(
    bodies: Record<string, PhysicsStateReal>,
    params: SimulationParameters
  ): Record<string, OSVector3> {
    const bodyIds = Object.keys(bodies);
    const forces: Record<string, OSVector3> = {};

    // Initialize forces
    bodyIds.forEach(id => {
      forces[id] = new OSVector3(0, 0, 0);
    });

    if (bodyIds.length === 0) return forces;

    // Step 1: Calculate simulation bounds
    this.calculateSimulationBounds(bodies);

    // Step 2: Initialize PM grid
    this.initializePMGrid();

    // Step 3: Assign particles to grid and identify high-density regions
    const densityMap = this.assignParticlesToGrid(bodies);
    const highDensityRegions = this.identifyHighDensityRegions(densityMap);

         // Step 4: Calculate PM forces for long-range interactions
     const G = 6.67430e-11; // Gravitational constant (standard units)
     this.calculatePMForces(bodies, forces, G);

     // Step 5: Calculate Tree forces for high-density regions
     this.calculateTreeForces(bodies, forces, highDensityRegions, G);

     // Step 6: Apply corrections to avoid double-counting
     this.applyForceCorrections(bodies, forces, highDensityRegions, G);

    return forces;
  }

  /**
   * Calculate the bounding box of all particles
   */
  private calculateSimulationBounds(bodies: Record<string, PhysicsStateReal>): void {
    const positions = Object.values(bodies).map(body => body.position_m);
    
    if (positions.length === 0) return;

    const min = positions[0].clone();
    const max = positions[0].clone();

    positions.forEach(pos => {
      min.x = Math.min(min.x, pos.x);
      min.y = Math.min(min.y, pos.y);
      min.z = Math.min(min.z, pos.z);
      max.x = Math.max(max.x, pos.x);
      max.y = Math.max(max.y, pos.y);
      max.z = Math.max(max.z, pos.z);
    });

    // Add some padding
    const padding = (max.clone().sub(min)).length() * 0.1;
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
  private assignParticlesToGrid(bodies: Record<string, PhysicsStateReal>): number[][][] {
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
      const i0 = Math.floor(gx), i1 = i0 + 1;
      const j0 = Math.floor(gy), j1 = j0 + 1;
      const k0 = Math.floor(gz), k1 = k0 + 1;

      const dx = gx - i0, dy = gy - j0, dz = gz - k0;
      const dx1 = 1 - dx, dy1 = 1 - dy, dz1 = 1 - dz;

      // Weights for 8 corners
      const weights = [
        dx1 * dy1 * dz1, dx * dy1 * dz1, dx1 * dy * dz1, dx * dy * dz1,
        dx1 * dy1 * dz, dx * dy1 * dz, dx1 * dy * dz, dx * dy * dz
      ];

      const corners = [
        [i0, j0, k0], [i1, j0, k0], [i0, j1, k0], [i1, j1, k0],
        [i0, j0, k1], [i1, j0, k1], [i0, j1, k1], [i1, j1, k1]
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
    G: number
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
              this.simulationBounds.min.z + (k + 0.5) * this.gridSpacing
            );

            const r = pos.clone().sub(cellPos);
            const rMag = r.length();

            if (rMag > this.config.smoothingLength) {
              // Apply softened gravitational force
              const softening = this.config.smoothingLength;
              const rSoft = Math.sqrt(rMag * rMag + softening * softening);
              const forceMag = G * body.mass_kg * cell.totalMass / (rSoft * rSoft * rSoft);
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
    G: number
  ): void {
    if (highDensityRegions.size === 0) return;

    // Build tree for particles in high-density regions
    const treeBodies: Record<string, PhysicsStateReal> = {};
    
    Object.entries(bodies).forEach(([id, body]) => {
      const pos = body.position_m;
      const gx = Math.floor((pos.x - this.simulationBounds.min.x) / this.gridSpacing);
      const gy = Math.floor((pos.y - this.simulationBounds.min.y) / this.gridSpacing);
      const gz = Math.floor((pos.z - this.simulationBounds.min.z) / this.gridSpacing);
      
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
  private subdivideNode(node: TreeNode, bodies: Record<string, PhysicsStateReal>, depth: number): void {
    // Calculate center of mass and total mass
    let totalMass = 0;
    const weightedPos = new OSVector3(0, 0, 0);

    node.particles.forEach(id => {
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
    const center = node.bounds.min.clone().add(node.bounds.max).multiplyScalar(0.5);
    node.children = [];

    for (let i = 0; i < 8; i++) {
      const child: TreeNode = {
        bounds: {
          min: new OSVector3(
            i & 1 ? center.x : node.bounds.min.x,
            i & 2 ? center.y : node.bounds.min.y,
            i & 4 ? center.z : node.bounds.min.z
          ),
          max: new OSVector3(
            i & 1 ? node.bounds.max.x : center.x,
            i & 2 ? node.bounds.max.y : center.y,
            i & 4 ? node.bounds.max.z : center.z
          ),
        },
        centerOfMass: new OSVector3(0, 0, 0),
        totalMass: 0,
        particleCount: 0,
        particles: [],
        isLeaf: false,
      };

      // Assign particles to child
      node.particles.forEach(id => {
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
  private isInBounds(pos: OSVector3, bounds: { min: OSVector3; max: OSVector3 }): boolean {
    return pos.x >= bounds.min.x && pos.x < bounds.max.x &&
           pos.y >= bounds.min.y && pos.y < bounds.max.y &&
           pos.z >= bounds.min.z && pos.z < bounds.max.z;
  }

  /**
   * Calculate force on a particle using tree traversal
   */
  private calculateTreeForce(body: PhysicsStateReal, node: TreeNode, G: number): OSVector3 {
    if (node.totalMass === 0) return new OSVector3(0, 0, 0);

    const r = body.position_m.clone().sub(node.centerOfMass);
    const rMag = r.length();

    if (rMag === 0) return new OSVector3(0, 0, 0);

    // Opening angle criterion
    const boxSize = node.bounds.max.clone().sub(node.bounds.min).length();
    const theta = boxSize / rMag;

    if (node.isLeaf || theta < this.config.treeOpeningAngle) {
      // Use this node's center of mass
      const forceMag = G * body.mass_kg * node.totalMass / (rMag * rMag * rMag);
      return r.clone().multiplyScalar(-forceMag);
    } else {
      // Recurse to children
      let force = new OSVector3(0, 0, 0);
      if (node.children) {
        node.children.forEach(child => {
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
    G: number
  ): void {
    // Remove PM forces that were already calculated by tree method
    // This is a simplified correction - full implementation would be more sophisticated
    Object.entries(forces).forEach(([id, force]) => {
      const body = bodies[id];
      const pos = body.position_m;
      const gx = Math.floor((pos.x - this.simulationBounds.min.x) / this.gridSpacing);
      const gy = Math.floor((pos.y - this.simulationBounds.min.y) / this.gridSpacing);
      const gz = Math.floor((pos.z - this.simulationBounds.min.z) / this.gridSpacing);
      
      if (highDensityRegions.has(`${gx},${gy},${gz}`)) {
        // Reduce PM force contribution in high-density regions
        const correctionFactor = 0.5; // Simplified correction
        force.multiplyScalar(correctionFactor);
      }
    });
  }

  isOptimalFor(bodyCount: number): boolean {
    return bodyCount >= this.recommendedMinBodies && bodyCount <= this.recommendedMaxBodies;
  }
}