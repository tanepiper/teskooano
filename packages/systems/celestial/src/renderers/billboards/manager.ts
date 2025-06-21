import {
  AU_METERS,
  CelestialType,
  RenderableCelestialObject,
  SCALE,
} from "@teskooano/data-types";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { BillboardLODConfig } from "./types";
import { createBillboardSprite } from "./billboard-utils";
import { BillboardInfo } from "./types";

/**
 * Manages the lifecycle and visibility of all billboard sprites in the scene.
 * This class encapsulates the logic for creating, updating, and disposing of
 * billboards, which are used as low-detail representations of celestial objects
 * at great distances.
 */
export class BillboardManager {
  /**
   * Statically cached texture for all billboards to ensure it's created only once.
   * @private
   */
  private static _billboardTexture: THREE.CanvasTexture | null = null;
  /**
   * Map to store BillboardInfo for managing dynamic billboard properties,
   * keyed by celestial object ID.
   * @private
   */
  private billboardsInfo: Map<string, BillboardInfo> = new Map();

  /**
   * Configuration for billboard visibility distances in Astronomical Units (AU).
   * These values determine the camera distance at which billboards for different
   * celestial types become visible or hidden.
   * @private
   */
  private visibilityConfig = {
    planet: 90,
    gasGiant: 190,
    moon: 2,
    ejectedMoon: 2000,
    secondaryStar: 3000,
    default: 2,
  };

  constructor() {}

  /**
   * Creates a standardized billboard LOD level.
   * This centralizes the creation of the sprite, its group, and registers it for updates.
   * @param object The celestial object for which to create the billboard.
   * @param config Configuration for the billboard's appearance and behavior.
   * @returns An LODLevel object containing the configured billboard.
   */
  public createBillboardLOD(
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

  /**
   * Updates the visibility and opacity of all managed billboards.
   * This method should be called once per frame. It calculates which billboards
   * should be visible based on camera distance and hierarchical rules (e.g., hiding
   * moon billboards if their parent planet is also a billboard).
   * @param camera The main scene camera.
   * @param allObjects A map of all renderable celestial objects in the scene.
   * @param allMeshes A map of all THREE.Object3D meshes in the scene.
   */
  public update(
    camera: THREE.Camera,
    allObjects: Record<string, RenderableCelestialObject>,
    allMeshes: Record<string, THREE.Object3D>,
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

          if (!parentId) {
            isVisibleByRule = distanceToSelf < config.ejectedMoon;
            break;
          }

          const parentData = allObjects[parentId];
          const parentObject = allMeshes[parentId];
          if (!parentObject || !parentData) {
            isVisibleByRule = false;
            break;
          }

          if (
            parentObject instanceof THREE.LOD &&
            parentObject.levels.length > 0
          ) {
            const billboardLevel =
              parentObject.levels[parentObject.levels.length - 1];
            if (billboardLevel.object.visible) {
              isVisibleByRule = false;
              break;
            }
          }

          const parentPosition = new THREE.Vector3();
          parentObject.getWorldPosition(parentPosition);
          const distanceToParent = cameraPosition.distanceTo(parentPosition);
          if (distanceToParent > config.moon) {
            isVisibleByRule = false;
            break;
          }

          isVisibleByRule = true;
          break;
        }
        default:
          isVisibleByRule = distanceToSelf < config.default;
      }

      let targetOpacity;
      const baseSpriteOpacity = 0.85;

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
   * Disposes of all resources used by the billboards, including their materials.
   * This should be called when the renderer is being destroyed to prevent memory leaks.
   */
  public dispose(): void {
    this.billboardsInfo.forEach(({ sprite }) => {
      sprite.material.dispose();
    });
    this.billboardsInfo.clear();
  }

  /**
   * Retrieves or creates the shared texture used for all billboard sprites.
   * The texture is a simple radial gradient, cached statically to avoid
   * recreating it for every billboard.
   * @private
   * @returns The shared `CanvasTexture` for billboards.
   */
  private getBillboardTexture(): THREE.CanvasTexture {
    if (BillboardManager._billboardTexture) {
      return BillboardManager._billboardTexture;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 64;
    canvas.height = 64;
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
    gradient.addColorStop(1, "rgba(255,255,255,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);

    const texture = new THREE.CanvasTexture(canvas);
    BillboardManager._billboardTexture = texture;
    return texture;
  }

  /**
   * Converts a distance in Astronomical Units (AU) to scene units.
   * This is used to translate the abstract visibility distances in `visibilityConfig`
   * into concrete distances usable for LOD checks.
   * @param au The distance in AU.
   * @private
   * @returns The equivalent distance in scene units.
   */
  private auToSceneUnits(au: number): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return (au * AU_METERS) / scale;
  }
}
