import * as THREE from "three";
import { BaseLabelLayer, VisibilityLevel } from "./BaseLabelLayer";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { AU_MARKER_LABEL_TAG } from "../components/au-marker-label/AuMarkerLabelComponent";

export class AuMarkerLabelLayer extends BaseLabelLayer {
  public createLabel(
    id: string,
    auValue: number,
    position: THREE.Vector3,
    color: string,
  ): void {
    if (this.elements.has(id)) {
      console.warn(
        `[AuMarkerLabelLayer] Label already exists for ${id}. Skipping creation.`,
      );
      return;
    }

    const labelElement = document.createElement(AU_MARKER_LABEL_TAG);
    // Store the AU value in scene units for direct comparison later.
    const auValueInSceneUnits = this.auToSceneUnits(auValue);
    labelElement.setAttribute("data-au-value", auValueInSceneUnits.toString());
    labelElement.setAttribute("data-au-display-value", auValue.toString());
    labelElement.setAttribute("data-color", color);

    const css2dObject = new CSS2DObject(labelElement);
    css2dObject.position.copy(position);

    this.scene.add(css2dObject);

    this.elements.set(id, css2dObject);
    // The component's visibility is now controlled by the 'visible' attribute for animations.
    // label.visible = this.isVisible;
  }

  public override update(
    camera: THREE.Camera,
    centralBody?: THREE.Object3D,
  ): void {
    if (!centralBody || !this.isVisible) {
      return;
    }

    const sceneLevels = this._getSceneVisibilityLevels();
    const valueSelector = (element: HTMLElement) =>
      parseFloat(element.getAttribute("data-au-value") || "0");

    this.updateVisibilityFromLevels(
      camera,
      centralBody,
      sceneLevels,
      valueSelector,
    );
  }

  /**
   * Pre-calculates the camera distance and label value thresholds in scene units.
   * @returns An array of visibility levels with values in scene units.
   */
  private _getSceneVisibilityLevels(): VisibilityLevel[] {
    const visibilityLevels = [
      {
        cameraDistAU: 5000,
        minLabelAU: 1000,
      },
      {
        cameraDistAU: 2000,
        minLabelAU: 200,
      },
      {
        cameraDistAU: 600,
        minLabelAU: 100,
      },
      {
        cameraDistAU: 400,
        minLabelAU: 20,
      },
      {
        cameraDistAU: 100,
        minLabelAU: 10,
      },
    ];

    // Convert AU levels to scene units for direct comparison.
    return visibilityLevels.map((level) => ({
      cameraDistScene: this.auToSceneUnits(level.cameraDistAU),
      minLabelScene: this.auToSceneUnits(level.minLabelAU),
    }));
  }
}
