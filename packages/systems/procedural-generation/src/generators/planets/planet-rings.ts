import type {
  CelestiaClassType,
  RingProperties,
  RingSystemConfiguration,
} from "@teskooano/data-types";
import { RockyType } from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils-functions";

/**
 * Ring system archetypes for varied visual appearance
 */
enum RingArchetype {
  SATURN_LIKE = "saturn", // Dense, close, dramatic rings (like Saturn)
  URANUS_LIKE = "uranus", // Thin, dark, vertical rings
  SPARSE_DISTANT = "sparse", // Thin rings far from planet
  SHEPHERD_MOON = "shepherd", // Narrow ringlets with gaps
  EXOTIC_WIDE = "exotic", // Wide, diffuse rings
}

interface ArchetypeConfig {
  startDistanceMin: number; // Multiplier of planet radius
  startDistanceMax: number;
  totalWidthMin: number; // Multiplier of planet radius
  totalWidthMax: number;
  numRingsMin: number;
  numRingsMax: number;
  opacityMin: number;
  opacityMax: number;
  gapSizeMin: number; // Multiplier of ring width
  gapSizeMax: number;
}

const RING_ARCHETYPES: Record<RingArchetype, ArchetypeConfig> = {
  [RingArchetype.SATURN_LIKE]: {
    startDistanceMin: 1.05, // Very close rings, some even at Roche limit
    startDistanceMax: 1.2, // Saturn's D ring at ~1.11x radius
    totalWidthMin: 0.8, // Saturn spans ~1.07x radius
    totalWidthMax: 1.5,
    numRingsMin: 3,
    numRingsMax: 7,
    opacityMin: 0.6,
    opacityMax: 1.0,
    gapSizeMin: 0.05,
    gapSizeMax: 0.3,
  },
  [RingArchetype.URANUS_LIKE]: {
    startDistanceMin: 1.6,
    startDistanceMax: 2.0,
    totalWidthMin: 0.3,
    totalWidthMax: 0.6,
    numRingsMin: 9,
    numRingsMax: 13,
    opacityMin: 0.3,
    opacityMax: 0.6,
    gapSizeMin: 0.1,
    gapSizeMax: 0.5,
  },
  [RingArchetype.SPARSE_DISTANT]: {
    startDistanceMin: 2.0,
    startDistanceMax: 3.0,
    totalWidthMin: 0.2,
    totalWidthMax: 0.5,
    numRingsMin: 1,
    numRingsMax: 3,
    opacityMin: 0.2,
    opacityMax: 0.5,
    gapSizeMin: 0.5,
    gapSizeMax: 2.0,
  },
  [RingArchetype.SHEPHERD_MOON]: {
    startDistanceMin: 1.15, // Closer narrow ringlets
    startDistanceMax: 1.5,
    totalWidthMin: 0.4,
    totalWidthMax: 0.8,
    numRingsMin: 5,
    numRingsMax: 10,
    opacityMin: 0.5,
    opacityMax: 0.9,
    gapSizeMin: 0.2,
    gapSizeMax: 0.8,
  },
  [RingArchetype.EXOTIC_WIDE]: {
    startDistanceMin: 1.08, // Dramatic close rings
    startDistanceMax: 1.3,
    totalWidthMin: 1.5,
    totalWidthMax: 3.0,
    numRingsMin: 2,
    numRingsMax: 5,
    opacityMin: 0.3,
    opacityMax: 0.7,
    gapSizeMin: 0.1,
    gapSizeMax: 0.4,
  },
};

/**
 * Calculates the Roche limit for a given planet
 * @param planetRadius_m Planet radius in meters
 * @param planetDensity_kgm3 Planet density in kg/m³
 * @param particleDensity_kgm3 Ring particle density in kg/m³
 * @returns Roche limit in meters
 */
function calculateRocheLimit(
  planetRadius_m: number,
  planetDensity_kgm3: number = 5500, // Earth-like density default
  particleDensity_kgm3: number = 2000, // Ice/rock mixture default
): number {
  // Roche limit = 2.44 * R_planet * (ρ_planet / ρ_particle)^(1/3)
  const densityRatio = planetDensity_kgm3 / particleDensity_kgm3;
  return 2.44 * planetRadius_m * Math.pow(densityRatio, 1 / 3);
}

/**
 * Generates enhanced ring properties with realistic characteristics
 */
function generateEnhancedRingProperties(
  random: () => number,
  ringType: RockyType,
  innerRadius_m: number,
  outerRadius_m: number,
  stellarDistanceAU: number,
  systemTilt: number,
): RingProperties {
  const ringComp = CONST.RING_COMPOSITION[ringType];
  if (!ringComp) {
    throw new Error(`No composition defined for ring type: ${ringType}`);
  }

  // Generate realistic ring properties
  const opacity = 0.3 + random() * 0.7; // 0.3 to 1.0
  const density = 0.3 + random() * 0.7; // 0.3 to 1.0
  const color = UTIL.getRandomItem(
    CONST.RING_COLORS[ringType] || ["#CCCCCC"],
    random,
  );
  const texture = getEnhancedRingTexture(ringType);
  const rotationRate =
    0.001 / Math.pow((innerRadius_m + outerRadius_m) / 2e8, 1.5);

  // Generate individual ring tilt (small variations around system tilt)
  const ringTilt = systemTilt + (random() - 0.5) * 0.02; // ±0.01 radians variation

  return {
    innerRadius: innerRadius_m,
    outerRadius: outerRadius_m,
    density,
    opacity,
    color,
    rotationRate,
    texture,
    composition: ringComp,
    type: ringType,
    // Enhanced Axial Inclination Controls
    ringTilt: ringTilt,
    inheritParentTilt: true, // Most rings inherit parent's axial tilt
  };
}

/**
 * Gets enhanced ring texture based on ring type
 */
function getEnhancedRingTexture(ringType: RockyType): string {
  const textures: Record<RockyType, string> = {
    [RockyType.ICE]: "ice_rings",
    [RockyType.ICE_DUST]: "ice_dust_rings",
    [RockyType.LIGHT_ROCK]: "light_rock_rings",
    [RockyType.DARK_ROCK]: "dark_rock_rings",
    [RockyType.METALLIC]: "metallic_rings",
    [RockyType.DUST]: "dust_rings",
  };

  return textures[ringType] || "default_rings";
}

/**
 * Generates ring systems for planets based on probability and allowed types.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param chance The probability of ring formation (0-1).
 * @param allowedTypes Array of allowed ring composition types.
 * @param parentVisualRadius_m The visual radius of the parent planet in meters.
 * @param outerRadiusFactor Factor for determining outer ring radius (default: 1.5).
 * @returns RingSystemConfiguration or undefined if no rings are generated.
 */
export function generateRings(
  random: () => number,
  chance: number,
  allowedTypes: RockyType[],
  parentVisualRadius_m: number,
  outerRadiusFactor: number = 1.5,
): RingSystemConfiguration | undefined {
  const roll = random();

  if (roll < chance && allowedTypes.length > 0) {
    const rings: RingProperties[] = [];

    // Select ring archetype (weighted towards Saturn-like for visual appeal)
    const archetypeRoll = random();
    let archetype: RingArchetype;
    if (archetypeRoll < 0.4) {
      archetype = RingArchetype.SATURN_LIKE;
    } else if (archetypeRoll < 0.6) {
      archetype = RingArchetype.SHEPHERD_MOON;
    } else if (archetypeRoll < 0.75) {
      archetype = RingArchetype.EXOTIC_WIDE;
    } else if (archetypeRoll < 0.9) {
      archetype = RingArchetype.URANUS_LIKE;
    } else {
      archetype = RingArchetype.SPARSE_DISTANT;
    }

    const config = RING_ARCHETYPES[archetype];

    // Number of rings based on archetype
    const numRings = Math.floor(
      config.numRingsMin +
        random() * (config.numRingsMax - config.numRingsMin + 1),
    );

    // Determine the type for the whole ring system once.
    const ringType = UTIL.getRandomItem(allowedTypes, random);
    if (!ringType) {
      console.warn(
        `[generateRings] Failed to get random ring type from allowed types:`,
        allowedTypes,
      );
      return undefined;
    }

    const ringComp = CONST.RING_COMPOSITION[ringType];
    if (!ringComp) {
      console.warn(
        `[generateRings] No composition defined for ring type: ${ringType}`,
      );
      return undefined;
    }

    // Calculate Roche limit for ring placement
    const rocheLimit = calculateRocheLimit(parentVisualRadius_m);

    // All rings in a system share the same tilt
    const systemTilt = (random() - 0.5) * 0.15;

    // Start distance based on archetype
    const startDistance =
      (config.startDistanceMin +
        random() * (config.startDistanceMax - config.startDistanceMin)) *
      parentVisualRadius_m;

    // Ensure we're outside Roche limit with safety margin
    const currentInnerRadius_m = Math.max(
      startDistance,
      rocheLimit * 1.05, // 5% safety margin
    );

    // Total width of ring system based on archetype
    const totalSystemWidth =
      (config.totalWidthMin +
        random() * (config.totalWidthMax - config.totalWidthMin)) *
      parentVisualRadius_m;

    // Distribute rings across the total width
    let nextInnerRadius = currentInnerRadius_m;

    for (let i = 0; i < numRings; i++) {
      const innerRadius_m = nextInnerRadius;

      // Calculate ring width as portion of remaining space
      const remainingRings = numRings - i;
      const remainingWidth =
        currentInnerRadius_m + totalSystemWidth - nextInnerRadius;

      // Vary ring widths: some thin, some thick
      const widthVariation = 0.5 + random() * 1.5; // 0.5x to 2.0x average
      const ringWidth_m =
        (remainingWidth / (remainingRings * 1.5)) * widthVariation;

      const outerRadius_m = innerRadius_m + ringWidth_m;

      // Opacity varies per archetype and per ring
      const opacity =
        config.opacityMin + random() * (config.opacityMax - config.opacityMin);

      // Generate ring properties
      const ring: RingProperties = {
        innerRadius: innerRadius_m,
        outerRadius: outerRadius_m,
        density: 0.3 + random() * 0.7,
        opacity: opacity,
        color: UTIL.getRandomItem(
          CONST.RING_COLORS[ringType] || ["#CCCCCC"],
          random,
        ),
        rotationRate:
          0.001 / Math.pow((innerRadius_m + outerRadius_m) / 2e8, 1.5),
        texture: getEnhancedRingTexture(ringType),
        composition: ringComp,
        type: ringType,
        ringTilt: systemTilt + (random() - 0.5) * 0.02,
        inheritParentTilt: true,
      };

      rings.push(ring);

      // Gap between rings based on archetype
      const gapSize =
        (config.gapSizeMin +
          random() * (config.gapSizeMax - config.gapSizeMin)) *
        ringWidth_m;

      nextInnerRadius = outerRadius_m + gapSize;
    }

    // Generate system-wide axial inclination
    const systemAxialInclination = systemTilt + (random() - 0.5) * 0.05;

    // Generate precession rate (very slow for most ring systems)
    const precessionRate = (random() - 0.5) * 0.0001;

    return {
      rings: rings,
      systemAxialInclination: systemAxialInclination,
      inheritParentTilt: true,
      precessionRate: precessionRate,
      unifiedRendering: true,
    };
  }

  return undefined;
}

/**
 * Generates ring systems for planets and returns just the rings array (backward compatibility).
 *
 * @param random The seeded pseudo-random number generator function.
 * @param chance The probability of ring formation (0-1).
 * @param allowedTypes Array of allowed ring composition types.
 * @param parentVisualRadius_m The visual radius of the parent planet in meters.
 * @param outerRadiusFactor Factor for determining outer ring radius (default: 1.5).
 * @returns Array of RingProperties or undefined if no rings are generated.
 */
export function generateRingsArray(
  random: () => number,
  chance: number,
  allowedTypes: RockyType[],
  parentVisualRadius_m: number,
  outerRadiusFactor: number = 1.5,
): RingProperties[] | undefined {
  const ringSystem = generateRings(
    random,
    chance,
    allowedTypes,
    parentVisualRadius_m,
    outerRadiusFactor,
  );
  return ringSystem?.rings;
}
