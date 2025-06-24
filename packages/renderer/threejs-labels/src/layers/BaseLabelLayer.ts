import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { AU_METERS, METERS_TO_SCENE_UNITS } from "@teskooano/data-types";

/**
 * Defines the structure for a component that can be registered with the CSS2DManager.
 */
export interface UIRegistryComponent {
  tagName: string;
  componentClass: CustomElementConstructor;
}

/**
 * Configuration for a single visibility level.
 */
export interface VisibilityLevel {
  cameraDistScene: number;
  minLabelScene: number;
}

export abstract class BaseLabelLayer {
  protected elements: Map<string, CSS2DObject> = new Map();
  public isVisible: boolean = true;
  protected scene?: THREE.Scene;

  /**
   * @param scene The Three.js scene, optional for layers that add elements to other objects.
   */
  constructor(scene?: THREE.Scene) {
    this.scene = scene;
  }

  /**
   * Specifies the custom elements required by this layer.
   * @returns An array of component definitions.
   */
  public getRequiredComponents(): UIRegistryComponent[] {
    return [];
  }

  /**
   * Toggles the visibility of all labels in this layer.
   * @param visible The desired visibility state.
   */
  public setVisibility(visible: boolean): void {
    this.isVisible = visible;
    this.elements.forEach((element) => {
      element.visible = visible;
    });
  }

  public removeElement(id: string): void {
    const element = this.elements.get(id);
    if (element) {
      element.removeFromParent();
      this.elements.delete(id);
    }
  }

  public clear(): void {
    this.elements.forEach((element) => {
      element.removeFromParent();
    });
    this.elements.clear();
  }

  /**
   * Converts a value from Astronomical Units (AU) into the renderer's internal scene units.
   * @param au - The value in AU.
   * @returns The equivalent value in scene units.
   */
  protected auToSceneUnits(au: number): number {
    return au * AU_METERS * METERS_TO_SCENE_UNITS;
  }

  /**
   * Converts a value from the renderer's internal scene units into Astronomical Units (AU).
   * @param sceneUnits - The value in scene units.
   * @returns The equivalent value in AU.
   */
  protected sceneUnitsToAu(sceneUnits: number): number {
    // This is the mathematical inverse of auToSceneUnits.
    return sceneUnits / (AU_METERS * METERS_TO_SCENE_UNITS);
  }

  /**
   * A generic update handler that toggles element visibility based on a set of distance-based levels.
   *
   * @param camera - The scene camera.
   * @param centralBody - The object from which distance is measured.
   * @param sceneLevels - An array of pre-calculated visibility levels.
   * @param valueSelector - A function that extracts the numeric value to check from a label's HTML element.
   */
  protected updateVisibilityFromLevels(
    camera: THREE.Camera,
    centralBody: THREE.Object3D,
    sceneLevels: VisibilityLevel[],
    valueSelector: (element: HTMLElement) => number,
  ): void {
    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    const cameraDistSceneUnits = cameraPosition.distanceTo(
      centralBody.position,
    );

    this.elements.forEach((label) => {
      const value = valueSelector(label.element);
      let visible = true;

      const applicableLevel = sceneLevels.find(
        (level) => cameraDistSceneUnits > level.cameraDistScene,
      );

      if (applicableLevel) {
        if (value < applicableLevel.minLabelScene) {
          visible = false;
        }
      }

      label.element.toggleAttribute("visible", visible);
    });
  }

  public getElement(id: string): CSS2DObject | undefined {
    return this.elements.get(id);
  }

  public hasElements(): boolean {
    return this.elements.size > 0;
  }

  /**
   * Default implementation does nothing.
   * Subclasses should override this method to implement LOD or other updates.
   */
  public update(
    camera: THREE.Camera,
    centralBody?: THREE.Object3D,
    objectManager?: any,
  ): void {}
}
