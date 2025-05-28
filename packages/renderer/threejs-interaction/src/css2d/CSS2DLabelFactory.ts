import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { CelestialType, SCALE } from "@teskooano/data-types";
import type { OortCloudProperties } from "@teskooano/data-types";
import { CSS2DLayerType } from "./CSS2DLayerType";

/**
 * Options for creating a positioned label.
 */
export interface PositionedLabelOptions {
  className?: string;
  color?: string;
  backgroundColor?: string;
  padding?: string;
  borderRadius?: string;
  fontSize?: string;
  pointerEvents?: string;
  whiteSpace?: string;
  layerType: CSS2DLayerType; // Made mandatory
  id?: string;
}

/**
 * Factory class for creating CSS2DObject labels.
 */
export class CSS2DLabelFactory {
  /**
   * Create a generic positioned label.
   */
  public createPositionedLabel(
    text: string,
    position: THREE.Vector3,
    options: PositionedLabelOptions,
  ): CSS2DObject {
    const labelDiv = document.createElement("div");
    labelDiv.className = options.className || "css2d-label"; // Default class
    labelDiv.textContent = text;
    labelDiv.style.color = options.color || "white";
    labelDiv.style.backgroundColor =
      options.backgroundColor || "rgba(0,0,0,0.5)";
    labelDiv.style.padding = options.padding || "2px 5px";
    labelDiv.style.borderRadius = options.borderRadius || "3px";
    labelDiv.style.fontSize = options.fontSize || "12px";
    labelDiv.style.pointerEvents = options.pointerEvents || "none";
    if (options.whiteSpace) {
      labelDiv.style.whiteSpace = options.whiteSpace;
    }

    const label = new CSS2DObject(labelDiv);
    label.position.copy(position);
    // The label is initially visible; LayerManager will control its HTMLElement's display style
    label.visible = true;

    return label;
  }

  /**
   * Determine label position for a celestial object.
   */
  private calculateCelestialLabelPosition(
    object: RenderableCelestialObject,
  ): THREE.Vector3 {
    if (
      object.type === CelestialType.OORT_CLOUD &&
      object.properties?.type === CelestialType.OORT_CLOUD
    ) {
      const oortCloudProps = object.properties as OortCloudProperties;
      const innerRadiusAU = oortCloudProps.innerRadiusAU;
      if (innerRadiusAU && typeof innerRadiusAU === "number") {
        const scaledInnerRadius = innerRadiusAU * SCALE.RENDER_SCALE_AU;
        const direction = new THREE.Vector3(0.7, 0.7, 0).normalize();
        return direction.multiplyScalar(scaledInnerRadius);
      } else {
        // Default position if Oort cloud radius is not defined
        return new THREE.Vector3(
          100 * SCALE.RENDER_SCALE_AU,
          100 * SCALE.RENDER_SCALE_AU,
          0,
        );
      }
    } else {
      const visualRadius = object.radius || 1; // Use a default if radius is not defined
      return new THREE.Vector3(0, visualRadius * 1.5, 0); // Position above the object
    }
  }

  /**
   * Create a label specifically for a celestial object.
   */
  public createCelestialLabel(object: RenderableCelestialObject): CSS2DObject {
    const labelPosition = this.calculateCelestialLabelPosition(object);
    return this.createPositionedLabel(object.name, labelPosition, {
      className: "celestial-label",
      layerType: CSS2DLayerType.CELESTIAL_LABELS,
      id: object.celestialObjectId,
    });
  }

  /**
   * Creates a label for an AU distance marker circle.
   */
  public createAuMarkerLabel(
    id: string,
    auValue: number,
    position: THREE.Vector3,
  ): CSS2DObject {
    return this.createPositionedLabel(`${auValue} AU`, position, {
      className: "au-marker-label",
      color: "#FFA500", // Orange color for AU markers
      backgroundColor: "rgba(0,0,0,0.6)",
      padding: "1px 4px",
      borderRadius: "2px",
      fontSize: "10px",
      whiteSpace: "nowrap",
      layerType: CSS2DLayerType.AU_MARKERS,
      id: id,
    });
  }
}
