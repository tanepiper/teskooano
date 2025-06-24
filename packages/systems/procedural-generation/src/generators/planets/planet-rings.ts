import type { RingProperties } from "@teskooano/data-types";
import { RockyType } from "@teskooano/data-types";
import * as CONST from "../../constants";
import * as UTIL from "../../utils";

/**
 * Enhanced ring formation context for realistic generation
 */
interface RingFormationContext {
  planetMass: number;
  planetRadius: number;
  stellarDistanceAU: number;
  systemAge: number;
  hasLargeMoons: boolean;
  planetType: string;
}

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
  return 2.44 * planetRadius_m * Math.pow(densityRatio, 1/3);
}

/**
 * Determines ring composition based on formation zone
 * @param stellarDistanceAU Distance from star in AU
 * @param planetType Type of planet
 * @param allowedTypes Base allowed types
 * @returns Enhanced allowed types based on formation context
 */
function getFormationZoneRingTypes(
  stellarDistanceAU: number,
  planetType: string,
  allowedTypes: RockyType[]
): RockyType[] {
  const snowLine = 2.7; // Approximate snow line in AU
  const enhancedTypes: RockyType[] = [...allowedTypes];

  if (stellarDistanceAU < snowLine) {
    // Inner system: More rocky/metallic rings
    if (!enhancedTypes.includes(RockyType.METALLIC)) {
      enhancedTypes.push(RockyType.METALLIC);
    }
    if (!enhancedTypes.includes(RockyType.DARK_ROCK)) {
      enhancedTypes.push(RockyType.DARK_ROCK);
    }
  } else {
    // Outer system: More icy rings
    if (!enhancedTypes.includes(RockyType.ICE)) {
      enhancedTypes.push(RockyType.ICE);
    }
    if (!enhancedTypes.includes(RockyType.ICE_DUST)) {
      enhancedTypes.push(RockyType.ICE_DUST);
    }
  }

  // Gas giants more likely to have complex ring systems
  if (planetType.includes("CLASS_")) {
    if (!enhancedTypes.includes(RockyType.ICE)) {
      enhancedTypes.push(RockyType.ICE);
    }
  }

  return enhancedTypes;
}

/**
 * Calculates ring formation probability based on scientific factors
 * @param context Ring formation context
 * @returns Probability modifier (0-2, where 1 is baseline)
 */
function calculateRingFormationProbability(context: RingFormationContext): number {
  let probability = 1.0;

  // Gas giants much more likely to have rings
  if (context.planetType.includes("CLASS_")) {
    probability *= 3.0;
  }

  // Larger planets more likely to have rings
  if (context.planetMass > 10) { // Jupiter masses
    probability *= 2.0;
  } else if (context.planetMass > 0.1) {
    probability *= 1.5;
  }

  // Optimal stellar distance for ring stability
  if (context.stellarDistanceAU > 0.1 && context.stellarDistanceAU < 50) {
    probability *= 1.2;
  } else {
    probability *= 0.5; // Too close or too far reduces stability
  }

  // Younger systems more likely to have rings (more debris)
  if (context.systemAge < 1) { // Young system (< 1 Gyr)
    probability *= 1.5;
  } else if (context.systemAge > 5) { // Old system (> 5 Gyr)
    probability *= 0.7;
  }

  // Large moons can disrupt ring systems
  if (context.hasLargeMoons) {
    probability *= 0.6;
  }

  return Math.min(probability, 2.0); // Cap at 2x baseline
}

/**
 * Generates enhanced ring properties with realistic orbital mechanics
 * @param random Random number generator
 * @param ringType Ring material type
 * @param innerRadius_m Inner radius in meters
 * @param outerRadius_m Outer radius in meters
 * @param stellarDistanceAU Distance from star
 * @param systemTilt Shared system tilt
 * @returns Ring properties
 */
function generateEnhancedRingProperties(
  random: () => number,
  ringType: RockyType,
  innerRadius_m: number,
  outerRadius_m: number,
  stellarDistanceAU: number,
  systemTilt: number
): RingProperties {
  const ringComp = CONST.RING_COMPOSITION[ringType];
  const ringColor = UTIL.getRandomItem(CONST.RING_COLORS[ringType], random);

  // Enhanced density based on ring type and formation
  let density: number;
  switch (ringType) {
    case RockyType.ICE:
      density = 0.6 + random() * 0.4; // Ice rings can be denser
      break;
    case RockyType.METALLIC:
      density = 0.4 + random() * 0.6; // Metallic rings more variable
      break;
    case RockyType.DUST:
    case RockyType.ICE_DUST:
      density = 0.1 + random() * 0.3; // Dust rings less dense
      break;
    default:
      density = 0.3 + random() * 0.7;
      break;
  }

  // Enhanced opacity based on ring type
  let opacity: number;
  switch (ringType) {
    case RockyType.ICE:
      opacity = 0.3 + random() * 0.5; // Ice rings more transparent
      break;
    case RockyType.DARK_ROCK:
      opacity = 0.4 + random() * 0.4; // Dark rings less reflective
      break;
    case RockyType.METALLIC:
      opacity = 0.2 + random() * 0.3; // Metallic rings can be sparse
      break;
    default:
      opacity = 0.2 + random() * 0.4;
      break;
  }

  // Rotation rate based on Kepler's laws (simplified)
  // ω ∝ 1/r^(3/2) for circular orbits
  const meanRadius_m = (innerRadius_m + outerRadius_m) / 2;
  const baseRotationRate = 0.001; // Base rate for normalization
  const rotationRate = baseRotationRate / Math.pow(meanRadius_m / 1e8, 1.5);

  return {
    innerRadius: innerRadius_m,
    outerRadius: outerRadius_m,
    density: density,
    opacity: opacity,
    color: ringColor || "#CCCCCC",
    tilt: systemTilt,
    rotationRate: rotationRate,
    texture: getEnhancedRingTexture(ringType),
    composition: ringComp || ["unknown"],
    type: ringType,
  };
}

/**
 * Gets appropriate texture identifier for ring type
 * @param ringType Ring material type
 * @returns Texture identifier
 */
function getEnhancedRingTexture(ringType: RockyType): string {
  switch (ringType) {
    case RockyType.ICE:
      return "ice_ring_texture";
    case RockyType.METALLIC:
      return "metallic_ring_texture";
    case RockyType.DARK_ROCK:
      return "dark_rock_ring_texture";
    case RockyType.DUST:
    case RockyType.ICE_DUST:
      return "dust_ring_texture";
    default:
      return "standard_ring_texture";
  }
}

/**
 * Generates properties for a planetary ring system with enhanced scientific accuracy.
 *
 * This function determines whether a planet should have rings based on realistic
 * formation probabilities, calculates their properties using proper orbital mechanics,
 * and ensures ring compositions match the formation environment.
 *
 * @param random The seeded pseudo-random number generator function.
 * @param chance The base probability (0-1) that rings will be generated.
 * @param allowedTypes An array of `RockyType` values that are permissible for
 *   the ring's composition.
 * @param parentVisualRadius_m The visual radius of the parent body in meters,
 *   used for scaling the ring system appropriately.
 * @param outerRadiusFactor A multiplier that controls the maximum width of the
 *   ring system relative to its inner radius. Defaults to 1.5.
 * @param context Optional formation context for enhanced realism.
 * @returns An array containing one or more `RingProperties` objects if rings
 *   are generated, or `undefined` otherwise.
 */
export function generateRings(
  random: () => number,
  chance: number,
  allowedTypes: RockyType[],
  parentVisualRadius_m: number,
  outerRadiusFactor: number = 1.5,
  context?: RingFormationContext,
): RingProperties[] | undefined {
  // Calculate enhanced formation probability if context provided
  let effectiveChance = chance;
  if (context) {
    const probabilityModifier = calculateRingFormationProbability(context);
    effectiveChance = Math.min(chance * probabilityModifier, 0.95); // Cap at 95%
  }

  const roll = random();

  if (roll < effectiveChance && allowedTypes.length > 0) {
    const rings: RingProperties[] = [];
    
    // Enhanced ring count based on planet type
    let maxRings = 5;
    if (context?.planetType.includes("CLASS_")) {
      maxRings = 8; // Gas giants can have more complex ring systems
    }
    
    const numRings = Math.floor(random() * maxRings) + 1;

    // Get formation zone appropriate ring types
    const enhancedAllowedTypes = context 
      ? getFormationZoneRingTypes(context.stellarDistanceAU, context.planetType, allowedTypes)
      : allowedTypes;

    // Determine the type for the whole ring system once.
    const ringType = UTIL.getRandomItem(enhancedAllowedTypes, random);
    if (!ringType) {
      console.warn(
        `[generateRings] Failed to get random ring type from allowed types:`,
        enhancedAllowedTypes,
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
    
    // All rings in a system share the same tilt, but with enhanced realism
    const systemTilt = (random() - 0.5) * 0.15;

    // Start the first ring outside the Roche limit with safety margin
    let currentInnerRadius_m = Math.max(
      (1.3 + random() * 0.7) * parentVisualRadius_m,
      rocheLimit * 1.1 // 10% safety margin outside Roche limit
    );

    for (let i = 0; i < numRings; i++) {
      const innerRadius_m = currentInnerRadius_m;

      // Calculate a variable width for each ring with enhanced realism
      const baseWidth = (0.05 + random() * (outerRadiusFactor / 5)) * parentVisualRadius_m;
      
      // Ring width decreases with distance (observational constraint)
      const distanceFactor = Math.max(0.5, 1 - (i * 0.1));
      const ringWidth_m = baseWidth * distanceFactor;
      
      const outerRadius_m = innerRadius_m + ringWidth_m;

      // Generate enhanced ring properties
      const ring = generateEnhancedRingProperties(
        random,
        ringType,
        innerRadius_m,
        outerRadius_m,
        context?.stellarDistanceAU || 5.0,
        systemTilt
      );

      rings.push(ring);

      // Define the gap between this ring and the next one
      // Gaps are influenced by resonances and shepherd moons
      const minGap = ringWidth_m * 0.1;
      const maxGap = ringWidth_m * 1.5;
      
      // Larger planets tend to have wider gaps
      const massGapFactor = context?.planetMass ? Math.min(2, Math.sqrt(context.planetMass)) : 1;
      const gap_m = (minGap + random() * (maxGap - minGap)) * massGapFactor;
      
      currentInnerRadius_m = outerRadius_m + gap_m;
    }

    if (rings.length > 0) {
      return rings;
    }
  }

  return undefined;
}
