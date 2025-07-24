import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import * as THREE from "three";
import { GeometryHelper } from "@teskooano/renderer-threejs-helpers";
import { Layer2DManager } from "../Layer2DManager";
import { AuMarkerLabelLayer } from "../layers/AuMarkerLabelLayer";
import { CSS2DLayerType } from "../types";

/**
 * Manages the creation, visibility, and disposal of AU (Astronomical Unit) markers.
 * This class encapsulates both the 3D ring geometries and the 2D CSS labels.
 */
export class AuMarkerManager {
  private group: THREE.Group;
  private scene: THREE.Scene;
  private css2DManager: Layer2DManager;
  private isVisible: boolean = true;
  private auMarkersData: Array<{ au: number; color: string }>;

  /**
   * @param scene The main THREE.Scene to add the markers to.
   * @param css2DManager The manager for 2D labels.
   */
  constructor(
    scene: THREE.Scene,
    css2DManager: Layer2DManager,
    name = "GROUP_AU_MARKER_RINGS",
  ) {
    this.auMarkersData = this.generateAuMarkersData();

    this.scene = scene;
    this.css2DManager = css2DManager;
    this.group = new THREE.Group();
    this.group.name = name;
    this.scene.add(this.group);
  }

  /**
   * Creates the AU marker rings and their corresponding 2D labels.
   */
  public createMarkers(): void {
    // Register the dedicated layer for AU marker labels
    const auMarkerLayer = new AuMarkerLabelLayer(this.scene);
    this.css2DManager.registerLayer(CSS2DLayerType.AU_MARKERS, auMarkerLayer);

    this.auMarkersData.forEach(({ au, color }) => {
      const radiusSceneUnits = au * AU_METERS * METERS_TO_SCENE_UNITS;
      const ringThickness = radiusSceneUnits * 0.001;

      // Create material with required properties
      const material = new THREE.MeshBasicMaterial({
        color: parseInt(color.replace("#", "0x")),
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        toneMapped: true,
      });

      const circle = GeometryHelper.createRing({
        x: 0,
        y: 0,
        z: 0,
        size: 1,
        color: 0xffffff, // ignored when material is provided
        wireframe: false, // ignored when material is provided
        innerRadius: radiusSceneUnits - ringThickness / 2,
        outerRadius: radiusSceneUnits + ringThickness / 2,
        segments: 256,
        name: `AU_RING_${au}`,
        material,
      });

      circle.rotation.x = -Math.PI / 2;
      this.group.add(circle);

      const labelPositions = {
        Xpos: new THREE.Vector3(radiusSceneUnits, 0, 0),
        Xneg: new THREE.Vector3(-radiusSceneUnits, 0, 0),
        Zpos: new THREE.Vector3(0, 0, radiusSceneUnits),
        Zneg: new THREE.Vector3(0, 0, -radiusSceneUnits),
      };

      for (const [dir, pos] of Object.entries(labelPositions)) {
        const labelId = `au-label-${dir}-${au}`;
        auMarkerLayer.createLabel(labelId, au, pos, color);
      }
    });
  }

  /**
   * Sets the visibility of all AU markers (rings and labels).
   * @param visible True to show, false to hide.
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.group.visible = this.isVisible;
    this.css2DManager.setLayerVisibility(
      CSS2DLayerType.AU_MARKERS,
      this.isVisible,
    );
  }

  /**
   * Toggles the visibility of all AU markers.
   */
  public toggle(): void {
    this.setVisible(!this.isVisible);
  }

  /**
   * Removes all AU marker objects and labels from the scene and disposes of their resources.
   */
  public dispose(): void {
    this.scene.remove(this.group);
    // Dispose of all geometries and materials in the group
    this.group.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else {
          object.material.dispose();
        }
      }
    });
    // Clear the group itself
    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }

    this.css2DManager.clearLayer(CSS2DLayerType.AU_MARKERS);
  }

  /**
   * Generates AU marker data dynamically.
   * Creates markers in groups of 10, where each tenth marker (0.1, 1, 10, 100, etc.) is green
   * and the others are orange. Goes up to the specified maximum AU.
   * @param maxAu The maximum AU value to generate markers for (default: 1,000,000)
   * @returns Array of AU marker data objects
   */
  private generateAuMarkersData(
    maxAu: number = 1000000,
  ): Array<{ au: number; color: string }> {
    const markers: Array<{ au: number; color: string }> = [];

    // Start with 0.1 AU and go up in groups of 10
    let currentGroup = 0.1;

    while (currentGroup <= maxAu) {
      // Generate 10 markers for this group (0.1, 0.2, ..., 0.9, 1.0)
      for (let i = 1; i <= 10; i++) {
        let au = currentGroup * i;
        if (au < 1) {
          au = parseFloat(au.toFixed(1));
        }

        // Skip if we've exceeded the maximum
        if (au > maxAu) break;

        // Every 10th marker (i === 10) is green, others are orange
        const color = i === 10 ? "#00ff00" : "#FFA500";

        markers.push({ au, color });
      }

      // Move to the next group (multiply by 10)
      currentGroup *= 10;
    }

    return markers;
  }
}
