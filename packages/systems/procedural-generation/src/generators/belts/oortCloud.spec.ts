import { describe, expect, it } from "vitest";
import { generateOortCloud } from "./oortCloud";
import { createSeededRandom } from "@teskooano/core-math";
import {
  CelestialType,
  CelestialStatus,
  StellarType,
  SpectralClass,
  LuminosityClass,
  type StarProperties,
  type CelestialObject,
  type OortCloudProperties,
} from "@teskooano/data-types";
import * as CONST from "../../constants";

describe("Oort Cloud Generator", () => {
  it("should generate a valid Oort cloud with realistic properties", async () => {
    const random = await createSeededRandom("test-seed");

    // Create a mock parent star
    const parentStar: CelestialObject<StarProperties> = {
      id: "test-star",
      name: "Test Star",
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
        realAphelion_m: 0,
        realPerihelion_m: 0,
        averageOrbitalSpeed_mps: 0,
        epoch: "J2000",
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 1.0,
        color: "#FFF9E5",
      },
    };

    const oortCloud = generateOortCloud(random, parentStar);

    expect(oortCloud).not.toBeNull();
    expect(oortCloud?.type).toBe(CelestialType.OORT_CLOUD);
    expect(oortCloud?.parentId).toBe("test-star");
    expect(oortCloud?.name).toBe("Test Star Oort Cloud");
    expect(oortCloud?.id).toBe("oortcloud-test-star");
    expect(oortCloud?.status).toBe(CelestialStatus.ACTIVE);
    expect(oortCloud?.realMass_kg).toBe(0);
    expect(oortCloud?.realRadius_m).toBe(0);
    expect(oortCloud?.temperature).toBeGreaterThanOrEqual(10);
    expect(oortCloud?.temperature).toBeLessThanOrEqual(30);
    expect(oortCloud?.ignorePhysics).toBe(true);
    expect(oortCloud?.ignoreCollisions).toBe(true);
    expect(oortCloud?.properties).toBeDefined();

    const oortProps = oortCloud?.properties as OortCloudProperties;
    expect(oortProps.type).toBe(CelestialType.OORT_CLOUD);
    expect(oortProps.innerRadiusAU).toBeGreaterThanOrEqual(200);
    expect(oortProps.innerRadiusAU).toBeLessThanOrEqual(250);
    expect(oortProps.outerRadiusAU).toBeGreaterThan(oortProps.innerRadiusAU);
    expect(oortProps.outerRadiusAU).toBeLessThanOrEqual(
      oortProps.innerRadiusAU + 100,
    );
    expect(oortProps.composition).toEqual([
      "ice",
      "methane ice",
      "ammonia ice",
    ]);
    expect(oortProps.visualDensity).toBeGreaterThanOrEqual(0.05);
    expect(oortProps.visualDensity).toBeLessThanOrEqual(0.15);
    expect(oortProps.visualParticleCount).toBeGreaterThanOrEqual(10000);
    expect(oortProps.visualParticleCount).toBeLessThanOrEqual(25000);
    expect(oortProps.visualParticleColor).toBe("#B0D0FF");
    expect(oortProps.count).toBeGreaterThanOrEqual(10000);
    expect(oortProps.count).toBeLessThanOrEqual(25000);
    expect(oortProps.color).toBe("#B0D0FF");
  });

  it("should return null for invalid parent star", async () => {
    const random = await createSeededRandom("test-seed");

    // Test with null parent
    expect(generateOortCloud(random, null as any)).toBeNull();

    // Test with non-star object
    const nonStar: CelestialObject = {
      id: "not-a-star",
      name: "Not a Star",
      type: CelestialType.PLANET,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.EARTH_MASS_KG,
      realRadius_m: CONST.EARTH_RADIUS_M,
      temperature: 300,
      orbit: {
        realSemiMajorAxis_m: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 0,
        realAphelion_m: 0,
        realPerihelion_m: 0,
        averageOrbitalSpeed_mps: 0,
        epoch: "J2000",
      },
    };

    expect(generateOortCloud(random, nonStar)).toBeNull();
  });

  it("should generate different Oort clouds for different stars", async () => {
    const random = await createSeededRandom("test-seed");

    const star1: CelestialObject<StarProperties> = {
      id: "star-1",
      name: "Star One",
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
        realAphelion_m: 0,
        realPerihelion_m: 0,
        averageOrbitalSpeed_mps: 0,
        epoch: "J2000",
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 1.0,
        color: "#FFF9E5",
      },
    };

    const star2: CelestialObject<StarProperties> = {
      id: "star-2",
      name: "Star Two",
      type: CelestialType.STAR,
      status: CelestialStatus.ACTIVE,
      realMass_kg: CONST.SOLAR_MASS_KG * 2,
      realRadius_m: CONST.SOLAR_RADIUS_M * 1.5,
      temperature: 7000,
      orbit: {
        realSemiMajorAxis_m: 0,
        eccentricity: 0,
        inclination: 0,
        longitudeOfAscendingNode: 0,
        argumentOfPeriapsis: 0,
        meanAnomaly: 0,
        period_s: 0,
        realAphelion_m: 0,
        realPerihelion_m: 0,
        averageOrbitalSpeed_mps: 0,
        epoch: "J2000",
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "F5V",
        mainSpectralClass: SpectralClass.F,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 2.0,
        color: "#FFF9E5",
      },
    };

    const oortCloud1 = generateOortCloud(random, star1);
    const oortCloud2 = generateOortCloud(random, star2);

    expect(oortCloud1).not.toBeNull();
    expect(oortCloud2).not.toBeNull();
    expect(oortCloud1?.id).not.toBe(oortCloud2?.id);
    expect(oortCloud1?.name).toBe("Star One Oort Cloud");
    expect(oortCloud2?.name).toBe("Star Two Oort Cloud");
  });

  it("should have valid orbital parameters", async () => {
    const random = await createSeededRandom("test-seed");

    const parentStar: CelestialObject<StarProperties> = {
      id: "test-star",
      name: "Test Star",
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
        realAphelion_m: 0,
        realPerihelion_m: 0,
        averageOrbitalSpeed_mps: 0,
        epoch: "J2000",
      },
      properties: {
        type: CelestialType.STAR,
        isMainStar: true,
        spectralClass: "G2V",
        mainSpectralClass: SpectralClass.G,
        luminosityClass: LuminosityClass.V,
        stellarType: StellarType.MAIN_SEQUENCE,
        luminosity: 1.0,
        color: "#FFF9E5",
      },
    };

    const oortCloud = generateOortCloud(random, parentStar);

    expect(oortCloud).not.toBeNull();
    expect(oortCloud?.orbit).toBeDefined();
    expect(oortCloud?.orbit.realSemiMajorAxis_m).toBe(0);
    expect(oortCloud?.orbit.eccentricity).toBe(0);
    expect(oortCloud?.orbit.inclination).toBe(0);
    expect(oortCloud?.orbit.longitudeOfAscendingNode).toBe(0);
    expect(oortCloud?.orbit.argumentOfPeriapsis).toBe(0);
    expect(oortCloud?.orbit.meanAnomaly).toBe(0);
    expect(oortCloud?.orbit.period_s).toBe(0);
    expect(oortCloud?.orbit.realAphelion_m).toBe(0);
    expect(oortCloud?.orbit.realPerihelion_m).toBe(0);
    expect(oortCloud?.orbit.averageOrbitalSpeed_mps).toBe(0);
    expect(oortCloud?.orbit.epoch).toBe("J2000");
  });
});
