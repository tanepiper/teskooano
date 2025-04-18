import { CelestialObject } from '@teskooano/data-types';

// Base interface for all celestial info components
export interface CelestialInfoComponent extends HTMLElement {
    updateData(celestial: CelestialObject): void;
} 