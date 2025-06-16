import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
} from "@teskooano/data-types";
import { CelestialZone } from "./types";

/**
 * The default configuration for celestial zones, based on a typical G-type star.
 * These can be overridden or extended.
 */
export const defaultCelestialZones: CelestialZone[] = [
  {
    name: "Inner Zone",
    minAU: 0.1,
    maxAU: 2.5,
    formationProbabilities: [
      {
        type: CelestialType.PLANET,
        chance: 0.75,
        densityRange_kg_m3: [3500, 6000],
        massMultiplierFactorRange: [0.5, 1.5],
        ringChance: 0.01,
        allowedRingTypes: [RockyType.LIGHT_ROCK, RockyType.DARK_ROCK],
        subTypes: [
          PlanetType.TERRESTRIAL,
          PlanetType.BARREN,
          PlanetType.ROCKY,
          PlanetType.LAVA,
        ],
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
        subTypes: [GasGiantClass.CLASS_I, GasGiantClass.CLASS_II], // Hot Jupiters
      },
    ],
  },
  {
    name: "Frost Line",
    minAU: 2.5,
    maxAU: 8,
    formationProbabilities: [
      {
        type: CelestialType.GAS_GIANT,
        chance: 1.0, // Almost always a gas giant here
        densityRange_kg_m3: [600, 1500],
        massMultiplierFactorRange: [20, 120],
        ringChance: 0.25,
        allowedRingTypes: [RockyType.METALLIC, RockyType.DUST, RockyType.ICE],
        subTypes: [
          GasGiantClass.CLASS_I,
          GasGiantClass.CLASS_II,
          GasGiantClass.CLASS_III,
        ],
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
    formationProbabilities: [
      {
        type: CelestialType.GAS_GIANT, // Ice Giants
        chance: 0.85,
        densityRange_kg_m3: [1200, 2000],
        massMultiplierFactorRange: [5, 25],
        ringChance: 0.4,
        allowedRingTypes: [RockyType.ICE, RockyType.ICE_DUST],
        subTypes: [GasGiantClass.CLASS_III, GasGiantClass.CLASS_IV],
      },
      {
        type: CelestialType.DWARF_PLANET, // Dwarf/Ice Planets
        chance: 0.15,
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
