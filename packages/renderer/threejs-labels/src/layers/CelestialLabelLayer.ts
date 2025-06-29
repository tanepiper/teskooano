import * as THREE from "three";
import { BaseLabelLayer, UIRegistryComponent } from "./BaseLabelLayer";
import {
  type RenderableCelestialObject,
  CelestialType,
  AU_METERS,
} from "@teskooano/data-types";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {
  CELESTIAL_LABEL_TAG,
  CelestialLabelComponent,
} from "../components/celestial-label/CelestialLabelComponent";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";

export interface LabelVisibilityConfig {
  planet?: number;
  gasGiant?: number;
  moon?: number;
  ejectedMoon?: number;
  secondaryStar?: number;
  default?: number;
}

export class CelestialLabelLayer extends BaseLabelLayer {
  private visibilityConfig: Required<LabelVisibilityConfig>;

  constructor(config: LabelVisibilityConfig = {}) {
    super();
    this.visibilityConfig = {
      planet: 90,
      gasGiant: 190,
      moon: 2,
      ejectedMoon: 2000,
      secondaryStar: 3000,
      default: 2,
      ...config,
    };
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

  public createLabel(
    object: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
  ): void {
    const objectId = object.celestialObjectId;
    if (this.elements.has(objectId)) {
      return;
    }

    const labelElement = document.createElement(CELESTIAL_LABEL_TAG);
    labelElement.setAttribute("data-name", object.name);
    // Store metadata for the update logic
    labelElement.setAttribute("data-object-id", objectId);
    labelElement.setAttribute("data-object-type", object.type);
    if (object.parentId) {
      labelElement.setAttribute("data-parent-id", object.parentId);
    }

    const label = new CSS2DObject(labelElement);
    label.position.copy(this.calculateLabelPosition(object));

    parentMesh.add(label);

    this.elements.set(objectId, label);
  }

  public override update(
    camera: THREE.Camera,
    centralBody?: THREE.Object3D,
    objectManager?: ObjectManager,
  ): void {
    if (!objectManager) {
      return;
    }
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    const config = this._getLabelVisibilityConfig();
    const allObjects = objectManager.getLatestRenderableObjects();
    const mainStarId = Object.values(allObjects).find(
      (obj) => obj.type === CelestialType.STAR && !obj.parentId,
    )?.celestialObjectId;

    this.elements.forEach((label) => {
      const type = label.element.getAttribute(
        "data-object-type",
      ) as CelestialType;
      const objectId = label.element.getAttribute("data-object-id")!;
      const ownObject = objectManager.getObject(objectId);

      let visible = false;

      if (!ownObject) {
        label.element.toggleAttribute("visible", false);
        return;
      }

      const distanceToSelf = cameraPosition.distanceTo(ownObject.position);
      const distanceInAu = this.sceneUnitsToAu(distanceToSelf);
      const formattedDistance = this._formatDistance(distanceInAu);
      label.element.setAttribute("data-distance-formatted", formattedDistance);

      switch (type) {
        case CelestialType.STAR: {
          if (objectId === mainStarId) {
            visible = true;
          } else {
            // It's a secondary star, apply distance check
            visible = distanceToSelf < config.secondaryStar;
          }
          break;
        }

        case CelestialType.PLANET: {
          visible = distanceToSelf < config.planet;
          break;
        }
        case CelestialType.GAS_GIANT: {
          visible = distanceToSelf < config.gasGiant;
          break;
        }

        case CelestialType.MOON: {
          const parentId = label.element.getAttribute("data-parent-id")!;
          const allObjects = objectManager.getLatestRenderableObjects();
          const parentData = allObjects[parentId];
          const parentObject = objectManager.getObject(parentId);

          if (parentObject && parentData) {
            if (
              [CelestialType.PLANET, CelestialType.GAS_GIANT].includes(
                parentData.type,
              )
            ) {
              // Rule: Visible if camera is close to the PARENT planet.
              const distanceToParent = cameraPosition.distanceTo(
                parentObject.position,
              );
              visible = distanceToParent < config.moon;
            } else if (parentData.type === CelestialType.STAR) {
              // Rule: Ejected moon, visible if camera is close to the MOON itself.
              visible = distanceToSelf < config.ejectedMoon;
            }
          }
          break;
        }
        default: {
          // Rule: Default for all other objects.
          visible = distanceToSelf < config.default;
        }
      }
      label.element.toggleAttribute("visible", visible);
    });
  }

  /**
   * Formats a distance value into a human-readable string with appropriate units.
   * @param distanceInAu - The distance in Astronomical Units.
   * @returns A formatted string (e.g., "(1.23 AU)", "(500.00 km)").
   */
  private _formatDistance(distanceInAu: number): string {
    if (distanceInAu > 0.5) {
      return `${distanceInAu.toFixed(2)} AU`;
    }

    const distanceInMeters = distanceInAu * AU_METERS;
    const MEGAMETER = 1_000_000;
    const KILOMETER = 1_000;

    if (distanceInMeters >= MEGAMETER) {
      return `${(distanceInMeters / MEGAMETER).toFixed(2)} Mm`;
    }
    if (distanceInMeters >= KILOMETER) {
      return `${(distanceInMeters / KILOMETER).toFixed(2)} km`;
    }
    return `${distanceInMeters.toFixed(2)} m`;
  }

  /**
   * Defines the visibility rules for different celestial object types.
   * @returns An object with distance thresholds in scene units.
   */
  private _getLabelVisibilityConfig() {
    return {
      planet: this.auToSceneUnits(this.visibilityConfig.planet),
      gasGiant: this.auToSceneUnits(this.visibilityConfig.gasGiant),
      moon: this.auToSceneUnits(this.visibilityConfig.moon),
      ejectedMoon: this.auToSceneUnits(this.visibilityConfig.ejectedMoon),
      secondaryStar: this.auToSceneUnits(this.visibilityConfig.secondaryStar),
      default: this.auToSceneUnits(this.visibilityConfig.default),
    };
  }

  private calculateLabelPosition(
    object: RenderableCelestialObject,
  ): THREE.Vector3 {
    const visualRadius = object.radius || 1;
    return new THREE.Vector3(0, visualRadius * 1.5, 0);
  }
}
