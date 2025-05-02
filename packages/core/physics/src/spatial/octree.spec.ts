import { describe, it, expect } from "vitest";
import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "@teskooano/data-types";
import { Octree } from "./octree";

const createRealState = (
  id: string | number,
  pos: { x: number; y: number; z: number },
  mass: number,
): PhysicsStateReal => ({
  id,
  mass_kg: mass,
  position_m: new OSVector3(pos.x, pos.y, pos.z),

  velocity_mps: new OSVector3(0, 0, 0),
});

describe("Octree", () => {
  it("should initialize with correct root node size", () => {
    const octree = new Octree(100);

    const root = (octree as any).root;
    expect(root.size).toBe(100);
    expect(root.center.x).toBe(0);
    expect(root.center.y).toBe(0);
    expect(root.center.z).toBe(0);
  });

  it("should insert a single body correctly", () => {
    const octree = new Octree(100);
    const body = createRealState(1, { x: 10, y: 10, z: 10 }, 10);
    octree.insert(body);
    const root = (octree as any).root;
    expect(root.bodies).toContain(body);
    expect(root.totalMass_kg).toBe(10);
    expect(root.centerOfMass_m.x).toBeCloseTo(10);
    expect(root.centerOfMass_m.y).toBeCloseTo(10);
    expect(root.centerOfMass_m.z).toBeCloseTo(10);
  });

  it("should subdivide when inserting multiple bodies", () => {
    const octree = new Octree(100);
    const body1 = createRealState(1, { x: 10, y: 10, z: 10 }, 10);
    const body2 = createRealState(2, { x: -10, y: -10, z: -10 }, 20);
    octree.insert(body1);
    octree.insert(body2);
    const root = (octree as any).root;

    expect(root.children).toBeDefined();
    expect(root.children?.length).toBe(8);
    expect(root.bodies.length).toBe(0);
    expect(root.totalMass_kg).toBeCloseTo(30);

    expect(root.centerOfMass_m.x).toBeCloseTo(-100 / 30);
    expect(root.centerOfMass_m.y).toBeCloseTo(-100 / 30);
    expect(root.centerOfMass_m.z).toBeCloseTo(-100 / 30);

    let body1Found = false;
    let body2Found = false;
    root.children?.forEach((child) => {
      if (child.bodies.some((b) => b.id === 1)) body1Found = true;
      if (child.bodies.some((b) => b.id === 2)) body2Found = true;
    });
    expect(body1Found).toBe(true);
    expect(body2Found).toBe(true);
  });

  it("should find bodies within a given range", () => {
    const octree = new Octree(100);
    const body1 = createRealState(1, { x: 10, y: 0, z: 0 }, 1);
    const body2 = createRealState(2, { x: 50, y: 0, z: 0 }, 1);
    const body3 = createRealState(3, { x: 90, y: 0, z: 0 }, 1);
    octree.insert(body1);
    octree.insert(body2);
    octree.insert(body3);

    const centerPoint = new OSVector3(30, 0, 0);
    const range = 25;
    const foundBodies = octree.findBodiesInRange(centerPoint, range);

    expect(foundBodies.length).toBe(2);
    expect(foundBodies.some((b) => b.id === 1)).toBe(true);
    expect(foundBodies.some((b) => b.id === 2)).toBe(true);
    expect(foundBodies.some((b) => b.id === 3)).toBe(false);
  });

  it("findBodiesInRange should return empty array if no bodies in range", () => {
    const octree = new Octree(100);
    const body1 = createRealState(1, { x: 1000, y: 0, z: 0 }, 1);
    octree.insert(body1);

    const centerPoint = new OSVector3(0, 0, 0);
    const range = 50;
    const foundBodies = octree.findBodiesInRange(centerPoint, range);
    expect(foundBodies.length).toBe(0);
  });

  it("should calculate approximate force using Barnes-Hut", () => {
    const octree = new Octree(10000);

    const distantBody = createRealState(
      "distant",
      { x: 5000, y: 0, z: 0 },
      100,
    );

    const targetBody = createRealState("target", { x: 0, y: 0, z: 0 }, 10);

    octree.insert(distantBody);
    octree.insert(targetBody);

    const theta = 0.5;
    const force = octree.calculateForceOn(targetBody, theta);

    const root = (octree as any).root;

    expect(force.x).toBeGreaterThan(0);
    expect(force.y).toBeCloseTo(0);
    expect(force.z).toBeCloseTo(0);

    expect(force.length()).toBeGreaterThan(0);
  });

  it("calculateForceOn should handle empty octree", () => {
    const octree = new Octree(100);
    const targetBody = createRealState("target", { x: 0, y: 0, z: 0 }, 10);
    const force = octree.calculateForceOn(targetBody, 0.5);
    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
    expect(force.z).toBe(0);
  });

  it("calculateForceOn should ignore self-interaction", () => {
    const octree = new Octree(100);
    const targetBody = createRealState("target", { x: 0, y: 0, z: 0 }, 10);
    octree.insert(targetBody);
    const force = octree.calculateForceOn(targetBody, 0.5);
    expect(force.x).toBe(0);
    expect(force.y).toBe(0);
    expect(force.z).toBe(0);
  });

  it("should clear the octree correctly", () => {
    const octree = new Octree(100);
    const body1 = createRealState(1, { x: 10, y: 10, z: 10 }, 10);
    octree.insert(body1);
    octree.clear();
    const root = (octree as any).root;
    expect(root.bodies.length).toBe(0);
    expect(root.children).toBeUndefined();
    expect(root.totalMass_kg).toBe(0);
    expect(root.centerOfMass_m.x).toBe(0);
    expect(root.centerOfMass_m.y).toBe(0);
    expect(root.centerOfMass_m.z).toBe(0);
  });
});
