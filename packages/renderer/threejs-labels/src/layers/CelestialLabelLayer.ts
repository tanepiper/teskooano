import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { BaseLabelLayer, UIRegistryComponent } from "./BaseLabelLayer";
import {
  type RenderableCelestialObject,
  CelestialType,
} from "@teskooano/data-types";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
  CELESTIAL_LABEL_TAG,
  CelestialLabelComponent,
} from "../components/celestial-label/CelestialLabelComponent";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { AU_METERS, SCALE } from "@teskooano/data-values";
import { Subscription } from "rxjs";
import { StateAccessor } from "@teskooano/core-state";
import { renderableStore } from "@teskooano/core-state";

export interface LabelVisibilityConfig {
  planet?: number;
  gasGiant?: number;
  moon?: number;
  comet?: number;
  ejectedMoon?: number;
  secondaryStar?: number;
  default?: number;
  satellite?: number;
  ejectedSatellite?: number;
  asteroid?: number; // Add asteroid visibility config
}

export class CelestialLabelLayer extends BaseLabelLayer {
  private visibilityConfig: Required<LabelVisibilityConfig>;
  private labelCache = new Map<
    string,
    {
      lastDistance: string;
      lastSpeed: string;
      lastVisible: boolean;
      lastPosition?: THREE.Vector3;
    }
  >();

  // Pre-allocated vectors for performance
  private _tempPos1 = new THREE.Vector3();
  private _tempPos2 = new THREE.Vector3();

  // State management
  private renderableSubscription: Subscription | null = null;
  private globalLabelsEnabled: boolean = true; // Default to true
  private lastGlobalState: boolean = true;

  constructor(scene: THREE.Scene, config: LabelVisibilityConfig = {}) {
    super(scene);
    this.visibilityConfig = {
      planet: config.planet ?? 500,
      gasGiant: config.gasGiant ?? 800,
      moon: config.moon ?? 200,
      comet: config.comet ?? 300,
      ejectedMoon: config.ejectedMoon ?? 150,
      secondaryStar: config.secondaryStar ?? 1000,
      default: config.default ?? 400,
      satellite: config.satellite ?? 1,
      ejectedSatellite: config.ejectedSatellite ?? 200000000,
      asteroid: config.asteroid ?? 100,
    };

    // Subscribe to renderable object changes
    this.subscribeToStateChanges();
  }

  /**
   * Specifies the custom elements required by this layer.
   */
  public override getRequiredComponents(): UIRegistryComponent[] {
    return [
      {
        tagName: CELESTIAL_LABEL_TAG,
        componentClass: CelestialLabelComponent,
      },
    ];
  }

  /**
   * Create a label for a celestial object
   */
  public createLabel(
    object: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
  ): void {
    if (!this.scene) {
      throw new Error("No scene to create celestial labels with");
    }

    const labelElement = document.createElement(
      CELESTIAL_LABEL_TAG,
    ) as CelestialLabelComponent;
    labelElement.setAttribute("data-object-id", object.id);
    labelElement.setAttribute("data-object-type", object.type);
    labelElement.setAttribute("data-name", object.name);
    if (object.parentId) {
      labelElement.setAttribute("data-parent-id", object.parentId);
    }

    const css2dObject = new CSS2DObject(labelElement);
    css2dObject.name = `celestial-label-${object.id}`;
    css2dObject.position.copy(this.calculateLabelPosition(object, parentMesh));

    const group = this.scene.getObjectByName(`GROUP_${object.id}`);
    if (group) {
      group.add(css2dObject);
    }

    this.elements.set(object.id, css2dObject);

    // Initialize cache for this label
    this.labelCache.set(object.id, {
      lastDistance: "",
      lastSpeed: "",
      lastVisible: false,
      lastPosition: css2dObject.position.clone(),
    });
  }

  public override update(
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
  ): void {
    // Call parent update for throttling
    super.update(camera, objectManager);

    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    const allObjects = objectManager.getLatestRenderableObjects();

    this.elements.forEach((label) => {
      const objectId = label.element.getAttribute("data-object-id")!;
      const ownObject = objectManager.getObject(objectId);
      const renderableObject = allObjects[objectId];

      if (!ownObject || !renderableObject) {
        return;
      }

      // Update label position if object has moved
      const newLabelPosition = this.calculateLabelPosition(
        renderableObject,
        ownObject,
        objectManager,
      );

      const cache = this.labelCache.get(objectId)!;
      if (!cache.lastPosition || !cache.lastPosition.equals(newLabelPosition)) {
        label.position.copy(newLabelPosition);
        cache.lastPosition = newLabelPosition.clone();
      }

      // Update distance and speed display
      const centerDistance = cameraPosition.distanceTo(ownObject.position);
      const distanceInAu = this.sceneUnitsToAu(centerDistance);
      const formattedDistance = this._formatDistance(distanceInAu);

      let formattedSpeed = "";
      if (renderableObject.velocityMagnitude_mps !== undefined) {
        formattedSpeed = this._formatSpeed(
          renderableObject.velocityMagnitude_mps,
        );
      }

      // Only update attributes if values have changed
      if (cache.lastDistance !== formattedDistance) {
        label.element.setAttribute(
          "data-distance-formatted",
          formattedDistance,
        );
        cache.lastDistance = formattedDistance;
      }

      if (cache.lastSpeed !== formattedSpeed) {
        label.element.setAttribute("data-speed-formatted", formattedSpeed);
        cache.lastSpeed = formattedSpeed;
      }

      // Update cache
      this.labelCache.set(objectId, cache);
    });
  }

  public override clear(): void {
    super.clear();
    this.labelCache.clear();
    this.unsubscribeFromStateChanges();
  }

  /**
   * Set the global labels enabled state
   */
  public setGlobalLabelsEnabled(enabled: boolean): void {
    if (this.globalLabelsEnabled !== enabled) {
      this.globalLabelsEnabled = enabled;
      this.updateAllLabelVisibility();
    }
  }

  /**
   * Subscribe to renderable object state changes
   */
  private subscribeToStateChanges(): void {
    this.unsubscribeFromStateChanges();

    this.renderableSubscription = renderableStore.renderableObjects$.subscribe(
      (renderableObjects) => {
        this.updateAllLabelVisibility();
      },
    );
  }

  /**
   * Unsubscribe from state changes
   */
  private unsubscribeFromStateChanges(): void {
    if (this.renderableSubscription) {
      this.renderableSubscription.unsubscribe();
      this.renderableSubscription = null;
    }
  }

  /**
   * Update visibility for all labels based on global and individual state
   */
  private updateAllLabelVisibility(): void {
    this.elements.forEach((label) => {
      const objectId = label.element.getAttribute("data-object-id");
      if (!objectId) return;

      const renderableObject = StateAccessor.getRenderableObject(objectId);
      if (!renderableObject) return;

      // AND logic: global labels enabled AND individual showLabel
      const shouldBeVisible =
        this.globalLabelsEnabled && (renderableObject.showLabel ?? true);

      // Update the component's visibility using CSS class
      const component = label.element as CelestialLabelComponent;
      component.setVisible(shouldBeVisible);

      // Update CSS2DObject visibility
      label.visible = shouldBeVisible;
    });
  }

  /**
   * Formats distance for display with appropriate units
   */
  private _formatDistance(distanceInAu: number): string {
    if (distanceInAu < 0.01) {
      // For distances under 0.01 AU (1.496e+7 m), use shorter metric units
      const distanceInMeters = distanceInAu * AU_METERS;

      if (distanceInMeters >= 1_000_000_000) {
        return `${(distanceInMeters / 1_000_000_000).toFixed(1)} Gm`;
      } else if (distanceInMeters >= 1_000_000) {
        return `${(distanceInMeters / 1_000_000).toFixed(1)} Mm`;
      } else if (distanceInMeters >= 1_000) {
        return `${(distanceInMeters / 1_000).toFixed(1)} km`;
      } else {
        return `${distanceInMeters.toFixed(0)} m`;
      }
    } else if (distanceInAu < 1) {
      return `${distanceInAu.toFixed(2)} AU`;
    } else if (distanceInAu < 100) {
      return `${distanceInAu.toFixed(1)} AU`;
    } else {
      return `${Math.round(distanceInAu)} AU`;
    }
  }

  /**
   * Formats a speed value into a human-readable string with appropriate units.
   * @param speedInMps - The speed in meters per second.
   * @returns A formatted string (e.g., "1.23 km/s", "0.001c").
   */
  private _formatSpeed(speedInMps: number): string {
    const LIGHT_SPEED = 299_792_458; // m/s
    const KILOMETER_PER_SECOND = 1_000; // m/s

    // If speed is significant fraction of light speed (>= 0.001c), show as fraction of c
    if (speedInMps >= LIGHT_SPEED * 0.001) {
      const fractionOfLightSpeed = speedInMps / LIGHT_SPEED;
      if (fractionOfLightSpeed >= 0.01) {
        return `${fractionOfLightSpeed.toFixed(3)}c`;
      } else {
        return `${fractionOfLightSpeed.toFixed(4)}c`;
      }
    }

    // If speed is >= 1 km/s, show in km/s
    if (speedInMps >= KILOMETER_PER_SECOND) {
      return `${(speedInMps / KILOMETER_PER_SECOND).toFixed(2)} km/s`;
    }

    // Otherwise show in m/s
    if (speedInMps >= 1) {
      return `${speedInMps.toFixed(1)} m/s`;
    } else {
      return `${speedInMps.toFixed(2)} m/s`;
    }
  }

  private calculateLabelPosition(
    object: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
    objectManager?: ObjectManager,
  ): THREE.Vector3 {
    const visualRadius = object.radius || 1;

    // Special handling for particle systems (asteroid fields and oort clouds)
    // that should be positioned at their inner radius, not at origin
    if (
      object.type === CelestialType.ASTEROID_FIELD ||
      object.type === CelestialType.OORT_CLOUD
    ) {
      if (object.properties) {
        const props = object.properties as any;
        if (props.innerRadiusAU !== undefined) {
          // Convert inner radius from AU to scene units
          const innerRadiusSceneUnits =
            props.innerRadiusAU * SCALE.RENDER_SCALE_AU;

          // Get the parent star's position (asteroid fields orbit the star)
          // Use pre-allocated vector _tempPos1
          const parentStarPosition = this._tempPos1;
          parentStarPosition.set(0, 0, 0); // Reset for reuse
          if (object.parentId && objectManager) {
            // Get parent object from the object manager
            const parentObject = objectManager.getObject(object.parentId);
            if (parentObject) {
              parentObject.getWorldPosition(parentStarPosition);
            }
          }

          // Position label at the inner radius edge relative to the parent star
          // Use pre-allocated vector _tempPos2 for labelPosition
          const labelPosition = this._tempPos2.copy(parentStarPosition);
          labelPosition.add(new THREE.Vector3(innerRadiusSceneUnits, 0, 0));
          // Add offset above the belt for visibility
          return labelPosition.add(new THREE.Vector3(0, visualRadius * 1.5, 0));
        }
      }
    }

    // Get the world position of the celestial object
    // Use pre-allocated vector _tempPos1
    const worldPosition = this._tempPos1;
    worldPosition.set(0, 0, 0); // Reset for reuse
    parentMesh.getWorldPosition(worldPosition);

    // Position label at a fixed offset above the object in world space
    // Use world "up" direction (Y-axis) to ensure labels stay consistent
    // regardless of the object's axial tilt or rotation
    // Use pre-allocated vector _tempPos2 for the final return value
    return this._tempPos2
      .copy(worldPosition)
      .add(new THREE.Vector3(0, visualRadius * 1.5, 0));
  }
}
