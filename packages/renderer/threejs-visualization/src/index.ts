import { OrbitManager } from './OrbitManager';
import { ObjectManager } from './ObjectManager';
import { BackgroundManager } from './BackgroundManager';
import * as THREE from 'three';

// Sub-component specific logic
export * from './object-manager';
export * from './orbit-manager';
export * from './background-manager';

// Main manager classes
export * from './ObjectManager';
export * from './OrbitManager';
export * from './BackgroundManager';

// Enums and Types specific to visualization
export { VisualizationMode } from './OrbitManager';

// Export sub-modules if needed, or specific functions
// export * from './orbit-manager'; // Export orbit calculation helpers
// export * from './object-manager'; // Export object creation/update helpers
// export * from './background-manager'; // Export background creation helpers

// REMOVED VisualizationRenderer class definition 