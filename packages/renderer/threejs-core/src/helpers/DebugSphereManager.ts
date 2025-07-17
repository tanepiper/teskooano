import * as THREE from "three";

/**
 * @const DEBUG_SPHERE_CONFIG
 * @description Configuration for the debug sphere at the origin.
 */
const DEBUG_SPHERE_CONFIG = {
  RADIUS: 0.5,
  WIDTH_SEGMENTS: 16,
  HEIGHT_SEGMENTS: 16,
  COLOR: 0xff00ff,
};

/**
 * Manages the debug sphere at the origin for spatial reference.
 *
 * This manager is designed to be used by the ModularSpaceRenderer and
 * other high-level renderer components for debugging purposes.
 */
export class DebugSphereManager {
  private scene: THREE.Scene;
  private debugSphere: THREE.Mesh | null = null;
  private isVisible = false;

  /**
   * Creates a new DebugSphereManager instance.
   * @param scene The `THREE.Scene` to which the debug sphere will be added.
   */
  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Sets the visibility of the debug sphere.
   * @param visible True to show the debug sphere, false to hide it.
   */
  public setVisible(visible: boolean): void {
    this.isVisible = visible;

    if (visible) {
      if (!this.debugSphere) {
        this._createDebugSphere();
      }
      if (this.debugSphere) {
        this.debugSphere.visible = true;
      }
    } else if (this.debugSphere) {
      this.debugSphere.visible = false;
    }
  }

  /**
   * Toggles the visibility of the debug sphere.
   */
  public toggle(): void {
    this.setVisible(!this.isVisible);
  }

  /**
   * Gets the current visibility of the debug sphere.
   * @returns True if the debug sphere is visible, false otherwise.
   */
  public getVisible(): boolean {
    return this.isVisible;
  }

  /**
   * Disposes of the debug sphere's resources and removes it from the scene.
   */
  public dispose(): void {
    if (this.debugSphere) {
      this.scene.remove(this.debugSphere);
      this.debugSphere.geometry.dispose();
      if (this.debugSphere.material instanceof Array) {
        this.debugSphere.material.forEach((m) => m.dispose());
      } else {
        this.debugSphere.material.dispose();
      }
      this.debugSphere = null;
    }
  }

  /**
   * Creates the debug sphere at the origin using settings from the config.
   */
  private _createDebugSphere(): void {
    if (this.debugSphere) return;

    const geometry = new THREE.SphereGeometry(
      DEBUG_SPHERE_CONFIG.RADIUS,
      DEBUG_SPHERE_CONFIG.WIDTH_SEGMENTS,
      DEBUG_SPHERE_CONFIG.HEIGHT_SEGMENTS,
    );
    const material = new THREE.MeshBasicMaterial({
      color: DEBUG_SPHERE_CONFIG.COLOR,
    });
    this.debugSphere = new THREE.Mesh(geometry, material);
    this.debugSphere.position.set(0, 0, 0);
    this.scene.add(this.debugSphere);
  }
}
