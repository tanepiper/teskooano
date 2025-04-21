// packages/systems/celestial/src/generation/procedural-texture.ts
// Uses 3D Simplex noise for seamless spherical texture generation.

import {
  BaseSurfaceProperties,
  DesertSurfaceProperties,
  IceSurfaceProperties,
  LavaSurfaceProperties,
  OceanSurfaceProperties,
  PlanetType,
  ProceduralSurfaceProperties,
  SurfacePropertiesUnion,
} from "@teskooano/data-types";
import { createNoise3D } from "simplex-noise"; // Corrected import

// Cache for generated textures
const textureCache = new Map<string, GeneratedTerrainTextures>();

// Simple seeded pseudo-random number generator (Mulberry32) - Keep if needed elsewhere, or remove if unused
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// --- Helper function to map equirectangular UV to Sphere XYZ ---
/**
 * Converts UV coordinates (equirectangular projection) to 3D Cartesian coordinates on a unit sphere.
 * @param u - Horizontal texture coordinate (0 to 1).
 * @param v - Vertical texture coordinate (0 to 1).
 * @returns [x, y, z] coordinates on the unit sphere.
 */
function mapEquirectangularToSphere(
  u: number,
  v: number,
): [number, number, number] {
  const phi = u * 2 * Math.PI; // Azimuthal angle (longitude)
  const theta = v * Math.PI; // Polar angle (latitude)

  const x = Math.sin(theta) * Math.cos(phi);
  const y = Math.cos(theta); // Use Y as the up/down axis for typical sphere mapping
  const z = Math.sin(theta) * Math.sin(phi);

  return [x, y, z];
}

// --- Keep Color Helper functions ---
function hexToRgb(hex: string): [number, number, number] | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16),
      ]
    : null;
}

function interpolateRgb(
  colorA: [number, number, number],
  colorB: [number, number, number],
  factor: number,
): [number, number, number] {
  const clampedFactor = Math.max(0, Math.min(1, factor)); // Ensure factor is 0-1
  const r = Math.round(colorA[0] + (colorB[0] - colorA[0]) * clampedFactor);
  const g = Math.round(colorA[1] + (colorB[1] - colorA[1]) * clampedFactor);
  const b = Math.round(colorA[2] + (colorB[2] - colorA[2]) * clampedFactor);
  return [r, g, b];
}

function rgbToCssString(rgb: [number, number, number]): string {
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

function getColorForHeight(
  height: number, // Expected to be normalized (0 to 1)
  surfaceProperties: SurfacePropertiesUnion | undefined,
): string {
  // Default grayscale if no properties
  if (!surfaceProperties) {
    const intensity = Math.floor(height * 255);
    return `rgb(${intensity}, ${intensity}, ${intensity})`;
  }

  // Handle Rocky/Terrestrial/Barren specifically using ProceduralSurfaceProperties
  if (
    "planetType" in surfaceProperties &&
    (surfaceProperties.planetType === PlanetType.ROCKY ||
      surfaceProperties.planetType === PlanetType.TERRESTRIAL ||
      surfaceProperties.planetType === PlanetType.BARREN)
  ) {
    const props = surfaceProperties as ProceduralSurfaceProperties;
    const c1 = hexToRgb(props.color ?? "#202020");
    const c2 = hexToRgb(props.colorHigh ?? "#404040");
    const c3 = hexToRgb(props.colorLow ?? "#606060");
    const c4 = hexToRgb(props.colorMid1 ?? "#A0A0A0");
    const c5 = hexToRgb(props.colorMid2 ?? "#E0E0E0");
    const t2 = 0.3;
    const t3 = 0.5;
    const t4 = 0.7;
    const t5 = 0.9;
    const b12 = 0.1;
    const b23 = 0.1;
    const b34 = 0.1;
    const b45 = 0.1;

    if (!c1 || !c2 || !c3 || !c4 || !c5) {
      console.error(
        "[getColorForHeight] Failed to parse one or more hex colors for ProceduralSurface.",
      );
      return "rgb(128, 128, 128)"; // Fallback gray
    }

    let finalRgb: [number, number, number];

    // Blending logic (remains the same)
    if (height < t2 - b12 / 2) {
      finalRgb = c1;
    } else if (height < t2 + b12 / 2) {
      const factor = smoothstep(t2 - b12 / 2, t2 + b12 / 2, height);
      finalRgb = interpolateRgb(c1, c2, factor);
    } else if (height < t3 - b23 / 2) {
      finalRgb = c2;
    } else if (height < t3 + b23 / 2) {
      const factor = smoothstep(t3 - b23 / 2, t3 + b23 / 2, height);
      finalRgb = interpolateRgb(c2, c3, factor);
    } else if (height < t4 - b34 / 2) {
      finalRgb = c3;
    } else if (height < t4 + b34 / 2) {
      const factor = smoothstep(t4 - b34 / 2, t4 + b34 / 2, height);
      finalRgb = interpolateRgb(c3, c4, factor);
    } else if (height < t5 - b45 / 2) {
      finalRgb = c4;
    } else if (height < t5 + b45 / 2) {
      const factor = smoothstep(t5 - b45 / 2, t5 + b45 / 2, height);
      finalRgb = interpolateRgb(c4, c5, factor);
    } else {
      finalRgb = c5;
    }
    return rgbToCssString(finalRgb);
  }

  // --- Handle other specific planet types ---
  else if ("planetType" in surfaceProperties) {
    let baseColor = surfaceProperties.color ?? "#808080"; // Use base color as fallback

    switch (surfaceProperties.planetType) {
      case PlanetType.DESERT:
        const desertProps = surfaceProperties as DesertSurfaceProperties;
        const duneColor = hexToRgb(desertProps.color ?? "#c19a6b");
        const rockColor = hexToRgb(desertProps.secondaryColor ?? "#a0522d");
        if (duneColor && rockColor) {
          const desertFactor = smoothstep(0.3, 0.7, height);
          baseColor = rgbToCssString(
            interpolateRgb(rockColor, duneColor, desertFactor),
          );
        }
        break;
      case PlanetType.ICE:
        const iceProps = surfaceProperties as IceSurfaceProperties;
        const iceColor = hexToRgb(iceProps.color ?? "#e0f0ff");
        const crevasseColor = hexToRgb(iceProps.secondaryColor ?? "#87ceeb");
        if (iceColor && crevasseColor) {
          const iceFactor = smoothstep(0.2, 0.5, height);
          baseColor = rgbToCssString(
            interpolateRgb(crevasseColor, iceColor, iceFactor),
          );
        }
        break;
      case PlanetType.LAVA:
        const lavaProps = surfaceProperties as LavaSurfaceProperties;
        // Use smoothstep for a less abrupt transition
        const lavaFactor = smoothstep(0.55, 0.65, height);
        const rockLavaColor = hexToRgb(lavaProps.rockColor ?? "#303030");
        const lavaColor = hexToRgb(lavaProps.lavaColor ?? "#FF4500");
        if (rockLavaColor && lavaColor) {
          baseColor = rgbToCssString(
            interpolateRgb(rockLavaColor, lavaColor, lavaFactor),
          );
        } else {
          baseColor =
            height > 0.6
              ? (lavaProps.lavaColor ?? "#FF4500")
              : (lavaProps.rockColor ?? "#303030");
        }
        break;
      case PlanetType.OCEAN:
        const oceanProps = surfaceProperties as OceanSurfaceProperties;
        // Use smoothstep for blending near the coast
        const landRatio = oceanProps.landRatio ?? 0.3;
        const blendRange = 0.05; // How wide the blend region is
        const oceanFactor = smoothstep(
          landRatio - blendRange / 2,
          landRatio + blendRange / 2,
          height,
        );
        const oceanColor = hexToRgb(oceanProps.oceanColor ?? "#1E90FF");
        const landColor = hexToRgb(oceanProps.landColor ?? "#90EE90");
        if (oceanColor && landColor) {
          baseColor = rgbToCssString(
            interpolateRgb(oceanColor, landColor, oceanFactor),
          );
        } else {
          baseColor =
            height < landRatio
              ? (oceanProps.oceanColor ?? "#1E90FF")
              : (oceanProps.landColor ?? "#90EE90");
        }
        break;
    }
    return baseColor;
  }

  // Fallback
  console.warn(
    "[getColorForHeight] No planetType found or matched, using base surface color.",
  );
  return (surfaceProperties as BaseSurfaceProperties).color ?? "#808080";
}

/**
 * Populates the color canvas using 3D Simplex noise.
 * @param canvas - The OffscreenCanvas to draw on.
 * @param noiseFunc - The noise function to use for generating the heightmap.
 * @param surfaceProperties - Properties defining surface colors and transitions.
 * @param noiseScale - Controls the frequency/scale of the noise features. Larger values = smaller features.
 * @param noiseOctaves - Number of noise layers to combine for more detail.
 * @param noisePersistence - How much each successive octave contributes (0-1).
 * @param noiseLacunarity - How much the frequency increases for each octave (>1).
 * @returns A 2D array containing the generated normalized heightmap data (0-1).
 */
function drawColorCanvasFromNoise(
  canvas: OffscreenCanvas,
  noiseFunc: (x: number, y: number, z: number) => number,
  surfaceProperties: SurfacePropertiesUnion | undefined,
  noiseScale: number = 1.0,
  noiseOctaves: number = 4,
  noisePersistence: number = 0.5,
  noiseLacunarity: number = 2.0,
): number[][] {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context from OffscreenCanvas");
  }
  const canvasSize = canvas.width; // Assume square
  ctx.clearRect(0, 0, canvasSize, canvasSize);

  const heightMap: number[][] = Array(canvasSize)
    .fill(0)
    .map(() => Array(canvasSize).fill(0));

  // --- Generate raw noise values (store directly) ---
  for (let py = 0; py < canvasSize; py++) {
    for (let px = 0; px < canvasSize; px++) {
      const u = px / (canvasSize - 1);
      const v = py / (canvasSize - 1);
      const [x, y, z] = mapEquirectangularToSphere(u, v);

      let totalNoise = 0;
      let amplitude = 1;
      let frequency = noiseScale;
      let maxValue = 0;

      for (let i = 0; i < noiseOctaves; i++) {
        totalNoise +=
          noiseFunc(x * frequency, y * frequency, z * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= noisePersistence;
        frequency *= noiseLacunarity;
      }

      // Normalize the octave noise to roughly [-1, 1] and store
      const rawNoise = maxValue === 0 ? 0 : totalNoise / maxValue; // Avoid division by zero
      heightMap[py][px] = rawNoise; // Store the raw noise value directly
    }
  }

  // --- Normalize heightmap based on theoretical [-1, 1] range and draw ---
  for (let py = 0; py < canvasSize; py++) {
    for (let px = 0; px < canvasSize; px++) {
      // Get the stored raw noise value (assumed to be roughly -1 to 1)
      const rawNoiseValue = heightMap[py][px];

      // MODIFIED: Normalize directly from [-1, 1] range to [0, 1]
      const normalizedHeight = (rawNoiseValue + 1.0) * 0.5;
      // --- End Modification ---

      // Clamp just in case noise function goes slightly out of bounds
      const clampedHeight = Math.max(0.0, Math.min(1.0, normalizedHeight));

      heightMap[py][px] = clampedHeight; // Store final normalized height

      const color = getColorForHeight(clampedHeight, surfaceProperties);
      ctx.fillStyle = color;
      ctx.fillRect(px, py, 1, 1); // Draw single pixel
    }
  }

  return heightMap; // Return the normalized heightmap
}

/**
 * Generates a normal map texture from height data generated by 3D Simplex noise.
 * @param heightMap - The normalized heightmap data (values 0 to 1) generated from noise.
 * @param canvasSize - The desired dimensions of the output canvas.
 * @param strength - The strength factor for the normal map bumps (higher means bumpier). Default 1.0.
 * @returns An OffscreenCanvas containing the generated normal map texture.
 */
function generateNormalMapFromHeightData(
  heightMap: number[][],
  canvasSize: number = 512,
  strength: number = 1.0,
): OffscreenCanvas {
  const height = heightMap.length;
  const width = heightMap[0]?.length ?? 0;
  if (width === 0 || height === 0 || width !== height || width !== canvasSize) {
    throw new Error(
      `Invalid heightMap dimensions (${width}x${height}) for normal map generation (expected ${canvasSize}x${canvasSize}).`,
    );
  }

  const canvas = new OffscreenCanvas(canvasSize, canvasSize);
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not get 2D context for normal map generation");
  }

  const imgData = ctx.createImageData(canvasSize, canvasSize);
  const data = imgData.data;

  // Helper to sample height, wrapping around edges of the heightMap
  const sampleHeightWrap = (px: number, py: number): number => {
    const wrappedX = ((px % width) + width) % width;
    const wrappedY = ((py % height) + height) % height;
    return heightMap[wrappedY][wrappedX];
  };

  for (let py = 0; py < canvasSize; py++) {
    for (let px = 0; px < canvasSize; px++) {
      // Sample neighboring heights using wrapped sampling
      const hl = sampleHeightWrap(px - 1, py); // Height left
      const hr = sampleHeightWrap(px + 1, py); // Height right
      const hu = sampleHeightWrap(px, py - 1); // Height up
      const hd = sampleHeightWrap(px, py + 1); // Height down

      // Calculate derivatives (slopes) - adjust strength here
      // Strength amplifies the height difference. Pixel distances are 1.
      let dx = (hl - hr) * strength * 0.5; // Normalize difference by 2 pixels distance
      let dy = (hu - hd) * strength * 0.5; // Normalize difference by 2 pixels distance

      // Create normal vector (dx, dy, 1) and normalize
      // Z component is 1 before normalization for heightmap normals
      const vec = [dx, dy, 1.0];
      const len = Math.sqrt(
        vec[0] * vec[0] + vec[1] * vec[1] + vec[2] * vec[2],
      );

      let nx = 0,
        ny = 0,
        nz = 1; // Default to flat normal (0,0,1) if length is zero
      if (len > 0) {
        nx = vec[0] / len;
        ny = vec[1] / len;
        nz = vec[2] / len;
      }

      // Remap normal components from [-1, 1] to RGB [0, 255]
      // Normal maps typically store (nx+1)/2, (ny+1)/2, (nz+1)/2
      const r = Math.floor((nx * 0.5 + 0.5) * 255);
      const g = Math.floor((ny * 0.5 + 0.5) * 255); // Y component often maps to Green
      const b = Math.floor((nz * 0.5 + 0.5) * 255); // Z component maps to Blue

      const index = (py * canvasSize + px) * 4;
      data[index] = r; // Red
      data[index + 1] = g; // Green
      data[index + 2] = b; // Blue
      data[index + 3] = 255; // Alpha
    }
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/**
 * Return type for the terrain generation function.
 */
export interface GeneratedTerrainTextures {
  colorCanvas: OffscreenCanvas;
  normalCanvas: OffscreenCanvas;
  heightMap: number[][]; // Also return the raw height data if needed
}

/**
 * Generates procedural terrain color and normal maps using 3D Simplex noise, with caching.
 *
 * @param seed - A number used to seed the random number generator for deterministic output.
 * @param options - Optional configuration for generation.
 * @param options.surfaceProperties - Properties defining surface colors and transitions.
 * @param options.canvasSize - The size of the output texture canvas (default: 1024).
 * @param options.noiseScale - Controls the base frequency/scale of the noise features (default: 1.0).
 * @param options.noiseOctaves - Number of noise layers to combine (default: 4).
 * @param options.noisePersistence - Amplitude multiplier for each octave (default: 0.5).
 * @param options.noiseLacunarity - Frequency multiplier for each octave (default: 2.0).
 * @param options.normalStrength - Strength factor for the normal map bumps (default: 1.0).
 * @returns An object containing OffscreenCanvas instances for color/normal maps and the height data.
 */
export function generateTerrainTexture(
  seed: number,
  options?: {
    surfaceProperties?: SurfacePropertiesUnion;
    canvasSize?: number;
    noiseScale?: number;
    noiseOctaves?: number;
    noisePersistence?: number;
    noiseLacunarity?: number;
    normalStrength?: number;
  },
): GeneratedTerrainTextures {
  // Generate a cache key based on seed and options
  // Simple stringification; consider a more robust hashing for complex options if needed.
  const optionsString = JSON.stringify(options ?? {});
  const cacheKey = `${seed}-${optionsString}`;

  // Check cache first
  if (textureCache.has(cacheKey)) {
    // Return a structured clone to avoid shared mutable state issues if canvases were modified elsewhere
    const cached = textureCache.get(cacheKey)!;
    return {
      colorCanvas: cached.colorCanvas, // OffscreenCanvas should be transferable/clonable
      normalCanvas: cached.normalCanvas,
      heightMap: cached.heightMap, // Assuming heightMap array is not mutated externally
    };
  }

  console.warn(
    `[generateTerrainTexture] Cache miss for key: ${cacheKey}. Generating...`,
  );

  // Use mulberry32 PRNG for deterministic noise based on seed
  const rng = mulberry32(seed);
  // Create the 3D noise function using the PRNG
  const noise3D = createNoise3D(rng);

  const surfaceProperties = options?.surfaceProperties;
  const canvasSize = options?.canvasSize ?? 1024;
  const noiseScale = options?.noiseScale ?? 1.0;
  const noiseOctaves = options?.noiseOctaves ?? 4;
  const noisePersistence = options?.noisePersistence ?? 0.5;
  const noiseLacunarity = options?.noiseLacunarity ?? 2.0;
  const normalStrength = options?.normalStrength ?? 1.0;
  // Create color canvas
  const colorCanvas = new OffscreenCanvas(canvasSize, canvasSize);

  // Generate heightmap and draw color canvas simultaneously
  const heightMap = drawColorCanvasFromNoise(
    colorCanvas,
    noise3D,
    surfaceProperties,
    noiseScale,
    noiseOctaves,
    noisePersistence,
    noiseLacunarity,
  );

  // Generate normal map from the height data
  const normalCanvas = generateNormalMapFromHeightData(
    heightMap,
    canvasSize,
    normalStrength,
  );

  const result: GeneratedTerrainTextures = {
    colorCanvas,
    normalCanvas,
    heightMap,
  };

  // Store the result in the cache
  textureCache.set(cacheKey, result);

  return result;
}
