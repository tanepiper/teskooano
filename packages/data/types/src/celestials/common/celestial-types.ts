// ============================================================================
// PRIMARY CELESTIAL CLASSIFICATION
// ============================================================================

/**
 * Primary celestial object types - top-level classification
 * Based on fundamental physics and astronomical taxonomy
 */
export enum CelestialType {
  STAR = "STAR",
  STELLAR_REMNANT = "STELLAR_REMNANT",
  PLANET = "PLANET",
  SMALL_BODY = "SMALL_BODY",
  EXTENDED_STRUCTURE = "EXTENDED_STRUCTURE",
}

/**
 * Operational status of celestial objects
 */
export enum CelestialStatus {
  ACTIVE = "active",
  DESTROYED = "destroyed",
  ANNIHILATED = "annihilated",
  DORMANT = "dormant",
}
