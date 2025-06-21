import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import * as THREE from "three";

/**
 * Configuration options for the BaseCelestialRenderer.
 */
export interface BaseCelestialRendererOptions {
  /**
   * An optional reference to the scene's lighting manager. This can be used
   * by renderers to access global lighting information.
   */
  lightingManager?: LightingManager;
}
