import { initializeVenus as initializeVenusPlanet } from "./venus";

/**
 * Initializes the complete Venus system.
 * Venus has no moons, so only the planet itself is initialized.
 */
export function initializeVenus(parentId: string): void {
  initializeVenusPlanet(parentId);
}
