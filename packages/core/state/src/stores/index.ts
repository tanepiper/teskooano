import { celestialStore } from "./CelestialStore.js";
import { seedStore } from "./SeedStore.js";
import { physicsStore } from "./PhysicsStore.js";
import { renderableStore } from "./RenderableStore.js";

export { celestialStore, seedStore, physicsStore, renderableStore };

// Re-export observables for convenience
export const currentSeed$ = seedStore.currentSeed$;
export const celestialObjects$ = celestialStore.objects$;
export const celestialHierarchy$ = celestialStore.hierarchy$;
export const accelerationVectors$ = physicsStore.accelerationVectors$;
export const renderableObjects$ = renderableStore.renderableObjects$;
