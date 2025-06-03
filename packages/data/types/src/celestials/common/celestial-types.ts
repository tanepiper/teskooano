/**
 * Primary celestial object types - top-level classification
 * Based on fundamental physics and astronomical taxonomy
 */
export enum CelestialType {
  /** Represents a star, a self-luminous celestial body consisting of a mass of gas held together by its own gravity. */
  STAR = "STAR",
  /** Represents a stellar remnant, the compact core left after a star has exhausted its fuel (e.g., white dwarf, neutron star, black hole). */
  STELLAR_REMNANT = "STELLAR_REMNANT",
  /** Represents a planet, a celestial body orbiting a star or stellar remnant that is massive enough to be rounded by its own gravity, is not massive enough to cause thermonuclear fusion, and has cleared its neighboring region of planetesimals. */
  PLANET = "PLANET",
  /** Represents a small body, such as an asteroid, comet, or dwarf planet. */
  SMALL_BODY = "SMALL_BODY",
  /** Represents an extended structure, such as a nebula, accretion disk, or planetary ring system. */
  EXTENDED_STRUCTURE = "EXTENDED_STRUCTURE",
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
  /** Catch-all for other or undefined celestial types. */
  OTHER = "OTHER",
}

/**
 * Operational status of celestial objects
 */
export enum CelestialStatus {
  /** Indicates the celestial object is currently active and functioning as expected. */
  ACTIVE = "active",
  /** Indicates the celestial object has been destroyed through conventional means. */
  DESTROYED = "destroyed",
  /** Indicates the celestial object has been completely obliterated or ceased to exist, possibly through exotic or high-energy events. */
  ANNIHILATED = "annihilated",
  /** Indicates the celestial object is currently in a dormant or inactive state, but could potentially become active again. */
  DORMANT = "dormant",
}
