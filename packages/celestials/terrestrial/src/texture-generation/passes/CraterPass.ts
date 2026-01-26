/**
 * CraterPass - Generates impact craters based on atmosphere presence.
 *
 * This is Pass 2 of the terrain generation pipeline.
 * Uses SDF-based crater shapes with proper morphology including
 * bowl, rim, central peak, and ejecta blanket.
 *
 * @module texture-generation/passes/CraterPass
 */

import * as THREE from "three";
import type { AtmosphereType } from "@teskooano/data-types";
import { OffscreenRenderer } from "../utils/OffscreenRenderer";
import type {
  CraterDefinition,
  CraterPassConfig,
  TextureResolution,
} from "../types";
import { getCraterCountRange } from "../types";

// Import shader source
import craterFragShader from "../shaders/crater.frag.glsl";

/** Maximum number of craters (must match shader constant) */
const MAX_CRATERS = 128;

/**
 * Simple seeded random number generator.
 */
function createSeededRandom(seed: string): () => number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  let state = Math.abs(hash) || 1;

  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Generates crater definitions based on atmosphere type.
 *
 * @param seed - Seed for deterministic generation
 * @param atmosphereType - Type of atmosphere (affects crater count)
 * @returns Array of crater definitions
 */
export function generateCraterDistribution(
  seed: string,
  atmosphereType: AtmosphereType,
): CraterDefinition[] {
  const random = createSeededRandom(seed + "_craters");
  const range = getCraterCountRange(atmosphereType);
  const craterCount = Math.floor(
    range.min + random() * (range.max - range.min),
  );

  const craters: CraterDefinition[] = [];
  const existingCenters: { x: number; y: number; radius: number }[] = [];

  // Size distribution - more small craters than large ones
  // Follows power law similar to real crater populations
  const getSizeCategory = ():
    | "tiny"
    | "small"
    | "medium"
    | "large"
    | "huge" => {
    const r = random();
    if (r < 0.4) return "tiny";
    if (r < 0.7) return "small";
    if (r < 0.9) return "medium";
    if (r < 0.98) return "large";
    return "huge";
  };

  const getRadiusForCategory = (
    category: "tiny" | "small" | "medium" | "large" | "huge",
  ): number => {
    // Scale up crater sizes to be more visible at lower resolutions
    // At 512x256, we need larger craters to be visible (minimum ~4-8 pixels)
    const scale = 1.5; // Scale factor for visibility
    switch (category) {
      case "tiny":
        return (0.005 + random() * 0.01) * scale; // 0.0075 - 0.0225
      case "small":
        return (0.015 + random() * 0.02) * scale; // 0.0225 - 0.0525
      case "medium":
        return (0.035 + random() * 0.03) * scale; // 0.0525 - 0.0975
      case "large":
        return (0.065 + random() * 0.05) * scale; // 0.0975 - 0.1725
      case "huge":
        return (0.115 + random() * 0.08) * scale; // 0.1725 - 0.2925
    }
  };

  // Attempt to place craters with spacing check
  let attempts = 0;
  const maxAttempts = craterCount * 10;

  while (craters.length < craterCount && attempts < maxAttempts) {
    attempts++;

    const sizeCategory = getSizeCategory();
    const radius = getRadiusForCategory(sizeCategory);

    // Random position (avoiding poles which get distorted in equirectangular)
    const x = random();
    const y = 0.1 + random() * 0.8; // Avoid top/bottom 10%

    // Check spacing with existing craters
    const minSpacing = radius * 2.5; // Minimum spacing based on crater size
    let tooClose = false;

    for (const existing of existingCenters) {
      // Handle wrapping in x direction
      let dx = Math.abs(x - existing.x);
      if (dx > 0.5) dx = 1.0 - dx;
      const dy = Math.abs(y - existing.y);

      // Compensate for equirectangular aspect ratio
      const dist = Math.sqrt((dx * 2) ** 2 + dy ** 2);
      const requiredSpacing = (radius + existing.radius) * 1.5;

      if (dist < requiredSpacing) {
        tooClose = true;
        break;
      }
    }

    if (tooClose) continue;

    // Crater properties based on size
    // Increased depth and rim height for better visibility at low resolutions
    const depth = radius * (0.5 + random() * 0.5); // Depth proportional to radius (increased from 0.3-0.7 to 0.5-1.0)
    const rimHeight = depth * (0.3 + random() * 0.4); // Rim is 30-70% of depth (increased from 20-50%)

    // Larger craters have central peaks
    const hasCentralPeak = radius > 0.04 && random() > 0.3;

    // Age distribution - more recent craters in airless bodies
    let age: number;
    if (atmosphereType === "NONE") {
      age = random() * 0.5; // Mostly fresh craters
    } else if (atmosphereType === "THIN") {
      age = 0.2 + random() * 0.6;
    } else {
      age = 0.5 + random() * 0.5; // Mostly old, eroded craters
    }

    craters.push({
      center: { x, y },
      radius,
      depth,
      rimHeight,
      hasCentralPeak,
      age,
    });

    existingCenters.push({ x, y, radius });
  }

  return craters;
}

/**
 * CraterPass applies impact craters to the height map.
 */
export class CraterPass {
  private offscreenRenderer: OffscreenRenderer;
  private renderTarget: THREE.WebGLRenderTarget | null = null;
  private resolution: TextureResolution;

  /**
   * Creates a new CraterPass.
   *
   * @param offscreenRenderer - Shared OffscreenRenderer instance
   * @param resolution - Output texture resolution
   */
  constructor(
    offscreenRenderer: OffscreenRenderer,
    resolution: TextureResolution,
  ) {
    this.offscreenRenderer = offscreenRenderer;
    this.resolution = resolution;
  }

  /**
   * Applies craters to an existing height map.
   *
   * @param inputTarget - Height map from previous pass
   * @param config - Crater configuration
   * @returns WebGLRenderTarget containing the modified height map
   */
  apply(
    inputTarget: THREE.WebGLRenderTarget,
    config: CraterPassConfig,
  ): THREE.WebGLRenderTarget {
    // Create render target if needed
    if (!this.renderTarget) {
      this.renderTarget = this.offscreenRenderer.createRenderTarget(
        this.resolution,
        {
          format: THREE.RGBAFormat,
          type: THREE.FloatType,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          wrapS: THREE.RepeatWrapping,
          wrapT: THREE.ClampToEdgeWrapping,
        },
      );
    }

    // Limit craters to MAX_CRATERS
    const craters = config.craters.slice(0, MAX_CRATERS);

    // Pack crater data into uniform arrays
    const craterData: number[] = [];
    const craterExtra: number[] = [];

    for (let i = 0; i < MAX_CRATERS; i++) {
      if (i < craters.length) {
        const c = craters[i];
        craterData.push(c.center.x, c.center.y, c.radius, c.depth);
        craterExtra.push(c.rimHeight, c.hasCentralPeak ? 1.0 : 0.0, c.age, 0.0);
      } else {
        // Pad with zeros
        craterData.push(0, 0, 0, 0);
        craterExtra.push(0, 0, 0, 0);
      }
    }

    // Set up uniforms
    const uniforms: Record<string, THREE.IUniform> = {
      uHeightMap: { value: inputTarget.texture },
      uCraterData: { value: this.packToVec4Array(craterData) },
      uCraterExtra: { value: this.packToVec4Array(craterExtra) },
      uCraterCount: { value: craters.length },
    };

    // Render craters to target
    this.offscreenRenderer.renderToTarget(
      craterFragShader,
      uniforms,
      this.renderTarget,
    );

    return this.renderTarget;
  }

  /**
   * Packs a flat array into THREE.Vector4 array for uniform.
   */
  private packToVec4Array(data: number[]): THREE.Vector4[] {
    const result: THREE.Vector4[] = [];
    for (let i = 0; i < data.length; i += 4) {
      result.push(
        new THREE.Vector4(
          data[i] ?? 0,
          data[i + 1] ?? 0,
          data[i + 2] ?? 0,
          data[i + 3] ?? 0,
        ),
      );
    }
    return result;
  }

  /**
   * Gets the render target.
   */
  getRenderTarget(): THREE.WebGLRenderTarget | null {
    return this.renderTarget;
  }

  /**
   * Disposes of resources.
   */
  dispose(): void {
    if (this.renderTarget) {
      this.renderTarget.dispose();
      this.renderTarget = null;
    }
  }
}
