import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  type CelestialObject,
} from "@teskooano/data-types";
import { CelestialZone } from "./types";
import * as CONST from "../constants";
import { calculateStellarLuminosity } from "../utils";
import { calculateHabitableZoneFromLuminosity } from "../properties/stars";

/**
 * The default configuration for celestial zones, based on a typical G-type star.
 * These can be overridden or extended.
 */
export const defaultCelestialZones: CelestialZone[] = [
  {
    name: "Inner Zone",
    minAU: 0.1,
    maxAU: 0.8,
    minBodies: 2,
    maxAdditionalBodies: 2,
    formationProbabilities: [
      {
        type: CelestialType.PLANET,
        chance: 0.75,
        densityRange_kg_m3: [3500, 6000],
        massMultiplierFactorRange: [0.5, 1.5],
        ringChance: 0.01,
        allowedRingTypes: [RockyType.LIGHT_ROCK, RockyType.DARK_ROCK],
        subTypes: [PlanetType.BARREN, PlanetType.ROCKY, PlanetType.LAVA],
      },
      {
        type: CelestialType.GAS_GIANT,
        chance: 0.25,
        densityRange_kg_m3: [600, 1500],
        massMultiplierFactorRange: [15, 65],
        ringChance: 0.05,
        allowedRingTypes: [
          RockyType.METALLIC,
          RockyType.DARK_ROCK,
          RockyType.DUST,
        ],
        subTypes: [GasGiantClass.CLASS_IV, GasGiantClass.CLASS_V], // Hot Jupiters
      },
    ],
  },
  {
    name: "Habitable Zone",
    minAU: 1.5,
    maxAU: 2.5,
    minBodies: 2,
    maxAdditionalBodies: 2,
    formationProbabilities: [
      {
        type: CelestialType.PLANET,
        chance: 0.75,
        densityRange_kg_m3: [3500, 6000],
        massMultiplierFactorRange: [0.5, 1.5],
        ringChance: 0.01,
        allowedRingTypes: [RockyType.LIGHT_ROCK, RockyType.DARK_ROCK],
        subTypes: [PlanetType.TERRESTRIAL, PlanetType.BARREN, PlanetType.ROCKY],
      },
      {
        type: CelestialType.GAS_GIANT,
        chance: 0.15,
        densityRange_kg_m3: [600, 1500],
        massMultiplierFactorRange: [15, 65],
        ringChance: 0.05,
        allowedRingTypes: [
          RockyType.METALLIC,
          RockyType.DARK_ROCK,
          RockyType.DUST,
        ],
        subTypes: [
          GasGiantClass.CLASS_I,
          GasGiantClass.CLASS_II,
          GasGiantClass.CLASS_V,
        ],
      },
    ],
  },
  {
    name: "Frost Line",
    minAU: 2.5,
    maxAU: 8,
    minBodies: 1,
    maxAdditionalBodies: 2,
    formationProbabilities: [
      {
        type: CelestialType.GAS_GIANT,
        chance: 0.75, // Almost always a gas giant here
        densityRange_kg_m3: [600, 1500],
        massMultiplierFactorRange: [20, 120],
        ringChance: 0.25,
        allowedRingTypes: [RockyType.METALLIC, RockyType.DUST, RockyType.ICE],
        subTypes: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II],
      },
      {
        type: CelestialType.PLANET,
        chance: 0.25,
        densityRange_kg_m3: [1000, 3000],
        massMultiplierFactorRange: [0.01, 0.1],
        ringChance: 0.05,
        allowedRingTypes: [RockyType.ICE, RockyType.ICE_DUST],
        subTypes: [PlanetType.ICE, PlanetType.ROCKY, PlanetType.BARREN],
      },
    ],
  },
  {
    name: "Outer Zone",
    minAU: 8,
    maxAU: 30,
    minBodies: 1,
    maxAdditionalBodies: 3,
    formationProbabilities: [
      {
        type: CelestialType.GAS_GIANT, // Ice Giants
        chance: 0.85,
        densityRange_kg_m3: [1200, 2000],
        massMultiplierFactorRange: [5, 25],
        ringChance: 0.4,
        allowedRingTypes: [RockyType.ICE, RockyType.ICE_DUST],
        subTypes: [GasGiantClass.CLASS_II, GasGiantClass.CLASS_III],
      },
      {
        type: CelestialType.PLANET, // Dwarf/Ice Planets
        chance: 0.15,
        densityRange_kg_m3: [1000, 3000],
        massMultiplierFactorRange: [0.01, 0.1],
        ringChance: 0.05,
        allowedRingTypes: [RockyType.ICE, RockyType.ICE_DUST],
        subTypes: [PlanetType.ICE, PlanetType.ROCKY, PlanetType.BARREN],
      },
    ],
  },
  {
    name: "Interstellar Zone",
    minAU: 30,
    maxAU: 10000,
    minBodies: 2,
    maxAdditionalBodies: 5,
    formationProbabilities: [
      {
        type: CelestialType.GAS_GIANT, // Ice Giants
        chance: 0.1,
        densityRange_kg_m3: [1200, 2000],
        massMultiplierFactorRange: [5, 25],
        ringChance: 0.4,
        allowedRingTypes: [RockyType.ICE, RockyType.ICE_DUST],
        subTypes: [GasGiantClass.CLASS_III],
      },
      {
        type: CelestialType.DWARF_PLANET, // Dwarf/Ice Planets
        chance: 0.9,
        densityRange_kg_m3: [1000, 3000],
        massMultiplierFactorRange: [0.01, 0.1],
        ringChance: 0.05,
        allowedRingTypes: [RockyType.ICE, RockyType.ICE_DUST],
        subTypes: [PlanetType.ICE, PlanetType.ROCKY, PlanetType.BARREN],
      },
    ],
  },
];

/**
 * @class CelestialZoneManager
 * @description Manages the definitions of orbital zones and provides methods
 *              to retrieve zone information based on distance from a star.
 *              This is a key component in making procedural generation more
 *              data-driven and configurable.
 */
export class CelestialZoneManager {
  private zones: CelestialZone[];

  /**
   * Creates an instance of CelestialZoneManager.
   * @param zones - An array of `CelestialZone` configurations. Defaults to `defaultCelestialZones`.
   */
  constructor(zones: CelestialZone[] = defaultCelestialZones) {
    // Sort zones by min distance to ensure correct matching
    this.zones = zones.sort((a, b) => a.minAU - b.minAU);
  }

  /**
   * Generates a scaled set of celestial zones based on a star's luminosity.
   * Brighter stars will have their zones pushed further out.
   *
   * @param star - The star to generate zones for.
   * @returns An array of `CelestialZone` objects scaled for the given star.
   */
  public static generateZonesForStar(star: CelestialObject): CelestialZone[] {
    return generateZonesForStar(star);
  }

  /**
   * Retrieves the appropriate celestial zone for a given orbital distance.
   * @param distanceAU - The distance from the star in Astronomical Units (AU).
   * @returns The matching `CelestialZone` object, or `undefined` if no zone is found.
   */
  public getZoneForDistance(distanceAU: number): CelestialZone | undefined {
    return this.zones.find(
      (zone) => distanceAU >= zone.minAU && distanceAU < zone.maxAU,
    );
  }
}

export function generateZonesForStar(star: CelestialObject): CelestialZone[] {
  // First, calculate the star's intrinsic luminosity.
  const luminosity = calculateStellarLuminosity(
    star.realRadius_m,
    star.temperature,
  );

  // Next, use the new physics-based calculation for the habitable zone.
  const { innerBoundary: hzInner, outerBoundary: hzOuter } =
    calculateHabitableZoneFromLuminosity(luminosity);

  const originalHabitableZone = defaultCelestialZones.find(
    (z) => z.name === "Habitable Zone",
  )!;
  const originalInnerZone = defaultCelestialZones.find(
    (z) => z.name === "Inner Zone",
  )!;
  const originalFrostLine = defaultCelestialZones.find(
    (z) => z.name === "Frost Line",
  )!;

  // Calculate scaling factors based on how the habitable zone has shifted.
  // We use this to scale the other zones relative to the new, accurate HZ.
  const innerScaleFactor = hzInner / originalHabitableZone.minAU;
  const outerScaleFactor = hzOuter / originalHabitableZone.maxAU;

  const scaledZones = JSON.parse(
    JSON.stringify(defaultCelestialZones),
  ) as CelestialZone[];

  const habitableZone = scaledZones.find((z) => z.name === "Habitable Zone")!;
  habitableZone.minAU = hzInner;
  habitableZone.maxAU = hzOuter;

  const innerZone = scaledZones.find((z) => z.name === "Inner Zone")!;
  innerZone.minAU *= innerScaleFactor;
  innerZone.maxAU = hzInner; // Ensure it's contiguous

  const frostLine = scaledZones.find((z) => z.name === "Frost Line")!;
  frostLine.minAU = hzOuter; // Ensure it's contiguous
  frostLine.maxAU *= outerScaleFactor;

  const outerZone = scaledZones.find((z) => z.name === "Outer Zone")!;
  outerZone.minAU = frostLine.maxAU;
  outerZone.maxAU *= outerScaleFactor;

  const interstellarZone = scaledZones.find(
    (z) => z.name === "Interstellar Zone",
  )!;
  interstellarZone.minAU = outerZone.maxAU;
  interstellarZone.maxAU *= outerScaleFactor;

  return scaledZones;
}
