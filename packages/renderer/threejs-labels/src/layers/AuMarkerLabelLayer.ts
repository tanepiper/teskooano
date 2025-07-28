import * as THREE from "three";
import { OSVector3 } from "@teskooano/core-math";
import { BaseLabelLayer, UIRegistryComponent } from "./BaseLabelLayer";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { AuMarkerLabelComponent } from "../components/au-marker-label/AuMarkerLabelComponent";
import { ObjectManager } from "@teskooano/renderer-threejs-objects";

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
    objectManager: ObjectManager, // Pass ObjectManager for raycasting
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

    const raycaster = new THREE.Raycaster();
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    // Set the camera for the raycaster
    raycaster.camera = camera;

    this.managedGroups.forEach((group, au) => {
      const markerAuValueScene = group.userData.sceneDistance || 0;
      if (markerAuValueScene === 0) {
        group.visible = false;
        return;
      }

      // Basic visibility based on camera distance (e.g., markers too far disappear)
      let visible = cameraPosition.distanceTo(group.position) < markerAuValueScene * 5;

      if (visible) {
        // Perform raycast from camera to marker's position
        const markerPosition = group.position.clone();
        raycaster.set(cameraPosition, markerPosition.sub(cameraPosition).normalize());

        // Get all rendered meshes from the ObjectManager
        const allRenderedMeshes = objectManager.getAllRenderedMeshes();

        // Filter out the AU marker meshes themselves and ensure only valid, visible Meshes are occluders
        const occluders = allRenderedMeshes.filter(mesh => 
          mesh instanceof THREE.Mesh && 
          mesh.visible && 
          mesh.matrixWorld !== null && // Crucial: ensure matrixWorld is not null
          !mesh.name.startsWith("au-marker-label")
        );

        const intersects = raycaster.intersectObjects(occluders, true);

        // If there's an intersection, and the intersection point is closer than the marker,
        // then the marker is occluded.
        if (intersects.length > 0 && intersects[0].distance < cameraPosition.distanceTo(group.position)) {
          visible = false;
        }
      }

      group.visible = visible;
      group.children.forEach((child) => {
        if (child instanceof CSS2DObject) {
          child.element.toggleAttribute("visible", visible);
        }
      });
    });
  }
}
