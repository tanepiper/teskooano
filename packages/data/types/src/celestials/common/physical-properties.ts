/**
 * Atmospheric classifications based on density and pressure relative to Earth-like conditions.
 */
export enum AtmosphereType {
  /** No discernible atmosphere. */
  NONE = "NONE",
  /** A barely detectable atmosphere, extremely thin. */
  TRACE = "TRACE",
  /** A thin atmosphere, significantly less dense than Earth's. */
  THIN = "THIN",
  /** An atmosphere comparable to Earth's in density and pressure. */
  NORMAL = "NORMAL",
  /** A dense atmosphere, significantly thicker and with higher pressure than Earth's. */
  DENSE = "DENSE",
  /** An extremely dense atmosphere, with very high pressure. */
  SUPER_DENSE = "SUPER_DENSE",
  /** An atmosphere with pressure so high it would crush most known structures and life forms. */
  CRUSHING = "CRUSHING",
}

/**
 * Describes the general nature of a celestial body's solid or liquid surface.
 */
export enum SurfaceType {
  /** Surface characterized by numerous impact craters. */
  CRATERED = "CRATERED",
  /** Large, relatively flat and featureless plains. */
  SMOOTH_PLAINS = "SMOOTH_PLAINS",
  /** Surface dominated by mountain ranges. */
  MOUNTAINS = "MOUNTAINS",
  /** Surface featuring deep, narrow gorges or ravines. */
  CANYONS = "CANYONS",
  /** Surface characterized by low-lying depressions between hills or mountains. */
  VALLEYS = "VALLEYS",
  /** Surface shaped by volcanic activity, may include lava flows, volcanic cones, etc. */
  VOLCANIC = "VOLCANIC",
  /** Surface covered in sand dunes or similar aeolian features. */
  DUNES = "DUNES",
  /** Surface broken by extensive cracks or fissures. */
  FRACTURED = "FRACTURED",
  /** Surface showing distinct layers of rock or other materials. */
  LAYERED = "LAYERED",

  // Ice surfaces
  /** Expansive, flat regions covered in ice. */
  ICE_PLAINS = "ICE_PLAINS",
  /** Icy surface with significant cracks and fissures. */
  ICE_CRACKED = "ICE_CRACKED",
  /** Icy surface with prominent ridges and formations. */
  ICE_RIDGED = "ICE_RIDGED",

  // Liquid surfaces
  /** Large body of liquid, typically water or methane. */
  OCEAN = "OCEAN",
  /** Smaller bodies of standing liquid. */
  LAKES = "LAKES",
  /** Channels of flowing liquid. */
  RIVERS = "RIVERS",

  // Special
  /** A diverse surface with multiple significant terrain types. */
  VARIED = "VARIED",
  /** The surface type is not known or cannot be determined. */
  UNKNOWN = "UNKNOWN",
}

/**
 * Describes the primary composition type of rocky bodies like asteroids or ring particles.
 */
export enum RockyType {
  /** Composed primarily of ice (water, methane, ammonia). */
  ICE = "ICE",
  /** Rich in metallic elements. */
  METALLIC = "METALLIC",
  /** Composed of lighter silicate rocks. */
  LIGHT_ROCK = "LIGHT_ROCK",
  /** Composed of darker silicate rocks, possibly carbonaceous. */
  DARK_ROCK = "DARK_ROCK",
  /** Mixture of fine ice particles and dust. */
  ICE_DUST = "ICE_DUST",
  /** Composed primarily of fine dust particles. */
  DUST = "DUST",
}
