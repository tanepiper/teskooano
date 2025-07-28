/**
 * Used to represent common parents for solar system main bodies, or other bodies,
 * this is a convenience const to help with the main system creation process.
 */
export const SolarSystemBodies = {
  /**
   * The Sun
   */
  SUN: "sun",
  /**
   * Mercury
   */
  MERCURY: "mercury",
  /**
   * Venus
   */
  VENUS: "venus",
  /**
   * Mars
   */
  MARS: "mars",
  /**
   * Jupiter
   */
  JUPITER: "jupiter",
  /**
   * Saturn
   */
  SATURN: "saturn",

  /**
   * Uranus
   */
  URANUS: "uranus",

  /**
   * Neptune
   */
  NEPTUNE: "neptune",

  /**
   * Pluto
   */
  PLUTO: "pluto",
  /**
   * Other
   */
  OTHER: "other",
} as const;

export type SolarSystemBodies =
  (typeof SolarSystemBodies)[keyof typeof SolarSystemBodies];
