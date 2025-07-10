import { describe, expect, it } from "vitest";
import { generateAsteroidBelt } from "./asteroidBelt";
import { createSeededRandom } from "@teskooano/core-math";
import {
  CelestialType,
  StellarType,
  SpectralClass,
  LuminosityClass,
  CelestialStatus,
  AsteroidFieldProperties,
} from "@teskooano/data-types";
import * as CONST from "../../constants";

describe("Asteroid Belt Generation", () => {
  it("should generate asteroid belt with realistic mass and temperature", async () => {
    const random = await createSeededRandom("test-seed");

    // Create a mock parent star
    const parentStar = {
      id: "test-star",
      name: "Test Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG, // 1 solar mass
      realRadius_m: CONST.SOLAR_RADIUS_M,
      temperature: 5778, // Solar temperature
      orbit: {
        realSemiMajorAxis_m: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 0,
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 1.0, // 1 solar luminosity
        color: "#FFF9E5",
      },
      physicsStateReal: {
        id: "test-star",
        mass_kg: CONST.SOLAR_MASS_KG,
        position_m: { x: 0, y: 0, z: 0 },
        velocity_mps: { x: 0, y: 0, z: 0 },
      },
    } as any;

    const belt = generateAsteroidBelt(random, parentStar, 0, 3.0);

    expect(belt).not.toBeNull();
    expect(belt?.type).toBe(CelestialType.ASTEROID_FIELD);
    expect(belt?.parentId).toBe("test-star");
    expect(belt?.realMass_kg).toBeGreaterThan(0); // Should have realistic mass
    expect(belt?.realMass_kg).toBeLessThan(1e23); // Should not be too massive
    expect(belt?.temperature).toBeGreaterThan(2.7); // Should be above cosmic background
    expect(belt?.temperature).toBeLessThan(1000); // Should be reasonable for 3 AU
    expect(belt?.properties?.type).toBe(CelestialType.ASTEROID_FIELD);

    const beltProps = belt?.properties as AsteroidFieldProperties;
    expect(beltProps.count).toBeGreaterThanOrEqual(1000);
    expect(beltProps.count).toBeLessThan(50000);
  });

  it("should calculate temperature based on star's actual luminosity", async () => {
    const random = await createSeededRandom("test-seed");

    // Create a bright star (10x solar luminosity)
    const brightStar = {
      id: "bright-star",
      name: "Bright Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG,
      realRadius_m: CONST.SOLAR_RADIUS_M,
      temperature: 5778,
      orbit: {
        realSemiMajorAxis_m: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 0,
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 10.0, // 10x solar luminosity
        color: "#FFF9E5",
      },
      physicsStateReal: {
        id: "bright-star",
        mass_kg: CONST.SOLAR_MASS_KG,
        position_m: { x: 0, y: 0, z: 0 },
        velocity_mps: { x: 0, y: 0, z: 0 },
      },
    } as any;

    const belt = generateAsteroidBelt(random, brightStar, 0, 3.0);

    expect(belt).not.toBeNull();
    // Temperature should be higher due to higher luminosity
    // T ∝ L^(1/4), so 10x luminosity should give ~1.78x temperature
    expect(belt?.temperature).toBeGreaterThan(200); // Should be warmer than solar system belt
  });

  it("should handle stars without luminosity property", async () => {
    const random = await createSeededRandom("test-seed");

    // Create a star without luminosity property (fallback to mass-based calculation)
    const simpleStar = {
      id: "simple-star",
      name: "Simple Star",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG,
      realRadius_m: CONST.SOLAR_RADIUS_M,
      temperature: 5778,
      orbit: {
        realSemiMajorAxis_m: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 0,
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        color: "#FFF9E5",
        // No luminosity property
      },
      physicsStateReal: {
        id: "simple-star",
        mass_kg: CONST.SOLAR_MASS_KG,
        position_m: { x: 0, y: 0, z: 0 },
        velocity_mps: { x: 0, y: 0, z: 0 },
      },
    } as any;

    const belt = generateAsteroidBelt(random, simpleStar, 0, 3.0);

    expect(belt).not.toBeNull();
    expect(belt?.realMass_kg).toBeGreaterThan(0);
    expect(belt?.temperature).toBeGreaterThan(2.7);
  });
});
