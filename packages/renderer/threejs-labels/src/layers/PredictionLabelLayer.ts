import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { BaseLabelLayer, UIRegistryComponent } from "./BaseLabelLayer";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { PredictionLabel } from "../components/prediction/PredictionLabel";
import { RenderableCelestialObject } from "@teskooano/data-types";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";

const PREDICTION_LABEL_TAG = "prediction-label";

export class PredictionLabelLayer extends BaseLabelLayer {
  private activePredictionObject: THREE.Object3D | null = null;
  private activeObjectVelocity: number = 0; // Speed in m/s
  private activeObjectRadius: number = 0; // Radius in scene units

  constructor(scene: THREE.Scene) {
    super(scene);
  }

  public getRequiredComponents(): UIRegistryComponent[] {
    return [
      {
        tagName: PREDICTION_LABEL_TAG,
        componentClass: PredictionLabel,
      },
    ];
  }

  public addLabel(
    id: string,
    position: THREE.Vector3,
    text: string,
    timeInSeconds: number,
  ): CSS2DObject {
    const labelElement = document.createElement(
      PREDICTION_LABEL_TAG,
    ) as PredictionLabel;
    labelElement.setText(text);
    labelElement.setTimeCategory(timeInSeconds);
    labelElement.dataset.markerTime = timeInSeconds.toString();

    const label = new CSS2DObject(labelElement);
    label.name = `prediction-label-${id}`;
    label.position.copy(position);
    this.elements.set(id, label);

    this.scene?.add(label);
    label.visible = this.isVisible;

    return label;
  }

  public setActivePredictionObject(
    object: RenderableCelestialObject | null,
    threeJsObject: THREE.Object3D | null,
    velocity: number | null,
  ): void {
    this.activePredictionObject = threeJsObject;
    this.activeObjectVelocity = velocity || 0;
    this.activeObjectRadius = object?.radius || 0;
  }

  public update(
    camera: THREE.PerspectiveCamera,
    centralBody: OSVector3, // Not used by prediction labels
    objectManager: ObjectManager,
  ): void {
    if (!this.isVisible || !this.activePredictionObject) {
      // Ensure all are hidden if the layer is globally hidden or no object is active.
      this.elements.forEach((css2dObject) => {
        if (css2dObject.visible) {
          css2dObject.visible = false;
        }
      });
      return;
    }

    const objectPosition = this.activePredictionObject.position;
    const zoomDistance = camera.position.distanceTo(objectPosition);

    // Baseline thresholds in scene units
    const BASE_HIDE_SHORT_TERM_DIST = 50;
    const BASE_HIDE_MEDIUM_TERM_DIST = 150;
    const BASE_HIDE_LONG_TERM_DIST = 3000;
    const EARTH_ORBITAL_VELOCITY_MS = 29780; // ~30 km/s

    // Scale thresholds based on the object's velocity relative to Earth's orbital speed.
    // Clamp the factor to prevent extreme values for very slow or very fast objects.
    const velocityFactor =
      this.activeObjectVelocity / EARTH_ORBITAL_VELOCITY_MS;
    const clampedFactor = Math.max(0.5, Math.min(velocityFactor, 5.0));

    const HIDE_SHORT_TERM_DIST = BASE_HIDE_SHORT_TERM_DIST * clampedFactor;
    const HIDE_MEDIUM_TERM_DIST = BASE_HIDE_MEDIUM_TERM_DIST * clampedFactor;
    const HIDE_LONG_TERM_DIST = BASE_HIDE_LONG_TERM_DIST * clampedFactor;

    const ONE_DAY = 86400;
    const NINETY_DAYS = ONE_DAY * 90;

    this.elements.forEach((css2dObject) => {
      const element = css2dObject.element as HTMLElement;
      const markerTime = parseFloat(element.dataset.markerTime || "0");

      if (!markerTime) {
        // Default to visible if time is not set, though this shouldn't happen.
        css2dObject.visible = true;
        return;
      }

      // Check 1: Is label inside the celestial object's radius?
      if (this.activeObjectRadius > 0) {
        const distanceToCenter =
          css2dObject.position.distanceTo(objectPosition);
        if (distanceToCenter < this.activeObjectRadius) {
          css2dObject.visible = false;
          return; // Skip further checks, it's inside the object.
        }
      }

      let shouldBeVisible = true;
      // console.log(zoomDistance, HIDE_SHORT_TERM_DIST)
      if (markerTime < ONE_DAY) {
        // Short-term markers (e.g., 1h, 6h, 12h)
        if (zoomDistance > HIDE_SHORT_TERM_DIST) {
          shouldBeVisible = false;
        }
      } else if (markerTime < NINETY_DAYS) {
        // Medium-term markers (e.g., 1d, 7d, 30d)
        if (zoomDistance > HIDE_MEDIUM_TERM_DIST) {
          shouldBeVisible = false;
        }
      }

      // Apply occlusion checking if the label would otherwise be visible
      if (shouldBeVisible && objectManager) {
        // Get the label's world position
        const labelWorldPosition = new THREE.Vector3();
        css2dObject.getWorldPosition(labelWorldPosition);

        // Generate a unique ID for this prediction label
        const labelId = `prediction_${element.dataset.markerTime}_${this.activePredictionObject?.name || "unknown"}`;

        // Check if the label is occluded by celestial objects
        const isOccluded = this.isLabelOccludedOptimized(
          labelId,
          OSVector3.fromThreeJS(labelWorldPosition),
          camera,
          objectManager,
          labelId,
        );

        if (isOccluded) {
          shouldBeVisible = false;
        }
      }

      // The final visibility also depends on the layer's global visibility state.
      css2dObject.visible = shouldBeVisible;
    });
  }
}
