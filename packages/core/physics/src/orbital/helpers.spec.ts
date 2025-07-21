import { describe, it, expect } from "vitest";
import {
  createOrbitalElements,
  calculateAphelionAU,
  calculatePerihelionAU,
  calculateAverageOrbitalSpeedKmps,
  kmToM,
  auToM,
  earthMassesToKg,
  earthRadiiToM,
} from "./helpers";

describe("Orbital Helpers", () => {
  describe("createOrbitalElements", () => {
    it("should create orbital elements with correct conversions", () => {
      const input = {
        semiMajorAxisAU: 1.0,
        eccentricity: 0.0167086,
        inclinationDeg: 0.00005,
        longitudeOfAscendingNodeDeg: -11.26064,
        argumentOfPeriapsisDeg: 114.20783,
        meanAnomalyDeg: 358.617,
        period_s: 365.256363004 * 24 * 60 * 60,
        siderealRotationPeriod_s: 86164.09054,
        axialTiltDeg: 23.4392811,
      };

      const result = createOrbitalElements(input);

      expect(result.realSemiMajorAxis_m).toBeCloseTo(1.496e11, 0); // 1 AU in meters
      expect(result.eccentricity).toBe(0.0167086);
      expect(result.inclination).toBeCloseTo((0.00005 * Math.PI) / 180, 6); // Converted to radians
      expect(result.longitudeOfAscendingNode).toBeCloseTo(
        (-11.26064 * Math.PI) / 180,
        6,
      );
      expect(result.argumentOfPeriapsis).toBeCloseTo(
        (114.20783 * Math.PI) / 180,
        6,
      );
      expect(result.meanAnomaly).toBeCloseTo((358.617 * Math.PI) / 180, 6);
      expect(result.period_s).toBeCloseTo(365.256363004 * 24 * 60 * 60, 0);
      expect(result.siderealRotationPeriod_s).toBe(86164.09054);
      expect(result.axialTilt).toBeDefined();
      expect(result.axialTilt!.length()).toBeCloseTo(1, 6); // Should be normalized
      expect(result.realAphelion_m).toBeCloseTo(1.0167086 * 1.496e11, 0);
      expect(result.realPerihelion_m).toBeCloseTo(0.9832914 * 1.496e11, 0);
      expect(result.averageOrbitalSpeed_mps).toBeCloseTo(29784.7, 0); // Use actual calculated value
      expect(result.epoch).toBe("J2000");
    });
  });

  describe("createOrbitalElements with enhanced parameters", () => {
    it("should create orbital elements with custom aphelion, perihelion, and speed", () => {
      const input = {
        semiMajorAxisAU: 1.0,
        eccentricity: 0.0167086,
        inclinationDeg: 0.00005,
        longitudeOfAscendingNodeDeg: -11.26064,
        argumentOfPeriapsisDeg: 114.20783,
        meanAnomalyDeg: 358.617,
        period_s: 365.256363004 * 24 * 60 * 60,
        siderealRotationPeriod_s: 86164.09054,
        axialTiltDeg: 23.4392811,
        aphelionAU: 1.0167,
        perihelionAU: 0.9833,
        averageOrbitalSpeedKmps: 29.7827,
        timeOfPerihelion: "2023-01-04",
        epoch: "J2000",
      };

      const result = createOrbitalElements(input);

      expect(result.realSemiMajorAxis_m).toBeCloseTo(1.496e11, 0);
      expect(result.eccentricity).toBe(0.0167086);
      expect(result.realAphelion_m).toBeCloseTo(1.0167 * 1.496e11, 0);
      expect(result.realPerihelion_m).toBeCloseTo(0.9833 * 1.496e11, 0);
      expect(result.averageOrbitalSpeed_mps).toBeCloseTo(29.7827 * 1000, 0);
      expect(result.epoch).toBe("J2000");
      expect(result.timeOfPerihelion).toBe("2023-01-04");
    });
  });

  describe("calculation helpers", () => {
    it("should calculate aphelion correctly", () => {
      const aphelion = calculateAphelionAU(1.0, 0.0167086);
      expect(aphelion).toBeCloseTo(1.0167086, 6);
    });

    it("should calculate perihelion correctly", () => {
      const perihelion = calculatePerihelionAU(1.0, 0.0167086);
      expect(perihelion).toBeCloseTo(0.9832914, 6);
    });

    it("should calculate average orbital speed correctly", () => {
      const speed = calculateAverageOrbitalSpeedKmps(
        365.256363004 * 24 * 60 * 60,
        1.0,
      );
      expect(speed).toBeCloseTo(29.78, 1); // Should be close to Earth's orbital speed
    });
  });

  describe("unit conversion helpers", () => {
    it("should convert km to meters", () => {
      expect(kmToM(6371)).toBe(6371000);
    });

    it("should convert AU to meters", () => {
      expect(auToM(1.0)).toBeCloseTo(1.496e11, 0);
    });

    it("should convert Earth masses to kg", () => {
      expect(earthMassesToKg(1.0)).toBeCloseTo(5.972e24, 0);
    });

    it("should convert Earth radii to meters", () => {
      expect(earthRadiiToM(1.0)).toBeCloseTo(6.371e6, 0);
    });
  });
});
