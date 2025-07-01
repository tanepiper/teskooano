import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-types";
import * as THREE from "three";
import { Layer2DManager } from "../Layer2DManager";
import { AuMarkerLabelLayer } from "../layers/AuMarkerLabelLayer";
import { CSS2DLayerType } from "../types";

const auMarkersData = [
  { au: 1, color: "#00ff00" },
  { au: 2, color: "#FFA500" },
  { au: 3, color: "#FFA500" },
  { au: 4, color: "#FFA500" },
  { au: 5, color: "#FFA500" },
  { au: 6, color: "#FFA500" },
  { au: 7, color: "#FFA500" },
  { au: 8, color: "#FFA500" },
  { au: 9, color: "#FFA500" },
  { au: 10, color: "#00ff00" },
  { au: 20, color: "#FFA500" },
  { au: 30, color: "#FFA500" },
  { au: 40, color: "#FFA500" },
  { au: 50, color: "#FFA500" },
  { au: 60, color: "#FFA500" },
  { au: 70, color: "#FFA500" },
  { au: 80, color: "#FFA500" },
  { au: 90, color: "#FFA500" },
  { au: 100, color: "#00ff00" },
  { au: 200, color: "#FFA500" },
  { au: 300, color: "#FFA500" },
  { au: 400, color: "#FFA500" },
  { au: 500, color: "#FFA500" },
  { au: 600, color: "#FFA500" },
  { au: 700, color: "#FFA500" },
  { au: 800, color: "#FFA500" },
  { au: 900, color: "#FFA500" },
  { au: 1000, color: "#00ff00" },
  { au: 2000, color: "#FFA500" },
  { au: 3000, color: "#FFA500" },
  { au: 4000, color: "#FFA500" },
  { au: 5000, color: "#FFA500" },
  { au: 6000, color: "#FFA500" },
  { au: 7000, color: "#FFA500" },
  { au: 8000, color: "#FFA500" },
  { au: 9000, color: "#FFA500" },
  { au: 10000, color: "#00ff00" },
  { au: 20000, color: "#FFA500" },
  { au: 30000, color: "#FFA500" },
  { au: 40000, color: "#FFA500" },
  { au: 50000, color: "#FFA500" },
  { au: 60000, color: "#FFA500" },
  { au: 70000, color: "#FFA500" },
  { au: 80000, color: "#FFA500" },
  { au: 90000, color: "#FFA500" },
  { au: 100000, color: "#00ff00" },
];

/**
 * Manages the creation, visibility, and disposal of AU (Astronomical Unit) markers.
 * This class encapsulates both the 3D ring geometries and the 2D CSS labels.
 */
export class AuMarkerManager {
  private group: THREE.Group;
  private scene: THREE.Scene;
  private css2DManager: Layer2DManager;
  private isVisible: boolean = true;

  /**
   * @param scene The main THREE.Scene to add the markers to.
   * @param css2DManager The manager for 2D labels.
   */
  constructor(
    scene: THREE.Scene,
    css2DManager: Layer2DManager,
    name = "AuMarkersGroup",
  ) {
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

    auMarkersData.forEach(({ au, color }) => {
      const radiusSceneUnits = au * AU_METERS * METERS_TO_SCENE_UNITS; // Auto-adjusts with new scale
      const ringThickness = radiusSceneUnits * 0.001;
      const circleGeometry = new THREE.RingGeometry(
        radiusSceneUnits - ringThickness / 2,
        radiusSceneUnits + ringThickness / 2,
        256,
      );
      const circleMaterial = new THREE.MeshBasicMaterial({
        color: color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5,
        toneMapped: false,
      });
      const circle = new THREE.Mesh(circleGeometry, circleMaterial);
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
}
