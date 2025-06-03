import { OSVector3 } from "@teskooano/core-math";
import { CelestialPhysicsState } from "@teskooano/celestial-object";
import { calculateGravitationalForce } from "../forces";
import { GRAVITATIONAL_CONSTANT } from "../units/constants";
import { Quaternion } from "three";

/**
 * Represents a node in the octree
 */
interface OctreeNode {
  /** The center point of this node (OSVector3, meters) */
  center: OSVector3;
  /** The size of this node (half-width, meters) */
  size: number;
  /** The bodies contained directly in this node */
  bodies: CelestialPhysicsState[];
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
const subdivide = (
  node: OctreeNode,
  currentDepth: number,
  maxDepth: number,
): void => {
  const halfSize = node.size / 2;
  const children: OctreeNode[] = [];

  for (let x = -1; x <= 1; x += 2) {
    for (let y = -1; y <= 1; y += 2) {
      for (let z = -1; z <= 1; z += 2) {
        const childCenter = new OSVector3(
          node.center.x + x * halfSize,
          node.center.y + y * halfSize,
          node.center.z + z * halfSize,
        );
        children.push(createNode(childCenter, halfSize));
      }
    }
  }

  node.children = children;
  const assignedChildren = node.children;

  const bodiesToRedistribute = [...node.bodies];
  node.bodies = [];

  node.totalMass_kg = 0;
  node.centerOfMass_m.copy(node.center);

  bodiesToRedistribute.forEach((body) => {
    let inserted = false;
    for (const child of assignedChildren) {
      if (isInBounds(body.position_m, child)) {
        insertBody(child, body, currentDepth + 1, maxDepth);
        inserted = true;
        break;
      }
    }

    if (!inserted) {
      node.bodies.push(body);

      updateMassProperties(node, body);
    }
  });

  node.totalMass_kg = 0;
  node.centerOfMass_m.set(0, 0, 0);
  let totalMassForParent = 0;
  const weightedCOMParent = new OSVector3(0, 0, 0);

  if (assignedChildren) {
    assignedChildren.forEach((child) => {
      if (child.totalMass_kg > 0) {
        weightedCOMParent.add(
          child.centerOfMass_m.clone().multiplyScalar(child.totalMass_kg),
        );
        totalMassForParent += child.totalMass_kg;
      }
    });
  }

  node.bodies.forEach((retainedBody) => {
    weightedCOMParent.add(
      retainedBody.position_m.clone().multiplyScalar(retainedBody.mass_kg),
    );
    totalMassForParent += retainedBody.mass_kg;
  });

  if (totalMassForParent > 0) {
    node.centerOfMass_m.copy(
      weightedCOMParent.multiplyScalar(1 / totalMassForParent),
    );
    node.totalMass_kg = totalMassForParent;
  } else {
    node.centerOfMass_m.copy(node.center);
    node.totalMass_kg = 0;
  }
};

/**
 * Updates mass properties (totalMass_kg and centerOfMass_m) of a node after adding a body
 */
const updateMassProperties = (
  node: OctreeNode,
  body: CelestialPhysicsState,
): void => {
  if (node.totalMass_kg === 0) {
    node.totalMass_kg = body.mass_kg;
    node.centerOfMass_m = body.position_m.clone();
    return;
  }

  const newTotalMass = node.totalMass_kg + body.mass_kg;

  const weightedOldCM = node.centerOfMass_m
    .clone()
    .multiplyScalar(node.totalMass_kg);
  const weightedNewCM = body.position_m.clone().multiplyScalar(body.mass_kg);

  const newCenterOfMass = weightedOldCM
    .add(weightedNewCM)
    .multiplyScalar(1 / newTotalMass);

  node.totalMass_kg = newTotalMass;
  node.centerOfMass_m = newCenterOfMass;
};

/**
 * Inserts a body into the octree
 */
const insertBody = (
  node: OctreeNode,
  body: CelestialPhysicsState,
  currentDepth: number,
  maxDepth: number,
): void => {
  updateMassProperties(node, body);

  if (currentDepth >= maxDepth) {
    node.bodies.push(body);
    return;
  }

  if (!node.children && node.bodies.length + 1 > 1 && node.size > 0.1) {
    if (node.bodies.length > 0) {
      subdivide(node, currentDepth + 1, maxDepth);
    }
  }

  if (node.children) {
    let insertedIntoChild = false;
    const originalBodies = [...node.bodies];
    node.bodies = [];

    for (const child of node.children) {
      if (isInBounds(body.position_m, child)) {
        insertBody(child, body, currentDepth + 1, maxDepth);
        insertedIntoChild = true;
        break;
      }
    }

    if (!insertedIntoChild) {
      node.bodies.push(body);
    }

    originalBodies.forEach((existingBody) => {
      let redistributed = false;
      for (const child of node.children!) {
        if (isInBounds(existingBody.position_m, child)) {
          insertBody(child, existingBody, currentDepth + 1, maxDepth);
          redistributed = true;
          break;
        }
      }

      if (!redistributed) {
        node.bodies.push(existingBody);
      }
    });
  } else {
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
  result: CelestialPhysicsState[] = [],
  seen: Set<string> = new Set(),
): CelestialPhysicsState[] => {
  const closestPoint = new OSVector3(
    Math.max(node.minX, Math.min(point.x, node.maxX)),
    Math.max(node.minY, Math.min(point.y, node.maxY)),
    Math.max(node.minZ, Math.min(point.z, node.maxZ)),
  );

  const distSq = distanceSquared(closestPoint, point);
  const rangeSq = range * range;

  if (distSq > rangeSq) {
    return result;
  }

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
  private softeningFactorSquared: number;
  private gravitationalConstant: number;

  /**
   * @param size            Half-width of the world cube this tree covers (m)
   * @param maxDepth        Maximum subdivision depth
   * @param softeningLength Characteristic length for Plummer softening (m). Defaults to 1 000 000 m (≈1000 km)
   * @param G               Gravitational constant. Defaults to the standard value.
   */
  constructor(
    size: number,
    maxDepth: number = 8,
    softeningLength: number = 1e6,
    G: number = GRAVITATIONAL_CONSTANT,
  ) {
    const actualSize = Math.max(size, 0.1);
    this.root = createNode(new OSVector3(0, 0, 0), actualSize);
    this.maxDepth = maxDepth;
    this.softeningFactorSquared = softeningLength * softeningLength;
    this.gravitationalConstant = G;
  }

  /**
   * Inserts a body into the octree
   */
  insert(body: CelestialPhysicsState): void {
    insertBody(this.root, body, 0, this.maxDepth);
  }

  /**
   * Finds all bodies within a given distance of a point.
   * Point should be OSVector3.
   */
  findBodiesInRange(point: OSVector3, range: number): CelestialPhysicsState[] {
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
   * @param forceCalculationFn Optional custom force calculation function.
   * @returns The calculated force vector (OSVector3).
   */
  calculateForceOn(
    body: CelestialPhysicsState,
    theta: number,
    forceCalculationFn?: (
      body1: CelestialPhysicsState,
      body2: CelestialPhysicsState,
      G: number,
    ) => OSVector3,
  ): OSVector3 {
    const totalForce = new OSVector3(0, 0, 0);
    this.calculateNodeForce(
      this.root,
      body,
      theta,
      totalForce,
      forceCalculationFn,
    );
    return totalForce;
  }

  /**
   * Recursive helper function to calculate force from a node onto a body.
   */
  private calculateNodeForce(
    node: OctreeNode,
    targetBody: CelestialPhysicsState,
    theta: number,
    accumulatedForce: OSVector3,
    forceCalculationFn?: (
      body1: CelestialPhysicsState,
      body2: CelestialPhysicsState,
      G: number,
    ) => OSVector3,
  ): void {
    if (
      node.totalMass_kg === 0 ||
      (node.bodies.length === 1 &&
        node.bodies[0].id === targetBody.id &&
        !node.children)
    ) {
      return;
    }

    const distanceSq =
      distanceSquared(targetBody.position_m, node.centerOfMass_m) +
      this.softeningFactorSquared;
    const distance = Math.sqrt(distanceSq);
    const nodeWidth = node.size * 2;

    if (nodeWidth / distance < theta || !node.children) {
      if (node.bodies.some((b) => b.id === targetBody.id) && !node.children) {
        for (const otherBody of node.bodies) {
          if (otherBody.id !== targetBody.id) {
            const force = forceCalculationFn
              ? forceCalculationFn(
                  otherBody,
                  targetBody,
                  this.gravitationalConstant,
                )
              : calculateGravitationalForce(
                  otherBody,
                  targetBody,
                  this.gravitationalConstant,
                );
            accumulatedForce.add(force);
          }
        }
      } else {
        const nodeBody: CelestialPhysicsState = {
          id: `node_${node.center.x}_${node.center.y}_${node.center.z}`,
          mass_kg: node.totalMass_kg,
          position_m: node.centerOfMass_m,
          velocity_mps: new OSVector3(0, 0, 0),
          orientation: new Quaternion(0, 0, 0, 1),
          angularVelocity_radps: new OSVector3(0, 0, 0),
        };
        const force = forceCalculationFn
          ? forceCalculationFn(nodeBody, targetBody, this.gravitationalConstant)
          : calculateGravitationalForce(
              nodeBody,
              targetBody,
              this.gravitationalConstant,
            );
        accumulatedForce.add(force);
      }
    } else {
      if (node.children) {
        for (const child of node.children) {
          this.calculateNodeForce(
            child,
            targetBody,
            theta,
            accumulatedForce,
            forceCalculationFn,
          );
        }
      }
    }
  }
}
