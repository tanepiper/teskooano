import * as THREE from "three";
import { BaseLabelLayer } from "./BaseLabelLayer";
import {
  type RenderableCelestialObject,
  CelestialType,
  SCALE,
  type OortCloudProperties,
} from "@teskooano/data-types";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CELESTIAL_LABEL_TAG } from "../components/celestial-label/CelestialLabelComponent";

export class CelestialLabelLayer extends BaseLabelLayer {
  public createLabel(
    object: RenderableCelestialObject,
    parentMesh: THREE.Object3D,
  ): void {
    const objectId = object.celestialObjectId;
    if (this.elements.has(objectId)) {
      console.warn(
        `[CelestialLabelLayer] Label already exists for ${objectId}. Skipping creation.`,
      );
      return;
    }

    const labelElement = document.createElement(CELESTIAL_LABEL_TAG);
    labelElement.setAttribute("data-name", object.name);

    const label = new CSS2DObject(labelElement);
    label.position.copy(this.calculateLabelPosition(object));

    parentMesh.add(label);

    this.elements.set(objectId, label);
    label.visible = this.isVisible;
  }

  private calculateLabelPosition(
    object: RenderableCelestialObject,
  ): THREE.Vector3 {
    if (object.type === CelestialType.OORT_CLOUD) {
      const oortCloudProps = object.properties as OortCloudProperties;
      const innerRadiusAU = oortCloudProps.innerRadiusAU;
      if (innerRadiusAU && typeof innerRadiusAU === "number") {
        const scaledInnerRadius = innerRadiusAU * SCALE.RENDER_SCALE_AU;
        const direction = new THREE.Vector3(0.7, 0.7, 0).normalize();
        return direction.multiplyScalar(scaledInnerRadius);
      } else {
        return new THREE.Vector3(100, 100, 0);
      }
    } else {
      const visualRadius = object.radius || 1;
      return new THREE.Vector3(0, visualRadius * 1.5, 0);
    }
  }
}
