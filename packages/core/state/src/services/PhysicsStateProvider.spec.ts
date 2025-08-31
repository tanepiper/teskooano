import { describe, expect, it, beforeEach, vi, afterEach } from "vitest";
import { PhysicsStateProvider } from "./PhysicsStateProvider";

// Mock the dependencies
vi.mock("./PhysicsStateCalculator", () => ({
  PhysicsStateCalculator: {
    calculatePhysicsState: vi.fn(),
  },
}));

vi.mock("@teskooano/core-state", () => ({
  StateAccessor: {
    getCelestialObjects: vi.fn(),
  },
}));

describe("PhysicsStateProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    PhysicsStateProvider.clearCache();
  });

  afterEach(() => {
    PhysicsStateProvider.clearCache();
  });

  describe("getPhysicsState", () => {
    it("should return null for undefined object", () => {
      const result = PhysicsStateProvider.getPhysicsState(undefined);
      expect(result).toBeNull();
    });

    it("should return null for null object", () => {
      const result = PhysicsStateProvider.getPhysicsState(null as any);
      expect(result).toBeNull();
    });

    it("should handle objects without id property", () => {
      const invalidObject = { name: "test" } as any;
      const result = PhysicsStateProvider.getPhysicsState(invalidObject);
      expect(result).toBeUndefined();
    });
  });

  describe("clearCache", () => {
    it("should clear the cache", () => {
      // This is a simple test that just verifies the method exists and doesn't throw
      expect(() => PhysicsStateProvider.clearCache()).not.toThrow();
    });
  });

  describe("removeFromCache", () => {
    it("should remove item from cache", () => {
      // This is a simple test that just verifies the method exists and doesn't throw
      expect(() =>
        PhysicsStateProvider.removeFromCache("test-id"),
      ).not.toThrow();
    });
  });

  describe("updateCache", () => {
    it("should handle undefined object", () => {
      expect(() =>
        PhysicsStateProvider.updateCache(undefined as any),
      ).toThrow();
    });

    it("should handle object without id", () => {
      const invalidObject = { name: "test" } as any;
      expect(() =>
        PhysicsStateProvider.updateCache(invalidObject),
      ).not.toThrow();
    });
  });

  describe("updateCacheWithSimulationResult", () => {
    it("should handle valid parameters", () => {
      const mockPhysicsState = {
        id: "test-id",
        mass_kg: 1000,
        position_m: { x: 0, y: 0, z: 0 } as any,
        velocity_mps: { x: 0, y: 0, z: 0 } as any,
      };

      expect(() =>
        PhysicsStateProvider.updateCacheWithSimulationResult(
          "test-id",
          mockPhysicsState as any,
        ),
      ).not.toThrow();
    });

    it("should handle null physics state", () => {
      expect(() =>
        PhysicsStateProvider.updateCacheWithSimulationResult(
          "test-id",
          null as any,
        ),
      ).not.toThrow();
    });
  });
});
