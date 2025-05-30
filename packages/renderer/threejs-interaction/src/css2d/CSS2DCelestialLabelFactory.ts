import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  CelestialType,
  SCALE, // Import SCALE for AU conversion
  // StarProperties, // No longer needed here
  // StellarType, // No longer needed here
} from "@teskooano/data-types";
// import { CSS2DLayerType } from "./CSS2DLayerType"; // No longer used directly in this file
import {
  ILabelFactory,
  CelestialLabelCreationContext,
  CelestialLabelUpdateContext,
  LabelCreationContext,
  LabelUpdateContext,
} from "./ILabelFactory";
import type { ICelestialLabelComponent } from "@teskooano/data-types"; // Import the new interface

/**
 * @deprecated Use CelestialLabelCreationContext directly from ILabelFactory
 */
export type CelestialLabelFactoryContext = CelestialLabelCreationContext; // Alias for backwards compatibility

export type CelestialLabelComponentFactory = (
  initialData: Partial<RenderableCelestialObject> & {
    objectType?: CelestialType;
    parentName?: string;
    parentType?: CelestialType;
    distanceToCameraAU?: number;
    // Allow any other properties that the concrete component might expect via updateData
    [key: string]: any;
  },
) => HTMLElement & ICelestialLabelComponent; // Corrected return type

/**
 * Factory for creating and updating CSS2DObject labels specifically for celestial bodies.
 * It uses a provided componentFactoryFunction to generate the HTML content of the labels.
 */
export class CSS2DCelestialLabelFactory implements ILabelFactory {
  private camera: THREE.Camera;
  private componentFactory: CelestialLabelComponentFactory;

  constructor(
    camera: THREE.Camera,
    componentFactory: CelestialLabelComponentFactory,
  ) {
    this.camera = camera;
    this.componentFactory = componentFactory;
    if (!this.componentFactory) {
      throw new Error(
        "[CSS2DCelestialLabelFactory] A componentFactory function is required.",
      );
    }
  }

  private _getDistanceToCameraAU(objectPosition: THREE.Vector3): number {
    const distance = this.camera.position.distanceTo(objectPosition);
    return distance / SCALE.RENDER_SCALE_AU;
  }

  /**
   * Creates a new CSS2DObject for a celestial label.
   * @param context - The context containing data for the celestial object.
   * @returns A CSS2DObject or null if creation failed.
   */
  createLabel(context: LabelCreationContext): CSS2DObject | null {
    const celestialContext = context as CelestialLabelCreationContext;
    if (!celestialContext.objectData || !celestialContext.visualObject) {
      console.error(
        "[CSS2DCelestialLabelFactory] Missing objectData or visualObject in context for createLabel",
        context,
      );
      return null;
    }

    const { objectData, visualObject, parentData } = celestialContext;

    const objectWorldPosition = visualObject.getWorldPosition(
      new THREE.Vector3(),
    );
    const distanceToCameraAU = this._getDistanceToCameraAU(objectWorldPosition);

    const componentInitialData: Partial<RenderableCelestialObject> & {
      objectType?: CelestialType;
      parentName?: string;
      parentType?: CelestialType;
      distanceToCameraAU?: number;
    } = {
      ...objectData, // Spread all objectData properties
      objectType: objectData.type,
      parentName: parentData?.name,
      parentType: parentData?.type,
      distanceToCameraAU: distanceToCameraAU,
    };

    // Use the provided factory function to create the label element
    const labelElement = this.componentFactory(componentInitialData);

    if (!labelElement) {
      console.error(
        `[CSS2DCelestialLabelFactory] Component factory failed to create an element for ${objectData.name}.`,
      );
      return null;
    }

    labelElement.setAttribute("tabindex", "-1");
    labelElement.style.pointerEvents = "none";

    const label = new CSS2DObject(labelElement);
    label.name = `CSS2DLabel_${objectData.celestialObjectId}`;
    label.userData = {
      isCelestialLabel: true,
      celestialObjectId: objectData.celestialObjectId,
      factoryContext: { ...celestialContext },
    };

    this.updateLabelPosition(label, objectData, visualObject);

    const initialVisibility = this.shouldLabelBeVisible(
      objectData,
      visualObject,
      labelElement,
      parentData,
    );
    label.visible = initialVisibility;
    if (typeof (labelElement as any).setVisibility === "function") {
      (labelElement as any).setVisibility(initialVisibility);
    } else {
      labelElement.style.display = initialVisibility ? "" : "none";
    }

    if (objectData.celestialObjectId && labelElement.id === "") {
      labelElement.id = `celestial-label-${objectData.celestialObjectId}`;
    }

    return label;
  }

  /**
   * Updates an existing CSS2DObject celestial label.
   * @param label - The CSS2DObject to update.
   * @param context - The context containing new data for the celestial object.
   */
  updateLabel(label: CSS2DObject, context: LabelUpdateContext): void {
    const celestialContext = context as CelestialLabelUpdateContext;
    if (
      !celestialContext.objectData ||
      !celestialContext.visualObject ||
      !label.element
    ) {
      console.warn(
        "[CSS2DCelestialLabelFactory] Missing required data for updateLabel or label element is missing.",
        { label, context },
      );
      return;
    }

    const { objectData, visualObject, parentData } = celestialContext;

    label.userData.celestialObjectId = objectData.celestialObjectId;
    label.userData.factoryContext = { ...celestialContext };

    const labelElement = label.element as HTMLElement;

    if (typeof (labelElement as any).updateData === "function") {
      const objectWorldPosition = visualObject.getWorldPosition(
        new THREE.Vector3(),
      );
      const distanceToCameraAU =
        this._getDistanceToCameraAU(objectWorldPosition);

      const componentUpdateData: Partial<RenderableCelestialObject> & {
        objectType?: CelestialType;
        parentName?: string;
        parentType?: CelestialType;
        distanceToCameraAU?: number;
      } = {
        ...objectData,
        objectType: objectData.type,
        parentName: parentData?.name,
        parentType: parentData?.type,
        distanceToCameraAU: distanceToCameraAU,
      };
      (labelElement as any).updateData(componentUpdateData);
    } else {
      // Fallback basic update if no updateData method
      const nameEl = labelElement.querySelector(".celestial-name");
      if (nameEl) nameEl.textContent = objectData.name || "Unknown";
    }

    this.updateLabelPosition(label, objectData, visualObject);

    const currentVisibility = this.shouldLabelBeVisible(
      objectData,
      visualObject,
      labelElement,
      parentData,
    );

    if (label.visible !== currentVisibility) {
      label.visible = currentVisibility;
    }

    if (typeof (labelElement as any).setVisibility === "function") {
      (labelElement as any).setVisibility(currentVisibility);
    } else {
      labelElement.style.display = currentVisibility ? "" : "none";
    }
  }

  /**
   * Updates the position of the label relative to its 3D object.
   * @internal
   */
  private updateLabelPosition(
    label: CSS2DObject,
    objectData: RenderableCelestialObject,
    visualObject: THREE.Object3D,
  ): void {
    const radius = objectData.radius ?? 1;
    const offsetFactor = objectData.type === CelestialType.STAR ? 1.1 : 1.5; // Closer for stars
    const offset = new THREE.Vector3(0, radius * offsetFactor, 0);
    label.position.copy(offset);
  }

  /**
   * Determines if a label should be visible based on object data and camera.
   * @internal
   */
  private shouldLabelBeVisible(
    objectData: RenderableCelestialObject,
    visualObject: THREE.Object3D,
    labelElement: HTMLElement,
    parentData?: RenderableCelestialObject,
  ): boolean {
    if (!visualObject.visible) {
      // Basic check: if 3D object isn't visible, label shouldn't be.
      return false;
    }

    // Delegate to component if it has a more sophisticated visibility check
    if (typeof (labelElement as any).shouldBeVisible === "function") {
      // Pass necessary context for the component to decide
      return (labelElement as any).shouldBeVisible(
        objectData,
        this.camera,
        visualObject,
      );
    }

    // Fallback to always visible if the component doesn't provide its own logic
    // and the parent 3D object is visible.
    // More complex generic logic (like distance culling) could be added here if needed
    // as a default when the component doesn't specify.
    return true;
  }
}
