import { celestialStore } from "./celestialStore";
import { seedStore } from "./seedStore";
import { physicsStore } from "./physicsStore";
import { renderableStore } from "./renderableStore";

export { celestialStore } from "./celestialStore";
export { seedStore } from "./seedStore";
export { physicsStore } from "./physicsStore";
export { renderableStore } from "./renderableStore";

// Re-export observables for convenience
export const currentSeed$ = seedStore.currentSeed$;
export const celestialObjects$ = celestialStore.objects$;
export const celestialHierarchy$ = celestialStore.hierarchy$;
export const accelerationVectors$ = physicsStore.accelerationVectors$;
export const renderableObjects$ = renderableStore.renderableObjects$;
