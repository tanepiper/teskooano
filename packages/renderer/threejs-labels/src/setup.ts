import * as THREE from "three";
import { AuMarkerManager } from "./managers/AuMarkerManager";
import { CSS2DLayerType, Layer2DManager } from "./Layer2DManager";
import {
  CelestialLabelLayer,
  type LabelVisibilityConfig,
} from "./layers/CelestialLabelLayer";

export interface LabelSystemOptions {
  showAuMarkers?: boolean;
  labelConfig?: LabelVisibilityConfig;
}

export interface LabelSystem {
  css2DManager: Layer2DManager;
  auMarkerManager?: AuMarkerManager;
}

/**
 * Initializes the complete label system, including the 2D manager and all default layers.
 * @param scene The main Three.js scene.
 * @param container The HTML element to host the 2D renderer.
 * @param options Configuration options for the label system.
 * @returns An object containing the initialized manager instances.
 */
export function initializeLabelSystem(
  scene: THREE.Scene,
  container: HTMLElement,
  options: LabelSystemOptions = {},
): LabelSystem {
  const css2DManager = new Layer2DManager(scene, container);

  const celestialLayer = new CelestialLabelLayer(options.labelConfig);
  css2DManager.registerLayer(CSS2DLayerType.CELESTIAL_LABELS, celestialLayer);

  let auMarkerManager: AuMarkerManager | undefined;
  if (options.showAuMarkers) {
    auMarkerManager = new AuMarkerManager(scene, css2DManager);
    auMarkerManager.createMarkers();
  }

  return { css2DManager, auMarkerManager };
}
