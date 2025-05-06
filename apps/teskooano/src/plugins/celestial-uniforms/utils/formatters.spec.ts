import { describe, it, expect } from "vitest";
import {
  FormatUtils,
  AU_IN_METERS,
  SECONDS_PER_DAY,
  SECONDS_PER_YEAR,
} from "./formatters";

describe("FormatUtils", () => {
  describe("formatExp", () => {
    it("should format numbers in exponential notation", () => {
      expect(FormatUtils.formatExp(123456789)).toBe("1.235e+8");
      expect(FormatUtils.formatExp(0.00012345, 2)).toBe("1.23e-4");
    });

    it("should return N/A for null, undefined, or non-finite numbers", () => {
      expect(FormatUtils.formatExp(null)).toBe("N/A");
      expect(FormatUtils.formatExp(undefined)).toBe("N/A");
      expect(FormatUtils.formatExp(Infinity)).toBe("N/A");
      expect(FormatUtils.formatExp(NaN)).toBe("N/A");
    });
  });

  describe("formatFix", () => {
    it("should format numbers with fixed decimal places", () => {
      expect(FormatUtils.formatFix(123.456)).toBe("123.5");
      expect(FormatUtils.formatFix(123.456, 2)).toBe("123.46");
      expect(FormatUtils.formatFix(123, 0)).toBe("123");
    });

    it("should return N/A for null, undefined, or non-finite numbers", () => {
      expect(FormatUtils.formatFix(null)).toBe("N/A");
      expect(FormatUtils.formatFix(undefined)).toBe("N/A");
      expect(FormatUtils.formatFix(Infinity)).toBe("N/A");
      expect(FormatUtils.formatFix(NaN)).toBe("N/A");
    });
  });

  describe("formatDistanceKm", () => {
    it("should convert meters to kilometers and format", () => {
      expect(FormatUtils.formatDistanceKm(1500)).toBe("2 km");
      expect(FormatUtils.formatDistanceKm(1500, 1)).toBe("1.5 km");
      expect(FormatUtils.formatDistanceKm(500, 0)).toBe("1 km");
      expect(FormatUtils.formatDistanceKm(499, 0)).toBe("0 km");
    });

    it("should return N/A for invalid input", () => {
      expect(FormatUtils.formatDistanceKm(null)).toBe("N/A");
    });
  });

  describe("formatDistanceAU", () => {
    it("should convert meters to AU and format", () => {
      expect(FormatUtils.formatDistanceAU(AU_IN_METERS)).toBe("1.000 AU");
      expect(FormatUtils.formatDistanceAU(AU_IN_METERS * 1.5)).toBe("1.500 AU");
      expect(FormatUtils.formatDistanceAU(AU_IN_METERS / 2, 4)).toBe(
        "0.5000 AU",
      );
    });

    it("should return N/A for invalid input", () => {
      expect(FormatUtils.formatDistanceAU(null)).toBe("N/A");
    });
  });

  describe("formatDegrees", () => {
    it("should convert radians to degrees and format", () => {
      expect(FormatUtils.formatDegrees(Math.PI)).toBe("180.0°");
      expect(FormatUtils.formatDegrees(Math.PI / 2)).toBe("90.0°");
      expect(FormatUtils.formatDegrees(Math.PI / 4, 2)).toBe("45.00°");
    });

    it("should return N/A for invalid input", () => {
      expect(FormatUtils.formatDegrees(null)).toBe("N/A");
    });
  });

  describe("formatPeriod", () => {
    it("should format seconds into appropriate units (s, days, yrs)", () => {
      expect(FormatUtils.formatPeriod(60)).toBe("60 s");
      expect(FormatUtils.formatPeriod(SECONDS_PER_DAY)).toBe("1.0 days");
      expect(FormatUtils.formatPeriod(SECONDS_PER_DAY * 1.49)).toBe("1.5 days");
      expect(FormatUtils.formatPeriod(SECONDS_PER_DAY * 1.5)).toBe("1.5 days");
      expect(FormatUtils.formatPeriod(SECONDS_PER_DAY * 1.51)).toBe("1.5 days");
      expect(FormatUtils.formatPeriod(SECONDS_PER_YEAR)).toBe("365.2 days");
      expect(FormatUtils.formatPeriod(SECONDS_PER_YEAR * 1.49)).toBe(
        "544.2 days",
      );
      expect(FormatUtils.formatPeriod(SECONDS_PER_YEAR * 1.5)).toBe("1.50 yrs");
      expect(FormatUtils.formatPeriod(SECONDS_PER_YEAR * 2)).toBe("2.00 yrs");
    });

    it("should return N/A for invalid input", () => {
      expect(FormatUtils.formatPeriod(null)).toBe("N/A");
    });
  });

  describe("getStarColorName", () => {
    it("should return correct names for known hex codes", () => {
      expect(FormatUtils.getStarColorName("#9bb0ff")).toBe("Blue");
      expect(FormatUtils.getStarColorName("#cad7ff")).toBe("Blue-White");
      expect(FormatUtils.getStarColorName("#f8f7ff")).toBe("White");
      expect(FormatUtils.getStarColorName("#fff4ea")).toBe("Yellow-White");
      expect(FormatUtils.getStarColorName("#ffff9d")).toBe("Yellow");
      expect(FormatUtils.getStarColorName("#ffd2a1")).toBe("Orange");
      expect(FormatUtils.getStarColorName("#ffb56c")).toBe("Red-Orange");
      expect(FormatUtils.getStarColorName("#ff8080")).toBe("Red");
    });

    it("should return approximate names for unknown hex codes", () => {
      expect(FormatUtils.getStarColorName("#ffaaaa")).toBe("Yellowish");
      expect(FormatUtils.getStarColorName("#ff88aa")).toBe("Reddish");
      expect(FormatUtils.getStarColorName("#caaaaa")).toBe("Bluish");
      expect(FormatUtils.getStarColorName("#9baaaa")).toBe("Bluish");
      expect(FormatUtils.getStarColorName("#aaaaaa")).toBe("Bluish");
      expect(FormatUtils.getStarColorName("#abcdef")).toBe("Bluish");
      expect(FormatUtils.getStarColorName("#123456")).toBe("Unknown");
    });

    it("should return Unknown for null or undefined input", () => {
      expect(FormatUtils.getStarColorName(null)).toBe("Unknown");
      expect(FormatUtils.getStarColorName(undefined)).toBe("Unknown");
    });

    it("should handle case-insensitivity for hex codes", () => {
      expect(FormatUtils.getStarColorName("#9BB0FF")).toBe("Blue");
    });
  });
});
