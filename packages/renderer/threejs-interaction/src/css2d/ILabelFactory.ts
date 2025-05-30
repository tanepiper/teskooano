import type * as THREE from "three";
import type { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

// Context for creating any label
export interface LabelCreationContext {
  id: string; // Unique ID for the label
  // Common properties - specific factories will extend or interpret this
  [key: string]: any;
}

// Context for creating specifically celestial labels
export interface CelestialLabelCreationContext extends LabelCreationContext {
  objectData: RenderableCelestialObject;
  visualObject: THREE.Object3D; // The 3D object this label is attached to
  parentData?: RenderableCelestialObject; // Optional: parent celestial object data (e.g., for moons)
}

// Context for updating any label
export interface LabelUpdateContext {
  // Common properties - specific factories will extend or interpret this
  [key: string]: any;
}

// Context for updating specifically celestial labels
export interface CelestialLabelUpdateContext extends LabelUpdateContext {
  objectData: RenderableCelestialObject;
  visualObject: THREE.Object3D;
  parentData?: RenderableCelestialObject;
}

export interface ILabelFactory {
  /**
   * Creates a new CSS2DObject label.
   * @param context - The context required to create the label.
   * @returns A CSS2DObject or null if creation failed.
   */
  createLabel(context: LabelCreationContext): CSS2DObject | null;

  /**
   * Updates an existing CSS2DObject label.
   * @param label - The label to update.
   * @param context - The context containing data for the update.
   */
  updateLabel?(label: CSS2DObject, context: LabelUpdateContext): void;
}
