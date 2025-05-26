// ============================================================================
// PHYSICAL PROPERTIES
// ============================================================================

/**
 * Atmospheric classifications
 */
export enum AtmosphereType {
  NONE = "NONE",
  TRACE = "TRACE",
  THIN = "THIN",
  NORMAL = "NORMAL",
  DENSE = "DENSE",
  SUPER_DENSE = "SUPER_DENSE",
  CRUSHING = "CRUSHING",
}

/**
 * Surface terrain types
 */
export enum SurfaceType {
  CRATERED = "CRATERED",
  SMOOTH_PLAINS = "SMOOTH_PLAINS",
  MOUNTAINS = "MOUNTAINS",
  CANYONS = "CANYONS",
  VALLEYS = "VALLEYS",
  VOLCANIC = "VOLCANIC",
  DUNES = "DUNES",
  FRACTURED = "FRACTURED",
  LAYERED = "LAYERED",

  // Ice surfaces
  ICE_PLAINS = "ICE_PLAINS",
  ICE_CRACKED = "ICE_CRACKED",
  ICE_RIDGED = "ICE_RIDGED",

  // Liquid surfaces
  OCEAN = "OCEAN",
  LAKES = "LAKES",
  RIVERS = "RIVERS",

  // Special
  VARIED = "VARIED",
  UNKNOWN = "UNKNOWN",
}

/**
 * Composition materials
 */
export enum CompositionType {
  // Rocks and metals
  SILICATE = "SILICATE",
  IRON = "IRON",
  NICKEL = "NICKEL",
  CARBON = "CARBON",

  // Ices
  WATER_ICE = "WATER_ICE",
  METHANE_ICE = "METHANE_ICE",
  AMMONIA_ICE = "AMMONIA_ICE",
  NITROGEN_ICE = "NITROGEN_ICE",
  CO2_ICE = "CO2_ICE",

  // Gases
  HYDROGEN = "HYDROGEN",
  HELIUM = "HELIUM",
  METHANE = "METHANE",
  AMMONIA = "AMMONIA",

  // Other
  DUST = "DUST",
  ORGANIC = "ORGANIC",
  UNKNOWN = "UNKNOWN",
}
