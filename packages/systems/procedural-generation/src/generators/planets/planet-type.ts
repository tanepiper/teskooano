import { utils } from "@teskooano/core-math";
import {
  CelestialType,
  GasGiantClass,
  PlanetType,
  RockyType,
  type CelestialObject,
} from "@teskooano/data-types";
import * as UTIL from "../../utils-functions";
import { ZoneCategory } from "../../zones/types";

/**
 * @internal
 * The return type for the `determinePlanetTypeAndBaseProperties` function.
 * Defines the preliminary characteristics of a planet before detailed
 * properties are generated.
 */
export interface PlanetBaseProperties {
  celestialType: CelestialType;
  celestialClass: PlanetType | GasGiantClass;
  preliminaryDensity_kg_m3: number;
  targetDensity_kg_m3: number;
  massMultiplierFactor: number;
  ringChance: number;
  ringAllowedTypes: RockyType[];
}

/**
 * Planet type determination that respects zone constraints.
 * Uses zone's allowedPlanetTypes as primary constraint, with temperature fallback.
 */
export function determinePlanetTypeAndBaseProperties(
  random: () => number,
  parentStar: CelestialObject,
  zone: any,
): PlanetBaseProperties | undefined {
  if (!zone) {
    return undefined;
  }

  // Get stellar properties
  const starProps = parentStar.properties as any;
  const stellarTemp = starProps?.temperature || 5778;
  const stellarLuminosity = starProps?.luminosity || 1.0;

  // Calculate distance within the zone
  const distanceAU = zone.minAU + (zone.maxAU - zone.minAU) * random();

  let celestialClass: PlanetType | GasGiantClass;
  let isGasGiant = false;

  // **FIX: Respect zone constraints first**
  if (zone.allowedPlanetTypes && zone.allowedPlanetTypes.length > 0) {
    // Use zone-constrained planet types with weighted selection
    const allowedTypes = zone.allowedPlanetTypes
      .map((type: string) => PlanetType[type as keyof typeof PlanetType])
      .filter(Boolean);

    if (allowedTypes.length > 0) {
      // Check if gas giants are allowed in this zone AND we should consider them
      if (
        zone.allowedGasGiantClasses &&
        zone.allowedGasGiantClasses.length > 0
      ) {
        // Use a realistic gas giant formation probability based on zone characteristics
        // Gas giants are more common in outer zones, less common in inner zones
        let gasGiantChance = 0.3; // Default 30% chance

        // Adjust based on zone distance (outer zones favor gas giants)
        if (
          zone.category === ZoneCategory.COLD ||
          zone.category === ZoneCategory.FROZEN ||
          zone.category === ZoneCategory.OUTER
        ) {
          gasGiantChance = 0.6; // 60% chance in outer zones
        } else if (zone.category === ZoneCategory.COOL) {
          gasGiantChance = 0.4; // 40% chance in cool zones
        } else if (zone.category === ZoneCategory.TEMPERATE) {
          gasGiantChance = 0.25; // 25% chance in temperate zones
        } else if (
          zone.category === ZoneCategory.HOT ||
          zone.category === ZoneCategory.SCORCHED
        ) {
          gasGiantChance = 0.15; // 15% chance in hot zones (hot Jupiters are rare)
        }

        if (random() < gasGiantChance) {
          // Chance for gas giants when they're allowed in the zone
          isGasGiant = true;

          const allowedGGClasses = zone.allowedGasGiantClasses
            .map(
              (type: string) =>
                GasGiantClass[type as keyof typeof GasGiantClass],
            )
            .filter(Boolean);

          if (allowedGGClasses.length > 0) {
            celestialClass = UTIL.getRandomItem(allowedGGClasses, random);
          } else {
            // Fallback to planet if gas giant classes are invalid
            celestialClass = selectWeightedPlanetType(allowedTypes, random);
            isGasGiant = false;
          }
        } else {
          // Use planet types as specified in zone constraints
          celestialClass = selectWeightedPlanetType(allowedTypes, random);
        }
      } else {
        // No gas giants allowed, use planet types as specified
        celestialClass = selectWeightedPlanetType(allowedTypes, random);
      }
    } else {
      // Fallback to temperature-based selection if zone types are invalid
      celestialClass = temperatureBasedPlanetSelection(
        random,
        stellarLuminosity,
        distanceAU,
      );
    }
  } else {
    // Fallback to temperature-based selection if no zone constraints
    celestialClass = temperatureBasedPlanetSelection(
      random,
      stellarLuminosity,
      distanceAU,
    );
  }

  // Set properties based on type
  const targetDensity_kg_m3 = isGasGiant
    ? utils.lerp(500, 2000, random())
    : utils.lerp(2000, 5500, random());

  const massMultiplierFactor = isGasGiant
    ? utils.lerp(0.2, 8, random())
    : utils.lerp(0.02, 1, random());

  const ringChance = isGasGiant ? 0.75 : 0.1;

  const finalCelestialType = isGasGiant
    ? CelestialType.GAS_GIANT
    : CelestialType.PLANET;

  return {
    celestialType: finalCelestialType,
    celestialClass: celestialClass,
    preliminaryDensity_kg_m3: targetDensity_kg_m3,
    targetDensity_kg_m3: targetDensity_kg_m3,
    massMultiplierFactor: massMultiplierFactor,
    ringChance: ringChance,
    ringAllowedTypes: [RockyType.ICE, RockyType.LIGHT_ROCK],
  };
}

/**
 * Selects a planet type using weighted probabilities.
 * Makes terrestrial and ocean planets much rarer than rocky planets.
 */
function selectWeightedPlanetType(
  allowedTypes: PlanetType[],
  random: () => number,
): PlanetType {
  // Define rarity weights (higher = more common)
  const planetWeights: Record<PlanetType, number> = {
    [PlanetType.ROCKY]: 100, // Very common baseline
    [PlanetType.DESERT]: 80, // Common in hot zones
    [PlanetType.ICE]: 90, // Common in cold zones
    [PlanetType.BARREN]: 70, // Moderately common
    [PlanetType.LAVA]: 60, // Less common
    [PlanetType.TERRESTRIAL]: 15, // Rare - only ~15% chance
    [PlanetType.OCEAN]: 8, // Very rare - only ~8% chance
  };

  // Calculate total weight for allowed types
  let totalWeight = 0;
  for (const type of allowedTypes) {
    totalWeight += planetWeights[type] || 1;
  }

  // Select using weighted random
  const roll = random() * totalWeight;
  let currentWeight = 0;

  for (const type of allowedTypes) {
    currentWeight += planetWeights[type] || 1;
    if (roll <= currentWeight) {
      return type;
    }
  }

  // Fallback to first allowed type (should never reach here)
  return allowedTypes[0];
}

/**
 * Temperature-based planet type selection (fallback when no zone constraints)
 */
function temperatureBasedPlanetSelection(
  random: () => number,
  stellarLuminosity: number,
  distanceAU: number,
): PlanetType | GasGiantClass {
  // Use proper equilibrium temperature calculation
  const effectiveTemp = UTIL.estimateTemperature(stellarLuminosity, distanceAU);

  if (effectiveTemp > 1000) {
    // Hot zone: Rocky, Desert, Lava
    const hotTypes = [PlanetType.ROCKY, PlanetType.DESERT, PlanetType.LAVA];
    return UTIL.getRandomItem(hotTypes, random);
  } else if (effectiveTemp > 300) {
    // Habitable zone: Terrestrial, Ocean, Rocky
    const habitableTypes = [
      PlanetType.TERRESTRIAL,
      PlanetType.OCEAN,
      PlanetType.ROCKY,
    ];
    return UTIL.getRandomItem(habitableTypes, random);
  } else {
    // Cold zone: Ice, Rocky
    const coldTypes = [PlanetType.ICE, PlanetType.ROCKY];
    return UTIL.getRandomItem(coldTypes, random);
  }
}
