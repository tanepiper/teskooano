// ============================================================================
// SMALL BODY CLASSIFICATION
// ============================================================================

/**
 * Small Solar System body types
 */
export enum SmallBodyType {
  // Asteroids
  ASTEROID = "ASTEROID",
  NEAR_EARTH_ASTEROID = "NEAR_EARTH_ASTEROID",
  TROJAN_ASTEROID = "TROJAN_ASTEROID",

  // Comets
  COMET = "COMET",
  SHORT_PERIOD_COMET = "SHORT_PERIOD_COMET",
  LONG_PERIOD_COMET = "LONG_PERIOD_COMET",

  // Very small objects
  METEOROID = "METEOROID",
  MICROMETEOROID = "MICROMETEOROID",
  SPACE_DUST = "SPACE_DUST",

  // Dwarf planets
  DWARF_PLANET = "DWARF_PLANET",
  PLUTOID = "PLUTOID",

  // Special categories
  CENTAUR = "CENTAUR",
  KUIPER_BELT_OBJECT = "KUIPER_BELT_OBJECT",
  TRANS_NEPTUNIAN_OBJECT = "TRANS_NEPTUNIAN_OBJECT",
  SCATTERED_DISC_OBJECT = "SCATTERED_DISC_OBJECT",
  DETACHED_OBJECT = "DETACHED_OBJECT",
}

/**
 * Asteroid classifications
 */
export enum AsteroidType {
  // By orbit
  MAIN_BELT = "MAIN_BELT",
  NEAR_EARTH = "NEAR_EARTH",
  MARS_CROSSER = "MARS_CROSSER",
  JUPITER_TROJAN = "JUPITER_TROJAN",

  // By composition (spectral types)
  C_TYPE = "C_TYPE", // Carbonaceous
  S_TYPE = "S_TYPE", // Silicaceous
  M_TYPE = "M_TYPE", // Metallic
  X_TYPE = "X_TYPE", // Unknown
}

// ============================================================================
// EXTENDED STRUCTURES
// ============================================================================

/**
 * Large-scale structures and regions
 */
export enum ExtendedStructureType {
  RING_SYSTEM = "RING_SYSTEM",
  ASTEROID_BELT = "ASTEROID_BELT",
  DEBRIS_DISC = "DEBRIS_DISC",
  PROTOPLANETARY_DISC = "PROTOPLANETARY_DISC",
  OORT_CLOUD = "OORT_CLOUD",
  HILLS_CLOUD = "HILLS_CLOUD",
  HELIOSPHERE = "HELIOSPHERE",
  KUIPER_BELT = "KUIPER_BELT",
  SCATTERED_DISC = "SCATTERED_DISC",
}

/**
 * Ring system types
 */
export enum RingType {
  ICE = "ICE",
  ROCK = "ROCK",
  DUST = "DUST",
  ICE_DUST = "ICE_DUST",
  METALLIC = "METALLIC",
  ORGANIC = "ORGANIC",
}
