import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import {
  RenderableCelestialObject,
  SatelliteProperties,
  CelestialType,
} from "@teskooano/data-types";

import {
  BaseCelestialRenderer,
  type CelestialMeshOptions,
  type LightSourcesMap,
  createFallbackSphere,
  LODLevel,
} from "@teskooano/renderer-threejs-celestial";
import { SatelliteMaterial } from "./material";
import { METERS_TO_SCENE_UNITS } from "@teskooano/data-values";

/**
 * Renderer for satellite objects using 3D models (GLB, GLTF, etc.)
 *
 * Features:
 * - GLB/GLTF model loading with caching
 * - Automatic scaling based on object radius and scene units
 * - LOD system with model at high detail, billboard at distance
 * - Enhanced materials with lighting and emission effects
 * - Fallback sphere for loading failures
 * - Proper model centering and origin handling
 */
export class SatelliteRenderer extends BaseCelestialRenderer {
  private static modelCache = new Map<string, THREE.Group>();
  private static loadingPromises = new Map<string, Promise<THREE.Group>>();

  private satelliteGroup?: THREE.Group; // Main group that holds either model or fallback
  private model?: THREE.Group;
  private mediumDetailModel?: THREE.Group; // Medium detail version of the model
  private billboard?: THREE.Sprite;
  private loader: GLTFLoader;
  private dracoLoader: DRACOLoader;
  private material?: SatelliteMaterial;
  private isLoading = false;
  private loadingFailed = false;
  private fallbackMesh?: THREE.Mesh;
  private modelBoundingBox = new THREE.Box3();
  private currentObject?: RenderableCelestialObject;
  private _cachedLODLevels?: LODLevel[]; // Store current object reference
  private objectId: string;

  constructor(object: RenderableCelestialObject) {
    super(object);
    this.objectId = object.id;
    this.dracoLoader = new DRACOLoader();
    // Set the path to the Draco decoder files (relative to your public directory)
    // this.dracoLoader.setDecoderPath('/draco/'); // You must copy the decoder files to public/draco/
    this.dracoLoader.setDecoderPath(
      "https://www.gstatic.com/draco/v1/decoders/",
    );
    this.dracoLoader.setDecoderConfig({ type: "js" });
    this.loader = new GLTFLoader();
    this.loader.setDRACOLoader(this.dracoLoader);
  }

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // If we already have LOD levels cached, return them
    if (this._cachedLODLevels) {
      return this._cachedLODLevels;
    }

    this.currentObject = object; // Store the current object
    const properties = object.properties as SatelliteProperties;
    if (!properties?.modelPath) {
      console.warn(
        `[SatelliteRenderer] No modelPath provided for ${object.id}`,
      );
      this._cachedLODLevels = this.createFallbackLOD(object);
      return this._cachedLODLevels;
    }

    // Create the main group that will hold either the model or fallback
    if (!this.satelliteGroup) {
      this.satelliteGroup = new THREE.Group();
      this.satelliteGroup.name = `satellite-group-${object.id}`;

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

    // Ensure we have valid objects for all LOD levels
    const levels: LODLevel[] = [
      {
        distance: 0,
        object: this.satelliteGroup,
      },
    ];

    // Only add billboard level if it was successfully created
    if (this.billboard) {
      levels.push({
        distance: 5000, // Switch to billboard at 5km distance (in scene units)
        object: this.billboard,
      });
    }

    // Cache the LOD levels to prevent recreation
    this._cachedLODLevels = levels;
    return levels;
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
      loadingPromise = this.loadGLTFModel(modelPath, object);
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
      // Removed fallback mesh
    }

    // Add the loaded model
    this.satelliteGroup.add(this.model);
    // Added model to satellite group

    // Create the medium detail model now that we have the high detail model
    this.createMediumDetailModel(this.currentObject!);
  }

  private async loadGLTFModel(
    modelPath: string,
    object: RenderableCelestialObject,
  ): Promise<THREE.Group> {
    return new Promise((resolve, reject) => {
      this.loader.load(
        modelPath,
        (gltf) => {
          const model = gltf.scene;
          model.scale.set(1, 1, 1);
          const properties = object.properties as SatelliteProperties;
          model.scale.setScalar(
            this.calculateSatelliteScale(object, properties),
          );

          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              // Compute vertex normals for proper lighting calculations
              // This is crucial for materials to respond correctly to lighting
              if (child.geometry) {
                child.geometry.computeVertexNormals();
              }

              // Set shadow properties
              child.castShadow = true;
              child.receiveShadow = true;

              // Set render order to ensure satellites render before transparent objects
              child.renderOrder = 0;

              // Ensure the material is compatible with lighting
              if (child.material) {
                // Create satellite material that preserves original textures
                const originalMaterial = child.material;
                const properties = this.currentObject
                  ?.properties as SatelliteProperties;

                // Use custom material properties if available, otherwise use defaults
                const materialProperties = properties?.materialProperties || {};
                const satelliteMaterial = new SatelliteMaterial({
                  color: originalMaterial.color || new THREE.Color(0xdddddd),
                  metalness: materialProperties.metalness ?? 0.7,
                  roughness: materialProperties.roughness ?? 0.3,
                  maxEmissiveIntensity: 0.8,
                  envMapIntensity: materialProperties.envMapIntensity ?? 1.0,
                  originalMaterial: originalMaterial, // Pass original material to preserve textures
                });
                child.material = satelliteMaterial;
              }

              // Set name for debugging
              child.name = `satellite_mesh_${child.name || "unnamed"}`;
            }
          });

          // Set the model name
          model.name = "satellite_model";

          resolve(model);
        },
        (progress) => {
          // Optional: Handle loading progress
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

    // Calculate the appropriate scale for this satellite based on its real-world size
    const finalScale = this.calculateSatelliteScale(object, properties);

    // Apply the scale
    this.model.scale.setScalar(finalScale);

    // Set name for debugging
    this.model.name = `satellite_${object.id}`;

    // Ensure shadow settings and names are correct for enhanced materials
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // Ensure the mesh receives shadows and casts shadows
        child.receiveShadow = true;
        child.castShadow = true;

        // Set render order to ensure satellites render before transparent objects
        child.renderOrder = 0;

        // Set name for debugging
        child.name = `${object.id}_mesh_${child.name || "unnamed"}`;
      }
    });
  }

  /**
   * Calculates the appropriate scale for a satellite based on its real-world size
   * and the scene's scale (1 unit = 1 AU)
   */
  private calculateSatelliteScale(
    object: RenderableCelestialObject,
    properties: SatelliteProperties,
  ): number {
    // Get the real-world size of the satellite in meters
    const realSizeM = object.realRadius_m * 2; // Convert radius to diameter

    // Convert to scene units (where 1 AU = 1000 units)
    const sceneUnits = realSizeM * METERS_TO_SCENE_UNITS;

    // Apply any custom model scale from properties FIRST
    const modelScale = properties.modelScale ?? 1.0;

    const finalScale = sceneUnits * modelScale;
    return finalScale;
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

    // Scale billboard based on the satellite's size for consistency
    const properties = object.properties as SatelliteProperties;
    const billboardScale =
      this.calculateSatelliteScale(object, properties) * 0.1; // 10% of model size
    this.billboard.scale.setScalar(billboardScale);

    this.billboard.name = `satellite_billboard_${object.id}`;
    this.billboard.renderOrder = 0; // Ensure satellites render before transparent objects
  }

  private createMediumDetailModel(object: RenderableCelestialObject): void {
    if (!this.model) return;

    // Create a simplified version of the model for medium detail
    // This will be a simplified geometry that maintains the basic shape
    const properties = object.properties as SatelliteProperties;

    // Create a simple box geometry that approximates the satellite's shape
    const modelSize = this.modelBoundingBox.getSize(new THREE.Vector3());
    const boxGeometry = new THREE.BoxGeometry(
      modelSize.x * 0.8, // Slightly smaller than the original
      modelSize.y * 0.8,
      modelSize.z * 0.8,
    );

    // Use the same material as the high detail model
    const material = this.createSatelliteMaterial();

    const mediumDetailMesh = new THREE.Mesh(boxGeometry, material);
    mediumDetailMesh.name = `satellite_medium_${object.id}`;
    mediumDetailMesh.renderOrder = 0; // Ensure satellites render before transparent objects

    // Create a group to hold the medium detail mesh
    this.mediumDetailModel = new THREE.Group();
    this.mediumDetailModel.name = `satellite-medium-group-${object.id}`;
    this.mediumDetailModel.add(mediumDetailMesh);

    // Apply the same scale as the original model
    const scaleFactor = this.calculateSatelliteScale(object, properties);
    this.mediumDetailModel.scale.setScalar(scaleFactor);
  }

  private createFallbackMesh(object: RenderableCelestialObject): void {
    this.fallbackMesh = createFallbackSphere(object) as THREE.Mesh;
    this.fallbackMesh.material = this.createSatelliteMaterial(); // No original material for fallback
    this.fallbackMesh.renderOrder = 0; // Ensure satellites render before transparent objects
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
        distance: 1000, // Switch to billboard at 1km distance (in scene units) - much closer than before
        object: this.billboard!,
      },
    ];
  }

  private createSatelliteMaterial(
    originalMaterial?: THREE.Material,
  ): SatelliteMaterial {
    if (!this.material) {
      this.material = new SatelliteMaterial({
        color: new THREE.Color(0xdddddd), // Clean satellite color
        metalness: 0.7, // Metallic satellite materials
        roughness: 0.3, // Smooth but not mirror-like
        maxEmissiveIntensity: 0.8, // Maximum brightness when fully illuminated
        originalMaterial: originalMaterial, // Preserve textures if provided
      });
    }
    return this.material;
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
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

    // Apply centralized light attenuation like other renderers
    let attenuatedLightSources = this.applyLightAttenuation(
      object,
      lightSources,
    );

    // Special handling for rogue objects (satellites without parents)
    // These objects are often very far from stars and need minimum lighting to remain visible
    if (!object.parentId && object.type === CelestialType.SATELLITE) {
      // For rogue satellites, ensure they get minimum lighting even at great distances
      attenuatedLightSources = this.ensureMinimumLightingForRogueObject(
        object,
        attenuatedLightSources,
        lightSources,
      );
    }

    // Calculate dynamic ambient light based on nearby stars
    const dynamicAmbientIntensity =
      this.lightingManager.calculateDynamicAmbientLightWithStarData(
        object,
        lightSources, // Use original light sources for ambient calculation, not attenuated
        allObjects,
      );

    // Find shadow casters using centralized utility
    const shadowCasters = this.findShadowCasters(object, allObjects);

    // Update the satellite material with lighting information
    if (this.material && attenuatedLightSources.size > 0) {
      // Update dynamic ambient lighting
      if (this.material.uniforms.uDynamicAmbientIntensity) {
        this.material.uniforms.uDynamicAmbientIntensity.value =
          dynamicAmbientIntensity;
      }

      this.material.update(
        object.position,
        attenuatedLightSources,
        shadowCasters,
      );
    }

    // Update lighting for all materials in the model
    if (this.model && attenuatedLightSources.size > 0) {
      this.model.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          // Update our custom satellite materials with lighting information
          if (child.material instanceof SatelliteMaterial) {
            // Update dynamic ambient lighting
            if (child.material.uniforms.uDynamicAmbientIntensity) {
              child.material.uniforms.uDynamicAmbientIntensity.value =
                dynamicAmbientIntensity;
            }

            child.material.update(
              object.position,
              attenuatedLightSources,
              shadowCasters,
            );
          }
        }
      });
    }

    // Optional: Add satellite-specific animations like solar panel rotation
    if (this.model) {
      // Example: Slowly rotate the satellite
      this.model.rotation.y += 0.001 * timeScale;
    }
  }

  /**
   * Ensures rogue satellites (those without parents) get minimum lighting
   * even when they're very far from stars, to maintain visibility
   */
  private ensureMinimumLightingForRogueObject(
    object: RenderableCelestialObject,
    attenuatedLightSources: LightSourcesMap,
    originalLightSources: LightSourcesMap,
  ): LightSourcesMap {
    // Create a new map to avoid modifying the original
    const enhancedLightSources = new Map(attenuatedLightSources);

    // Check if any light source has very low intensity (indicating great distance)
    let hasVeryLowLighting = false;
    for (const lightData of enhancedLightSources.values()) {
      if (lightData.intensity && lightData.intensity < 0.1) {
        hasVeryLowLighting = true;
        break;
      }
    }

    // If lighting is very low, boost it to ensure visibility
    if (hasVeryLowLighting) {
      for (const [lightId, lightData] of enhancedLightSources.entries()) {
        // Ensure minimum intensity of 0.3 for rogue objects
        const minIntensity = 0.3;
        if (lightData.intensity && lightData.intensity < minIntensity) {
          lightData.intensity = minIntensity;
        }
      }
    }

    return enhancedLightSources;
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
    this.mediumDetailModel = undefined; // Clear medium detail model
    this.fallbackMesh = undefined;
    this.billboard = undefined;
    this.currentObject = undefined; // Reset current object

    // Note: We don't dispose cached models as they may be used by other instances
    this.dracoLoader.dispose();
  }
}
