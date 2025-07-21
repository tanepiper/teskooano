import { describe, it, expect, vi } from "vitest";
import {
  DynamicEpochProcessor,
  processSolarSystemToCurrentPositions,
} from "./dynamic-epoch-processor";
import type { CelestialObject } from "@teskooano/data-types";

const mockCelestialObject: CelestialObject = {
  id: "test-object",
  name: "Test Object",
  type: "PLANET" as any,
  status: "ACTIVE" as any,
  realRadius_m: 6371000,
  realMass_kg: 5.972e24,
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
  temperature: 288,
};

describe("DynamicEpochProcessor", () => {
  describe("processObjects", () => {
    it("should process objects to current epoch", () => {
      const processor = new DynamicEpochProcessor();
      const objects = [mockCelestialObject];

      const result = processor.processObjects(objects);

      expect(result).toHaveLength(1);
      expect(result[0].orbit.epoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result[0].orbit.epoch).not.toBe("J2000");
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
      expect(result[0].orbit.epoch).toBe(result[1].orbit.epoch); // Both should have same current epoch
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
      expect(stats.todayEpoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(stats.epochTypes).toHaveProperty("J2000", 1);
      expect(stats.epochTypes).toHaveProperty("2023-02-25", 1);
      expect(stats.averageYearsDifference).toBeGreaterThan(0);
    });
  });

  describe("getObjectInfo", () => {
    it("should provide detailed object information", () => {
      const processor = new DynamicEpochProcessor();
      const objects = [{ ...mockCelestialObject, name: "Test Object" }];

      processor.processObjects(objects);
      const info = processor.getObjectInfo("Test Object");

      expect(info).not.toBeNull();
      expect(info?.originalEpoch).toBe("J2000");
      expect(info?.currentEpoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(info?.yearsDifference).toBeGreaterThan(0);
      expect(info?.julianDayDifference).toBeGreaterThan(0);
    });

    it("should return null for unknown objects", () => {
      const processor = new DynamicEpochProcessor();
      const info = processor.getObjectInfo("Unknown Object");
      expect(info).toBeNull();
    });
  });

  describe("validateProcessing", () => {
    it("should validate successful processing", () => {
      const processor = new DynamicEpochProcessor();
      const objects = [{ ...mockCelestialObject, name: "Test Object" }];

      processor.processObjects(objects);
      const validation = processor.validateProcessing();

      expect(validation.isValid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    it("should detect large time differences", () => {
      const oldObject = {
        ...mockCelestialObject,
        name: "Old Object",
        orbit: { ...mockCelestialObject.orbit, epoch: "1900-01-01" },
      };

      const processor = new DynamicEpochProcessor();
      processor.processObjects([oldObject]);
      const validation = processor.validateProcessing();

      expect(validation.isValid).toBe(false);
      expect(
        validation.issues.some((issue) =>
          issue.issue.includes("large time difference"),
        ),
      ).toBe(true);
    });
  });
});

describe("processSolarSystemToCurrentPositions", () => {
  it("should process objects using convenience function", () => {
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

    const result = processSolarSystemToCurrentPositions(objects);

    expect(result).toHaveLength(2);
    expect(result[0].orbit.epoch).toBe(result[1].orbit.epoch);
    expect(result[0].orbit.epoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
