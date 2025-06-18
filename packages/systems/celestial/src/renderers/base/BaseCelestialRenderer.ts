import * as THREE from "three";
import {
  CelestialMeshOptions,
  CelestialRenderer,
  LightSourceData,
  LightSourcesMap,
} from "./CelestialRenderer";
import {
  AU_METERS,
  CelestialType,
  RenderableCelestialObject,
  SCALE,
} from "@teskooano/data-types";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import {
  BillboardInfo,
  calculateDistantSpriteSize,
  createBillboardSprite,
} from "../billboards";

export interface BillboardLODConfig {
  distance: number;
  size: number;
  color: THREE.Color;
  albedo?: number;
  light?: THREE.PointLight;
}

export interface BaseCelestialRendererOptions {
  lightingManager?: LightingManager;
}

/**
 * Abstract base class for all celestial renderers
 *
 * Provides common functionality:
 * - Material and resource management
 * - Light source handling
 * - Basic time tracking
 * - Utility methods for LOD
 */
export abstract class BaseCelestialRenderer implements CelestialRenderer {
  /**
   * Statically cached texture for all billboards to ensure it's created only once.
   * @private
   */
  private static _billboardTexture: THREE.CanvasTexture | null = null;

  /**
   * Map of materials for different objects
   * Key: object ID, Value: material instance
   */
  public materials: Map<string, THREE.Material | THREE.Material[]> = new Map();

  /**
   * Map of LOD levels for different objects
   * Key: object ID, Value: LOD instance
   */
  protected lods: Map<string, THREE.LOD> = new Map();

  /**
   * The start time of the renderer (used to calculate elapsed time)
   */
  protected startTime: number = Date.now() / 1000;

  /**
   * The current elapsed time
   */
  protected elapsedTime: number = 0;

  /**
   * Reusable vectors for calculations
   * Using instance variables avoids allocation in update loops
   */
  protected _tempVector1: THREE.Vector3 = new THREE.Vector3();
  protected _tempVector2: THREE.Vector3 = new THREE.Vector3();
  protected _tempVector3: THREE.Vector3 = new THREE.Vector3();
  protected lightingManager?: LightingManager;

  /**
   * Map to store BillboardInfo for managing dynamic billboard properties, keyed by celestial object ID.
   */
  protected billboardsInfo: Map<string, BillboardInfo> = new Map();

  constructor(options: BaseCelestialRendererOptions = {}) {
    this.lightingManager = options.lightingManager;
  }

  /**
   * Get LOD levels for a celestial object
   * Must be implemented by subclasses
   */
  abstract getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  /**
   * Update the renderer with the current simulation state
   * Default implementation updates time-based uniforms for the specific object's material.
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    this.updateLOD(object.celestialObjectId, camera);
    this.updateBillboards(camera, allObjects, allMeshes);
  }

  /**
   * Default implementation of LOD updating
   * Subclasses should override if they use custom LOD handling
   */
  updateLOD(objectId: string, camera: THREE.Camera): void {
    const lod = this.lods.get(objectId);
    if (lod) {
      lod.update(camera as THREE.Camera);
    }
  }

  private visibilityConfig = {
    planet: 90,
    gasGiant: 190,
    moon: 2,
    ejectedMoon: 2000,
    secondaryStar: 3000,
    default: 2,
  };

  private auToSceneUnits(au: number): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return (au * AU_METERS) / scale;
  }

  protected updateBillboards(
    camera: THREE.Camera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    if (!camera || !allObjects || !allMeshes || this.billboardsInfo.size === 0)
      return;

    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    const config = {
      planet: this.auToSceneUnits(this.visibilityConfig.planet),
      gasGiant: this.auToSceneUnits(this.visibilityConfig.gasGiant),
      moon: this.auToSceneUnits(this.visibilityConfig.moon),
      ejectedMoon: this.auToSceneUnits(this.visibilityConfig.ejectedMoon),
      secondaryStar: this.auToSceneUnits(this.visibilityConfig.secondaryStar),
      default: this.auToSceneUnits(this.visibilityConfig.default),
    };

    const mainStarId = Object.values(allObjects).find(
      (obj) => obj.type === CelestialType.STAR && !obj.parentId,
    )?.celestialObjectId;

    this.billboardsInfo.forEach((info) => {
      const { sprite, activationDistance, object } = info;
      const material = sprite.material as THREE.SpriteMaterial;
      if (!material) return;

      // NEW VISIBILITY LOGIC
      let isVisibleByRule = false;
      const distanceToSelf = cameraPosition.distanceTo(object.position);

      switch (object.type) {
        case CelestialType.STAR: {
          if (object.celestialObjectId === mainStarId) {
            isVisibleByRule = true;
          } else {
            isVisibleByRule = distanceToSelf < config.secondaryStar;
          }
          break;
        }
        case CelestialType.PLANET:
          isVisibleByRule = distanceToSelf < config.planet;
          break;
        case CelestialType.GAS_GIANT:
          isVisibleByRule = distanceToSelf < config.gasGiant;
          break;
        case CelestialType.MOON: {
          const parentId = object.parentId;

          // Handle ejected moons first.
          if (!parentId) {
            isVisibleByRule = distanceToSelf < config.ejectedMoon;
            break;
          }

          // Get parent data. If not available, moon can't be visible.
          const parentData = allObjects[parentId];
          const parentObject = allMeshes[parentId];
          if (!parentObject || !parentData) {
            isVisibleByRule = false;
            break;
          }

          // Rule 1: Is the parent a billboard? If so, the moon is hidden.
          if (
            parentObject instanceof THREE.LOD &&
            parentObject.levels.length > 0
          ) {
            // The last level is assumed to be the billboard. Check if its object is visible.
            const billboardLevel =
              parentObject.levels[parentObject.levels.length - 1];
            if (billboardLevel.object.visible) {
              isVisibleByRule = false;
              break; // Final decision: hide.
            }
          }

          // Rule 2: Is the camera too far from the parent? (2 AU cutoff)
          const parentPosition = new THREE.Vector3();
          parentObject.getWorldPosition(parentPosition);
          const distanceToParent = cameraPosition.distanceTo(parentPosition);
          if (distanceToParent > config.moon) {
            isVisibleByRule = false;
            break; // Final decision: hide.
          }

          // If we passed both checks, the moon is allowed to be visible.
          isVisibleByRule = true;
          break;
        }
        default:
          isVisibleByRule = distanceToSelf < config.default;
      }

      // ORIGINAL FADING LOGIC, now combined with visibility rule
      let targetOpacity;
      const baseSpriteOpacity = 0.85;

      // Only show if it meets the visibility rule AND is beyond the activation distance for the billboard
      if (isVisibleByRule && distanceToSelf >= activationDistance) {
        targetOpacity = baseSpriteOpacity;
      } else {
        targetOpacity = 0.0;
      }

      const currentOpacity = material.opacity;
      let newOpacity = THREE.MathUtils.lerp(
        currentOpacity,
        targetOpacity,
        0.1, // fade speed
      );

      if (targetOpacity < 0.01 && newOpacity < 0.01) {
        newOpacity = 0;
      }
      material.opacity = newOpacity;
      sprite.visible = newOpacity > 0.001;
    });
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    this.materials.forEach((material) => {
      if (material instanceof THREE.Material) {
        Object.keys(material).forEach((key) => {
          const value = (material as any)[key];
          if (value instanceof THREE.Texture) {
            value.dispose();
          }
        });

        if (material instanceof THREE.ShaderMaterial) {
          Object.keys(material.uniforms || {}).forEach((key) => {
            const value = material.uniforms[key].value;
            if (value instanceof THREE.Texture) {
              value.dispose();
            }
          });
        }

        material.dispose();
      }
    });

    this.materials.clear();
    this.lods.clear();

    this.billboardsInfo.forEach(({ sprite }) => {
      // The material is unique to each sprite, so it's safe to dispose.
      sprite.material.dispose();
      // The texture map is static and shared, so we do not dispose of it here.
    });
    this.billboardsInfo.clear();
  }

  /**
   * Helper method to map detail level to segment count
   */
  protected getSegmentsForDetailLevel(
    detailLevel?: string,
    defaultSegments: number = 64,
  ): number {
    if (!detailLevel) return defaultSegments;

    switch (detailLevel) {
      case "high":
        return 128;
      case "medium":
        return 64;
      case "low":
        return 32;
      case "very-low":
        return 16;
      default:
        return defaultSegments;
    }
  }

  /**
   * Add a material to the materials map for tracking and disposal
   */
  public registerMaterial(id: string, material: THREE.Material): void {
    const existingMaterial = this.materials.get(id);
    if (existingMaterial) {
      (Array.isArray(existingMaterial)
        ? existingMaterial
        : [existingMaterial]
      ).forEach((m) => m.dispose());
    }
    this.materials.set(id, material);
  }

  /**
   * Utility method to safely apply a texture to a material
   * Handles uniforms for shader materials
   */
  protected applyTexture(
    material: THREE.Material,
    textureKey: string,
    texture: THREE.Texture | null,
  ): void {
    if (!texture) return;

    if (material instanceof THREE.ShaderMaterial) {
      if (material.uniforms && material.uniforms[textureKey] !== undefined) {
        material.uniforms[textureKey].value = texture;
      }
    } else {
      (material as any)[textureKey] = texture;
    }
  }

  /**
   * Calculate the appropriate LOD level based on distance
   * Returns a number between 0 and 1 representing the LOD level
   * 0 = highest detail, 1 = lowest detail
   */
  protected calculateLODLevel(distance: number, objectRadius: number): number {
    const normalizedDistance = distance / (objectRadius * 100);

    return Math.max(0, Math.min(1, normalizedDistance - 0.5));
  }

  /**
   * Helper method to get the world position of an object
   */
  protected getWorldPosition(object: RenderableCelestialObject): THREE.Vector3 {
    return object.position.clone();
  }

  /**
   * Helper to find the primary light source for an object
   */
  public findPrimaryLightSource(
    object: RenderableCelestialObject,
    lightSources?: LightSourcesMap,
  ): LightSourceData | null {
    if (!lightSources || lightSources.size === 0) return null;

    if (
      object.primaryLightSourceId &&
      lightSources.has(object.primaryLightSourceId)
    ) {
      return lightSources.get(object.primaryLightSourceId) || null;
    }

    return lightSources.values().next().value || null;
  }

  /**
   * Creates a standardized billboard LOD level.
   * This centralizes the creation of the sprite, its group, and registers it for updates.
   * @param object The celestial object for the billboard.
   * @param config Configuration for the billboard's appearance and behavior.
   * @returns An LODLevel object containing the configured billboard.
   * @protected
   */
  protected _createBillboardLOD(
    object: RenderableCelestialObject,
    config: BillboardLODConfig,
  ): LODLevel {
    const texture = this.getBillboardTexture();
    const billboardInfo = createBillboardSprite(
      object,
      texture,
      config.size,
      config.color,
      config.albedo,
    );

    billboardInfo.activationDistance = config.distance;
    billboardInfo.maxFadeDistance = config.distance * 5;

    this.billboardsInfo.set(object.celestialObjectId, billboardInfo);

    const billboardGroup = new THREE.Group();
    billboardGroup.name = `${object.celestialObjectId}-billboard-lod`;
    billboardGroup.add(billboardInfo.sprite);

    if (config.light) {
      billboardGroup.add(config.light);
    }

    return {
      object: billboardGroup,
      distance: config.distance,
    };
  }

  protected getBillboardTexture(): THREE.CanvasTexture {
    if (BaseCelestialRenderer._billboardTexture) {
      return BaseCelestialRenderer._billboardTexture;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 64; // from util
    canvas.height = 64; // from util
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Could not get 2D context for billboard texture");
    }

    const gradient = context.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      canvas.width / 2,
    );
    gradient.addColorStop(0, "rgba(255,255,255,1)");
    gradient.addColorStop(1, "rgba(255,255,255,0)"); // from util
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    BaseCelestialRenderer._billboardTexture = texture;
    return texture;
  }

  public getLOD(object: RenderableCelestialObject): THREE.LOD | undefined {
    return this.lods.get(object.celestialObjectId);
  }

  public initialize(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): void {
    // Base implementation does nothing, subclasses should override.
  }
}
