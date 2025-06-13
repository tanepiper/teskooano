import * as THREE from "three";
import { BaseLabelLayer } from "./BaseLabelLayer";
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
    labelElement.setAttribute("data-au-value", auValue.toString());
    labelElement.setAttribute("data-color", color);

    const label = new CSS2DObject(labelElement);
    label.position.copy(position);

    // AU Markers are not parented to a specific mesh
    this.scene.add(label);

    this.elements.set(id, label);
    label.visible = this.isVisible;
  }
}
