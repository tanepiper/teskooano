import { describe, it, expect, vi } from "vitest";
import {
  DynamicEpochProcessor,
  processSolarSystemToCurrentTime,
} from "./dynamic-epoch-processor";
import type { CelestialObject } from "@teskooano/data-types";

// Mock celestial object for testing
const mockCelestialObject: CelestialObject<any> = {
  id: "test-object",
  name: "Test Object",
  type: "PLANET" as any,
  status: "ACTIVE" as any,
  parentId: "sun",
  realMass_kg: 5.972e24,
  realRadius_m: 6371000,
  temperature: 255,
  albedo: 0.3,
  orbit: {
    realSemiMajorAxis_m: 149597870700,
    eccentricity: 0.0167,
    inclination: 0,
    longitudeOfAscendingNode: 0,
    argumentOfPeriapsis: 0,
    meanAnomaly: 0,
    period_s: 31557600,
    realAphelion_m: 152097701000,
    realPerihelion_m: 147098040000,
    averageOrbitalSpeed_mps: 29780,
    epoch: "J2000",
  },
  properties: {},
};

describe("DynamicEpochProcessor", () => {
  describe("processObjects", () => {
    it("should process objects to current time", () => {
      const processor = new DynamicEpochProcessor();
      const objects = [mockCelestialObject];

      const result = processor.processObjects(objects);

      expect(result).toHaveLength(1);
      expect(result[0].orbit.epoch).toBe("J2000"); // Preserves original epoch
      expect(result[0].orbit.meanAnomaly).not.toBe(0); // Should be updated to current position
    });

    it("should handle multiple objects with different epochs", () => {
      const object1 = {
        ...mockCelestialObject,
        name: "Object 1",
        orbit: { ...mockCelestialObject.orbit, epoch: "J2000" },
      };
      const object2 = {
        ...mockCelestialObject,
        name: "Object 2",
        orbit: { ...mockCelestialObject.orbit, epoch: "2023-02-25" },
      };

      const processor = new DynamicEpochProcessor();
      const result = processor.processObjects([object1, object2]);

      expect(result).toHaveLength(2);
      // Both should have updated mean anomalies reflecting current positions
      expect(result[0].orbit.meanAnomaly).not.toBe(0);
      expect(result[1].orbit.meanAnomaly).not.toBe(0);
    });
  });

  describe("getProcessingStats", () => {
    it("should provide accurate processing statistics", () => {
      const processor = new DynamicEpochProcessor();
      const objects = [
        {
          ...mockCelestialObject,
          name: "Object 1",
          orbit: { ...mockCelestialObject.orbit, epoch: "J2000" },
        },
        {
          ...mockCelestialObject,
          name: "Object 2",
          orbit: { ...mockCelestialObject.orbit, epoch: "2023-02-25" },
        },
      ];

      processor.processObjects(objects);
      const stats = processor.getProcessingStats();

      expect(stats.totalObjects).toBe(2);
      expect(stats.currentEpoch).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
      );
      expect(stats.epochTypes).toHaveProperty("J2000", 1);
      expect(stats.epochTypes).toHaveProperty("2023-02-25", 1);
      expect(stats.averageYearsDifference).toBeGreaterThan(0);
      expect(stats.averageTimeDifferenceSeconds).toBeGreaterThan(0);
    });
  });

  describe("processSolarSystemToCurrentTime", () => {
    it("should process all objects to current time with logging", () => {
      const objects = [mockCelestialObject];

      // Mock console.log to capture logging output
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const result = processSolarSystemToCurrentTime(objects);

      expect(result).toHaveLength(1);
      expect(result[0].orbit.meanAnomaly).not.toBe(0);

      // Verify that logging occurred
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("[DynamicEpochProcessor] Processed"),
      );

      consoleSpy.mockRestore();
    });
  });
});
