import { OSVector3 } from '@teskooano/core-math';
import { PhysicsStateReal } from '../types';
import { calculateNewtonianGravitationalForce as calculateGravitationalForce } from '../forces/gravity';

/**
 * Represents a node in the octree
 */
interface OctreeNode {
  /** The center point of this node (OSVector3, meters) */
  center: OSVector3;
  /** The size of this node (half-width, meters) */
  size: number;
  /** The bodies contained directly in this node */
  bodies: PhysicsStateReal[];
  /** Child nodes (if any) */
  children?: OctreeNode[];
  /** The total mass of all bodies within this node and its children (kg) */
  totalMass_kg: number;
  /** The center of mass of all bodies within this node and its children (OSVector3, meters) */
  centerOfMass_m: OSVector3;
  /** The minimum x coordinate of this node */
  minX: number;
  /** The maximum x coordinate of this node */
  maxX: number;
  /** The minimum y coordinate of this node */
  minY: number;
  /** The maximum y coordinate of this node */
  maxY: number;
  /** The minimum z coordinate of this node */
  minZ: number;
  /** The maximum z coordinate of this node */
  maxZ: number;
}

/**
 * Creates a new octree node
 */
const createNode = (center: OSVector3, size: number): OctreeNode => ({
  center,
  size,
  bodies: [],
  totalMass_kg: 0,
  centerOfMass_m: center.clone(),
  minX: center.x - size,
  maxX: center.x + size,
  minY: center.y - size,
  maxY: center.y + size,
  minZ: center.z - size,
  maxZ: center.z + size,
});

/**
 * Checks if a point (OSVector3) is within the bounds of a node
 */
const isInBounds = (point: OSVector3, node: OctreeNode): boolean => {
  return (
    point.x >= node.minX &&
    point.x <= node.maxX &&
    point.y >= node.minY &&
    point.y <= node.maxY &&
    point.z >= node.minZ &&
    point.z <= node.maxZ
  );
};

/**
 * Calculates the squared distance between two OSVector3 points (for performance)
 */
const distanceSquared = (a: OSVector3, b: OSVector3): number => {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
};

/**
 * Subdivides a node into 8 children
 */
const subdivide = (node: OctreeNode, currentDepth: number, maxDepth: number): void => {
  const halfSize = node.size / 2;
  const children: OctreeNode[] = [];

  // Create 8 children using OSVector3
  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let z = -1; z <= 1; z += 2) {
        const childCenter = new OSVector3(
          node.center.x + x * halfSize,
          node.center.y + y * halfSize,
          node.center.z + z * halfSize
        );
        children.push(createNode(childCenter, halfSize));
      }
    }
  }

  node.children = children;
  const assignedChildren = node.children; // Assign to new var for type checker

  // Redistribute bodies to children
  const bodiesToRedistribute = [...node.bodies];
  node.bodies = [];
  
  node.totalMass_kg = 0;
  node.centerOfMass_m.copy(node.center); // Reset COM to geometric center initially
  
  bodiesToRedistribute.forEach(body => {
    let inserted = false;
    for (const child of assignedChildren) {
      if (isInBounds(body.position_m, child)) {
        insertBody(child, body, currentDepth + 1, maxDepth);
        inserted = true;
        break;
      }
    }
    // If body wasn't inserted into any child, keep it in this node
    if (!inserted) {
      node.bodies.push(body);
      // Update node's mass properties
      updateMassProperties(node, body);
    }
  });

  // Update the parent node's mass properties based on its children AFTER redistribution
  node.totalMass_kg = 0; // Reset again before summing up children
  node.centerOfMass_m.set(0,0,0);
  let totalMassForParent = 0;
  const weightedCOMParent = new OSVector3(0,0,0);

  if (assignedChildren) { 
    assignedChildren.forEach(child => {
      if (child.totalMass_kg > 0) {
          weightedCOMParent.add(child.centerOfMass_m.clone().multiplyScalar(child.totalMass_kg));
          totalMassForParent += child.totalMass_kg;
      }
    });
  }
  // Also include mass of bodies retained directly by the parent
  node.bodies.forEach(retainedBody => {
     weightedCOMParent.add(retainedBody.position_m.clone().multiplyScalar(retainedBody.mass_kg));
     totalMassForParent += retainedBody.mass_kg;
  });

  if (totalMassForParent > 0) {
     node.centerOfMass_m.copy(weightedCOMParent.multiplyScalar(1 / totalMassForParent));
     node.totalMass_kg = totalMassForParent;
  } else {
     node.centerOfMass_m.copy(node.center); // Fallback if node becomes empty
     node.totalMass_kg = 0;
  }
};

/**
 * Updates mass properties (totalMass_kg and centerOfMass_m) of a node after adding a body
 */
const updateMassProperties = (node: OctreeNode, body: PhysicsStateReal): void => {
  // If this is the first body, just use its position as the center of mass
  if (node.totalMass_kg === 0) {
    node.totalMass_kg = body.mass_kg;
    node.centerOfMass_m = body.position_m.clone();
    return;
  }

  // Calculate new center of mass
  const newTotalMass = node.totalMass_kg + body.mass_kg;
  
  const weightedOldCM = node.centerOfMass_m.clone().multiplyScalar(node.totalMass_kg);
  const weightedNewCM = body.position_m.clone().multiplyScalar(body.mass_kg);
  
  const newCenterOfMass = weightedOldCM.add(weightedNewCM).multiplyScalar(1 / newTotalMass);
  
  node.totalMass_kg = newTotalMass;
  node.centerOfMass_m = newCenterOfMass;
};

/**
 * Inserts a body into the octree
 */
const insertBody = (node: OctreeNode, body: PhysicsStateReal, currentDepth: number, maxDepth: number): void => {
  // Update mass properties before potential subdivision/insertion
  updateMassProperties(node, body);

  // Stop subdividing if max depth is reached
  if (currentDepth >= maxDepth) {
    node.bodies.push(body);
    return;
  }

  // If node has no children and meets criteria, subdivide
  if (!node.children && node.bodies.length + 1 > 1 && node.size > 0.1) { // +1 for the body being inserted
     // Check if we should subdivide (e.g., node has bodies already)
     if (node.bodies.length > 0) { 
       subdivide(node, currentDepth + 1, maxDepth); // Pass depth down
     }
  }

  // If node has children, try to insert into them
  if (node.children) {
    let insertedIntoChild = false;
    const originalBodies = [...node.bodies]; // Bodies currently in this node before insert
    node.bodies = []; // Clear bodies from this node as they should go to children if possible

    // Try inserting the new body
    for (const child of node.children) {
      if (isInBounds(body.position_m, child)) {
        insertBody(child, body, currentDepth + 1, maxDepth);
        insertedIntoChild = true;
        break;
      }
    }
    // If the new body couldn't fit in a child, add it back to this node
    if (!insertedIntoChild) {
      node.bodies.push(body);
    }

    // Redistribute existing bodies that were in this node
    originalBodies.forEach(existingBody => {
       let redistributed = false;
       for (const child of node.children!) {
         if (isInBounds(existingBody.position_m, child)) {
            insertBody(child, existingBody, currentDepth + 1, maxDepth);
            redistributed = true;
            break;
         }
       }
       // If an existing body couldn't fit in a child, keep it here
       if (!redistributed) {
          node.bodies.push(existingBody);
       }
    });

  } else {
    // If no children (or subdivision didn't happen), store the body in this node
    node.bodies.push(body);
  }
};

/**
 * Finds all bodies within a given distance of a point.
 * Point should be OSVector3.
 */
const findBodiesInRange = (
  node: OctreeNode,
  point: OSVector3,
  range: number,
  result: PhysicsStateReal[] = [],
  seen: Set<string> = new Set()
): PhysicsStateReal[] => {
  // Check if this node intersects with the range query using OSVector3
  const closestPoint = new OSVector3(
    Math.max(node.minX, Math.min(point.x, node.maxX)),
    Math.max(node.minY, Math.min(point.y, node.maxY)),
    Math.max(node.minZ, Math.min(point.z, node.maxZ))
  );

  // Calculate distance using OSVector3
  const distSq = distanceSquared(closestPoint, point);
  const rangeSq = range * range;
  
  // If the node is completely outside the range, return early
  if (distSq > rangeSq) {
    return result;
  }

  // Check bodies in this node
  for (const body of node.bodies) {
    const bodyId = String(body.id);
    if (!seen.has(bodyId)) {
      const bodyDistSq = distanceSquared(body.position_m, point);
      if (bodyDistSq <= rangeSq) {
        result.push(body);
        seen.add(bodyId);
      }
    }
  }

  // If node has children, check them
  if (node.children) {
    for (const child of node.children) {
      findBodiesInRange(child, point, range, result, seen);
    }
  }

  return result;
};

/**
 * The main Octree class
 */
export class Octree {
  private root: OctreeNode;
  private maxDepth: number;
  private softeningFactorSquared: number = 0.1 * 0.1;

  constructor(size: number, maxDepth: number = 8) {
    const actualSize = Math.max(size, 0.1);
    this.root = createNode(new OSVector3(0, 0, 0), actualSize);
    this.maxDepth = maxDepth;
  }

  /**
   * Inserts a body into the octree
   */
  insert(body: PhysicsStateReal): void {
    insertBody(this.root, body, 0, this.maxDepth);
  }

  /**
   * Finds all bodies within a given distance of a point.
   * Point should be OSVector3.
   */
  findBodiesInRange(point: OSVector3, range: number): PhysicsStateReal[] {
    return findBodiesInRange(this.root, point, range);
  }

  /**
   * Clears all bodies from the octree
   */
  clear(): void {
    this.root = createNode(new OSVector3(0, 0, 0), this.root.size);
  }

  /**
   * Calculate the total gravitational force exerted on a body using Barnes-Hut.
   * @param body The body to calculate the force on.
   * @param theta The Barnes-Hut approximation parameter (lower = more accurate, higher = faster).
   * @returns The calculated force vector (OSVector3).
   */
  calculateForceOn(body: PhysicsStateReal, theta: number): OSVector3 {
    const totalForce = new OSVector3(0, 0, 0);
    this.calculateNodeForce(this.root, body, theta, totalForce);
    return totalForce;
  }

  /**
   * Recursive helper function to calculate force from a node onto a body.
   */
  private calculateNodeForce(
    node: OctreeNode,
    targetBody: PhysicsStateReal,
    theta: number,
    accumulatedForce: OSVector3
  ): void {
    // Skip calculation if the node is empty or the target body is the only thing in it
    if (node.totalMass_kg === 0 || (node.bodies.length === 1 && node.bodies[0].id === targetBody.id && !node.children)) {
      return;
    }

    const distanceSq = distanceSquared(targetBody.position_m, node.centerOfMass_m) + this.softeningFactorSquared;
    const distance = Math.sqrt(distanceSq);
    const nodeWidth = node.size * 2; // Node size is half-width

    // Barnes-Hut condition: Use node approximation if far enough away or if it's a leaf node
    if ((nodeWidth / distance) < theta || !node.children) {
      // If the node directly contains the target body, calculate force from other bodies in the node directly
      if (node.bodies.some(b => b.id === targetBody.id) && !node.children) {
         for (const otherBody of node.bodies) {
           if (otherBody.id !== targetBody.id) {
              const force = calculateGravitationalForce(otherBody, targetBody);
              accumulatedForce.add(force);
           }
         }
      } else {
        // Use the node's center of mass approximation
        // Create a temporary body representing the node's mass
        const nodeBody: PhysicsStateReal = {
          id: `node_${node.center.x}_${node.center.y}_${node.center.z}`, // Unique ID for the node
          mass_kg: node.totalMass_kg,
          position_m: node.centerOfMass_m,
          velocity_mps: new OSVector3(0,0,0)
        };
        const force = calculateGravitationalForce(nodeBody, targetBody);
        accumulatedForce.add(force);
      }
    } else {
      // Node is too close, recurse into children
      if (node.children) {
        for (const child of node.children) {
          this.calculateNodeForce(child, targetBody, theta, accumulatedForce);
        }
      }
    }
  }
} 