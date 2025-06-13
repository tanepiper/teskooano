import { describe, it, expect } from "vitest";
import { PhysicsStateReal } from "../types";
import { OSVector3 } from "@teskooano/core-math";
import {
  detectSphereCollision,
  resolveCollision,
  handleCollisions,
} from "./collision";
import { Collision } from "./collision";
import { CelestialType } from "@teskooano/data-types";

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
      ["1", CelestialType.SPACE_ROCK],
      ["2", CelestialType.SPACE_ROCK],
      ["3", CelestialType.SPACE_ROCK],
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
