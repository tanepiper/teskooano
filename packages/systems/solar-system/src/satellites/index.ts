import { initializeISS } from "./iss";
import { initializeHubble } from "./hubble";
import { initializeGPS } from "./gps";
import { initializeJWST } from "./jwst";
import { initializeVoyager1 } from "./voyager1";
import { initializeVoyager2 } from "./voyager2";
import { initializeGeostationarySat } from "./geostationary";

/**
 * Initialize all satellites in the solar system
 * @param sunId - ID of the Sun (for deep space satellites)
 * @param earthId - ID of Earth (for Earth-orbiting satellites)
 */
export function initializeSatellites(sunId: string, earthId: string): void {
  // Earth-orbiting satellites
  initializeISS(earthId);
  initializeHubble(earthId);
  initializeGPS(earthId);
  initializeGeostationarySat(earthId); // New geostationary satellite

  // Deep space satellites orbiting the Sun
  initializeJWST(sunId);

  // Rogue satellites (interstellar space - no parent)
  initializeVoyager1(); // No parentId - rogue object
  initializeVoyager2(); // No parentId - rogue object
}

// Also export individual functions for specific use cases
export {
  initializeISS,
  initializeHubble,
  initializeJWST,
  initializeGPS,
  initializeVoyager1,
  initializeVoyager2,
};
