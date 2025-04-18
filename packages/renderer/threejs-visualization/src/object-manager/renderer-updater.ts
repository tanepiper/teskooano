import {
  CelestialRenderer,
  KerrBlackHoleRenderer,
  NeutronStarRenderer,
  RingSystemRenderer,
  SchwarzschildBlackHoleRenderer,
} from "@teskooano/systems-celestial";
import * as THREE from "three";

/**
 * Helper class responsible for iterating through different categories of celestial renderers
 * (standard celestial, stars, planets, moons) and calling their respective `update` methods.
 * This centralizes the update logic, allowing the `ObjectManager` to simply delegate the task.
 * It specifically handles potentially different update requirements for specialized renderers
 * like black holes or neutron stars, passing necessary context like the renderer, scene, and camera.
 */
export class RendererUpdater {
  /** @internal Map storing general celestial renderers (e.g., asteroid fields, Oort clouds). Keyed by object ID. */
  private celestialRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing specialized star renderers. Keyed by object ID. */
  private starRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing specialized planet renderers. Keyed by object ID. */
  private planetRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing specialized moon renderers. Keyed by object ID. */
  private moonRenderers: Map<string, CelestialRenderer>;
  /** @internal Map storing ring system renderers. Keyed by object ID. */
  private ringSystemRenderers: Map<string, RingSystemRenderer>;

  /**
   * Creates a new RendererUpdater instance.
   * @param celestialRenderers - Map of general celestial renderers.
   * @param starRenderers - Map of star-specific renderers.
   * @param planetRenderers - Map of planet-specific renderers.
   * @param moonRenderers - Map of moon-specific renderers.
   * @param ringSystemRenderers - Map of ring system-specific renderers.
   */
  constructor(
    celestialRenderers: Map<string, CelestialRenderer>,
    starRenderers: Map<string, CelestialRenderer>,
    planetRenderers: Map<string, CelestialRenderer>,
    moonRenderers: Map<string, CelestialRenderer>,
    ringSystemRenderers: Map<string, RingSystemRenderer>,
  ) {
    this.celestialRenderers = celestialRenderers;
    this.starRenderers = starRenderers;
    this.planetRenderers = planetRenderers;
    this.moonRenderers = moonRenderers;
    this.ringSystemRenderers = ringSystemRenderers;
  }

  /**
   * Iterates through all managed renderer maps and calls the `update` method on each renderer instance
   * that has one defined. Passes the current time and optional context (lights, objects, renderer, scene, camera).
   * Differentiates between standard and specialized renderers.
   *
   * @param time - The current simulation time or delta time.
   * @param lightSources - Optional map of active light sources.
   * @param objects - Optional map of the actual THREE.Object3D instances (currently unused but available).
   * @param renderer - Optional WebGLRenderer instance, needed for some specialized renderers.
   * @param scene - Optional Scene instance, needed for some specialized renderers.
   * @param camera - Optional PerspectiveCamera instance, needed for some specialized renderers.
   */
  updateRenderers(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    objects?: Map<string, THREE.Object3D>,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera,
  ): void {
    // Update standard renderers
    this.updateStandardRenderers(time, lightSources, camera);

    // Update specialized renderers
    this.updateSpecializedRenderers(
      time,
      lightSources,
      renderer,
      scene,
      camera,
    );
  }

  /**
   * Updates renderers for standard objects like planets, moons, and generic celestial types.
   * Passes time, light sources, and camera information.
   * @internal
   * @param time - Current simulation time or delta time.
   * @param lightSources - Map of active light sources.
   * @param camera - The main camera.
   */
  private updateStandardRenderers(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    camera?: THREE.Camera,
  ): void {
    // Restore original logic: Update standard renderers (Planets, Moons, Generic Celestial)
    const renderersToUpdate = [
      ...this.celestialRenderers.values(),
      ...this.planetRenderers.values(),
      ...this.moonRenderers.values(),
    ];

    renderersToUpdate.forEach((rendererInstance) => {
      if (rendererInstance.update) {
        rendererInstance.update(time, lightSources, camera);
      }
    });
  }

  /**
   * Updates specialized renderers, particularly stars, checking if they require extra context
   * (renderer, scene, camera) for effects like gravitational lensing.
   * @internal
   * @param time - Current simulation time or delta time.
   * @param lightSources - Map of active light sources.
   * @param renderer - WebGLRenderer instance.
   * @param scene - Scene instance.
   * @param camera - PerspectiveCamera instance.
   */
  private updateSpecializedRenderers(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera,
  ): void {
    // Update star renderers
    this.starRenderers.forEach((starRenderer, id) => {
      if (starRenderer.update) {
        // const mesh = objects?.get(id);

        // Check if this is a renderer that supports gravitational lensing
        if (
          starRenderer instanceof SchwarzschildBlackHoleRenderer ||
          starRenderer instanceof KerrBlackHoleRenderer ||
          starRenderer instanceof NeutronStarRenderer
        ) {
          // Pass renderer, scene and camera for lensing updates
          if (renderer && scene && camera) {
            // Lensing update might need different args - needs verification
            // For now, attempt standard call (might error)
            starRenderer.update(time, lightSources, camera);
          }
        } else {
          // Normal update for standard stars
          starRenderer.update(time, lightSources, camera);
        }
      }
    });

    // Update ring renderers
    this.ringSystemRenderers.forEach((ringRenderer, id) => {
      if (ringRenderer.update) {
        // Ring renderer update doesn't need renderer/scene/camera for basic light updates
        ringRenderer.update(time, lightSources);
      }
    });
  }

  /**
   * Cleans up resources used by the renderers.
   * Iterates through all managed renderer maps and calls the `dispose` method on each instance
   * if it exists.
   */
  dispose(): void {
    // Dispose of renderers
    this.celestialRenderers.forEach((renderer) => {
      if (renderer.dispose) {
        renderer.dispose();
      }
    });

    this.starRenderers.forEach((renderer) => {
      if (renderer.dispose) {
        renderer.dispose();
      }
    });

    this.planetRenderers.forEach((renderer) => {
      if (renderer.dispose) {
        renderer.dispose();
      }
    });

    this.moonRenderers.forEach((renderer) => {
      if (renderer.dispose) {
        renderer.dispose();
      }
    });

    // Dispose ring renderers
    this.ringSystemRenderers.forEach((renderer) => {
      if (renderer.dispose) {
        renderer.dispose();
      }
    });
  }
}
