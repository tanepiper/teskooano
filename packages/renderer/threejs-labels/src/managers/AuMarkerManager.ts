import { AU_METERS } from "@teskooano/data-values";
import * as THREE from "three";
import { GeometryHelper } from "@teskooano/renderer-threejs-helpers";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import { Layer2DManager } from "../Layer2DManager";
import { AuMarkerLabelLayer } from "../layers/AuMarkerLabelLayer";
import { CSS2DLayerType } from "../types";
import { METERS_TO_SCENE_UNITS } from "@teskooano/core-physics";

/**
 * Manages the creation, visibility, and disposal of AU (Astronomical Unit) markers.
 * This class encapsulates both the 3D ring geometries and the 2D CSS labels,
 * using an InstancedMesh for optimized rendering of the rings.
 */
export class AuMarkerManager {
  private mainGroup: THREE.Group;
  private scene: THREE.Scene;
  private css2DManager: Layer2DManager;
  private isVisible: boolean = true;
  private auMarkersData: Array<{ au: number; color: string }>;
  private ringInstances: THREE.InstancedMesh | null = null;
  private auMarkerGroups: Map<number, THREE.Group> = new Map();

  /**
   * @param scene The main THREE.Scene to add the markers to.
   * @param css2DManager The manager for 2D labels.
   */
  constructor(
    scene: THREE.Scene,
    css2DManager: Layer2DManager,
    name = "GROUP_AU_MARKERS",
  ) {
    this.auMarkersData = this.generateAuMarkersData();

    this.scene = scene;
    this.css2DManager = css2DManager;
    this.mainGroup = new THREE.Group();
    this.mainGroup.name = name;

    // Set render order to ensure AU markers are rendered behind celestial objects
    this.mainGroup.renderOrder =
      RenderOrderManager.getRenderOrderForEffect("distance-markers");

    this.scene.add(this.mainGroup);
  }

  /**
   * Creates the AU marker rings as a single InstancedMesh and their corresponding 2D labels.
   */
  public createMarkers(): void {
    // Register the dedicated layer for AU marker labels
    const auMarkerLayer = new AuMarkerLabelLayer(this.scene);
    this.css2DManager.registerLayer(CSS2DLayerType.AU_MARKERS, auMarkerLayer);

    const count = this.auMarkersData.length;
    if (count === 0) return;

    // 1. Create the base geometry and material for the instanced rings
    // The geometry should be a "unit" ring, so its radius is 1.
    // The InstancedMesh matrix will then scale it to the correct AU radius.
    const ringGeometry = new THREE.RingGeometry(0.995, 1, 256);
    const ringMaterial = new THREE.MeshBasicMaterial({
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.2,
      toneMapped: false, // Set to false for UI elements to not be affected by scene lighting
      depthTest: true, // Enable depth testing so AU markers are occluded by celestial objects
      depthWrite: false, // Don't write to depth buffer to avoid interfering with celestial objects
      blending: THREE.NormalBlending, // Use normal blending for proper transparency
    });

    this.ringInstances = new THREE.InstancedMesh(
      ringGeometry,
      ringMaterial,
      count,
    );
    this.ringInstances.name = "au-rings-instanced";
    this.mainGroup.add(this.ringInstances);

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();

    this.auMarkersData.forEach(({ au, color: hexColor }, i) => {
      const radiusSceneUnits = au * AU_METERS * METERS_TO_SCENE_UNITS;

      // 2. Set the transform for each instance (scale and rotation)
      // Rings are on the XZ plane, so we rotate around the X-axis
      dummy.rotation.x = Math.PI / 2;
      dummy.scale.set(radiusSceneUnits, radiusSceneUnits, 1);
      dummy.updateMatrix();

      if (this.ringInstances) {
        this.ringInstances.setMatrixAt(i, dummy.matrix);
        this.ringInstances.setColorAt(i, color.set(hexColor));
      }

      // 4. Create the four labels for each ring at their world positions
      const labelPositions = {
        Xpos: new THREE.Vector3(radiusSceneUnits, 0, 0),
        Xneg: new THREE.Vector3(-radiusSceneUnits, 0, 0),
        Zpos: new THREE.Vector3(0, 0, radiusSceneUnits),
        Zneg: new THREE.Vector3(0, 0, -radiusSceneUnits),
      };

      // Get or create the group for this AU distance
      let distanceGroup = this.auMarkerGroups.get(au);
      if (!distanceGroup) {
        distanceGroup = new THREE.Group();
        distanceGroup.name = `AU_MARKER_GROUP_${au}`;
        // Store the scene distance in the group's user data for efficient access
        distanceGroup.userData = {
          sceneDistance: radiusSceneUnits,
        };
        this.auMarkerGroups.set(au, distanceGroup);
        this.mainGroup.add(distanceGroup);
      }

      for (const [dir, pos] of Object.entries(labelPositions)) {
        const labelId = `au-marker-${au}-label-${dir}`;
        const css2dObject = auMarkerLayer.createLabel(
          labelId,
          au,
          pos,
          hexColor,
        );
        // Add labels to their own group
        distanceGroup.add(css2dObject);
      }
    });

    // Pass the managed groups to the layer so it can control their visibility
    auMarkerLayer.setManagedGroups(this.auMarkerGroups);

    // 5. Important: update the instance buffers
    this.ringInstances.instanceMatrix.needsUpdate = true;
    if (this.ringInstances.instanceColor) {
      this.ringInstances.instanceColor.needsUpdate = true;
    }
  }

  /**
   * Sets the visibility of all AU markers (rings and labels).
   * @param visible True to show, false to hide.
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;
    this.mainGroup.visible = this.isVisible;
    // The layer visibility will handle the individual labels
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
    this.scene.remove(this.mainGroup);
    // Dispose of all geometries and materials in the group
    this.mainGroup.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        if (Array.isArray(object.material)) {
          object.material.forEach((material) => material.dispose());
        } else if (object.material) {
          object.material.dispose();
        }
      }
    });
    // Clear the group itself
    while (this.mainGroup.children.length > 0) {
      this.mainGroup.remove(this.mainGroup.children[0]);
    }
    this.ringInstances = null;

    this.css2DManager.clearLayer(CSS2DLayerType.AU_MARKERS);
  }

  /**
   * Generates AU marker data dynamically.
   * Creates markers in powers of 10, with the first of each decade (0.1, 1, 10, etc.) as green.
   * @param maxAu The maximum AU value to generate markers for (default: 1,000,000)
   * @returns Array of AU marker data objects
   */
  private generateAuMarkersData(
    maxAu: number = 1000000,
  ): Array<{ au: number; color: string }> {
    const markers: Array<{ au: number; color: string }> = [];
    let powerOf10 = 0.1;

    while (powerOf10 <= maxAu) {
      for (let i = 1; i <= 9; i++) {
        const au = i * powerOf10;
        if (au > maxAu) {
          break; // Stop if we exceed the max AU
        }

        let displayAu = au;
        if (powerOf10 < 1) {
          // Handle floating point inaccuracies for decimals
          displayAu = parseFloat(au.toFixed(1));
        }

        // The first marker of each "decade" (0.1, 1, 10, etc.) is green
        const color = i === 1 ? "#00ff00" : "#FFA500";

        markers.push({ au: displayAu, color });
      }
      powerOf10 *= 10;
    }
    return markers;
  }
}
