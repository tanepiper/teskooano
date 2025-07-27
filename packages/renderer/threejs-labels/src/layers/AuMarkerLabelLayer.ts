import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { BaseLabelLayer, UIRegistryComponent } from "./BaseLabelLayer";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { AuMarkerLabelComponent } from "../components/au-marker-label/AuMarkerLabelComponent";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";

/**
 * Manages labels specifically for AU distance markers.
 */
export class AuMarkerLabelLayer extends BaseLabelLayer {
  private managedGroups: Map<number, THREE.Group> = new Map();

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
   * @returns The created CSS2DObject
   */
  public createLabel(
    id: string,
    auValue: number,
    position: THREE.Vector3,
    color: string,
  ): CSS2DObject {
    if (!this.scene) {
      throw new Error("No scene to create AU Markers with");
    }

    const labelElement = document.createElement(
      AuMarkerLabelComponent.TAG_NAME,
    );
    // The scene distance is now stored on the parent group, so we don't need it here.
    labelElement.setAttribute("data-au-display-value", auValue.toString());
    labelElement.setAttribute("data-color", color);

    const css2dObject = new CSS2DObject(labelElement);
    css2dObject.name = `au-marker-label-${id}`;
    css2dObject.position.copy(position);

    // Don't add to scene here - the caller will add it to the appropriate mesh/group
    // this.scene.add(css2dObject);

    this.elements.set(id, css2dObject);

    return css2dObject;
  }

  /**
   * Receives the map of AU marker groups from the manager.
   * @param groups A map where the key is the AU value and the value is the THREE.Group.
   */
  public setManagedGroups(groups: Map<number, THREE.Group>): void {
    this.managedGroups = groups;
  }

  public override update(
    camera: THREE.PerspectiveCamera,
    centralBody: OSVector3, // This is actually the origin point (0,0,0) for AU markers
    objectManager: ObjectManager,
  ): void {
    if (!this.isVisible) {
      // If the layer is globally hidden, ensure all groups are hidden.
      this.managedGroups.forEach((group) => {
        if (group.visible) {
          group.visible = false;
        }
      });
      return;
    }

    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    // AU markers are centered at the origin (0,0,0), so we measure from there directly
    // instead of relying on the passed centralBody parameter.
    const cameraDistance = cameraPosition.distanceTo(
      new THREE.Vector3(0, 0, 0),
    );

    this.managedGroups.forEach((group, au) => {
      // Retrieve the scene distance from the group's userData
      const markerAuValueScene = group.userData.sceneDistance || 0;
      if (markerAuValueScene === 0) {
        // Hide the group if the distance is not set
        group.visible = false;
        return;
      }

      // Hide the label group if the camera is 110% past the marker's distance
      let visible = cameraDistance < markerAuValueScene * 5;

      // The previous occlusion check was flawed as it used the group's origin (0,0,0)
      // for the check, causing all groups to be incorrectly hidden.
      // It has been removed to restore visibility. A new group-based occlusion
      // strategy would require a more complex implementation.

      group.visible = visible;
      // Propagate the visibility state to the child labels every frame
      // to ensure their initial state is set correctly.
      group.children.forEach((child) => {
        if (child instanceof CSS2DObject) {
          child.element.toggleAttribute("visible", visible);
        }
      });
    });
  }
}
