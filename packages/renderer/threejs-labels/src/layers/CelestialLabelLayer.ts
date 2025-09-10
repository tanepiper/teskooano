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
import { formatDistance, formatSpeed } from "../utils/formatting";
import { labelStateManager } from "../state/LabelStateManager";

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
  asteroid?: number;
}

export class CelestialLabelLayer extends BaseLabelLayer {
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

  constructor(scene: THREE.Scene, config: LabelVisibilityConfig = {}) {
    super(scene);

    // Update the state manager's LOD config with any custom values
    labelStateManager.updateLODConfig({
      planet: config.planet ?? 500,
      gasGiant: config.gasGiant ?? 800,
      moon: config.moon ?? 1,
      comet: config.comet ?? 300,
      satellite: config.satellite ?? 1,
      asteroid: config.asteroid ?? 100,
      default: config.default ?? 400,
    });
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

    const labelElement = document.createElement(CELESTIAL_LABEL_TAG);
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

    // Update the state manager with current context
    labelStateManager.updateContext(camera, objectManager);

    const updateContext = this._prepareUpdateContext(camera, objectManager);

    this.elements.forEach((label) => {
      this._updateSingleLabel(label, updateContext, objectManager, camera);
    });
  }

  public override clear(): void {
    super.clear();
    // Clean up cache
    this.labelCache.clear();
  }

  /**
   * Prepares the update context with common data needed for label updates.
   */
  private _prepareUpdateContext(
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
  ) {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    const allObjects = objectManager.getLatestRenderableObjects();
    const mainStarId = Object.values(allObjects).find(
      (obj) => obj.type === CelestialType.STAR && !obj.parentId,
    )?.id;

    return {
      cameraPosition,
      allObjects,
      mainStarId,
    };
  }

  /**
   * Updates a single label with position, visibility, and formatting.
   */
  private _updateSingleLabel(
    label: CSS2DObject,
    updateContext: ReturnType<typeof this._prepareUpdateContext>,
    objectManager: ObjectManager,
    camera: THREE.PerspectiveCamera,
  ): void {
    const { cameraPosition, allObjects } = updateContext;

    const type = label.element.getAttribute(
      "data-object-type",
    ) as CelestialType;
    const objectId = label.element.getAttribute("data-object-id")!;
    const ownObject = objectManager.getObject(objectId);

    if (!ownObject) {
      label.element.toggleAttribute("visible", false);
      return;
    }

    const renderableObject = allObjects[objectId];
    if (!renderableObject) {
      return;
    }

    // Update label position
    this._updateLabelPosition(
      label,
      renderableObject,
      ownObject,
      objectManager,
    );

    // Get visibility from state manager
    const visible = labelStateManager.getComputedVisibility(objectId);

    // Update label attributes (distance, speed)
    this._updateLabelAttributes(
      label,
      renderableObject,
      ownObject,
      cameraPosition,
    );

    // Apply occlusion checking if the label would otherwise be visible
    const finalVisible =
      visible && this.isVisible
        ? this._checkLabelOcclusion(label, objectId, camera, objectManager)
        : visible;

    // Update visibility if it has changed
    this._updateLabelVisibility(label, objectId, finalVisible);
  }

  /**
   * Updates the label position if the object has moved significantly.
   */
  private _updateLabelPosition(
    label: CSS2DObject,
    renderableObject: RenderableCelestialObject,
    ownObject: THREE.Object3D,
    objectManager: ObjectManager,
  ): void {
    const newLabelPosition = this.calculateLabelPosition(
      renderableObject,
      ownObject,
      objectManager,
    );

    const cache = this.labelCache.get(renderableObject.id)!;
    if (!cache.lastPosition || !cache.lastPosition.equals(newLabelPosition)) {
      label.position.copy(newLabelPosition);
      cache.lastPosition = newLabelPosition.clone();
    }
  }

  /**
   * Updates label attributes (distance, speed) if they have changed.
   */
  private _updateLabelAttributes(
    label: CSS2DObject,
    renderableObject: RenderableCelestialObject,
    ownObject: THREE.Object3D,
    cameraPosition: THREE.Vector3,
  ): void {
    // Calculate distance from camera to object surface
    const centerDistance = cameraPosition.distanceTo(ownObject.position);

    // For solid bodies, subtract the object's radius to get distance to surface
    const solidBodyTypes = [
      CelestialType.PLANET,
      CelestialType.DWARF_PLANET,
      CelestialType.MOON,
      CelestialType.SATELLITE,
      CelestialType.ASTEROID,
    ];

    let distanceToSelf = centerDistance;
    if (
      solidBodyTypes.includes(renderableObject.type) &&
      renderableObject.realRadius_m
    ) {
      const radiusInSceneUnits =
        renderableObject.realRadius_m * (1 / AU_METERS);
      distanceToSelf = Math.max(0, centerDistance - radiusInSceneUnits);
    }

    const distanceInAu = this.sceneUnitsToAu(distanceToSelf);
    const formattedDistance = formatDistance(distanceInAu);

    let formattedSpeed = "";
    if (renderableObject.velocityMagnitude_mps !== undefined) {
      formattedSpeed = formatSpeed(renderableObject.velocityMagnitude_mps);
    }

    const cache = this.labelCache.get(renderableObject.id)!;

    if (cache.lastDistance !== formattedDistance) {
      label.element.setAttribute("data-distance-formatted", formattedDistance);
      cache.lastDistance = formattedDistance;
    }

    if (cache.lastSpeed !== formattedSpeed) {
      label.element.setAttribute("data-speed-formatted", formattedSpeed);
      cache.lastSpeed = formattedSpeed;
    }
  }

  /**
   * Checks if a label is occluded by celestial objects.
   */
  private _checkLabelOcclusion(
    label: CSS2DObject,
    objectId: string,
    camera: THREE.PerspectiveCamera,
    objectManager: ObjectManager,
  ): boolean {
    const labelWorldPosition = new THREE.Vector3();
    label.getWorldPosition(labelWorldPosition);

    const labelId = `celestial_${objectId}`;

    const isOccluded = this.isLabelOccludedOptimized(
      labelId,
      OSVector3.fromThreeJS(labelWorldPosition),
      camera,
      objectManager,
      objectId,
    );

    return !isOccluded;
  }

  /**
   * Updates label visibility if it has changed.
   */
  private _updateLabelVisibility(
    label: CSS2DObject,
    objectId: string,
    visible: boolean,
  ): void {
    const cache = this.labelCache.get(objectId)!;

    if (cache.lastVisible !== visible) {
      label.element.toggleAttribute("visible", visible);
      cache.lastVisible = visible;
    }

    this.labelCache.set(objectId, cache);
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
