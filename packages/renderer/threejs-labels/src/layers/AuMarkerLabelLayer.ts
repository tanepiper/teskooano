import * as THREE from "three";
import { BaseLabelLayer } from "./BaseLabelLayer";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { AU_MARKER_LABEL_TAG } from "../components/au-marker-label/AuMarkerLabelComponent";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-types";

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
    const auValueInSceneUnits = auValue * AU_METERS * METERS_TO_SCENE_UNITS;
    labelElement.setAttribute("data-au-value", auValueInSceneUnits.toString());
    labelElement.setAttribute("data-au-display-value", auValue.toString());
    labelElement.setAttribute("data-color", color);

    const label = new CSS2DObject(labelElement);
    label.position.copy(position);

    this.scene.add(label);

    this.elements.set(id, label);
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
    const cameraDistSceneUnits = cameraPosition.distanceTo(
      centralBody.position,
    );

    // Define visibility levels. Each level defines a camera distance threshold
    // and the minimum AU value to display at that distance.
    // The thresholds should be ordered from largest camera distance to smallest.
    const visibilityLevels = [
      {
        cameraDistAU: 5000, // When camera is further than 400 AU...
        minLabelAU: 1000, // ...only show labels >= 20 AU.
      },
      {
        cameraDistAU: 2000, // When camera is further than 400 AU...
        minLabelAU: 200, // ...only show labels >= 20 AU.
      },
      {
        cameraDistAU: 600, // When camera is further than 400 AU...
        minLabelAU: 100, // ...only show labels >= 20 AU.
      },
      {
        cameraDistAU: 400, // When camera is further than 400 AU...
        minLabelAU: 20, // ...only show labels >= 20 AU.
      },
      {
        cameraDistAU: 100, // When camera is further than 100 AU...
        minLabelAU: 10, // ...only show labels >= 10 AU.
      },
    ];

    // Convert AU levels to scene units for direct comparison.
    const sceneLevels = visibilityLevels.map((level) => ({
      cameraDistScene: level.cameraDistAU * AU_METERS * METERS_TO_SCENE_UNITS,
      minLabelScene: level.minLabelAU * AU_METERS * METERS_TO_SCENE_UNITS,
    }));

    this.elements.forEach((label) => {
      const auValueSceneUnits = parseFloat(
        label.element.getAttribute("data-au-value") || "0",
      );

      let visible = true;

      // Find the first (and therefore, furthest) visibility level that applies.
      const applicableLevel = sceneLevels.find(
        (level) => cameraDistSceneUnits > level.cameraDistScene,
      );

      if (applicableLevel) {
        // If a level applies, hide the label if its value is less than the minimum for that level.
        if (auValueSceneUnits < applicableLevel.minLabelScene) {
          visible = false;
        }
      }
      // If no level applies, we are zoomed in close, so all labels remain visible by default.

      // Toggle the 'visible' attribute to trigger the CSS fade animation.
      label.element.toggleAttribute("visible", visible);
    });
  }
}
