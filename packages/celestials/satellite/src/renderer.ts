import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  RenderableCelestialObject,
  SatelliteProperties,
  METERS_TO_SCENE_UNITS,
} from "@teskooano/data-types";

import {
  BaseCelestialRenderer,
  type CelestialMeshOptions,
  type LightSourcesMap,
  createFallbackSphere,
} from "@teskooano/renderer-threejs-celestial";
import { SatelliteMaterial } from "./material";

/**
 * Renderer for satellite objects using 3D models (FBX, GLB, etc.)
 *
 * Features:
 * - FBX model loading with caching
 * - Automatic scaling based on object radius
 * - LOD system with model at high detail, billboard at distance
 * - Enhanced materials with lighting and emission effects
 * - Fallback sphere for loading failures
 */
export class SatelliteRenderer extends BaseCelestialRenderer {
  private static modelCache = new Map<string, THREE.Group>();
  private static loadingPromises = new Map<string, Promise<THREE.Group>>();

  private satelliteGroup?: THREE.Group; // Main group that holds either model or fallback
  private model?: THREE.Group;
  private billboard?: THREE.Sprite;
  private loader = new FBXLoader();
  private material?: SatelliteMaterial;
  private isLoading = false;
  private loadingFailed = false;
  private fallbackMesh?: THREE.Mesh;

  constructor() {
    super();
  }

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const properties = object.properties as SatelliteProperties;
    if (!properties?.modelPath) {
      console.warn(
        `[SatelliteRenderer] No modelPath provided for ${object.celestialObjectId}`,
      );
      return this.createFallbackLOD(object);
    }

    // Create the main group that will hold either the model or fallback
    if (!this.satelliteGroup) {
      this.satelliteGroup = new THREE.Group();
      this.satelliteGroup.name = `satellite-group-${object.celestialObjectId}`;

      // Start with fallback mesh
      this.createFallbackMesh(object);
      this.satelliteGroup.add(this.fallbackMesh!);
    }

    // Start loading the model if not already loaded/loading
    this.loadModel(object, properties.modelPath);

    // Create billboard for distant viewing if not created yet
    if (!this.billboard) {
      this.createBillboard(object);
    }

    return [
      {
        distance: 0,
        object: this.satelliteGroup,
      },
      {
        distance: 100000, // Switch to billboard at 100km distance (in scene units)
        object: this.billboard!,
      },
    ];
  }

  private async loadModel(
    object: RenderableCelestialObject,
    modelPath: string,
  ): Promise<void> {
    // Check cache first
    const cachedModel = SatelliteRenderer.modelCache.get(modelPath);
    if (cachedModel) {
      this.model = cachedModel.clone();
      this.applyModelProperties(object);
      this.swapToModel();
      return;
    }

    // Check if already loading
    let loadingPromise = SatelliteRenderer.loadingPromises.get(modelPath);
    if (!loadingPromise) {
      // Start new loading process
      this.isLoading = true;
      loadingPromise = this.loadFBXModel(modelPath);
      SatelliteRenderer.loadingPromises.set(modelPath, loadingPromise);
    }

    try {
      const loadedModel = await loadingPromise;
      // Cache the loaded model
      SatelliteRenderer.modelCache.set(modelPath, loadedModel);
      // Create our instance
      this.model = loadedModel.clone();
      this.applyModelProperties(object);
      this.swapToModel();
      this.isLoading = false;
    } catch (error) {
      console.error(
        `[SatelliteRenderer] Failed to load model ${modelPath}:`,
        error,
      );
      this.loadingFailed = true;
      this.isLoading = false;
    } finally {
      SatelliteRenderer.loadingPromises.delete(modelPath);
    }
  }

  /**
   * Swaps out the fallback mesh with the loaded model in the satellite group
   */
  private swapToModel(): void {
    if (!this.satelliteGroup || !this.model) return;

    // Remove fallback mesh
    if (this.fallbackMesh) {
      this.satelliteGroup.remove(this.fallbackMesh);
    }

    // Add the loaded model
    this.satelliteGroup.add(this.model);
  }

  private async loadFBXModel(modelPath: string): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (fbx) => {
          // Ensure the model is properly set up
          fbx.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // Apply enhanced satellite material to mesh parts
              child.material = this.createSatelliteMaterial();
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
          resolve(fbx);
        },
        (progress) => {
          // Optional: Handle loading progress
          console.debug(
            `[SatelliteRenderer] Loading progress: ${(progress.loaded / progress.total) * 100}%`,
          );
        },
        (error) => {
          reject(error);
        },
      );
    });
  }

  private applyModelProperties(object: RenderableCelestialObject): void {
    if (!this.model) return;

    const properties = object.properties as SatelliteProperties;

    // Scale based on the satellite's real-world size
    // Use the actual realRadius_m of the satellite converted to scene units
    const realSizeM = object.realRadius_m * 2; // Convert radius to diameter
    const sceneUnits = realSizeM * METERS_TO_SCENE_UNITS;
    const modelScale = properties.modelScale ?? 1.0;

    // Add a visibility multiplier so satellites aren't microscopic
    const visibilityMultiplier = 10; // Make satellites 100x larger for visibility
    const finalScale = sceneUnits * modelScale * visibilityMultiplier;

    this.model.scale.setScalar(finalScale);

    // Set name for debugging
    this.model.name = `satellite_${object.celestialObjectId}`;

    // Apply our lighting-aware material to all meshes in the FBX model
    const satelliteMaterial = this.createSatelliteMaterial();

    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Dispose of the original material to free memory
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach((mat) => mat.dispose());
          } else {
            child.material.dispose();
          }
        }

        // Apply our satellite material that responds to lighting
        child.material = satelliteMaterial;

        // Ensure the mesh receives shadows and casts shadows
        child.receiveShadow = true;
        child.castShadow = true;

        // Set name for debugging
        child.name = `${object.celestialObjectId}_mesh_${child.name || "unnamed"}`;
      }
    });
  }

  private createBillboard(object: RenderableCelestialObject): void {
    // Create a simple billboard sprite for distant viewing
    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
    const context = canvas.getContext("2d")!;

    // Draw a simple satellite icon
    context.fillStyle = "#ffffff";
    context.fillRect(20, 30, 24, 4); // Main body
    context.fillRect(10, 20, 44, 2); // Solar panels
    context.fillRect(30, 10, 4, 44); // Vertical component

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      sizeAttenuation: false,
    });

    this.billboard = new THREE.Sprite(spriteMaterial);
    this.billboard.scale.setScalar(object.radius * 10); // Make it visible at distance
    this.billboard.name = `satellite_billboard_${object.celestialObjectId}`;
  }

  private createFallbackMesh(object: RenderableCelestialObject): void {
    this.fallbackMesh = createFallbackSphere(object) as THREE.Mesh;
    this.fallbackMesh.material = this.createSatelliteMaterial();
  }

  private createFallbackLOD(object: RenderableCelestialObject): LODLevel[] {
    this.createFallbackMesh(object);
    this.createBillboard(object);

    return [
      {
        distance: 0,
        object: this.fallbackMesh!,
      },
      {
        distance: 100000,
        object: this.billboard!,
      },
    ];
  }

  private createSatelliteMaterial(): SatelliteMaterial {
    if (!this.material) {
      this.material = new SatelliteMaterial({
        color: new THREE.Color(0xdddddd), // Clean satellite color
        metalness: 0.7, // Metallic satellite materials
        roughness: 0.3, // Smooth but not mirror-like
        maxEmissiveIntensity: 0.8, // Maximum brightness when fully illuminated
      });
    }
    return this.material;
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );

    // Update material with dynamic lighting calculation
    if (this.material && lightSources.size > 0) {
      this.material.update(object.position, lightSources);
    }

    // Optional: Add satellite-specific animations like solar panel rotation
    if (this.model) {
      // Example: Slowly rotate the satellite
      this.model.rotation.y += 0.001 * timeScale;
    }
  }

  dispose(): void {
    super.dispose();

    // Clean up materials
    if (this.material) {
      this.material.dispose();
    }

    // Clean up fallback mesh
    if (this.fallbackMesh) {
      if (this.fallbackMesh.material) {
        (this.fallbackMesh.material as THREE.Material).dispose();
      }
      if (this.fallbackMesh.geometry) {
        this.fallbackMesh.geometry.dispose();
      }
    }

    // Clean up billboard
    if (this.billboard) {
      this.billboard.material.dispose();
      if (this.billboard.material.map) {
        this.billboard.material.map.dispose();
      }
    }

    // Clean up satellite group (the model instances are clones, so we can dispose them)
    if (this.satelliteGroup) {
      this.satelliteGroup.clear();
    }

    // Reset references
    this.satelliteGroup = undefined;
    this.model = undefined;
    this.fallbackMesh = undefined;
    this.billboard = undefined;

    // Note: We don't dispose cached models as they may be used by other instances
  }
}
