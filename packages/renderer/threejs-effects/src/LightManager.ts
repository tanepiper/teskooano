import * as THREE from "three";
import { renderableObjectsStore } from "@teskooano/core-state";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { MapStore } from "nanostores"; // Import MapStore type

/**
 * Manages light sources in the scene, particularly star lights
 */
export class LightManager {
  private starLights: Map<string, THREE.Light> = new Map();
  private scene: THREE.Scene;
  private ambientLight: THREE.AmbientLight; // Keep track of the ambient light
  private unsubscribeStore: (() => void) | null = null; // Store unsubscribe function

  /**
   * Create a new LightManager
   */
  constructor(
    scene: THREE.Scene,
    private objectsStore: MapStore<
      Record<string, RenderableCelestialObject>
    > = renderableObjectsStore, // Inject store
  ) {
    this.scene = scene;

    // Add a soft white ambient light to provide base illumination
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // White color, intensity 0.3
    this.scene.add(this.ambientLight);

    // Subscribe to store changes
    this.subscribeToStore();
  }

  /**
   * Subscribe to the renderable objects store to update light positions.
   * @internal
   */
  private subscribeToStore(): void {
    this.unsubscribeStore = this.objectsStore.subscribe(
      (objects: Record<string, RenderableCelestialObject>) => {
        // Iterate through store objects and update corresponding lights
        for (const id in objects) {
          const objectData = objects[id];
          if (objectData.type === "STAR" && objectData.position) {
            // Only update STAR lights with position
            const light = this.starLights.get(id);
            if (light) {
              light.position.copy(objectData.position); // Use copy for Vector3
            } else {
              // Optionally add light if it doesn't exist? Or rely on ObjectManager?
              // Let's assume ObjectManager handles adding lights initially.
            }
          }
        }
        // Handle lights for objects that were removed from the store?
        // We rely on ObjectManager calling removeStarLight for now.
      },
    );
  }

  /**
   * Add a star light to the scene
   */
  addStarLight(
    id: string,
    position: THREE.Vector3,
    color: number = 0xffffff,
    intensity: number = 1.5,
  ): void {
    // Create a point light with distance-based attenuation
    const light = new THREE.PointLight(color, intensity, 0, 0.5);
    light.position.set(position.x, position.y, position.z);
    this.scene.add(light);
    this.starLights.set(id, light);
  }

  /**
   * Update a star light's position
   * DEPRECATED: Position is now updated via store subscription.
   * Kept for potential direct manipulation if needed, but generally unused.
   */
  updateStarLight(id: string, position: THREE.Vector3): void {
    console.warn(
      "[LightManager] updateStarLight is deprecated. Positions are updated via store subscription.",
    );
    const light = this.starLights.get(id);
    if (light) {
      light.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Remove a star light from the scene
   */
  removeStarLight(id: string): void {
    const light = this.starLights.get(id);
    if (light) {
      this.scene.remove(light);
      this.starLights.delete(id);
    }
  }

  /**
   * Get all star light positions for use in shaders or other calculations
   */
  getStarLightPositions(): Map<string, THREE.Vector3> {
    const positions = new Map<string, THREE.Vector3>();

    this.starLights.forEach((light, id) => {
      positions.set(id, light.position.clone());
    });

    return positions;
  }

  /**
   * Get all star light data (position, color, and intensity) for use in renderers
   */
  getStarLightsData(): Map<
    string,
    { position: THREE.Vector3; color: THREE.Color; intensity: number }
  > {
    const lightData = new Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >();

    this.starLights.forEach((light, id) => {
      // Ensure the light object is a THREE.PointLight or similar with color and intensity
      if (
        light instanceof THREE.PointLight ||
        light instanceof THREE.SpotLight
      ) {
        // DirectionalLight doesn't have intensity in the same way
        lightData.set(id, {
          position: light.position.clone(),
          color: light.color.clone(),
          intensity: light.intensity, // Add intensity
        });
      } else if (light instanceof THREE.DirectionalLight) {
        // Directional lights use intensity differently, maybe default to 1?
        lightData.set(id, {
          position: light.position.clone(), // Position is direction for directional
          color: light.color.clone(),
          intensity: light.intensity, // Still has intensity property
        });
      } else {
        console.warn(
          `LightManager: Light with id ${id} is not a recognized type with color/intensity properties.`,
        );
        lightData.set(id, {
          position: light.position.clone(),
          color: new THREE.Color(0xffffff), // Default white
          intensity: 1.0, // Default intensity
        });
      }
    });

    return lightData;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Unsubscribe from the store
    this.unsubscribeStore?.();
    this.unsubscribeStore = null;

    // Remove star lights
    this.starLights.forEach((light) => {
      this.scene.remove(light);
    });
    this.starLights.clear();

    // Remove ambient light
    if (this.ambientLight) {
      this.scene.remove(this.ambientLight);
    }
  }
}
