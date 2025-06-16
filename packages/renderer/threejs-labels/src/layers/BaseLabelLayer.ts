import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { CONVERSION } from "@teskooano/core-physics";

export abstract class BaseLabelLayer {
  protected elements: Map<string, CSS2DObject> = new Map();
  public isVisible: boolean = true;
  protected scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

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

  public getElement(id: string): CSS2DObject | undefined {
    return this.elements.get(id);
  }

  public hasElements(): boolean {
    return this.elements.size > 0;
  }

  public update(camera: THREE.Camera, centralBody?: THREE.Object3D): void {
    // Default implementation does nothing.
    // Subclasses should override this method to implement LOD or other updates.
  }
}
