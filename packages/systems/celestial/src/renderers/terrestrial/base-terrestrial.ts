import {
  PlanetProperties,
  PlanetType,
  ProceduralSurfaceProperties, // Added import
  SCALE,
  SurfaceType,
} from "@teskooano/data-types";
import * as THREE from "three";
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from "../index";
import { AtmosphereMaterial } from "./materials/atmosphere.material";
import { CloudMaterial } from "./materials/clouds.material";
import { ProceduralPlanetMaterial } from "./materials/procedural-planet.material";

import type { RenderableCelestialObject } from "@teskooano/renderer-threejs"; // Import RenderableCelestialObject

// --- IndexedDB Helper Functions ---

const DB_NAME = "textureCacheDB";
const DB_VERSION = 1;
const STORE_NAME = "generatedTextures";

let dbPromise: Promise<IDBDatabase> | null = null;

function openTextureDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise;
  }
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error(
        "[IndexedDB] Database error:",
        (event.target as IDBOpenDBRequest).error,
      );
      reject((event.target as IDBOpenDBRequest).error);
      dbPromise = null; // Allow retry on next call
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "cacheKey" });
      }
      // Handle future version upgrades here if needed
    };
  });
  return dbPromise;
}

async function getTextureFromDB(
  key: string,
): Promise<{ colorBlob: Blob; normalBlob: Blob } | null> {
  try {
    const db = await openTextureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onerror = (event) => {
        console.error(
          `[IndexedDB] Error getting item with key ${key}:`,
          (event.target as IDBRequest).error,
        );
        reject((event.target as IDBRequest).error);
      };

      request.onsuccess = (event) => {
        const result = (event.target as IDBRequest).result;
        if (result && result.colorBlob && result.normalBlob) {
          resolve({
            colorBlob: result.colorBlob,
            normalBlob: result.normalBlob,
          });
        } else {
          resolve(null);
        }
      };
    });
  } catch (error) {
    console.error("[IndexedDB] Failed to open DB for get operation:", error);
    return null; // Return null if DB opening fails
  }
}

async function saveTextureToDB(
  key: string,
  colorBlob: Blob,
  normalBlob: Blob,
): Promise<void> {
  try {
    const db = await openTextureDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const item = {
        cacheKey: key,
        colorBlob: colorBlob,
        normalBlob: normalBlob,
      };
      const request = store.put(item);

      request.onerror = (event) => {
        console.error(
          `[IndexedDB] Error putting item with key ${key}:`,
          (event.target as IDBRequest).error,
        );
        // Consider specific error handling (e.g., QuotaExceededError)
        reject((event.target as IDBRequest).error);
      };

      request.onsuccess = () => {
        resolve();
      };

      transaction.oncomplete = () => {
        // Optional: log transaction completion
      };

      transaction.onerror = (event) => {
        console.error(
          "[IndexedDB] Transaction error during save:",
          (event.target as IDBTransaction).error,
        );
        reject((event.target as IDBTransaction).error);
      };
    });
  } catch (error) {
    console.error("[IndexedDB] Failed to open DB for save operation:", error);
    // Decide if failure to save should reject or just warn
    // For caching, usually just warning is acceptable
  }
}

// --- Utility Functions ---

// Simple hash function for string seeds (copied from diamond-square)
function simpleHash(str: string): number {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  // Ensure the seed is somewhat constrained and positive for the PRNG
  return Math.abs(hash % 2147483647);
}

// Define MAX_LIGHTS constant matching the shader
const MAX_LIGHTS = 4;

/**
 * Base renderer for terrestrial planets and moons
 */
export class BaseTerrestrialRenderer implements CelestialRenderer {
  protected materials: Map<string, THREE.Material> = new Map();
  protected atmosphereMaterials: Map<string, AtmosphereMaterial> = new Map();
  protected cloudMaterials: Map<string, CloudMaterial> = new Map();
  protected textureLoader: THREE.TextureLoader;
  // Cache holds color and potentially null normal textures
  protected loadedTextures: Map<
    string,
    { color: THREE.Texture | null; normal: THREE.Texture | null }
  > = new Map();
  protected startTime: number = Date.now() / 1000;
  protected elapsedTime: number = 0;
  protected objectIds: Set<string> = new Set();

  // Helper vectors for update calculations
  private _worldPos = new THREE.Vector3();
  private _lightWorldPos = new THREE.Vector3();
  private _viewLightDir = new THREE.Vector3();

  protected material: ProceduralPlanetMaterial | null = null;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    // Attempt to open DB on init, errors handled in get/save
    openTextureDB();
  }

  /**
   * Creates and returns an array of LOD levels for the terrestrial object.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    this.objectIds.add(object.celestialObjectId);

    // FIXED: Using a proper radius for visualization
    // The problem was using realRadius_m which is in meters (potentially millions of km)
    // Instead, we should use the scaled radius directly
    const baseRadius = object.radius ?? 1;
    const scale = typeof SCALE === "number" ? SCALE : 1;

    // --- Level 0: High Detail ---
    const highDetailGroup = this._createHighDetailGroup(
      object,
      options,
      baseRadius,
    );
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // --- Level 1: Medium Detail ---
    const mediumSegments = 32;
    const mediumGeometry = new THREE.SphereGeometry(
      baseRadius,
      mediumSegments,
      mediumSegments,
    );
    const mediumMaterial = new THREE.MeshStandardMaterial({
      color: this._getBasePlanetColor(object),
      roughness: 0.8,
      metalness: 0.1,
    });
    const mediumMesh = new THREE.Mesh(mediumGeometry, mediumMaterial);
    mediumMesh.name = `${object.celestialObjectId}-medium-lod`;
    const level1Group = new THREE.Group();
    level1Group.add(mediumMesh);
    const level1: LODLevel = { object: level1Group, distance: 50 * scale };

    // --- Level 2: Low Detail ---
    const lowSegments = 16;
    const lowGeometry = new THREE.SphereGeometry(
      baseRadius,
      lowSegments,
      lowSegments,
    );
    const lowMaterial = new THREE.MeshBasicMaterial({
      color: this._getBasePlanetColor(object),
      wireframe: true,
    });
    const lowMesh = new THREE.Mesh(lowGeometry, lowMaterial);
    lowMesh.name = `${object.celestialObjectId}-low-lod`;
    const level2Group = new THREE.Group();
    level2Group.add(lowMesh);
    const level2: LODLevel = { object: level2Group, distance: 200 * scale };

    const levels = [level0, level1, level2];
    return levels;
  }

  /**
   * Helper to create the high-detail group (Level 0 LOD).
   * @internal
   */
  private _createHighDetailGroup(
    object: RenderableCelestialObject,
    options: CelestialMeshOptions | undefined,
    baseRadius: number,
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `${object.celestialObjectId}-high-lod-group`;
    const segments =
      options?.segments ?? (options?.detailLevel === "high" ? 64 : 48);

    // --- Body ---
    let bodyMesh: THREE.Mesh;
    try {
      // Use proper procedural material
      const bodyMaterial = this.createPlanetMaterial(object);
      this.initializeMaterialMap(object.celestialObjectId, bodyMaterial);
      const bodyGeometry = new THREE.SphereGeometry(
        baseRadius,
        segments,
        segments,
      );
      bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    } catch (error) {
      console.error(
        `[BaseTerrestrialRenderer] Error creating procedural material for ${object.celestialObjectId}:`,
        error,
      );
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.1,
      });
      this.initializeMaterialMap(object.celestialObjectId, fallbackMaterial);
      const bodyGeometry = new THREE.SphereGeometry(
        baseRadius,
        segments,
        segments,
      );
      bodyMesh = new THREE.Mesh(bodyGeometry, fallbackMaterial);
      console.warn(
        `[BaseTerrestrialRenderer] Created fallback body mesh for ${object.celestialObjectId}:`,
        bodyMesh,
      );
    }
    bodyMesh.name = `${object.celestialObjectId}-body`;
    group.add(bodyMesh);

    // --- Clouds (Optional) ---
    const cloudMesh = this.addClouds(object, segments, baseRadius);
    if (cloudMesh) {
      group.add(cloudMesh);
    }

    // --- Atmosphere (Optional) ---
    const atmosphereMesh = this.addAtmosphere(object, segments, baseRadius);
    if (atmosphereMesh) {
      group.add(atmosphereMesh);
    }
    return group;
  }

  /**
   * Initialize the materials map with the created material
   */
  protected initializeMaterialMap(id: string, material: THREE.Material): void {
    this.materials.set(id, material);
  }

  /**
   * Create material for the planet using default shader settings.
   * Resolves default colors based on planet type if needed.
   */
  protected createPlanetMaterial(
    object: RenderableCelestialObject,
  ): ProceduralPlanetMaterial {
    if (!object.celestialObjectId) {
      throw new Error(
        "[createPlanetMaterial] CelestialObject must have an id.",
      );
    }

    const specificSurfaceProps = (object.properties as PlanetProperties)
      ?.surface as ProceduralSurfaceProperties | undefined;
    const planetProps = object.properties as PlanetProperties | undefined;
    const planetType = planetProps?.planetType ?? (object as any).planetType;

    // --- Define default simple colors ---
    let simplePalette = {
      low: "#5179B5", // Default blueish low color
      mid1: "#4C9341", // Default green
      mid2: "#836F27", // Default yellow/brown
      high: "#A0A0A0", // Default grey/rock high color
    };

    // --- Adjust simple palette based on planet type ---
    if (planetType) {
      switch (planetType) {
        case PlanetType.LAVA:
          simplePalette = {
            low: "#3B0B00",
            mid1: "#801800",
            mid2: "#D44000",
            high: "#FF6B00",
          }; // Reds/Oranges
          break;
        case PlanetType.ICE:
          simplePalette = {
            low: "#A0D2DB",
            mid1: "#C0ECF1",
            mid2: "#E1FEFF",
            high: "#FFFFFF",
          }; // Light blues/Whites
          break;
        case PlanetType.DESERT:
          simplePalette = {
            low: "#A0522D",
            mid1: "#D2B48C",
            mid2: "#E0C9A6",
            high: "#F5E6CA",
          }; // Browns/Tans
          break;
        case PlanetType.TERRESTRIAL:
          // Keep the default earth-like palette
          break;
        case PlanetType.ROCKY:
        case PlanetType.BARREN:
          simplePalette = {
            low: "#303030",
            mid1: "#606060",
            mid2: "#808080",
            high: "#B0B0B0",
          }; // Grayscale for rocky/barren
          break;
      }
    }

    // --- Build final properties for the material constructor ---
    const finalProps: ProceduralSurfaceProperties = {
      type: specificSurfaceProps?.type ?? SurfaceType.FLAT,
      color: specificSurfaceProps?.color ?? "#808080", // Fallback color (might not be used)
      roughness: specificSurfaceProps?.roughness ?? 0.8,

      // Noise parameters (for fragment shader)
      persistence: specificSurfaceProps?.persistence ?? 0.5,
      lacunarity: specificSurfaceProps?.lacunarity ?? 2.0,
      octaves: specificSurfaceProps?.octaves ?? 6,
      simplePeriod: specificSurfaceProps?.simplePeriod ?? 4.0,

      // NEW Simple Colors - Use derived palette, allow overrides
      colorLow: specificSurfaceProps?.colorLow ?? simplePalette.low,
      colorMid1: specificSurfaceProps?.colorMid1 ?? simplePalette.mid1,
      colorMid2: specificSurfaceProps?.colorMid2 ?? simplePalette.mid2,
      colorHigh: specificSurfaceProps?.colorHigh ?? simplePalette.high,
    };

    const material = new ProceduralPlanetMaterial(finalProps);
    material.needsUpdate = true;

    return material;
  }

  /**
   * Update uniforms for the planet based on time and lighting.
   */
  update(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    camera?: THREE.Camera,
  ): void {
    // Create default light if none provided
    if (!lightSources || lightSources.size === 0) {
      console.warn(
        "[BaseTerrestrialRenderer] No light sources provided, adding default light",
      );
      lightSources = new Map<
        string,
        { position: THREE.Vector3; color: THREE.Color; intensity: number }
      >();
      lightSources.set("default_sun", {
        position: new THREE.Vector3(1, 0.3, 0.5).normalize(),
        color: new THREE.Color(0xffffff),
        intensity: 1.5,
      });
    }

    // Iterate through stored materials and update them
    this.materials.forEach((material) => {
      if (material instanceof ProceduralPlanetMaterial) {
        material.update(time, lightSources, camera);
      }
      // Add updates for other material types if needed (e.g., MeshStandardMaterial for LOD levels?)
      // Probably not needed here as LODManager handles switching meshes.
    });

    // Update cloud materials
    this.cloudMaterials.forEach((material) => {
      let sunPos: THREE.Vector3 | undefined = undefined;
      if (lightSources && lightSources.size > 0) {
        const firstLight = lightSources.values().next().value;
        if (firstLight) sunPos = firstLight.position;
      }
      if (camera) {
        material.update(time, camera.position, sunPos);
      } else {
        console.warn(
          "[BaseTerrestrialRenderer] Camera not available for cloud material update.",
        );
        material.update(time, new THREE.Vector3(0, 0, 1), sunPos);
      }
    });

    // Update atmosphere materials
    this.atmosphereMaterials.forEach((material) => {
      let sunPos: THREE.Vector3 | undefined = undefined;
      if (lightSources && lightSources.size > 0) {
        const firstLight = lightSources.values().next().value;
        if (firstLight) sunPos = firstLight.position;
      }
      material.update(time, sunPos);
    });
  }

  /**
   * Dispose of all materials and textures
   */
  dispose(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();

    this.atmosphereMaterials.forEach((material) => material.dispose());
    this.atmosphereMaterials.clear();

    this.cloudMaterials.forEach((material) => material.dispose());
    this.cloudMaterials.clear();

    // Dispose loaded textures
    this.loadedTextures.forEach((textures) => {
      textures.color?.dispose();
      textures.normal?.dispose();
    });
    this.loadedTextures.clear();

    this.objectIds.clear();
  }

  /**
   * Modified addClouds to return the mesh or null.
   * @internal
   */
  protected addClouds(
    object: RenderableCelestialObject,
    segments: number = 64,
    baseRadiusInput?: number,
  ): THREE.Mesh | null {
    // Return type changed
    const props = object.properties as PlanetProperties | undefined;
    const clouds = props?.clouds;
    if (!clouds) return null;

    const baseRadius =
      baseRadiusInput ?? object.realRadius_m ?? object.radius ?? 1;
    const cloudRadius = baseRadius * 1.015;

    let cloudColor = new THREE.Color(0xffffff);
    let cloudOpacity = 0.8;
    let cloudSpeed = 1.0;

    if (clouds) {
      if (clouds.color) cloudColor = new THREE.Color(clouds.color);
      if (clouds.opacity !== undefined) cloudOpacity = clouds.opacity;
      if (clouds.speed !== undefined) cloudSpeed = clouds.speed;
    } else {
      if (props?.planetType === PlanetType.LAVA) {
        cloudColor = new THREE.Color(0x555555);
        cloudSpeed = 1.5;
      } else if (props?.planetType === PlanetType.ICE) {
        cloudOpacity = 0.6;
      }
    }

    const cloudGeometry = new THREE.SphereGeometry(
      cloudRadius,
      segments,
      segments,
    );
    const cloudMaterial = new CloudMaterial({
      color: cloudColor,
      opacity: cloudOpacity,
      speed: cloudSpeed,
      sunPosition: new THREE.Vector3(1, 0, 0),
    });

    const cloudMesh = new THREE.Mesh(cloudGeometry, cloudMaterial);
    cloudMesh.name = `${object.celestialObjectId}-clouds`;
    cloudMesh.renderOrder = 1;
    this.cloudMaterials.set(object.celestialObjectId, cloudMaterial);
    // group.add(cloudMesh); // REMOVED - Returning mesh instead
    return cloudMesh;
  }

  /**
   * Modified addAtmosphere to return the mesh or null.
   * @internal
   */
  protected addAtmosphere(
    object: RenderableCelestialObject,
    segments: number = 64,
    baseRadiusInput?: number,
  ): THREE.Mesh | null {
    // Return type changed
    const props = object.properties as PlanetProperties | undefined;
    const atmosphereProps = props?.atmosphere;
    if (!atmosphereProps) return null;

    const baseRadius =
      baseRadiusInput ?? object.realRadius_m ?? object.radius ?? 1;
    const atmosphereRadius = baseRadius * 1.05;
    const atmosphereGeometry = new THREE.SphereGeometry(
      atmosphereRadius,
      segments,
      segments,
    );

    let atmosphereColor = new THREE.Color(atmosphereProps.color || "#FFFFFF");
    if (!atmosphereProps.color) {
      if (props?.planetType === PlanetType.LAVA) {
        atmosphereColor = new THREE.Color("#FF6644");
      } else {
        atmosphereColor = new THREE.Color("#88AAFF");
      }
    }

    const opacity = atmosphereProps.opacity ?? 0.7;
    const atmosphereMaterial = new AtmosphereMaterial(atmosphereColor, {
      opacity: opacity,
      sunPosition: new THREE.Vector3(1, 0, 0),
    });

    const atmosphereMesh = new THREE.Mesh(
      atmosphereGeometry,
      atmosphereMaterial,
    );
    atmosphereMesh.name = `${object.celestialObjectId}-atmosphere`;
    atmosphereMesh.renderOrder = 2;
    this.atmosphereMaterials.set(object.celestialObjectId, atmosphereMaterial);
    // group.add(atmosphereMesh); // REMOVED - Returning mesh instead
    return atmosphereMesh;
  }

  /**
   * Helper to get a representative base color for the planet (used for simpler LOD levels).
   * @internal
   */
  private _getBasePlanetColor(object: RenderableCelestialObject): THREE.Color {
    const planetProps = object.properties as PlanetProperties | undefined;
    const planetType = planetProps?.planetType ?? (object as any).planetType;
    const specificSurfaceProps = planetProps?.surface as
      | ProceduralSurfaceProperties
      | undefined;

    // Prefer the specific colorLow if defined
    if (specificSurfaceProps?.colorLow) {
      return new THREE.Color(specificSurfaceProps.colorLow);
    }

    // Fallback based on planet type
    if (planetType) {
      switch (planetType) {
        case PlanetType.LAVA:
          return new THREE.Color("#801800"); // Mid1
        case PlanetType.ICE:
          return new THREE.Color("#C0ECF1"); // Mid1
        case PlanetType.DESERT:
          return new THREE.Color("#D2B48C"); // Mid1
        case PlanetType.TERRESTRIAL:
          return new THREE.Color("#4C9341"); // Default Mid1 (Green)
        case PlanetType.ROCKY:
        case PlanetType.BARREN:
          return new THREE.Color("#606060"); // Mid1
      }
    }

    // Absolute fallback
    return new THREE.Color("#808080"); // Grey
  }
}
