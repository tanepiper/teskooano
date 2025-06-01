/**
 * Defines the level of Post-Newtonian approximation to use for gravitational calculations.
 */
export enum PNOrder {
  /** Pure Newtonian gravity. */
  NEWTONIAN = "NEWTONIAN",
  /** The existing simplified relativistic effects (relativistic mass, time dilation). */
  SIMPLIFIED_RELATIVISTIC = "SIMPLIFIED_RELATIVISTIC",
  /** First-order Post-Newtonian corrections. */
  PN1 = "PN1",
  /** 1PN + 1.5PN terms (often related to spin or specific interactions, can be detailed later). */
  // PN1_5 = "PN1_5",
  /** Second-order Post-Newtonian corrections. */
  PN2 = "PN2",
  /** 2PN + 2.5PN terms (includes gravitational radiation reaction force). */
  PN2_5 = "PN2_5",
}
