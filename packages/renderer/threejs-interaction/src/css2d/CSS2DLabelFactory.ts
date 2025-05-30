import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { CelestialType, SCALE } from "@teskooano/data-types";
import type { OortCloudProperties } from "@teskooano/data-types";
import { CSS2DLayerType } from "./CSS2DLayerType";
import type {
  ILabelFactory,
  LabelCreationContext,
  LabelUpdateContext,
} from "./ILabelFactory";

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
 * A generic factory for creating simple CSS2DObject labels.
 * This can be used for markers, annotations, or other non-celestial UI elements in 2D space.
 */
export class CSS2DLabelFactory implements ILabelFactory {
  constructor() {
    // Constructor might take general configuration options in the future
  }

  /**
   * Creates a generic CSS2DObject label.
   * The context should provide an `id` and `elementContent` (which can be an HTMLElement or string).
   * An optional `position` (THREE.Vector3) can be provided for initial placement.
   */
  createLabel(context: LabelCreationContext): CSS2DObject | null {
    if (!context.id || context.elementContent === undefined) {
      console.error(
        "[CSS2DLabelFactory] Missing id or elementContent in context for createLabel",
        context,
      );
      return null;
    }

    let labelElement: HTMLElement;
    if (typeof context.elementContent === "string") {
      labelElement = document.createElement("div");
      labelElement.textContent = context.elementContent;
      // Apply some default styling for string content
      labelElement.style.padding = "2px 5px";
      labelElement.style.background = "rgba(0,0,0,0.6)";
      labelElement.style.color = "white";
      labelElement.style.borderRadius = "3px";
      labelElement.style.fontSize = "12px";
    } else if (context.elementContent instanceof HTMLElement) {
      labelElement = context.elementContent;
    } else {
      console.error(
        "[CSS2DLabelFactory] elementContent must be a string or HTMLElement",
        context,
      );
      return null;
    }

    labelElement.id = labelElement.id || `css2d-label-${context.id}`;
    labelElement.setAttribute("tabindex", "-1");
    labelElement.style.pointerEvents = "auto"; // Generic labels might be interactive

    const label = new CSS2DObject(labelElement);
    label.name = `CSS2DLabel_${context.id}`;
    if (context.position && context.position instanceof THREE.Vector3) {
      label.position.copy(context.position);
    }

    // Store any additional userData passed in context
    if (context.userData) {
      label.userData = { ...label.userData, ...context.userData };
    }
    label.userData.labelId = context.id;

    return label;
  }

  /**
   * Updates an existing generic CSS2DObject label.
   * The context can provide `elementContent` to replace the label's HTML element
   * or other properties to update specific parts if the labelElement has corresponding methods/attributes.
   */
  updateLabel(label: CSS2DObject, context: LabelUpdateContext): void {
    if (!label.element) {
      console.warn(
        "[CSS2DLabelFactory] Cannot update label, element is missing.",
        label,
      );
      return;
    }

    if (context.elementContent !== undefined) {
      if (typeof context.elementContent === "string") {
        label.element.textContent = context.elementContent;
      } else if (context.elementContent instanceof HTMLElement) {
        // Replace the entire element if a new one is provided
        // This is a simple replacement; more sophisticated updates would require knowledge of the element's structure
        if (label.element.parentNode) {
          label.element.parentNode.replaceChild(
            context.elementContent,
            label.element,
          );
        }
        (label as any).element = context.elementContent; // Update the reference in CSS2DObject
        // Ensure new element has required attributes
        context.elementContent.setAttribute("tabindex", "-1");
        context.elementContent.style.pointerEvents = "auto";
        if (context.id) {
          context.elementContent.id =
            context.elementContent.id || `css2d-label-${context.id}`;
        }
      } else {
        console.warn(
          "[CSS2DLabelFactory] Invalid elementContent type for updateLabel.",
        );
      }
    }

    if (context.position && context.position instanceof THREE.Vector3) {
      label.position.copy(context.position);
    }

    // Update any additional userData passed in context
    if (context.userData) {
      label.userData = { ...label.userData, ...context.userData };
    }
  }

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
    const labelDiv = document.createElement("div");
    labelDiv.className = "au-marker-label";
    labelDiv.textContent = `${auValue} AU`;
    // Basic styling, can be externalized to CSS
    labelDiv.style.color = "#ccc";
    labelDiv.style.fontSize = "10px";
    labelDiv.style.padding = "1px 3px";
    labelDiv.style.backgroundColor = "rgba(0,0,0,0.5)";
    labelDiv.style.borderRadius = "2px";
    labelDiv.style.pointerEvents = "none"; // AU markers are not interactive

    const creationContext: LabelCreationContext = {
      id: `au-marker-${id}`,
      elementContent: labelDiv,
      position: position,
      userData: { isAuMarkerLabel: true, auValue: auValue },
    };

    return this.createLabel(creationContext)!; // Assuming createLabel doesn't return null here
  }
}
