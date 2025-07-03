import * as THREE from "three";
import { BaseLabelLayer, UIRegistryComponent } from "./BaseLabelLayer";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { AuMarkerLabelComponent } from "../components/au-marker-label/AuMarkerLabelComponent";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";

/**
 * Manages labels specifically for AU distance markers.
 */
export class AuMarkerLabelLayer extends BaseLabelLayer {
  constructor(scene: THREE.Scene) {
    super(scene);
  }

  /**
   * Specifies the custom elements required by this layer.
   */
  public override getRequiredComponents(): UIRegistryComponent[] {
    return [
      {
        tagName: AuMarkerLabelComponent.TAG_NAME,
        componentClass: AuMarkerLabelComponent,
      },
    ];
  }

  /**
   * Create a label for a specific AU Value at the specific position
   * @param id
   * @param auValue
   * @param position
   * @param color
   */
  public createLabel(
    id: string,
    auValue: number,
    position: THREE.Vector3,
    color: string,
  ): void {
    if (!this.scene) {
      throw new Error("No scene to create AU Markers with");
    }

    const labelElement = document.createElement(
      AuMarkerLabelComponent.TAG_NAME,
    );
    // Store the AU value in scene units for direct comparison later.
    const auValueInSceneUnits = this.auToSceneUnits(auValue);
    labelElement.setAttribute(
      "data-scene-distance",
      auValueInSceneUnits.toString(),
    );
    labelElement.setAttribute("data-au-display-value", auValue.toString());
    labelElement.setAttribute("data-color", color);

    const css2dObject = new CSS2DObject(labelElement);
    css2dObject.position.copy(position);

    this.scene.add(css2dObject);

    this.elements.set(id, css2dObject);
  }

  public override update(
    camera: THREE.Camera,
    centralBody?: THREE.Object3D,
    objectManager?: ObjectManager,
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
        label.element.getAttribute("data-scene-distance") || "0",
      );

      // Hide the label if the camera is 110% past the marker's distance
      let visible = cameraDistance < markerAuValueScene * 10;

      // Apply occlusion checking if the label would otherwise be visible
      if (visible && objectManager) {
        // Get the label's world position
        const labelWorldPosition = new THREE.Vector3();
        label.getWorldPosition(labelWorldPosition);

        // Generate a unique ID for this AU marker label
        const labelId =
          label.element.getAttribute("data-au-display-value") +
          "_" +
          label.position.x.toFixed(0) +
          "_" +
          label.position.z.toFixed(0);

        // Check if the label is occluded by any celestial objects
        const isOccluded = this.isLabelOccludedOptimized(
          labelId,
          labelWorldPosition,
          camera,
          objectManager,
          // No labelObjectId for AU markers since they don't belong to a specific object
        );

        if (isOccluded) {
          visible = false;
        }
      }

      // Use toggleAttribute for CSS animations
      label.element.toggleAttribute("visible", visible);
    });
  }
}
