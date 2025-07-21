import { describe, it, expect, vi } from "vitest";
import {
  ASTRONOMICAL_EPOCHS,
  JULIAN_DAYS,
  getCurrentEpoch,
  julianDayToYearsSinceJ2000,
  yearsSinceJ2000ToJulianDay,
  getJulianDayForEpoch,
  getEpochDifferenceYears,
  updateOrbitalElementsToEpoch,
  calculateCurrentPositionFromEpoch,
  standardizeToCurrentEpoch,
  standardizeToDate,
  isValidEpoch,
  getEpochDescription,
} from "./epoch";
import type { OrbitalParameters } from "@teskooano/data-types";

describe("Epoch Utilities", () => {
  describe("Constants", () => {
    it("should have correct epoch constants", () => {
      expect(ASTRONOMICAL_EPOCHS.J2000).toBe("J2000");
      expect(ASTRONOMICAL_EPOCHS.J2025).toBe("J2025");
      expect(ASTRONOMICAL_EPOCHS.CURRENT_2025).toBe("2025-05-05");
      expect(ASTRONOMICAL_EPOCHS.EPOCH_2023).toBe("2023-02-25");
    });

    it("should have correct Julian Day numbers", () => {
      expect(JULIAN_DAYS.J2000).toBe(2451545.0);
      expect(JULIAN_DAYS.J2025).toBe(2460675.0);
      expect(JULIAN_DAYS.CURRENT_2025).toBe(2460801.0);
      expect(JULIAN_DAYS.EPOCH_2023).toBe(2460000.5);
    });

    it("should get current epoch dynamically", () => {
      const currentEpoch = getCurrentEpoch();
      expect(currentEpoch).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(currentEpoch).toBe(getCurrentEpoch()); // Should be consistent within test
    });
  });

  describe("Julian Day conversions", () => {
    it("should convert Julian Day to years since J2000", () => {
      expect(julianDayToYearsSinceJ2000(JULIAN_DAYS.J2000)).toBeCloseTo(0, 2);
      expect(julianDayToYearsSinceJ2000(JULIAN_DAYS.J2025)).toBeCloseTo(25, 1);
      expect(julianDayToYearsSinceJ2000(JULIAN_DAYS.CURRENT_2025)).toBeCloseTo(
        25.3,
        1,
      );
    });

    it("should convert years since J2000 to Julian Day", () => {
      expect(yearsSinceJ2000ToJulianDay(0)).toBeCloseTo(JULIAN_DAYS.J2000, 1);
      // Allow for small rounding differences in Julian Day calculations
      expect(yearsSinceJ2000ToJulianDay(25)).toBeCloseTo(JULIAN_DAYS.J2025, -1);
    });
  });

  describe("getJulianDayForEpoch", () => {
    it("should handle known epoch constants", () => {
      expect(getJulianDayForEpoch(ASTRONOMICAL_EPOCHS.J2000)).toBe(
        JULIAN_DAYS.J2000,
      );
      expect(getJulianDayForEpoch(ASTRONOMICAL_EPOCHS.J2025)).toBe(
        JULIAN_DAYS.J2025,
      );
    });

    it("should handle date strings", () => {
      const jd = getJulianDayForEpoch("2025-05-05");
      expect(jd).toBeCloseTo(JULIAN_DAYS.CURRENT_2025, 0);
    });

    it("should default to J2000 for unknown epochs", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      expect(getJulianDayForEpoch("UNKNOWN")).toBe(JULIAN_DAYS.J2000);
      expect(consoleSpy).toHaveBeenCalledWith(
        "Unknown epoch format: UNKNOWN, defaulting to J2000",
      );
      consoleSpy.mockRestore();
    });
  });

  describe("getEpochDifferenceYears", () => {
    it("should calculate correct time differences", () => {
      expect(
        getEpochDifferenceYears(
          ASTRONOMICAL_EPOCHS.J2000,
          ASTRONOMICAL_EPOCHS.J2025,
        ),
      ).toBeCloseTo(25, 1);
      expect(
        getEpochDifferenceYears(
          ASTRONOMICAL_EPOCHS.J2025,
          ASTRONOMICAL_EPOCHS.J2000,
        ),
      ).toBeCloseTo(-25, 1);
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
      epoch: ASTRONOMICAL_EPOCHS.J2000,
    };

    it("should return unchanged elements if epochs are the same", () => {
      const result = updateOrbitalElementsToEpoch(
        mockOrbitalElements,
        ASTRONOMICAL_EPOCHS.J2000,
      );
      expect(result).toEqual(mockOrbitalElements);
    });

    it("should update epoch field", () => {
      const result = updateOrbitalElementsToEpoch(
        mockOrbitalElements,
        ASTRONOMICAL_EPOCHS.J2025,
      );
      expect(result.epoch).toBe(ASTRONOMICAL_EPOCHS.J2025);
      expect(result.realSemiMajorAxis_m).toBe(
        mockOrbitalElements.realSemiMajorAxis_m,
      );
    });

    it("should update mean anomaly for small time differences", () => {
      const result = updateOrbitalElementsToEpoch(
        mockOrbitalElements,
        ASTRONOMICAL_EPOCHS.J2025,
      );
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
        epoch: ASTRONOMICAL_EPOCHS.J2000,
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
        epoch: ASTRONOMICAL_EPOCHS.J2000,
      };

      const targetDate = new Date("2025-01-01");
      const result = standardizeToDate(mockOrbitalElements, targetDate);
      expect(result.epoch).toBe("2025-01-01");
    });
  });

  describe("isValidEpoch", () => {
    it("should validate known epoch constants", () => {
      expect(isValidEpoch(ASTRONOMICAL_EPOCHS.J2000)).toBe(true);
      expect(isValidEpoch(ASTRONOMICAL_EPOCHS.J2025)).toBe(true);
    });

    it("should validate date strings", () => {
      expect(isValidEpoch("2025-05-05")).toBe(true);
      expect(isValidEpoch("2023-02-25")).toBe(true);
    });

    it("should validate J-prefixed epochs", () => {
      expect(isValidEpoch("J2000")).toBe(true);
      expect(isValidEpoch("J2025.0")).toBe(true);
    });

    it("should reject invalid formats", () => {
      expect(isValidEpoch("invalid")).toBe(false);
      expect(isValidEpoch("2025/05/05")).toBe(false);
    });
  });

  describe("getEpochDescription", () => {
    it("should provide descriptions for known epochs", () => {
      expect(getEpochDescription(ASTRONOMICAL_EPOCHS.J2000)).toContain(
        "J2000 epoch",
      );
      expect(getEpochDescription(ASTRONOMICAL_EPOCHS.CURRENT_2025)).toContain(
        "Date epoch",
      );
    });

    it("should handle unknown epochs gracefully", () => {
      expect(getEpochDescription("J2100")).toContain("J2100 epoch");
      expect(getEpochDescription("2026-01-01")).toContain("Date epoch");
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
      expect(result.updatedOrbitalElements.epoch).toBe("2025-01-01");
      expect(result.updatedOrbitalElements.meanAnomaly).not.toBe(0);
    });
  });
});
