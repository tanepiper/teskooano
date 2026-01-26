import { describe, it, expect } from "vitest";
import { PhysicsStateReal } from "../types";
import { OSVector3 } from "@teskooano/core-math";
import { detectSphereCollision, Collision } from "./collision";
import { CelestialType } from "@teskooano/data-types";

// Test-only functions (moved from collision.ts as they're not used in production)
const COLLISION_RESTITUTION = 0.8;

/**
 * Resolves a detected collision between two bodies using elastic collision.
 * Test-only function - production uses CollisionDetectionService.
 */
const resolveCollision = (
  collision: Collision,
  body1Real: PhysicsStateReal,
  body2Real: PhysicsStateReal,
): [PhysicsStateReal, PhysicsStateReal] => {
  const { normal, relativeVelocity } = collision;
  const mass1 = body1Real.mass_kg;
  const mass2 = body2Real.mass_kg;

  if (mass1 <= 0 || mass2 <= 0) {
    console.warn(
      `Collision resolution skipped between ${body1Real.id} and ${body2Real.id}: Invalid mass (<= 0).`,
    );
    return [body1Real, body2Real];
  }

  const normalVelocity = relativeVelocity.dot(normal);

  if (normalVelocity > 0) {
    return [body1Real, body2Real];
  }

  const restitution = COLLISION_RESTITUTION;
  const j = (-(1 + restitution) * normalVelocity) / (1 / mass1 + 1 / mass2);
  const impulseVector = normal.clone().multiplyScalar(j);

  const newVelocity1_mps = body1Real.velocity_mps
    .clone()
    .addScaledVector(impulseVector, 1 / mass1);

  const newVelocity2_mps = body2Real.velocity_mps
    .clone()
    .subScaledVector(impulseVector, 1 / mass2);

  const newBody1: PhysicsStateReal = {
    ...body1Real,
    velocity_mps: newVelocity1_mps,
  };

  const newBody2: PhysicsStateReal = {
    ...body2Real,
    velocity_mps: newVelocity2_mps,
  };

  return [newBody1, newBody2];
};

/**
 * Simple collision resolution based on physics rules:
 * - If it's not a star and it hits a star, it's destroyed
 * - If it's two stars, the smaller star is destroyed
 * - If it's two planets, the larger planet wins
 */
const resolveSimpleCollision = (
  id1: string,
  id2: string,
  body1: PhysicsStateReal,
  body2: PhysicsStateReal,
  body1IsStar: boolean,
  body2IsStar: boolean,
  updatedBodiesMap: Map<string | number, PhysicsStateReal>,
): string[] => {
  const destroyedIds = new Set<string>();
  if (destroyedIds.has(id1) || destroyedIds.has(id2)) {
    return Array.from(destroyedIds);
  }

  // Rule 1: If it's not a star and it hits a star, it's destroyed
  if (!body1IsStar && body2IsStar) {
    destroyedIds.add(id1);
    return Array.from(destroyedIds);
  }
  if (body1IsStar && !body2IsStar) {
    destroyedIds.add(id2);
    return Array.from(destroyedIds);
  }

  // Rule 2: If it's two stars, the smaller star is destroyed
  if (body1IsStar && body2IsStar) {
    if (body1.mass_kg >= body2.mass_kg) {
      destroyedIds.add(id2);
    } else {
      destroyedIds.add(id1);
    }
    return Array.from(destroyedIds);
  }

  // Rule 3: If it's two planets, the larger planet wins
  if (!body1IsStar && !body2IsStar) {
    if (body1.mass_kg >= body2.mass_kg) {
      destroyedIds.add(id2);
    } else {
      destroyedIds.add(id1);
    }
    return Array.from(destroyedIds);
  }
  return Array.from(destroyedIds);
};

/**
 * Iterates through all pairs of bodies, detects collisions, and applies simple destruction rules.
 * Test-only function - production uses CollisionDetectionService.
 */
const handleCollisions = (
  bodiesReal: PhysicsStateReal[],
  radii: Map<string | number, number>,
  isStar: Map<string | number, boolean>,
  bodyTypes: Map<string | number, CelestialType>,
  ignoreCollisions?: Map<string | number, boolean>,
): [PhysicsStateReal[], Set<string>] => {
  const updatedBodiesMap = new Map<string | number, PhysicsStateReal>();
  const destroyedIds = new Set<string>();

  // Initialize the map with all bodies
  bodiesReal.forEach((body) => updatedBodiesMap.set(body.id, { ...body }));

  const numBodies = bodiesReal.length;

  for (let i = 0; i < numBodies; i++) {
    const body1 = bodiesReal[i];
    const id1 = body1.id;

    for (let j = i + 1; j < numBodies; j++) {
      const body2 = bodiesReal[j];
      const id2 = body2.id;

      // Check if either object should ignore collisions
      const body1IgnoreCollisions = ignoreCollisions?.get(id1) ?? false;
      const body2IgnoreCollisions = ignoreCollisions?.get(id2) ?? false;

      if (body1IgnoreCollisions || body2IgnoreCollisions) {
        continue;
      }

      const radius1 = radii.get(id1);
      const radius2 = radii.get(id2);
      const body1IsStar = isStar.get(id1) ?? false;
      const body2IsStar = isStar.get(id2) ?? false;

      if (radius1 === undefined || radius2 === undefined) {
        console.warn(
          `Skipping collision check between ${id1} and ${id2}: Missing radius information.`,
        );
        continue;
      }

      const collision = detectSphereCollision(body1, radius1, body2, radius2);

      if (collision) {
        // Use simple destruction rules
        const newDestroyedIds = resolveSimpleCollision(
          id1,
          id2,
          body1,
          body2,
          body1IsStar,
          body2IsStar,
          updatedBodiesMap,
        );
        newDestroyedIds.forEach((id) => destroyedIds.add(id));
      }
    }
  }

  const finalBodies = Array.from(updatedBodiesMap.values()).filter(
    (body) => !destroyedIds.has(body.id),
  );

  return [finalBodies, destroyedIds];
};

const createRealState = (
  id: string,
  pos: { x: number; y: number; z: number },
  vel: { x: number; y: number; z: number },
  mass: number,
): PhysicsStateReal => ({
  id,
  mass_kg: mass,
  position_m: new OSVector3(pos.x, pos.y, pos.z),
  velocity_mps: new OSVector3(vel.x, vel.y, vel.z),
});

describe("Collision Detection (detectSphereCollision)", () => {
  it("should detect collision when spheres overlap", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 2, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const radius1 = 1.5;
    const radius2 = 1.5;
    const collision = detectSphereCollision(body1, radius1, body2, radius2);
    expect(collision).not.toBeNull();
    if (collision) {
      expect(collision.penetrationDepth).toBeCloseTo(1.0);

      expect(collision.normal.x).toBeCloseTo(-1.0);
      expect(collision.normal.y).toBeCloseTo(0.0);
      expect(collision.normal.z).toBeCloseTo(0.0);

      const expectedPoint = body2.position_m
        .clone()
        .add(collision.normal.clone().multiplyScalar(radius2));
      expect(collision.point.x).toBeCloseTo(expectedPoint.x);
      expect(collision.point.y).toBeCloseTo(expectedPoint.y);
      expect(collision.point.z).toBeCloseTo(expectedPoint.z);
    }
  });

  it("should not detect collision when spheres touch exactly", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 3, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const radius1 = 1.5;
    const radius2 = 1.5;
    const collision = detectSphereCollision(body1, radius1, body2, radius2);
    expect(collision).toBeNull();
  });

  it("should not detect collision when spheres are separate", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 4, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const radius1 = 1.5;
    const radius2 = 1.5;
    const collision = detectSphereCollision(body1, radius1, body2, radius2);
    expect(collision).toBeNull();
  });
});

describe("Collision Resolution (resolveCollision)", () => {
  it("should resolve head-on collision correctly (equal mass)", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      1,
    );
    const radius = 0.6;
    const collisionInfo = detectSphereCollision(body1, radius, body2, radius);
    expect(collisionInfo).not.toBeNull();
    if (!collisionInfo) return;

    const [newState1, newState2] = resolveCollision(
      collisionInfo,
      body1,
      body2,
    );

    expect(newState1.velocity_mps.x).toBeCloseTo(-1.0);
    expect(newState1.velocity_mps.y).toBeCloseTo(0.0);
    expect(newState1.velocity_mps.z).toBeCloseTo(0.0);
    expect(newState2.velocity_mps.x).toBeCloseTo(1.0);
    expect(newState2.velocity_mps.y).toBeCloseTo(0.0);
    expect(newState2.velocity_mps.z).toBeCloseTo(0.0);
  });

  it("should resolve collision with one stationary body (equal mass)", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 2, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 0, z: 0 },
      1,
    );
    const radius = 0.6;
    const collisionInfo = detectSphereCollision(body1, radius, body2, radius);
    expect(collisionInfo).not.toBeNull();
    if (!collisionInfo) return;

    const [newState1, newState2] = resolveCollision(
      collisionInfo,
      body1,
      body2,
    );

    expect(newState1.velocity_mps.x).toBeCloseTo(0.0);
    expect(newState1.velocity_mps.y).toBeCloseTo(0.0);
    expect(newState1.velocity_mps.z).toBeCloseTo(0.0);
    expect(newState2.velocity_mps.x).toBeCloseTo(2.0);
    expect(newState2.velocity_mps.y).toBeCloseTo(0.0);
    expect(newState2.velocity_mps.z).toBeCloseTo(0.0);
  });

  it("should resolve head-on collision correctly (unequal mass)", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      2,
    );
    const body2 = createRealState(
      "2",
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      1,
    );
    const radius = 0.6;
    const collisionInfo = detectSphereCollision(body1, radius, body2, radius);
    expect(collisionInfo).not.toBeNull();
    if (!collisionInfo) return;

    const [newState1, newState2] = resolveCollision(
      collisionInfo,
      body1,
      body2,
    );

    expect(newState1.velocity_mps.x).toBeCloseTo(-1 / 3);
    expect(newState2.velocity_mps.x).toBeCloseTo(5 / 3);
  });
});

describe("Collision Handling (handleCollisions)", () => {
  it("should handle multiple simultaneous collisions", () => {
    const body1 = createRealState(
      "1",
      { x: 0, y: 0, z: 0 },
      { x: 1, y: 0, z: 0 },
      1,
    );
    const body2 = createRealState(
      "2",
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      1,
    );
    const body3 = createRealState(
      "3",
      { x: 2, y: 0, z: 0 },
      { x: -2, y: 0, z: 0 },
      1,
    );
    const radius = 0.6;
    const radii = new Map<string | number, number>([
      ["1", radius],
      ["2", radius],
      ["3", radius],
    ]);
    const bodies = [body1, body2, body3];
    const isStar = new Map<string | number, boolean>([
      ["1", false],
      ["2", false],
      ["3", false],
    ]);
    const bodyTypes = new Map<string | number, CelestialType>([
      ["1", CelestialType.ASTEROID],
      ["2", CelestialType.ASTEROID],
      ["3", CelestialType.ASTEROID],
    ]);

    const [updatedBodies] = handleCollisions(bodies, radii, isStar, bodyTypes);

    const finalV1 = updatedBodies.find((b) => b.id === "1")?.velocity_mps;
    const finalV2 = updatedBodies.find((b) => b.id === "2")?.velocity_mps;
    const finalV3 = updatedBodies.find((b) => b.id === "3")?.velocity_mps;

    expect(finalV1?.x).toBeCloseTo(-1.0);
    expect(finalV2?.x).toBeCloseTo(-2.0);
    expect(finalV3?.x).toBeCloseTo(1.0);
  });
});
