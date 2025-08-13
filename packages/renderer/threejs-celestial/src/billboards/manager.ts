import { RenderableCelestialObject } from "@teskooano/data-types";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import { LightingHelper } from "@teskooano/renderer-threejs-helpers";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import { createBillboardSprite } from "./billboard-utils";
import { BillboardInfo, BillboardLODConfig } from "./types";

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

    const light = this.createPointLightForBillboard(object, config);
    billboardInfo.light = light;

    billboardInfo.activationDistance = config.distance;
    billboardInfo.maxFadeDistance = config.distance * 4;

    this.billboardsInfo.set(object.id, billboardInfo);

    const billboardGroup = new THREE.Group();
    billboardGroup.name = `${object.id}-billboard-lod`;
    billboardGroup.add(billboardInfo.sprite);
    billboardGroup.add(light);

    // Apply correct render order for star billboards to ensure proper depth sorting
    RenderOrderManager.applyRenderOrder(billboardGroup, "star-billboard");

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
    camera: THREE.PerspectiveCamera,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allObjects: Record<string, RenderableCelestialObject>,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    allMeshes: Record<string, THREE.Object3D>,
  ): void {
    if (!camera || this.billboardsInfo.size === 0) return;

    const cameraPosition = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);

    this.billboardsInfo.forEach((info) => {
      const { sprite, activationDistance, maxFadeDistance, object, light } =
        info;
      const material = sprite.material as THREE.SpriteMaterial;
      if (!material) return;

      const distanceToSelf = cameraPosition.distanceTo(object.position);

      // --- Opacity Fading ---
      const baseSpriteOpacity = 0.85;
      const targetOpacity =
        distanceToSelf >= activationDistance ? baseSpriteOpacity : 0.0;

      const currentOpacity = material.opacity;
      let newOpacity = THREE.MathUtils.lerp(
        currentOpacity,
        targetOpacity,
        0.05, // fade speed
      );

      if (targetOpacity < 0.01 && newOpacity < 0.01) {
        newOpacity = 0;
      }
      material.opacity = newOpacity;
      sprite.visible = newOpacity > 0.001;

      // --- Light Fading ---
      if (light) {
        // Light starts fading at activationDistance and is fully gone by maxFadeDistance
        const lightFadeFactor = THREE.MathUtils.smoothstep(
          distanceToSelf,
          activationDistance,
          maxFadeDistance,
        );
        const targetIntensity =
          (1 - lightFadeFactor) * (light.userData.originalIntensity || 1);

        light.intensity = THREE.MathUtils.lerp(
          light.intensity,
          targetIntensity,
          0.05, // fade speed
        );

        if (targetIntensity < 0.01 && light.intensity < 0.01) {
          light.intensity = 0;
        }
      }
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
   * Creates a point light for a billboard based on its color and albedo.
   * @param object The celestial object.
   * @param config The billboard configuration.
   * @returns A new THREE.PointLight.
   */
  private createPointLightForBillboard(
    object: RenderableCelestialObject,
    config: BillboardLODConfig,
  ): THREE.PointLight {
    // --- Light Color ---
    // Use a desaturated, brighter version of the object's color for the light
    // to increase perceived brightness while retaining the hue.
    const hsl = { h: 0, s: 0, l: 0 };
    config.color.getHSL(hsl);
    const lightColor = new THREE.Color().setHSL(hsl.h, 0.4, 0.85);

    // --- Light Intensity ---
    // Intensity is a factor of the color's luminance and the albedo.
    // A base value is added to ensure dark planets are still visible,
    // and a larger multiplier is used for overall brightness.
    const lightIntensity =
      (0.2 + config.color.getHSL({ h: 0, s: 0, l: 0 }).l) *
      (config.albedo ?? 0.3);

    const pointLight = LightingHelper.createPointLight({
      color: lightColor.getHex(),
      intensity: lightIntensity,
      decay: 2,
      distance: 0,
      name: `${object.id}-billboard-lod-light`,
    });
    // Store the original intensity for fading calculations
    pointLight.userData.originalIntensity = lightIntensity;
    return pointLight;
  }
}
