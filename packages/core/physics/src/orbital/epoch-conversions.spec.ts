import { describe, it, expect, vi } from "vitest";
import { J2000_EPOCH, J2000_JULIAN_DAY } from "@teskooano/data-values";
import {
  dateToJulianDay,
  julianDayToYearsSinceJ2000,
  yearsSinceJ2000ToJulianDay,
  getCurrentEpoch,
  getCurrentPreciseEpoch,
  getCurrentJulianDay,
  getEpochDifferenceYears,
} from "./epoch-conversions";
import {
  normalizeEpoch,
  updateOrbitalElementsToEpoch,
  calculateCurrentPositionFromEpoch,
  calculateCurrentPositionPrecise,
  standardizeToCurrentEpoch,
  standardizeToDate,
} from "./epoch";
import type { OrbitalParameters } from "@teskooano/data-types";

describe("Epoch Conversions", () => {
  describe("Current epoch functions", () => {
    it("should get current epoch dynamically", () => {
      const currentEpoch = getCurrentEpoch();
      expect(currentEpoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(currentEpoch).toBe(getCurrentEpoch());
    });

    it("should get current precise epoch with time", () => {
      const currentPreciseEpoch = getCurrentPreciseEpoch();
      expect(currentPreciseEpoch).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
      );
    });

    it("should get current Julian Day with precision", () => {
      const currentJD = getCurrentJulianDay();
      expect(currentJD).toBeGreaterThan(2451545.0);
      expect(currentJD).toBeLessThan(2500000.0);
    });
  });

  describe("Julian Day conversions", () => {
    it("should convert Julian Day to years since J2000", () => {
      expect(julianDayToYearsSinceJ2000(J2000_JULIAN_DAY)).toBeCloseTo(0, 2);
      expect(julianDayToYearsSinceJ2000(2460675.0)).toBeCloseTo(25, 1);
      expect(julianDayToYearsSinceJ2000(2460801.0)).toBeCloseTo(25.3, 1);
    });

    it("should convert years since J2000 to Julian Day", () => {
      expect(yearsSinceJ2000ToJulianDay(0)).toBeCloseTo(J2000_JULIAN_DAY, 1);
      expect(yearsSinceJ2000ToJulianDay(25)).toBeCloseTo(2460675.0, -1);
    });
  });

  describe("dateToJulianDay", () => {
    it("should convert dates to Julian Day correctly", () => {
      const j2000Date = new Date(2000, 0, 1, 12, 0, 0, 0);
      expect(dateToJulianDay(j2000Date)).toBeCloseTo(J2000_JULIAN_DAY, 0);

      const j2025Date = new Date(2025, 0, 1, 12, 0, 0, 0);
      expect(dateToJulianDay(j2025Date)).toBeCloseTo(2460677.0, 0);
    });
  });

  describe("getEpochDifferenceYears", () => {
    it("should calculate correct time differences", () => {
      expect(getEpochDifferenceYears("J2000", "J2025")).toBeCloseTo(25, 1);
      expect(getEpochDifferenceYears("J2025", "J2000")).toBeCloseTo(-25, 1);
    });
  });

  describe("normalizeEpoch", () => {
    it("should return epoch if provided", () => {
      expect(normalizeEpoch("J2000")).toBe("J2000");
      expect(normalizeEpoch("2025-01-01")).toBe("2025-01-01");
    });

    it("should return current epoch if undefined", () => {
      const result = normalizeEpoch(undefined);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe(getCurrentEpoch());
    });

    it("should return current epoch if empty string", () => {
      const result = normalizeEpoch("");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe(getCurrentEpoch());
    });

    it("should return current epoch if whitespace string", () => {
      const result = normalizeEpoch("   ");
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(result).toBe(getCurrentEpoch());
    });
  });

  describe("updateOrbitalElementsToEpoch", () => {
    const mockOrbitalElements: OrbitalParameters = {
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
      epoch: J2000_EPOCH,
    };

    it("should return unchanged elements if epochs are the same", () => {
      const result = updateOrbitalElementsToEpoch(
        mockOrbitalElements,
        J2000_EPOCH,
      );
      expect(result).toEqual(mockOrbitalElements);
    });

    it("should update epoch field", () => {
      const result = updateOrbitalElementsToEpoch(mockOrbitalElements, "J2025");
      expect(result.epoch).toBe("J2025");
      expect(result.realSemiMajorAxis_m).toBe(
        mockOrbitalElements.realSemiMajorAxis_m,
      );
    });

    it("should update mean anomaly for small time differences", () => {
      const result = updateOrbitalElementsToEpoch(mockOrbitalElements, "J2025");
      expect(result.meanAnomaly).toBeGreaterThanOrEqual(0);
      expect(result.meanAnomaly).toBeLessThan(2 * Math.PI);
      expect(result.epoch).toBe("J2025");
    });

    it("should warn for large time differences", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      updateOrbitalElementsToEpoch(mockOrbitalElements, "2100-01-01");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Large epoch difference"),
      );
      consoleSpy.mockRestore();
    });

    it("should handle missing epoch by using today's date", () => {
      const elementsWithoutEpoch: OrbitalParameters = {
        ...mockOrbitalElements,
        epoch: undefined as any,
      };
      const result = updateOrbitalElementsToEpoch(
        elementsWithoutEpoch,
        "J2025",
      );
      expect(result.epoch).toBe("J2025");
    });
  });

  describe("standardizeToCurrentEpoch", () => {
    it("should standardize to current epoch", () => {
      const mockOrbitalElements: OrbitalParameters = {
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
        epoch: J2000_EPOCH,
      };

      const result = standardizeToCurrentEpoch(mockOrbitalElements);
      expect(result.epoch).toBe(getCurrentEpoch());
    });
  });

  describe("standardizeToDate", () => {
    it("should standardize to specific date", () => {
      const mockOrbitalElements: OrbitalParameters = {
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
        epoch: J2000_EPOCH,
      };

      const targetDate = new Date("2025-01-01");
      const result = standardizeToDate(mockOrbitalElements, targetDate);
      expect(result.epoch).toBe("2025-01-01");
    });
  });

  describe("calculateCurrentPositionFromEpoch", () => {
    it("should calculate position for same epoch", () => {
      const mockOrbitalElements: OrbitalParameters = {
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
      };

      const result = calculateCurrentPositionFromEpoch(
        mockOrbitalElements,
        "J2000",
      );
      expect(result.position).toBeDefined();
      expect(result.velocity).toBeDefined();
      expect(result.updatedOrbitalElements.epoch).toBe("J2000");
    });

    it("should calculate position for different epoch", () => {
      const mockOrbitalElements: OrbitalParameters = {
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
      };

      const result = calculateCurrentPositionFromEpoch(
        mockOrbitalElements,
        "2025-01-01",
      );
      expect(result.position).toBeDefined();
      expect(result.velocity).toBeDefined();
      expect(result.updatedOrbitalElements.epoch).toBe("J2000");
      expect(result.updatedOrbitalElements.meanAnomaly).not.toBe(0);
    });
  });

  describe("calculateCurrentPositionPrecise", () => {
    it("should calculate position using precise current time", () => {
      const mockOrbitalElements: OrbitalParameters = {
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
      };

      const result = calculateCurrentPositionPrecise(mockOrbitalElements);
      expect(result.position).toBeDefined();
      expect(result.velocity).toBeDefined();
      expect(result.updatedOrbitalElements.epoch).toBe("J2000");
      expect(result.updatedOrbitalElements.meanAnomaly).not.toBe(0);
    });
  });
});
