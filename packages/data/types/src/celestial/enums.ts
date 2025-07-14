/**
 * Defines the primary classification of a celestial body.
 */
export enum CelestialType {
  /** A star, the central body of a system. */
  STAR = "STAR",
  /** A planet orbiting a star. */
  PLANET = "PLANET",
  /** A planet that meets some but not all criteria for a full planet. */
  DWARF_PLANET = "DWARF_PLANET",
  /** A moon orbiting a planet or gas giant. */
  MOON = "MOON",
  /** Individual space rock objects, used for asteroid fields or rings. */
  SPACE_ROCK = "SPACE_ROCK",
  /** A collection of space rocks, typically forming a belt. */
  ASTEROID_FIELD = "ASTEROID_FIELD",
  /** A large planet composed mostly of gases. */
  GAS_GIANT = "GAS_GIANT",
  /** An icy body that displays a coma and sometimes a tail when near a star. */
  COMET = "COMET",
  /** A theoretical cloud of icy planetesimals proposed to surround the sun at a great distance. */
  OORT_CLOUD = "OORT_CLOUD",
  /** A distinct system of rings orbiting a celestial body. */
  RING_SYSTEM = "RING_SYSTEM",
  /** The center of mass of a multi-body system. */
  BARYCENTER = "BARYCENTER",
  /** A man-made artificial satellite or spacecraft. */
  SATELLITE = "SATELLITE",
  /** Catch-all for other or undefined celestial types. */
  OTHER = "OTHER",
}

/**
 * Classification system for gas giants based on atmospheric properties.
 */
export enum GasGiantClass {
  /** Ammonia clouds, typical of Jupiter. */
  CLASS_I = "CLASS_I",
  /** Water clouds, typical of Saturn. */
  CLASS_II = "CLASS_II",
  /** Ice Giant - Cloudless, clear hydrogen atmosphere, typical of Uranus and Neptune. */
  CLASS_III = "CLASS_III",
  /** Alkali metal clouds, very hot. */
  CLASS_IV = "CLASS_IV",
  /** Silicate clouds, even hotter. */
  CLASS_V = "CLASS_V",
}

/**
 * Defines the primary type of a planet based on its composition and surface characteristics.
 */
export enum PlanetType {
  /** A very barren plane with lots of craters. */
  BARREN = "BARREN",
  /** Primarily composed of rock and metal, often cratered. */
  ROCKY = "ROCKY",
  /** Earth-like planet with potential for liquid water and complex atmospheres. */
  TERRESTRIAL = "TERRESTRIAL",
  /** Dry, arid surface, possibly with dunes. */
  DESERT = "DESERT",
  /** Covered primarily in ice. */
  ICE = "ICE",
  /** Surface dominated by molten lava flows. */
  LAVA = "LAVA",
  /** Surface predominantly covered by liquid oceans. */
  OCEAN = "OCEAN",
}

/**
 * Describes the general density of a celestial body's atmosphere.
 */
export enum AtmosphereType {
  /** No atmosphere. */
  NONE = "NONE",
  /** Very low pressure, minimal atmospheric effects. */
  THIN = "THIN",
  /** Earth-like atmospheric pressure. */
  NORMAL = "NORMAL",
  /** High pressure, significant atmospheric effects. */
  DENSE = "DENSE",
  /** A very dense atmosphere, potentially hazardous. */
  VERY_DENSE = "VERY_DENSE",
}

/**
 * Describes the general topography or covering of a celestial body's surface.
 */
export enum SurfaceType {
  /** Characterized by numerous impact craters. */
  CRATERED = "CRATERED",
  /** Characterized by canyons and valleys. */
  CANYONOUS = "CANYONOUS",
  /** Characterized by volcanic activity. */
  VOLCANIC = "VOLCANIC",
  /** Dominated by mountain ranges and high relief. */
  MOUNTAINOUS = "MOUNTAINOUS",
  /** Relatively level terrain with low relief. */
  FLAT = "FLAT",
  /** Highlands and plateaus. */
  HIGHLANDS = "HIGHLANDS",
  /** Surface is predominantly liquid water or another fluid. */
  OCEAN = "OCEAN",
  /** Surface features earth-like variety (land, water, mountains). */
  VARIED = "VARIED",
  /** Characterized by large sand dunes. */
  DUNES = "DUNES",
  /** Dominated by flat expanses of ice. */
  ICE_FLATS = "ICE_FLATS",
  /** Surface ice showing significant cracking or fissures. */
  ICE_CRACKED = "ICE_CRACKED",
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

/**
 * Classification of stars based on their spectral characteristics and evolutionary stage.
 * This represents the actual astrophysical type, not the renderer type.
 */
export enum StellarType {
  /** Stars fusing hydrogen in their core, like the Sun. */
  MAIN_SEQUENCE = "MAIN_SEQUENCE",
  /** Young stars still forming and accreting material (not yet optically visible). */
  PROTOSTAR = "PROTOSTAR",
  /** Pre-main sequence stars that have become optically visible but haven't started hydrogen fusion. */
  PRE_MAIN_SEQUENCE = "PRE_MAIN_SEQUENCE",
  /** Massive, hot star losing mass via strong stellar winds. */
  WOLF_RAYET = "WOLF_RAYET",
  /** Very large, luminous evolved stars. */
  HYPERGIANT = "HYPERGIANT",
  /** Dense remnant of a low-to-medium mass star. */
  WHITE_DWARF = "WHITE_DWARF",
  /** Extremely dense remnant of a massive star's supernova. */
  NEUTRON_STAR = "NEUTRON_STAR",
  /** Region of spacetime where gravity is so strong nothing can escape. */
  BLACK_HOLE = "BLACK_HOLE",
}

/**
 * Subtypes for neutron stars - these are NOT separate stellar types
 */
export enum NeutronStarSubtype {
  /** Standard neutron star with regular magnetic field. */
  STANDARD = "STANDARD",
  /** Neutron star with strong magnetic field and radio pulses. */
  PULSAR = "PULSAR",
  /** Neutron star with extremely strong magnetic field. */
  MAGNETAR = "MAGNETAR",
}

/**
 * Subtypes for black holes - these are NOT separate stellar types
 */
export enum BlackHoleSubtype {
  /** Non-rotating black hole (Schwarzschild). */
  SCHWARZSCHILD = "SCHWARZSCHILD",
  /** Rotating black hole (Kerr). */
  KERR = "KERR",
}

/**
 * Subtypes for pre-main-sequence stars - these are NOT separate stellar types
 */
export enum ProtostarSubtype {
  /** Pre-main sequence stars < 2 solar masses with strong stellar winds. */
  T_TAURI = "T_TAURI",
  /** Pre-main sequence stars 2-8 solar masses of intermediate mass. */
  HERBIG_AE_BE = "HERBIG_AE_BE",
}

/**
 * Subtypes for white dwarfs based on spectral features
 */
export enum WhiteDwarfSubtype {
  DA = "DA", // Hydrogen-dominated atmosphere
  DB = "DB", // Helium-dominated atmosphere
  DC = "DC", // Featureless spectrum
  DO = "DO", // Helium-rich with ionized helium lines
  DZ = "DZ", // Metal-rich atmosphere
  DQ = "DQ", // Carbon-rich atmosphere
  DX = "DX", // Unclassified
}

/**
 * Spectral classes for main sequence stars and brown dwarfs
 * From hottest to coolest: O, B, A, F, G, K, M, L, T, Y
 */
export enum SpectralClass {
  O = "O",
  B = "B",
  A = "A",
  F = "F",
  G = "G",
  K = "K",
  M = "M",
  L = "L",
  T = "T",
  Y = "Y",
}

/**
 * Special spectral classes for non-main sequence stars
 */
export enum SpecialSpectralClass {
  W = "W", // Wolf-Rayet stars
  C = "C", // Carbon stars
  S = "S", // S-type stars
  D = "D", // White dwarfs
  Q = "Q", // Novae
  P = "P", // Pulsars
  R = "R", // R-type stars
  N = "N", // Nebulae
}

/**
 * Luminosity classes, indicating the size and evolutionary state of the star
 */
export enum LuminosityClass {
  I = "I", // Supergiants
  II = "II", // Bright giants
  III = "III", // Giants
  IV = "IV", // Subgiants
  V = "V", // Main sequence
  VI = "VI", // Subdwarfs
  VII = "VII", // White dwarfs
}

export enum CelestialStatus {
  ACTIVE = "active",
  DESTROYED = "destroyed",
  ANNIHILATED = "annihilated",
}
