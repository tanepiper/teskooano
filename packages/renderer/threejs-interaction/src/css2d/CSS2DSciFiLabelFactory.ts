import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { CelestialType, SCALE } from "@teskooano/data-types"; // Assuming you might need these
import { CSS2DLayerType } from "./CSS2DLayerType";
import { SciFiLabelComponent, SciFiLabelMode } from "./SciFiLabelComponent"; // Import the new Web Component

// --- Configuration Constants for LOD ---
const MAX_LABEL_DISTANCE_AU = 50; // Hide labels beyond this distance (e.g., 50 AU)
const CLOSE_ZOOM_DISTANCE_THRESHOLD_AU = 0.5; // Show full label when closer than this (e.g., 0.5 AU)
const MINIMAL_LABEL_DISTANCE_THRESHOLD_AU = 10; // Show minimal label between close and this distance (e.g., 10 AU)
// Labels beyond MINIMAL_LABEL_DISTANCE_THRESHOLD_AU (up to MAX_LABEL_DISTANCE_AU) could be hidden or minimal based on focus.

export interface SciFiLabelFactoryContext {
  objectData: RenderableCelestialObject;
  visualObject: THREE.Object3D;
  parentData?: RenderableCelestialObject; // For moons, their parent object
  // isFocused is assumed to be on RenderableCelestialObject
  // isParentFocused would be parentData.isFocused
}

/**
 * Factory class for creating context-aware "sci-fi" CSS2DObject labels.
 */
export class CSS2DSciFiLabelFactory {
  private camera: THREE.Camera;

  constructor(camera: THREE.Camera) {
    this.camera = camera;
  }

  /**
   * Calculates the distance from the camera to the object in AU.
   */
  private calculateDistanceToCameraAU(objectPosition: THREE.Vector3): number {
    const distance = this.camera.position.distanceTo(objectPosition);
    return distance / SCALE.RENDER_SCALE_AU;
  }

  private determineLabelState(
    context: SciFiLabelFactoryContext,
    distanceAU: number,
  ): {
    visible: boolean;
    mode: SciFiLabelMode;
    name: string;
    type: string | null;
    distanceDisplay: number | null;
  } {
    const { objectData, parentData } = context;
    let visible = true;
    let mode: SciFiLabelMode = "full"; // Default to full, will be adjusted
    const name = objectData.name;
    let typeName: string | null = objectData.type || "Unknown"; // Renamed to avoid conflict with CelestialType enum
    let distanceDisplay: number | null = distanceAU;

    const isMajorBody =
      objectData.type === CelestialType.STAR ||
      objectData.type === CelestialType.PLANET ||
      objectData.type === CelestialType.GAS_GIANT ||
      objectData.type === CelestialType.DWARF_PLANET;

    if (isMajorBody) {
      visible = true; // Major bodies are always considered visible by this function.
      // Actual visibility is controlled by layer toggle elsewhere.
      const isObjectFocused = objectData.isFocused === true;
      if (isObjectFocused) {
        // Focused major body: full if close, minimal otherwise
        mode =
          distanceAU <= CLOSE_ZOOM_DISTANCE_THRESHOLD_AU ? "full" : "minimal";
      } else {
        // Non-focused major body: full if close, minimal otherwise (always visible)
        mode =
          distanceAU <= CLOSE_ZOOM_DISTANCE_THRESHOLD_AU ? "full" : "minimal";
      }
    } else if (objectData.type === CelestialType.MOON) {
      // Moon-specific logic:
      const isMoonFocused = objectData.isFocused === true;
      const isParentStar = parentData?.type === CelestialType.STAR;
      const isParentFocused = parentData?.isFocused === true;

      if (isMoonFocused) {
        visible = true;
        mode =
          distanceAU <= CLOSE_ZOOM_DISTANCE_THRESHOLD_AU ? "full" : "minimal";
      } else if (isParentFocused) {
        if (distanceAU <= CLOSE_ZOOM_DISTANCE_THRESHOLD_AU) {
          visible = true;
          mode = "full";
        } else if (distanceAU <= MINIMAL_LABEL_DISTANCE_THRESHOLD_AU) {
          visible = true;
          mode = "minimal";
        } else {
          visible = false; // Parent focused, but moon too far for even minimal label
        }
      } else if (isParentStar) {
        // Ejected moon scenario
        // Show minimal if close, otherwise hide
        if (distanceAU <= CLOSE_ZOOM_DISTANCE_THRESHOLD_AU) {
          visible = true;
          mode = "minimal";
        } else {
          visible = false;
        }
      } else {
        // Default for unfocused moons with non-star, unfocused parents: hide
        visible = false;
      }

      // Apply MAX_LABEL_DISTANCE_AU culling specifically for moons if they are still considered visible
      if (visible && distanceAU > MAX_LABEL_DISTANCE_AU) {
        visible = false;
      }
    } else {
      // Logic for other celestial types (e.g., asteroids, comets, etc., if they get labels)
      // Start with general distance culling for these other types
      if (distanceAU > MAX_LABEL_DISTANCE_AU) {
        visible = false;
      }

      if (visible) {
        // If not culled by distance, determine mode
        const isObjectFocused = objectData.isFocused === true;
        if (isObjectFocused) {
          // Focused other type: full if close, minimal otherwise
          mode =
            distanceAU <= CLOSE_ZOOM_DISTANCE_THRESHOLD_AU ? "full" : "minimal";
        } else {
          // Non-focused other type:
          if (distanceAU <= CLOSE_ZOOM_DISTANCE_THRESHOLD_AU) {
            mode = "full";
          } else if (distanceAU <= MINIMAL_LABEL_DISTANCE_THRESHOLD_AU) {
            mode = "minimal";
          } else {
            visible = false; // Too far and not focused for these other types
          }
        }
      }
    }

    // If minimal mode, nullify type for the component's display
    // Distance is now shown in minimal mode, so we don't nullify distanceDisplay
    if (mode === "minimal") {
      typeName = null;
      // distanceDisplay = null; // Removed this line to keep distance in minimal mode
    }

    return { visible, mode, name, type: typeName, distanceDisplay };
  }

  /**
   * Create a sci-fi label for a celestial object.
   * @param context The context for the celestial object.
   */
  public createCelestialSciFiLabel(
    context: SciFiLabelFactoryContext,
  ): CSS2DObject | null {
    const { objectData, visualObject } = context;
    const objectWorldPosition = new THREE.Vector3();
    visualObject.getWorldPosition(objectWorldPosition);
    const distanceAU = this.calculateDistanceToCameraAU(objectWorldPosition);

    const state = this.determineLabelState(context, distanceAU);

    // if (!state.visible) {
    //   return null; // Or return a hidden label that can be updated
    // }

    const labelComponent = new SciFiLabelComponent();
    labelComponent.updateData(
      state.name,
      state.type,
      state.distanceDisplay,
      state.mode,
    );
    labelComponent.setVisibility(state.visible);

    const label = new CSS2DObject(labelComponent);
    const visualRadius = objectData.radius || 1;
    const offsetPosition = new THREE.Vector3(0, visualRadius * 1.5, 0);
    label.position.copy(offsetPosition);

    // CSS2DObject.visible also controls rendering, along with component's internal style
    label.visible = state.visible;

    label.userData = {
      layerType: CSS2DLayerType.CELESTIAL_LABELS,
      isSciFiLabel: true,
      celestialObjectId: objectData.celestialObjectId,
      // Store context for updates if needed, or re-evaluate fully in update
      factoryContext: context,
    };

    if (objectData.celestialObjectId) {
      labelComponent.id = `scifi-label-${objectData.celestialObjectId}`;
    }
    return label;
  }

  public updateSciFiLabel(labelObject: CSS2DObject) {
    if (
      !(labelObject.element instanceof SciFiLabelComponent) ||
      !labelObject.userData.factoryContext
    ) {
      // console.warn("Attempted to update a non-SciFiLabelComponent label or label without context.");
      return;
    }

    const component = labelObject.element as SciFiLabelComponent;
    const context = labelObject.userData
      .factoryContext as SciFiLabelFactoryContext;
    const { visualObject } = context;

    const objectWorldPosition = new THREE.Vector3();
    visualObject.getWorldPosition(objectWorldPosition);
    const distanceAU = this.calculateDistanceToCameraAU(objectWorldPosition);

    // Re-determine state based on current distance and potentially updated context
    // (e.g. if focus changed on objects, context in userData should be the latest)
    const state = this.determineLabelState(context, distanceAU);

    component.updateData(
      state.name,
      state.type,
      state.distanceDisplay,
      state.mode,
    );
    component.setVisibility(state.visible);
    labelObject.visible = state.visible; // Also update CSS2DObject visibility
  }
}
