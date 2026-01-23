import { describe, it, expect, vi } from "vitest";
import { J2000_EPOCH, J2000_JULIAN_DAY } from "@teskooano/data-values";
import {
  parseJEpochToJulianDay,
  getJulianDayForEpoch,
  isValidEpoch,
  getEpochDescription,
} from "./epoch-parsers";

describe("Epoch Parsers", () => {
  describe("Constants", () => {
    it("should have correct J2000 epoch constant", () => {
      expect(J2000_EPOCH).toBe("J2000");
    });

    it("should have correct J2000 Julian Day number", () => {
      expect(J2000_JULIAN_DAY).toBe(2451545.0);
    });
  });

  describe("parseJEpochToJulianDay", () => {
    it("should parse J-epochs correctly", () => {
      expect(parseJEpochToJulianDay("J2000")).toBeCloseTo(J2000_JULIAN_DAY, 0);
      expect(parseJEpochToJulianDay("J2025")).toBeCloseTo(2460676.25, 0);
      expect(parseJEpochToJulianDay("J2100")).toBeCloseTo(2488070.0, 0);
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
      expect(getJulianDayForEpoch("J2025")).toBeCloseTo(2460676.25, 0);
      expect(getJulianDayForEpoch("J2100")).toBeCloseTo(2488070.0, 0);
    });

    it("should handle Julian Day numbers with JD prefix", () => {
      expect(getJulianDayForEpoch("JD 2451545.0")).toBe(2451545.0);
      expect(getJulianDayForEpoch("JD 2458900.5")).toBe(2458900.5);
      expect(getJulianDayForEpoch("JD2460675.0")).toBe(2460675.0);
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
      expect(jd).toBeCloseTo(2460801.0 + 0.5 + 30 / 86400 + 45 / 86400, 0);
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
      expect(isValidEpoch("JD2460675.0")).toBe(true);
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
      expect(isValidEpoch("2025-05-05T25:30:45")).toBe(false);
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
});
