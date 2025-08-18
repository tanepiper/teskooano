import { describe, it, expect, beforeEach, vi } from "vitest";
import { WasmSpatialPartitioning } from "./wasm-partitioning";
import { OSVector3 } from "@teskooano/core-math";
import { PhysicsStateReal } from "@teskooano/data-types";

// Mock the WASM library
vi.mock("@robertaron/spacial-partitioning", () => ({
  init: vi.fn().mockResolvedValue(undefined),
  createNearByGraph: vi.fn().mockReturnValue([
    [1, 2], // neighbors of body 0
    [0, 2], // neighbors of body 1
    [0, 1], // neighbors of body 2
  ]),
}));

describe("WasmSpatialPartitioning", () => {
  let spatialPartitioning: WasmSpatialPartitioning;

  beforeEach(async () => {
    spatialPartitioning = new WasmSpatialPartitioning(1000);
    await spatialPartitioning.initialize();
  });

  it("should initialize successfully", async () => {
    const newPartitioning = new WasmSpatialPartitioning(1000);
    await expect(newPartitioning.initialize()).resolves.not.toThrow();
  });

  it("should update with body positions", () => {
    const bodies: PhysicsStateReal[] = [
      {
        id: "body1",
        mass_kg: 1000,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body2",
        mass_kg: 2000,
        position_m: new OSVector3(500, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body3",
        mass_kg: 3000,
        position_m: new OSVector3(0, 500, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
    ];

    expect(() => spatialPartitioning.update(bodies)).not.toThrow();
  });

  it("should find neighbors for a body", () => {
    const bodies: PhysicsStateReal[] = [
      {
        id: "body1",
        mass_kg: 1000,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body2",
        mass_kg: 2000,
        position_m: new OSVector3(500, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body3",
        mass_kg: 3000,
        position_m: new OSVector3(0, 500, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
    ];

    spatialPartitioning.update(bodies);
    const neighbors = spatialPartitioning.findNeighbors("body1");

    expect(neighbors).toContain("body2");
    expect(neighbors).toContain("body3");
  });

  it("should find bodies in range", () => {
    const bodies: PhysicsStateReal[] = [
      {
        id: "body1",
        mass_kg: 1000,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body2",
        mass_kg: 2000,
        position_m: new OSVector3(500, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
    ];

    spatialPartitioning.update(bodies);
    const bodiesInRange = spatialPartitioning.findBodiesInRange(
      new OSVector3(0, 0, 0),
      1000,
    );

    expect(bodiesInRange).toContain("body1");
    expect(bodiesInRange).toContain("body2");
  });

  it("should get potential collision pairs", () => {
    const bodies: PhysicsStateReal[] = [
      {
        id: "body1",
        mass_kg: 1000,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body2",
        mass_kg: 2000,
        position_m: new OSVector3(500, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body3",
        mass_kg: 3000,
        position_m: new OSVector3(0, 500, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
    ];

    spatialPartitioning.update(bodies);
    const pairs = spatialPartitioning.getPotentialCollisionPairs();

    expect(pairs.length).toBeGreaterThan(0);
    expect(pairs[0]).toHaveLength(2);
  });

  it("should find closest body", () => {
    const bodies: PhysicsStateReal[] = [
      {
        id: "body1",
        mass_kg: 1000,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body2",
        mass_kg: 2000,
        position_m: new OSVector3(1000, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
    ];

    spatialPartitioning.update(bodies);
    const closest = spatialPartitioning.findClosestBody(
      new OSVector3(100, 0, 0),
    );

    expect(closest).not.toBeNull();
    expect(closest?.bodyId).toBe("body1");
    expect(closest?.distance).toBeLessThan(1000);
  });

  it("should provide statistics", () => {
    const bodies: PhysicsStateReal[] = [
      {
        id: "body1",
        mass_kg: 1000,
        position_m: new OSVector3(0, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
      {
        id: "body2",
        mass_kg: 2000,
        position_m: new OSVector3(500, 0, 0),
        velocity_mps: new OSVector3(0, 0, 0),
      },
    ];

    spatialPartitioning.update(bodies);
    const stats = spatialPartitioning.getStats();

    expect(stats.totalBodies).toBe(2);
    expect(stats.neighborDistance).toBe(1000);
    expect(stats.averageNeighbors).toBeGreaterThan(0);
  });

  it("should update neighbor distance", () => {
    spatialPartitioning.setNeighborDistance(2000);
    const config = spatialPartitioning.getConfig();

    expect(config.neighborDistance).toBe(2000);
  });
});
