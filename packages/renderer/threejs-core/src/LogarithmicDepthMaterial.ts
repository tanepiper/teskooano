import { METERS_TO_SCENE_UNITS, SCALE } from "@teskooano/data-values";
import * as THREE from "three";

/**
 * Camera distance configuration for space-scale rendering.
 * All camera distance settings should use these values for consistency.
 */
export const CAMERA_DISTANCE_CONFIG = {
  /** Near plane distance - 1.5 km in scene units */
  NEAR: 1500 * METERS_TO_SCENE_UNITS,
  /** Far plane distance - 10,000 AU in scene units */
  FAR: 10000 * SCALE.RENDER_SCALE_AU,
} as const;

/**
 * Helper for enabling logarithmic depth buffer in materials.
 *
 * This provides much better depth precision across huge distance ranges
 * like those found in space simulations, where objects can range from
 * meters to astronomical units in distance.
 *
 * Note: This class now works with the built-in Three.js logarithmic depth buffer
 * system (enabled via renderer.logarithmicDepthBuffer = true). It only sets
 * the necessary defines on materials - the actual shader injection is handled
 * by Three.js for shaders that include the standard logdepthbuf includes.
 */
export class LogarithmicDepthMaterial {
  /**
   * Enables logarithmic depth buffer for a material.
   * This modifies the material to use log depth calculations for better precision.
   *
   * Note: Since the renderer already has logarithmicDepthBuffer: true, we only need
   * to set the defines. The built-in Three.js system handles the shader injection.
   */
  public static enableLogDepth(material: THREE.Material): void {
    if (!material) return;

    // Skip materials that don't support logarithmic depth
    if (this.shouldSkipMaterial(material)) {
      return;
    }

    // Enable logarithmic depth buffer defines
    (material as any).defines = (material as any).defines || {};
    (material as any).defines.USE_LOGDEPTHBUF = true;
    (material as any).defines.USE_LOGDEPTHBUF_EXT = true;

    // Note: We don't inject custom shader code anymore since the renderer
    // already has logarithmicDepthBuffer: true and the built-in system works
    // with shaders that include <logdepthbuf_pars_fragment> and <logdepthbuf_fragment>

    material.needsUpdate = true;
  }

  /**
   * Determines if a material should be skipped for logarithmic depth processing.
   * Some materials (like effect materials) don't need or support logarithmic depth.
   */
  private static shouldSkipMaterial(material: THREE.Material): boolean {
    // Skip materials that are effect materials or have custom shaders without log depth support
    if (material instanceof THREE.ShaderMaterial) {
      // Check if this is a gravitational lensing material or similar effect material
      if (
        material.userData?.isEffectMaterial ||
        material.userData?.skipLogDepth ||
        material.name?.includes("lensing") ||
        material.name?.includes("effect")
      ) {
        return true;
      }

      // Skip materials with inline shaders that don't include log depth support
      if (
        material.fragmentShader &&
        !material.fragmentShader.includes("logdepthbuf_pars_fragment") &&
        !material.fragmentShader.includes("logdepthbuf_fragment")
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Enables logarithmic depth buffer for all materials in a scene.
   */
  public static enableLogDepthForScene(scene: THREE.Scene): void {
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.Sprite) {
        const material = object.material;

        if (Array.isArray(material)) {
          material.forEach((mat) => this.enableLogDepth(mat));
        } else {
          this.enableLogDepth(material);
        }
      }
    });
  }

  /**
   * Configures a camera for logarithmic depth buffer.
   */
  public static configureCameraForLogDepth(
    camera: THREE.PerspectiveCamera,
  ): void {
    // Use the single source of truth for camera distances
    camera.near = CAMERA_DISTANCE_CONFIG.NEAR;
    camera.far = CAMERA_DISTANCE_CONFIG.FAR;
    camera.updateProjectionMatrix();
  }

  /**
   * Note: Shader injection methods removed since we now use the built-in
   * Three.js logarithmic depth buffer system instead of custom injection.
   * The renderer has logarithmicDepthBuffer: true and shaders use the
   * standard <logdepthbuf_pars_fragment> and <logdepthbuf_fragment> includes.
   */

  /**
   * Creates a test material with logarithmic depth enabled.
   * Useful for testing log depth functionality.
   */
  public static createTestMaterial(): THREE.MeshBasicMaterial {
    const material = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: false,
      depthTest: true,
      depthWrite: true,
    });

    this.enableLogDepth(material);
    return material;
  }
}
