/**
 * Primary planet types based on composition and characteristics.
 * This enum categorizes planets into broad types based on their physical nature.
 */
export enum PlanetType {
  /** A rocky planet similar in size and composition to Earth, Mars, Venus, or Mercury. */
  TERRESTRIAL = "TERRESTRIAL",
  ROCKY_WORLD = "ROCKY_WORLD",
  BARREN_WORLD = "BARREN_WORLD",
  /** A terrestrial planet significantly more massive than Earth, but lighter than Neptune or Uranus. */
  SUPER_EARTH = "SUPER_EARTH",
  /** A planet primarily composed of ices (water, methane, ammonia) and rock, often with a thick, frozen surface. */
  ICE_WORLD = "ICE_WORLD",
  /** A planet with a significant amount of liquid water on its surface or subsurface, potentially covering the entire globe. */
  OCEAN_WORLD = "OCEAN_WORLD",
  /** A large planet primarily composed of hydrogen and helium, lacking a solid surface. Further classified by `GasGiantClass`. */
  GAS_GIANT = "GAS_GIANT",
  /** A terrestrial planet with a surface predominantly covered in molten lava. */
  LAVA_WORLD = "LAVA_WORLD",
  /** A terrestrial planet with an arid, desert-like surface. */
  DESERT_WORLD = "DESERT_WORLD",
  /** A planet that has been ejected from its star system and wanders through interstellar space. */
  ROGUE_PLANET = "ROGUE_PLANET",
  /** The remnant core of a gas giant that has had its atmosphere stripped away, typically due to close proximity to its star. */
  CHTHONIAN = "CHTHONIAN", // Stripped gas giant core
  /** An exotic type of planet with a carbon-rich composition, potentially with graphite or diamond layers. */
  CARBON_PLANET = "CARBON_PLANET",
}

/**
 * Gas giant classifications based on the Sudarsky system.
 * This is a temperature-based classification primarily used for gas giants,
 * indicating their atmospheric composition and appearance based on temperature.
 */
export enum GasGiantClass {
  /** Ammonia clouds dominate the atmosphere. Temperature < 150K. Typical of cold giants like Jupiter and Saturn. */
  CLASS_I = "CLASS_I", // Ammonia clouds (< 150K) - cold giants like Jupiter/Saturn
  /** Water clouds are prominent. Temperature between 150K and 250K. Represents warmer gas giants. */
  CLASS_II = "CLASS_II", // Water clouds (150-250K) - warmer giants
  /** Largely cloudless or with very high, thin clouds. Temperature between 250K and 700K. These are warm gas giants. */
  CLASS_III = "CLASS_III", // Cloudless (250-700K) - warm giants
  /** Dominated by alkali metal vapors (e.g., sodium, potassium) in the atmosphere. Temperature between 700K and 1200K. Hot giants. */
  CLASS_IV = "CLASS_IV", // Alkali metals (700-1200K) - hot giants
  /** Silicate (rock-forming) clouds are present. Temperature > 1200K. Represents very hot gas giants, often called "hot Jupiters". */
  CLASS_V = "CLASS_V", // Silicate clouds (> 1200K) - very hot giants (hot Jupiters)
}
