import type { RendererCelestialObject } from "@teskooano/renderer-threejs-core"; // Corrected import path
import type * as THREE from "three"; // For Camera type
import type { CelestialType } from "./celestial"; // Corrected Import CelestialType

/**
 * Defines the contract for a UI component used as a celestial label.
 * The rendering system (CSS2DCelestialLabelFactory) will interact with components
 * that implement this interface.
 */
export interface ICelestialLabelComponent extends HTMLElement {
  /**
   * Updates the component with new data for the celestial object.
   * @param data - Object containing data to display (e.g., name, type, distance, custom properties).
   *               The structure of this data should be agreed upon by the factory and the component.
   *               Typically, this would be Partial<RendererCelestialObject> & { objectType?, parentName?, parentType? }
   */
  updateData: (
    data: Partial<RendererCelestialObject> & {
      objectType?: CelestialType;
      parentName?: string;
      parentType?: CelestialType;
      [key: string]: any;
    },
  ) => void;

  /**
   * Optional method to explicitly set the visibility of the component's content.
   * This is useful if the component has internal logic for showing/hiding elements
   * beyond just CSS display style.
   * @param visible - True to show, false to hide.
   */
  setVisibility?: (visible: boolean) => void;

  /**
   * Optional method for the component to determine if it should be visible
   * based on its own internal logic and the provided context (e.g., camera distance, object properties).
   * If not implemented, the CSS2DCelestialLabelFactory might use its own default visibility logic.
   * @param objectData - The data of the celestial object.
   * @param camera - The current Three.js camera.
   * @param visualObject - The Three.js Object3D the label is attached to.
   * @param parentData - Optional parent data for the celestial object.
   * @returns True if the component deems it should be visible, false otherwise.
   */
  shouldBeVisible?: (
    objectData: RendererCelestialObject,
    camera: THREE.Camera,
    visualObject: THREE.Object3D,
    parentData?: RendererCelestialObject,
  ) => boolean;
}
