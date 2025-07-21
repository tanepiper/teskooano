import { describe, it, expect } from "vitest";
import {
  parseTLE,
  tleToOrbitalElements,
  createOrbitalElementsFromTLE,
} from "./tle";

describe("TLE Parser", () => {
  const ISS_TLE_LINE1 =
    "1 25544U 98067A   25201.84759595  .00007915  00000-0  14663-3 0  9997";
  const ISS_TLE_LINE2 =
    "2 25544  51.6338 140.2277 0002187  99.1799 260.9438 15.49977817520381";

  describe("parseTLE", () => {
    it("should parse ISS TLE data correctly", () => {
      const tle = parseTLE(ISS_TLE_LINE1, ISS_TLE_LINE2);

      expect(tle.catalogNumber).toBe("25544");
      expect(tle.internationalDesignator).toBe("98067A");
      expect(tle.epochYear).toBe(25);
      expect(tle.epochDay).toBeCloseTo(201.84759595, 8);
      expect(tle.inclination).toBeCloseTo(51.6338, 4);
      expect(tle.raan).toBeCloseTo(140.2277, 4);
      expect(tle.eccentricity).toBeCloseTo(0.0002187, 7);
      expect(tle.argumentOfPerigee).toBeCloseTo(99.1799, 4);
      expect(tle.meanAnomaly).toBeCloseTo(260.9438, 4);
      expect(tle.meanMotion).toBeCloseTo(15.49977817, 8);
      expect(tle.revolutionNumber).toBe(520381);
    });

    it("should throw error for invalid line lengths", () => {
      expect(() => parseTLE("short", "also short")).toThrow(
        "TLE lines must be exactly 69 characters long",
      );
    });
  });

  describe("tleToOrbitalElements", () => {
    it("should convert ISS TLE to orbital elements", () => {
      const tle = parseTLE(ISS_TLE_LINE1, ISS_TLE_LINE2);
      const orbitalElements = tleToOrbitalElements(tle);

      expect(orbitalElements.eccentricity).toBeCloseTo(0.0002187, 7);
      expect(orbitalElements.inclination).toBeCloseTo(
        (51.6338 * Math.PI) / 180,
        6,
      ); // Convert to radians
      expect(orbitalElements.longitudeOfAscendingNode).toBeCloseTo(
        (140.2277 * Math.PI) / 180,
        6,
      );
      expect(orbitalElements.argumentOfPeriapsis).toBeCloseTo(
        (99.1799 * Math.PI) / 180,
        6,
      );
      expect(orbitalElements.meanAnomaly).toBeCloseTo(
        (260.9438 * Math.PI) / 180,
        6,
      );
      expect(orbitalElements.period_s).toBeCloseTo(
        (24 * 60 * 60) / 15.49977817,
        0,
      ); // ~93 minutes
      expect(orbitalElements.epoch).toBe("2025-07-20"); // Day 201 of 2025
    });
  });

  describe("createOrbitalElementsFromTLE", () => {
    it("should create orbital elements directly from TLE strings", () => {
      const orbitalElements = createOrbitalElementsFromTLE(
        ISS_TLE_LINE1,
        ISS_TLE_LINE2,
      );

      expect(orbitalElements.eccentricity).toBeCloseTo(0.0002187, 7);
      expect(orbitalElements.inclination).toBeCloseTo(
        (51.6338 * Math.PI) / 180,
        6,
      );
      expect(orbitalElements.epoch).toBe("2025-07-20");
    });
  });
});
