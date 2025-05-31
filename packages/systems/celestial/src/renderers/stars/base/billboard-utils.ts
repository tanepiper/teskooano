import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { LODLevel } from "../../common/types";

/**
 * Creates a canvas texture for a star billboard.
 * The texture is a radial gradient from white (center) to transparent (edge).
 * @returns A THREE.CanvasTexture to be used for the billboard sprite.
 */
export function createBillboardTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext("2d");
  if (context) {
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
  }
  return new THREE.CanvasTexture(canvas);
}

/**
 * Calculates a default size for the distant sprite based on the star's radius.
 * This is a fallback if a more specific `calculateBillboardSize` is not available on the renderer.
 * @param object - The renderable celestial object (star).
 * @returns The calculated sprite size, clamped between min and max values.
 */
export function calculateDistantSpriteSize(
  object: RenderableCelestialObject,
): number {
  const minSpriteSize = 0.03;
  const maxSpriteSize = 0.15;
  const radiusScaleFactor = 0.0001;
  let calculatedSpriteSize = object.radius * radiusScaleFactor;
  return Math.max(minSpriteSize, Math.min(maxSpriteSize, calculatedSpriteSize));
}

/**
 * Creates the sprite for the star billboard.
 * The sprite uses additive blending and its size is in screen space.
 * @param object - The renderable celestial object (star).
 * @param texture - The texture to use for the sprite.
 * @param size - The size of the sprite (typically in screen space units).
 * @param starColor - The color of the star, used to tint the sprite.
 * @returns A THREE.Sprite configured for billboard rendering.
 */
export function createBillboardSprite(
  object: RenderableCelestialObject,
  texture: THREE.Texture,
  size: number,
  starColor: THREE.Color,
): THREE.Sprite {
  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    color: starColor,
    blending: THREE.AdditiveBlending,
    sizeAttenuation: false, // Size is in screen space
    transparent: true,
    opacity: 0.85,
  });

  const distantSprite = new THREE.Sprite(spriteMaterial);
  distantSprite.name = `${object.celestialObjectId}-distant-sprite`;
  distantSprite.scale.set(size, size, 1.0);
  return distantSprite;
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

  const pointLight = new THREE.PointLight(
    starColor,
    lightIntensity,
    0, // No decay distance limit
    2, // Decay factor
  );
  pointLight.name = `${object.celestialObjectId}-low-lod-light`;
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
