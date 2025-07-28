import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import { LightingHelper } from "@teskooano/renderer-threejs-helpers";
import * as THREE from "three";
import { BillboardInfo } from "./types";

/**
 * Creates the sprite for the star billboard.
 * The sprite uses additive blending and its size is in screen space.
 * @param object - The renderable celestial object (star).
 * @param texture - The texture to use for the sprite.
 * @param size - The size of the sprite (typically in screen space units).
 * @param starColor - The color of the star, used to tint the sprite.
 * @param albedo - The albedo factor to calculate the final color of the sprite.
 * @returns A THREE.Sprite configured for billboard rendering.
 */
export function createBillboardSprite(
  object: RenderableCelestialObject,
  texture: THREE.Texture,
  size: number,
  starColor: THREE.Color,
  albedo: number = 0.3,
): BillboardInfo {
  const finalColor = starColor.clone().multiplyScalar(albedo);

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    color: finalColor,
    blending: THREE.NormalBlending,
    sizeAttenuation: false, // Size is in screen space
    transparent: true, // Set to false so it writes to depth buffer properly
    opacity: 0.8, // Start with opaque, actual opacity will be handled by billboardManager.update
    depthWrite: true,
    depthTest: true,
    userData: {
      isBillboard: true,
      celestialObjectId: object.celestialObjectId,
      position: object.position,
      albedo,
      color: starColor.getHex(),
    },
  });

  const distantSprite = new THREE.Sprite(spriteMaterial);
  distantSprite.name = `${object.celestialObjectId}-distant-sprite`;
  distantSprite.scale.set(size / 2, size / 2, 1.0);

  return {
    sprite: distantSprite,
    object,
    activationDistance: 0,
    maxFadeDistance: 0,
  };
}

/**
 * Creates a point light associated with the star billboard.
 * The light's intensity is derived from the star material's glowIntensity uniform.
 * @param object - The renderable celestial object (star).
 * @param starColor - The color of the star.
 * @param starMaterial - The star's primary shader material (used to get glowIntensity).
 * @returns A THREE.PointLight to enhance the billboard's appearance from a distance.
 */
export function createBillboardPointLight(
  object: RenderableCelestialObject,
  starColor: THREE.Color,
  starMaterial: THREE.ShaderMaterial, // Assuming getMaterial() is accessible or passed
): THREE.PointLight {
  let lightIntensity = 5.0; // Default intensity
  const materialUniforms = (starMaterial as any).uniforms;
  if (materialUniforms && materialUniforms.glowIntensity) {
    const materialGlowIntensity = materialUniforms.glowIntensity.value;
    lightIntensity = materialGlowIntensity * 10.0;
    lightIntensity = Math.max(0.5, Math.min(lightIntensity, 20.0)); // Clamp intensity
  }

  const pointLight = LightingHelper.createPointLight({
    color: starColor.getHex(),
    intensity: lightIntensity,
    decay: 2,
    distance: 0,
    name: `${object.celestialObjectId}-low-lod-light`,
    castShadow: false,
  });
  // Store the original intensity for fading calculations
  pointLight.userData.originalIntensity = lightIntensity;
  return pointLight;
}

/**
 * Creates the LODLevel object for the star billboard.
 * This group contains the sprite and its associated point light.
 * @param object - The renderable celestial object (star).
 * @param sprite - The pre-created sprite for the billboard.
 * @param pointLight - The pre-created point light for the billboard.
 * @param billboardDistance - The distance at which this LOD level becomes active.
 * @returns An LODLevel object representing the billboard.
 */
export function createBillboardLODLevel(
  object: RenderableCelestialObject,
  sprite: THREE.Sprite,
  pointLight: THREE.PointLight,
  billboardDistance: number,
): LODLevel {
  const billboardGroup = new THREE.Group();
  billboardGroup.name = `${object.celestialObjectId}-billboard-lod`;
  billboardGroup.add(sprite);
  billboardGroup.add(pointLight);

  return {
    object: billboardGroup,
    distance: billboardDistance,
  };
}
