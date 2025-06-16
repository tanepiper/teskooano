import * as THREE from "three";
import { BaseLabelLayer, VisibilityLevel } from "./BaseLabelLayer";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { AU_MARKER_LABEL_TAG } from "../components/au-marker-label/AuMarkerLabelComponent";

/**
 * Manages labels specifically for AU distance markers.
 */
export class AuMarkerLabelLayer extends BaseLabelLayer {
  constructor(scene: THREE.Scene) {
    super(scene);
  }

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

    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    // AU markers are centered at the centralBody's position
    const cameraDistance = cameraPosition.distanceTo(centralBody.position);

    this.elements.forEach((label) => {
      const markerAuValueScene = parseFloat(
        label.element.getAttribute("data-au-value") || "0",
      );

      // Hide the label if the camera is 110% past the marker's distance
      const visible = cameraDistance < markerAuValueScene * 10;

      // Use toggleAttribute for CSS animations
      label.element.toggleAttribute("visible", visible);
    });
  }
}
