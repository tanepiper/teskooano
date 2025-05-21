import type * as THREE from "three";

/**
 * Base interface for all celestial object appearance-related properties.
 */
export interface CelestialAppearanceBase {
  rotation?: THREE.Quaternion; // Current visual rotation of the object
  // Future common visual flags: e.g., isVisible, receivesShadows, castsShadows
}
