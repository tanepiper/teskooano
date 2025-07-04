import { initializePlutoDwarfPlanet } from "./pluto";
import { initializeCharon } from "./charon";

/**
 * Initializes the complete Pluto system: the dwarf planet and its largest moon.
 */
export function initializePluto(parentId: string): void {
  const plutoId = initializePlutoDwarfPlanet(parentId);
  initializeCharon(plutoId);
}
