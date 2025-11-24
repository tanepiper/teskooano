import type { LODLevel } from "../base/managers/LODManager";
import type { RenderableCelestialObject } from "@teskooano/data-types";
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
    transparent: true,
    opacity: 0.8, // Start with opaque, actual opacity will be handled by billboardManager.update
    depthWrite: false, // Transparent sprites should not write to depth buffer
    depthTest: true, // But should test against depth buffer for proper occlusion
    userData: {
      isBillboard: true,
      id: object.id,
      position: object.position,
      albedo,
      color: starColor.getHex(),
    },
  });

  const distantSprite = new THREE.Sprite(spriteMaterial);
  distantSprite.name = `${object.id}-distant-sprite`;
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
 * The light's intensity is derived from the star material's glowIntensity uniform (if available).
 * Compatible with both WebGL (ShaderMaterial) and WebGPU (NodeMaterial) materials.
 * @param object - The renderable celestial object (star).
 * @param starColor - The color of the star.
 * @param starMaterial - The star's primary material (GLSL ShaderMaterial or TSL NodeMaterial).
 * @returns A THREE.PointLight to enhance the billboard's appearance from a distance.
 */
export function createBillboardPointLight(
  object: RenderableCelestialObject,
  starColor: THREE.Color,
  starMaterial: THREE.Material,
): THREE.PointLight {
  let lightIntensity = 5.0; // Default intensity

  // Only access uniforms for GLSL ShaderMaterial (WebGL)
  // TSL NodeMaterial (WebGPU) handles lighting differently
  if ("uniforms" in starMaterial && starMaterial.uniforms) {
    const materialUniforms = (starMaterial as any).uniforms;
    if (materialUniforms.glowIntensity) {
      const materialGlowIntensity = materialUniforms.glowIntensity.value;
      lightIntensity = materialGlowIntensity * 10.0;
      lightIntensity = Math.max(0.5, Math.min(lightIntensity, 20.0)); // Clamp intensity
    }
  }

  const pointLight = LightingHelper.createPointLight({
    color: starColor.getHex(),
    intensity: lightIntensity,
    decay: 2,
    distance: 0,
    name: `${object.id}-low-lod-light`,
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
  billboardGroup.name = `${object.id}-billboard-lod`;
  billboardGroup.add(sprite);
  billboardGroup.add(pointLight);

  return {
    object: billboardGroup,
    distance: billboardDistance,
  };
}
