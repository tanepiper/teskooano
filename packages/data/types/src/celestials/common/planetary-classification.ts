// ============================================================================
// PLANETARY CLASSIFICATION
// ============================================================================

/**
 * Primary planet types based on composition and characteristics
 */
export enum PlanetType {
  // Terrestrial planets
  TERRESTRIAL = "TERRESTRIAL",
  SUPER_EARTH = "SUPER_EARTH",

  // Ice/Rock compositions
  ICE_WORLD = "ICE_WORLD",
  OCEAN_WORLD = "OCEAN_WORLD",

  // Gas planets (use GasGiantClass for detailed classification)
  GAS_GIANT = "GAS_GIANT",

  // Special terrestrial types
  LAVA_WORLD = "LAVA_WORLD",
  DESERT_WORLD = "DESERT_WORLD",

  // Unusual/exotic
  ROGUE_PLANET = "ROGUE_PLANET",
  CHTHONIAN = "CHTHONIAN", // Stripped gas giant core
  CARBON_PLANET = "CARBON_PLANET",
}

/**
 * Planet sub-classifications based on surface/atmospheric conditions
 */
export enum PlanetSubtype {
  // Rocky world variants
  BARREN = "BARREN",
  CRATERED = "CRATERED",
  VOLCANIC = "VOLCANIC",

  // Ice world variants
  FROZEN = "FROZEN",
  GLACIAL = "GLACIAL",

  // Atmospheric variants
  GREENHOUSE = "GREENHOUSE",
  TIDALLY_LOCKED = "TIDALLY_LOCKED",
  EYEBALL = "EYEBALL", // Tidally locked with permanent ice/water sides
}

/**
 * Gas giant classifications (Sudarsky system)
 * Temperature-based classification that handles hot Jupiters, ice giants, etc.
 */
export enum GasGiantClass {
  CLASS_I = "CLASS_I", // Ammonia clouds (< 150K) - cold giants like Jupiter/Saturn
  CLASS_II = "CLASS_II", // Water clouds (150-250K) - warmer giants
  CLASS_III = "CLASS_III", // Cloudless (250-700K) - warm giants
  CLASS_IV = "CLASS_IV", // Alkali metals (700-1200K) - hot giants
  CLASS_V = "CLASS_V", // Silicate clouds (> 1200K) - very hot giants (hot Jupiters)
}

/**
 * Moon classifications
 */
export enum MoonType {
  REGULAR = "REGULAR",
  IRREGULAR = "IRREGULAR",
  CAPTURED_ASTEROID = "CAPTURED_ASTEROID",
  CAPTURED_COMET = "CAPTURED_COMET",
  TROJAN = "TROJAN",
  MOONLET = "MOONLET",
  SUBSATELLITE = "SUBSATELLITE",
}
