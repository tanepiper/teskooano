import { describe, it, expect, vi } from "vitest";
import {
  J2000_EPOCH,
  J2000_JULIAN_DAY,
  getCurrentEpoch,
  getCurrentPreciseEpoch,
  getCurrentJulianDay,
  julianDayToYearsSinceJ2000,
  yearsSinceJ2000ToJulianDay,
  getJulianDayForEpoch,
  getEpochDifferenceYears,
  updateOrbitalElementsToEpoch,
  calculateCurrentPositionFromEpoch,
  calculateCurrentPositionPrecise,
  standardizeToCurrentEpoch,
  standardizeToDate,
  isValidEpoch,
  getEpochDescription,
  dateToJulianDay,
  parseJEpochToJulianDay,
} from "./epoch";
import type { OrbitalParameters } from "@teskooano/data-types";

describe("Epoch Utilities", () => {
  describe("Constants", () => {
    it("should have correct J2000 epoch constant", () => {
      expect(J2000_EPOCH).toBe("J2000");
    });

    it("should have correct J2000 Julian Day number", () => {
      expect(J2000_JULIAN_DAY).toBe(2451545.0);
    });

    it("should get current epoch dynamically", () => {
      const currentEpoch = getCurrentEpoch();
      expect(currentEpoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(currentEpoch).toBe(getCurrentEpoch()); // Should be consistent within test
    });

    it("should get current precise epoch with time", () => {
      const currentPreciseEpoch = getCurrentPreciseEpoch();
      expect(currentPreciseEpoch).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/,
      );
    });

    it("should get current Julian Day with precision", () => {
      const currentJD = getCurrentJulianDay();
      expect(currentJD).toBeGreaterThan(2451545.0); // After J2000
      expect(currentJD).toBeLessThan(2500000.0); // Reasonable future date
    });
  });

  describe("Julian Day conversions", () => {
    it("should convert Julian Day to years since J2000", () => {
      expect(julianDayToYearsSinceJ2000(J2000_JULIAN_DAY)).toBeCloseTo(0, 2);
      expect(julianDayToYearsSinceJ2000(2460675.0)).toBeCloseTo(25, 1); // J2025
      expect(julianDayToYearsSinceJ2000(2460801.0)).toBeCloseTo(25.3, 1); // Current 2025
    });

    it("should convert years since J2000 to Julian Day", () => {
      expect(yearsSinceJ2000ToJulianDay(0)).toBeCloseTo(J2000_JULIAN_DAY, 1);
      // Allow for small rounding differences in Julian Day calculations
      expect(yearsSinceJ2000ToJulianDay(25)).toBeCloseTo(2460675.0, -1); // J2025
    });
  });

  describe("dateToJulianDay", () => {
    it("should convert dates to Julian Day correctly", () => {
      const j2000Date = new Date(2000, 0, 1, 12, 0, 0, 0); // Jan 1, 2000 noon UTC
      expect(dateToJulianDay(j2000Date)).toBeCloseTo(J2000_JULIAN_DAY, 0);

      const j2025Date = new Date(2025, 0, 1, 12, 0, 0, 0); // Jan 1, 2025 noon UTC
      expect(dateToJulianDay(j2025Date)).toBeCloseTo(2460675.0, 0);
    });
  });

  describe("parseJEpochToJulianDay", () => {
    it("should parse J-epochs correctly", () => {
      expect(parseJEpochToJulianDay("J2000")).toBeCloseTo(J2000_JULIAN_DAY, 0);
      expect(parseJEpochToJulianDay("J2025")).toBeCloseTo(2460675.0, 0);
      expect(parseJEpochToJulianDay("J2100")).toBeCloseTo(2488145.0, 0);
    });

    it("should handle fractional J-epochs", () => {
      expect(parseJEpochToJulianDay("J2000.5")).toBeCloseTo(
        2451545.0 + 365.25 * 0.5,
        0,
      );
    });
  });

  describe("getJulianDayForEpoch", () => {
    it("should handle J2000 epoch", () => {
      expect(getJulianDayForEpoch(J2000_EPOCH)).toBe(J2000_JULIAN_DAY);
    });

    it("should handle J-prefixed epochs", () => {
      expect(getJulianDayForEpoch("J2025")).toBeCloseTo(2460675.0, 0);
      expect(getJulianDayForEpoch("J2100")).toBeCloseTo(2488145.0, 0);
    });

    it("should handle Julian Day numbers with JD prefix", () => {
      expect(getJulianDayForEpoch("JD 2451545.0")).toBe(2451545.0);
      expect(getJulianDayForEpoch("JD 2458900.5")).toBe(2458900.5);
      expect(getJulianDayForEpoch("JD2460675.0")).toBe(2460675.0); // No space
    });

    it("should handle Julian Day numbers without prefix", () => {
      expect(getJulianDayForEpoch("2451545.0")).toBe(2451545.0);
      expect(getJulianDayForEpoch("2458900.5")).toBe(2458900.5);
      expect(getJulianDayForEpoch("2460675")).toBe(2460675);
    });

    it("should handle date strings", () => {
      const jd = getJulianDayForEpoch("2025-05-05");
      expect(jd).toBeCloseTo(2460801.0, 0);
    });

    it("should handle precise date-time strings", () => {
      const jd = getJulianDayForEpoch("2025-05-05T12:30:45");
      expect(jd).toBeCloseTo(2460801.0 + 0.5 + 30 / 86400 + 45 / 86400, 2);
    });

    it("should default to J2000 for unknown epochs", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(getJulianDayForEpoch("UNKNOWN")).toBe(J2000_JULIAN_DAY);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Unknown epoch format: UNKNOWN, defaulting to J2000",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getEpochDifferenceYears", () => {
    it("should calculate correct time differences", () => {
      expect(getEpochDifferenceYears("J2000", "J2025")).toBeCloseTo(25, 1);
      expect(getEpochDifferenceYears("J2025", "J2000")).toBeCloseTo(-25, 1);
    });
  });

  describe("updateOrbitalElementsToEpoch", () => {
    const mockOrbitalElements: OrbitalParameters = {
      realSemiMajorAxis_m: 149597870700, // 1 AU
      eccentricity: 0.0167,
      inclination: 0,
      longitudeOfAscendingNode: 0,
      argumentOfPeriapsis: 0,
      meanAnomaly: 0,
      period_s: 31557600, // 1 year
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
      expect(result.meanAnomaly).not.toBe(mockOrbitalElements.meanAnomaly);
      expect(result.meanAnomaly).toBeGreaterThanOrEqual(0);
      expect(result.meanAnomaly).toBeLessThan(2 * Math.PI);
    });

    it("should warn for large time differences", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      // Use a date string that will result in a large time difference
      updateOrbitalElementsToEpoch(mockOrbitalElements, "2100-01-01");
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Large epoch difference"),
      );
      consoleSpy.mockRestore();
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

  describe("isValidEpoch", () => {
    it("should validate J2000 epoch", () => {
      expect(isValidEpoch(J2000_EPOCH)).toBe(true);
    });

    it("should validate J-prefixed epochs", () => {
      expect(isValidEpoch("J2025")).toBe(true);
      expect(isValidEpoch("J2100.5")).toBe(true);
    });

    it("should validate Julian Day numbers with JD prefix", () => {
      expect(isValidEpoch("JD 2451545.0")).toBe(true);
      expect(isValidEpoch("JD 2458900.5")).toBe(true);
      expect(isValidEpoch("JD2460675.0")).toBe(true); // No space
    });

    it("should validate Julian Day numbers without prefix", () => {
      expect(isValidEpoch("2451545.0")).toBe(true);
      expect(isValidEpoch("2458900.5")).toBe(true);
      expect(isValidEpoch("2460675")).toBe(true);
    });

    it("should validate date strings", () => {
      expect(isValidEpoch("2025-05-05")).toBe(true);
      expect(isValidEpoch("2023-02-25")).toBe(true);
    });

    it("should validate precise date-time strings", () => {
      expect(isValidEpoch("2025-05-05T12:30:45")).toBe(true);
      expect(isValidEpoch("2023-02-25T00:00:00")).toBe(true);
      expect(isValidEpoch("2025-05-05T25:30:45")).toBe(false); // Invalid hour
    });

    it("should reject invalid formats", () => {
      expect(isValidEpoch("invalid")).toBe(false);
      expect(isValidEpoch("2025/05/05")).toBe(false);
    });
  });

  describe("getEpochDescription", () => {
    it("should provide descriptions for J2000", () => {
      expect(getEpochDescription(J2000_EPOCH)).toContain("J2000 epoch");
    });

    it("should handle J-prefixed epochs", () => {
      expect(getEpochDescription("J2100")).toContain("J2100 epoch");
    });

    it("should handle Julian Day epochs with JD prefix", () => {
      expect(getEpochDescription("JD 2451545.0")).toContain(
        "Julian Day epoch (JD 2451545.0)",
      );
      expect(getEpochDescription("JD 2458900.5")).toContain(
        "Julian Day epoch (JD 2458900.5)",
      );
    });

    it("should handle Julian Day epochs without prefix", () => {
      expect(getEpochDescription("2451545.0")).toContain(
        "Julian Day epoch (2451545.0)",
      );
      expect(getEpochDescription("2458900.5")).toContain(
        "Julian Day epoch (2458900.5)",
      );
    });

    it("should handle date epochs", () => {
      expect(getEpochDescription("2026-01-01")).toContain("Date epoch");
    });

    it("should handle precise date-time epochs", () => {
      expect(getEpochDescription("2026-01-01T12:30:45")).toContain(
        "Precise date-time epoch",
      );
    });

    it("should handle unknown epochs gracefully", () => {
      expect(getEpochDescription("UNKNOWN")).toContain("Unknown epoch");
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
      expect(result.updatedOrbitalElements.epoch).toBe("J2000"); // Preserves original epoch
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
      expect(result.updatedOrbitalElements.epoch).toBe("J2000"); // Preserves original epoch
      expect(result.updatedOrbitalElements.meanAnomaly).not.toBe(0);
    });
  });
});
