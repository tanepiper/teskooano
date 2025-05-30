import { initializePlutoMoons } from "./moons";
import { initializePlutoPlanet } from "./planet";

export function initializePluto(parentId: string): void {
  const plutoId = initializePlutoPlanet(parentId);
  initializePlutoMoons(plutoId);
}
