import * as THREE from "three";
import {
  createStarLayers,
  updateStarColors,
  createDebugVisuals,
  cleanupDebugVisuals,
  updateParallax,
  animateStarField,
} from "./background-manager";

/**
 * Manages the space background with multiple star field layers
 */
export class BackgroundManager {
  private group: THREE.Group;
  private starsGroup: THREE.Group;
  private debugGroup: THREE.Group;
  private camera: THREE.PerspectiveCamera | null = null;
  private scene: THREE.Scene;
  private time: number = 0;
  private isDebugMode: boolean = false;
  private starLayers: THREE.Points[] = [];

  /**
   * Creates a new BackgroundManager
   * @param scene The scene to add the background to
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.group = new THREE.Group();
    this.starsGroup = new THREE.Group();
    this.debugGroup = new THREE.Group();

    this.createStars();

    this.group.add(this.starsGroup);
    this.group.add(this.debugGroup);

    scene.add(this.group);
  }

  /**
   * Toggle debug visualization mode
   */
  public toggleDebug(): void {
    this.isDebugMode = !this.isDebugMode;

    cleanupDebugVisuals(this.debugGroup);

    if (this.isDebugMode) {
      const newDebugGroup = createDebugVisuals();

      while (newDebugGroup.children.length > 0) {
        this.debugGroup.add(newDebugGroup.children[0]);
      }
    }

    updateStarColors(this.starLayers, this.isDebugMode);

    if (!this.isDebugMode) {
      this.createStars();
    }
  }

  /**
   * Create the star field layers
   */
  private createStars(): void {
    while (this.starsGroup.children.length > 0) {
      const child = this.starsGroup.children[0];
      if (child instanceof THREE.Points) {
        child.geometry.dispose();
        (child.material as THREE.Material).dispose();
      }
      this.starsGroup.remove(child);
    }

    this.starLayers = createStarLayers();

    this.starLayers.forEach((layer) => this.starsGroup.add(layer));
  }

  /**
   * Set the camera for parallax effects
   */
  setCamera(camera: THREE.PerspectiveCamera): void {
    this.camera = camera;
  }

  /**
   * Get the background group
   */
  getGroup(): THREE.Group {
    return this.group;
  }

  /**
   * Update the background with animation and parallax effects
   */
  update(deltaTime: number): void {
    this.time += deltaTime;

    updateParallax(this.starsGroup, this.camera);

    animateStarField(this.starsGroup, this.starLayers, deltaTime);
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.scene.remove(this.group);

    this.starLayers.forEach((stars) => {
      stars.geometry.dispose();
      (stars.material as THREE.Material).dispose();
    });

    this.starLayers = [];

    cleanupDebugVisuals(this.debugGroup);

    while (this.starsGroup.children.length > 0) {
      this.starsGroup.remove(this.starsGroup.children[0]);
    }

    while (this.group.children.length > 0) {
      this.group.remove(this.group.children[0]);
    }
  }
}
