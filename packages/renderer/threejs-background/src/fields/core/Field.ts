import * as THREE from "three";

/**
 * Defines the common options for any field.
 */
export interface FieldOptions {
  name?: string;
}

/**
 * Abstract base class for all environmental fields (e.g., star fields, gas clouds).
 * It defines the common interface for updating, disposing, and managing debug states.
 */
export abstract class Field {
  public object: THREE.Object3D;
  public isDebugMode: boolean = false;
  protected options: FieldOptions;

  /**
   * Constructs a new Field.
   */
  constructor(options: FieldOptions) {
    this.options = options;
    this.object = new THREE.Group();
    if (options.name) {
      this.object.name = options.name;
    }
  }

  /**
   * Updates the field's state.
   */
  abstract update(deltaTime: number, camera?: THREE.PerspectiveCamera): void;

  /**
   * Toggles the debug visualization for the field.
   */
  abstract toggleDebug(debug: boolean): void;

  /**
   * Cleans up the field's resources.
   */
  abstract dispose(): void;
}
