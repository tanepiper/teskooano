import { CelestialType } from "@teskooano/data-types";
import { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { LODManager } from "@teskooano/renderer-threejs-effects";
import * as THREE from "three";
import { MeshFactoryConfig } from "../types";
import { BasicCelestialRenderer } from "@teskooano/celestials-base";

/**
 * @internal
 * Factory class responsible for creating BasicCelestialRenderer instances
 * for different types of celestial bodies based on their data.
 */
export class MeshFactory {
  private lodManager: LODManager;
  private camera: THREE.PerspectiveCamera;
  private debugMode: boolean = false;

  constructor(config: MeshFactoryConfig) {
    this.lodManager = config.lodManager;
    this.camera = config.camera;
  }

  /**
   * Gets the camera instance used by the factory.
   * Potentially needed by other managers like ObjectLifecycleManager for lensing.
   */
  public getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  /**
   * Enables or disables debug mode.
   * In debug mode, simpler fallback meshes (like spheres) might be created.
   * @param enabled - True to enable debug mode, false otherwise.
   */
  public setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    // Note: This only affects subsequently created meshes.
    // To apply debug mode to existing objects, they would need to be recreated.
    // Consider how BasicCelestialRenderer might handle a debug mode internally.
  }

  /**
   * Creates a BasicCelestialRenderer instance for a given celestial object.
   * The actual Three.js Object3D (LOD object) is accessible via the .lod property of the renderer.
   * @param object - The data defining the celestial object.
   * @returns A BasicCelestialRenderer instance, or null if creation fails.
   */
  public createObjectRenderer(
    object: import("@teskooano/celestials-base").CelestialObject,
  ): BasicCelestialRenderer | null {
    // TODO: Implement debug mode handling for BasicCelestialRenderer if needed.
    // if (this.debugMode) {
    //   // BasicCelestialRenderer might need a debug option in its constructor or a method.
    //   // For now, debug mode in MeshFactory won't directly create a different *type* of renderer,
    //   // but could pass a debug flag to BasicCelestialRenderer if supported.
    // }

    try {
      // Determine radius and color for the BasicCelestialRenderer constructor
      // These are placeholders; specific object types might have different defaults or ways to get this.
      const radius = object.physicalProperties.radius || 1;
      let color = 0xffffff;
      if (object.type === CelestialType.STAR) {
        // Example: stars might have a color derived from temperature or specific properties
        // This logic would ideally be inside a StarRenderer subclass of BasicCelestialRenderer
        color = 0xffff00; // Placeholder yellow for stars
      } else if (object.type === CelestialType.PLANET) {
        color = 0x0000ff; // Placeholder blue for planets
      }
      // Add more type-specific color/parameter logic as needed, or move to specialized renderers.

      // TODO: BasicCelestialRenderer options might need to be configured based on object type or properties.
      // For example, LOD distances, billboard settings, etc.
      const rendererOptions = {
        /* ... */
      };

      const celestialRenderer = new BasicCelestialRenderer(
        object,
        radius,
        color,
        rendererOptions,
      );

      // The LOD object itself is renderer.lod
      // The name and userData for the LOD object should be set by BasicCelestialRenderer ideally,
      // or here if BasicCelestialRenderer doesn't handle it.
      // celestialRenderer.lod.name = `${object.type}_${object.celestialObjectId}`;
      // celestialRenderer.lod.userData = {
      //   celestialId: object.celestialObjectId,
      //   type: object.type,
      // };
      // Set initial position and rotation on the LOD object within BasicCelestialRenderer's update or constructor.
      // celestialRenderer.lod.position.copy(object.position);
      // celestialRenderer.lod.quaternion.copy(object.rotation);

      return celestialRenderer;
    } catch (error) {
      console.error(
        `[MeshFactory] Error creating BasicCelestialRenderer for ${object.id} (${object.type}):`,
        error,
      );
      return null;
    }
  }
}
