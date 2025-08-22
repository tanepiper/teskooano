import * as THREE from "three";
import { Field } from "../core/Field";
import { createGalaxyField } from "./galaxy-field.generator";
import { GalaxyFieldOptions } from "./types";

/**
 * A concrete implementation of a `Field` that renders distant galaxies to create
 * a rich, deep-space background. Uses instanced rendering for optimal performance.
 */
export class GalaxyField extends Field {
  /** The galaxy group containing the instanced mesh. */
  private galaxyGroup: THREE.Group | null = null;

  /** The instanced mesh for all galaxies. */
  private instancedMesh: THREE.InstancedMesh | null = null;

  /** The original material for debug mode restoration. */
  private originalMaterial: THREE.Material | null = null;

  /** The intensity of the parallax effect. */
  private parallaxStrength: number;

  /** The base distance used for galaxy placement. */
  private baseDistance: number;

  /**
   * Constructs a new GalaxyField instance.
   * @param options The configuration for the galaxy field.
   */
  constructor(options: GalaxyFieldOptions) {
    super(options);
    this.parallaxStrength = options.parallaxStrength ?? 0.05;
    this.baseDistance = options.baseDistance;
    this.createGalaxies(options);
  }

  /**
   * Generates the galaxy field based on the provided configuration.
   * @param options The galaxy field options.
   */
  private createGalaxies(options: GalaxyFieldOptions): void {
    this.disposeGalaxies();

    this.galaxyGroup = createGalaxyField(options);
    this.object.add(this.galaxyGroup);

    // Store references to the instanced mesh and original material
    this.instancedMesh = this.galaxyGroup.children[0] as THREE.InstancedMesh;
    const material = Array.isArray(this.instancedMesh.material)
      ? this.instancedMesh.material[0]
      : this.instancedMesh.material;
    this.originalMaterial = material.clone();
  }

  /**
   * Updates the galaxy field's state for the current frame.
   * Static background galaxies don't need updates unless parallax is enabled.
   * @param _deltaTime The time elapsed since the last frame, in seconds.
   * @param camera The scene's camera, used to calculate parallax.
   */
  public update(_deltaTime: number, camera?: THREE.PerspectiveCamera): void {
    if (camera && this.parallaxStrength > 0) {
      this.applyParallax(camera);
    }
  }

  /**
   * Simulates a parallax effect by shifting the field's position in the
   * opposite direction of the camera's movement.
   * @param camera The scene's perspective camera.
   */
  private applyParallax(camera: THREE.PerspectiveCamera): void {
    const cameraPos = camera.position;
    const parallaxX = -cameraPos.x * this.parallaxStrength;
    const parallaxY = -cameraPos.y * this.parallaxStrength;
    const parallaxZ = -cameraPos.z * this.parallaxStrength;
    this.object.position.set(parallaxX, parallaxY, parallaxZ);
  }

  /**
   * Toggles the debug visualization, changing the material color.
   * @param debug `true` to enable debug mode, `false` to disable it.
   */
  public toggleDebug(debug: boolean): void {
    this.isDebugMode = debug;

    if (!this.instancedMesh || !this.originalMaterial) return;

    if (debug) {
      // Create debug material with bright color
      const debugMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#ff00ff"),
        transparent: true,
        opacity: 0.8,
        depthWrite: true,
        fog: false,
      });
      this.instancedMesh.material = debugMaterial;
    } else {
      // Restore original material
      this.instancedMesh.material = this.originalMaterial.clone();
    }
  }

  /**
   * Disposes of all Three.js resources used by the galaxies.
   */
  private disposeGalaxies(): void {
    if (this.instancedMesh) {
      // Dispose of geometry and material
      this.instancedMesh.geometry.dispose();
      const material = Array.isArray(this.instancedMesh.material)
        ? this.instancedMesh.material[0]
        : this.instancedMesh.material;
      material.dispose();
      if ((material as THREE.MeshBasicMaterial).map) {
        (material as THREE.MeshBasicMaterial).map!.dispose();
      }
    }

    if (this.galaxyGroup) {
      this.object.remove(this.galaxyGroup);
      this.galaxyGroup = null;
    }

    if (this.originalMaterial) {
      this.originalMaterial.dispose();
      this.originalMaterial = null;
    }

    this.instancedMesh = null;
  }

  /**
   * Cleans up all resources managed by this `GalaxyField` instance.
   */
  public dispose(): void {
    this.disposeGalaxies();
  }
}
