import {
  type CelestialRenderer,
  type RingSystemRenderer,
  KerrBlackHoleRenderer,
  NeutronStarRenderer,
  SchwarzschildBlackHoleRenderer,
} from "@teskooano/systems-celestial";
import type * as THREE from "three";
import { renderableStore } from "@teskooano/core-state";
import { RendererUpdaterConfig } from "../types";
import { BasicCelestialRenderer } from "@teskooano/celestials-base";

/**
 * Helper class responsible for iterating through active BasicCelestialRenderers
 * and calling their `update` methods.
 */
export class RendererUpdater {
  private activeRenderers: Map<string, BasicCelestialRenderer>;

  /**
   * Creates an instance of RendererUpdater.
   * @param config - Configuration object containing the map of active BasicCelestialRenderers.
   */
  constructor(config: RendererUpdaterConfig) {
    this.activeRenderers = config.activeRenderers;
  }

  /**
   * Iterates through all managed BasicCelestialRenderer instances and calls their `update` method.
   *
   * @param time - The current simulation time or delta time. (Currently unused by BasicCelestialRenderer.update)
   * @param lightSources - Optional map of active light sources. (Currently unused by BasicCelestialRenderer.update)
   * @param _renderer - Optional WebGLRenderer instance (no longer passed down).
   * @param _scene - Optional Scene instance (no longer passed down).
   * @param _camera - Optional PerspectiveCamera instance (no longer passed down).
   */
  updateRenderers(
    _time: number,
    _lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
  ): void {
    this.activeRenderers.forEach((rendererInstance) => {
      rendererInstance.update();
    });
  }

  /**
   * RendererUpdater does not own the renderers, so dispose is a no-op here.
   * The lifecycle of BasicCelestialRenderer instances is managed by ObjectLifecycleManager.
   */
  dispose(): void {
    // No-op. Renderers are disposed by ObjectLifecycleManager.
  }
}
