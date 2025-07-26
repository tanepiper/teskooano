import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { BaseLabelLayer, UIRegistryComponent } from "./BaseLabelLayer";
import {
  type RenderableCelestialObject,
  CelestialType,
  AU_METERS,
  SCALE,
} from "@teskooano/data-types";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer";
import {
  CELESTIAL_LABEL_TAG,
  CelestialLabelComponent,
} from "../components/celestial-label/CelestialLabelComponent";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";

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

/**
 * Calculates the distance from a point to the surface of a celestial object.
 * For solid bodies (planets, moons, etc.), this subtracts the object's radius.
 * For stars and other gaseous bodies, this returns the distance to the center.
 * @param fromPosition The position to measure from (e.g., camera position)
 * @param toPosition The position of the celestial object's center
 * @param objectRadius The radius of the celestial object in meters
 * @param objectType The type of celestial object
 * @returns The distance to the surface (or center for stars) in scene units
 */
function calculateSurfaceDistance(
  fromPosition: THREE.Vector3,
  toPosition: THREE.Vector3,
  objectRadius: number,
  objectType: CelestialType,
): number {
  const centerDistance = fromPosition.distanceTo(toPosition);

  // For all solid bodies, subtract the radius to get surface distance
  // This includes planets, moons, satellites, comets, etc.
  const solidBodyTypes = [
    CelestialType.PLANET,
    CelestialType.DWARF_PLANET,
    CelestialType.MOON,
    CelestialType.SATELLITE,
    CelestialType.COMET,
    CelestialType.ASTEROID_FIELD,
    CelestialType.OORT_CLOUD,
    CelestialType.ASTEROID, // Add ASTEROID to solid body types
  ];

  if (solidBodyTypes.includes(objectType) && objectRadius > 0) {
    // Convert radius from meters to scene units
    const radiusInSceneUnits = objectRadius * (1 / AU_METERS);
    return Math.max(0, centerDistance - radiusInSceneUnits);
  }

  // For stars and gas giants (no solid surface), use center distance
  return centerDistance;
}

export class CelestialLabelLayer extends BaseLabelLayer {
  private visibilityConfig: Required<LabelVisibilityConfig>;
  private labelCache = new Map<
    string,
    {
      lastDistance: string;
      lastSpeed: string;
      lastVisible: boolean;
      lastPosition?: THREE.Vector3; // Add caching for last position
    }
  >();

  // Pre-allocated vectors for performance in calculateLabelPosition
  private _tempPos1 = new THREE.Vector3();
  private _tempPos2 = new THREE.Vector3();

  /** Group for all celestial labels to manage visibility and organization */
  private celestialLabelsGroup: THREE.Group;

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
      asteroid: config.asteroid ?? 100, // Increase asteroid visibility to 100 AU for practical viewing
    };

    // Create a dedicated group for all celestial labels
    this.celestialLabelsGroup = new THREE.Group();
    this.celestialLabelsGroup.name = "GROUP_CELESTIAL_LABELS";
    if (this.scene) {
      this.scene.add(this.celestialLabelsGroup);
    }
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
    labelElement.setAttribute("data-object-id", object.celestialObjectId);
    labelElement.setAttribute("data-object-type", object.type);
    labelElement.setAttribute("data-name", object.name);
    if (object.parentId) {
      labelElement.setAttribute("data-parent-id", object.parentId);
    }

    const css2dObject = new CSS2DObject(labelElement);
    css2dObject.name = `celestial-label-${object.celestialObjectId}`;
    css2dObject.position.copy(this.calculateLabelPosition(object, parentMesh));

    this.celestialLabelsGroup.add(css2dObject);
    this.elements.set(object.celestialObjectId, css2dObject);

    // Initialize cache for this label
    this.labelCache.set(object.celestialObjectId, {
      lastDistance: "",
      lastSpeed: "",
      lastVisible: false,
      lastPosition: css2dObject.position.clone(), // Cache initial position
    });
  }

  public override update(
    camera: THREE.Camera,
    centralBody: OSVector3, // Not used by celestial labels
    objectManager: ObjectManager,
  ): void {
    // Call parent update for throttling
    super.update(camera, centralBody, objectManager);

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

      // Update label position to follow the celestial object ONLY IF it has moved significantly
      const renderableObject = allObjects[objectId];
      if (renderableObject) {
        const newLabelPosition = this.calculateLabelPosition(
          renderableObject,
          ownObject,
          objectManager,
        );

        const cache = this.labelCache.get(objectId)!;
        if (
          !cache.lastPosition ||
          !cache.lastPosition.equals(newLabelPosition)
        ) {
          label.position.copy(newLabelPosition);
          cache.lastPosition = newLabelPosition.clone(); // Update cached position
        }
      }

      // For label distance, measure from camera to object's surface
      // This gives the actual distance the user would experience
      const centerDistance = cameraPosition.distanceTo(ownObject.position);

      // For solid bodies, subtract the object's radius to get distance to surface
      // For stars, gas giants, and comets, use center distance (no meaningful surface for comets)
      const solidBodyTypes = [
        CelestialType.PLANET,
        CelestialType.DWARF_PLANET,
        CelestialType.MOON,
        CelestialType.SATELLITE,
        CelestialType.ASTEROID, // Include ASTEROID for surface distance calculation
      ];

      let distanceToSelf = centerDistance;
      if (solidBodyTypes.includes(type) && renderableObject?.realRadius_m) {
        // Convert radius from meters to scene units and subtract from center distance
        const radiusInSceneUnits =
          renderableObject.realRadius_m * (1 / AU_METERS);
        distanceToSelf = Math.max(0, centerDistance - radiusInSceneUnits);
      }
      const distanceInAu = this.sceneUnitsToAu(distanceToSelf);
      const formattedDistance = this._formatDistance(distanceInAu);

      // Calculate and format speed
      let formattedSpeed = "";
      if (renderableObject?.velocityMagnitude_mps !== undefined) {
        const speed = renderableObject.velocityMagnitude_mps; // Raw velocity in m/s
        formattedSpeed = this._formatSpeed(speed);
      }

      // Get cached values for this label (re-fetch as it might have been updated above for lastPosition)
      const cache = this.labelCache.get(objectId)!;

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

        case CelestialType.COMET: {
          visible = distanceToSelf < config.comet;
          break;
        }

        case CelestialType.PLANET: {
          visible = distanceToSelf < config.planet;
          break;
        }

        case CelestialType.DWARF_PLANET: {
          visible = distanceToSelf < config.planet;
          break;
        }

        case CelestialType.ASTEROID: {
          visible = distanceToSelf < config.asteroid;
          break;
        }

        case CelestialType.SATELLITE: {
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
              const parentCenterDistance = cameraPosition.distanceTo(
                parentObject.position,
              );
              const parentRadiusInSceneUnits =
                parentData.realRadius_m * (1 / AU_METERS);
              const distanceToParent = Math.max(
                0,
                parentCenterDistance - parentRadiusInSceneUnits,
              );
              visible = distanceToParent < config.satellite;
            } else if (parentData.type === CelestialType.STAR) {
              // Rule: Ejected moon, visible if camera is close to the MOON itself.
              visible = true;
            }
          } else {
            visible = true;
          }
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
              const parentCenterDistance = cameraPosition.distanceTo(
                parentObject.position,
              );
              const parentRadiusInSceneUnits =
                parentData.realRadius_m * (1 / AU_METERS);
              const distanceToParent = Math.max(
                0,
                parentCenterDistance - parentRadiusInSceneUnits,
              );
              visible = distanceToParent < config.moon;
            } else if (parentData.type === CelestialType.STAR) {
              // Rule: Ejected moon, visible if camera is close to the MOON itself.
              visible = distanceToSelf < config.ejectedMoon;
            }
          }
          break;
        }
        case CelestialType.ASTEROID_FIELD:
        case CelestialType.OORT_CLOUD: {
          // These objects typically don't have labels, or are handled differently.
          // Explicitly set to false to avoid displaying labels for them.
          visible = false;
          break;
        }
        default: {
          // Rule: Default for all other objects.
          visible = distanceToSelf < config.default;
        }
      }

      // Apply occlusion checking if the label would otherwise be visible
      if (visible && this.isVisible) {
        // Get the label's world position
        const labelWorldPosition = new THREE.Vector3();
        label.getWorldPosition(labelWorldPosition);

        // Generate a unique ID for this label
        const labelId = `celestial_${objectId}`;

        // Check if the label is occluded by celestial objects
        const isOccluded = this.isLabelOccludedOptimized(
          labelId,
          OSVector3.fromThreeJS(labelWorldPosition),
          camera,
          objectManager,
          objectId,
        );

        if (isOccluded) {
          visible = false;
        }
      }

      // Only update visibility if it has changed
      if (cache.lastVisible !== visible) {
        label.element.toggleAttribute("visible", visible);
        cache.lastVisible = visible;
      }

      // Update cache
      this.labelCache.set(objectId, cache);
    });
  }

  public override clear(): void {
    super.clear();
    // Clean up cache
    this.labelCache.clear();
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

  /**
   * Defines the visibility rules for different celestial object types.
   * @returns An object with distance thresholds in scene units.
   */
  private _getLabelVisibilityConfig() {
    return {
      planet: this.auToSceneUnits(this.visibilityConfig.planet),
      gasGiant: this.auToSceneUnits(this.visibilityConfig.gasGiant),
      comet: this.auToSceneUnits(this.visibilityConfig.comet),
      moon: this.auToSceneUnits(this.visibilityConfig.moon),
      ejectedMoon: this.auToSceneUnits(this.visibilityConfig.ejectedMoon),
      secondaryStar: this.auToSceneUnits(this.visibilityConfig.secondaryStar),
      default: this.auToSceneUnits(this.visibilityConfig.default),
      satellite: this.auToSceneUnits(this.visibilityConfig.satellite),
      ejectedSatellite: this.auToSceneUnits(
        this.visibilityConfig.ejectedSatellite,
      ),
      asteroid: this.auToSceneUnits(this.visibilityConfig.asteroid), // Add asteroid visibility config
    };
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
