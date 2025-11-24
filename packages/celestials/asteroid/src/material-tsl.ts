import * as THREE from "three";
import {
  uniform,
  float,
  vec3,
  positionLocal,
  normalLocal,
  mix,
  smoothstep,
  pow,
  abs,
  mul,
  add,
  clamp,
  sin,
  fract,
  Fn,
} from "three/tsl";
import { MeshStandardNodeMaterial } from "three/webgpu";
import type { AsteroidNucleusMaterialOptions } from "./material";

const MAX_COLORS = 4;

/**
 * TSL-based asteroid nucleus material for WebGPU
 * Implements multi-color height-based texturing with crater effects
 */
export class AsteroidNucleusMaterialTSL extends MeshStandardNodeMaterial {
  private colorUniforms: any[] = [];
  private heightUniforms: any[] = [];
  private numColorsUniform: any;
  private noiseScaleUniform: any;
  private blendSharpnessUniform: any;
  private craterScaleUniform: any;
  private craterStrengthUniform: any;
  private simplePeriodUniform: any;
  private undulationUniform: any;

  constructor(options: AsteroidNucleusMaterialOptions) {
    super();

    console.log("[AsteroidNucleusMaterialTSL] Creating WebGPU TSL material");

    // Pad colors and heights to MAX_COLORS
    const paddedColors = [...options.colors];
    const paddedHeights = [...options.heights];
    while (paddedColors.length < MAX_COLORS) {
      paddedColors.push(new THREE.Color(0x000000));
      paddedHeights.push(paddedHeights[paddedHeights.length - 1] ?? 1.0);
    }

    // Create uniform nodes for colors and heights
    for (let i = 0; i < MAX_COLORS; i++) {
      this.colorUniforms.push(uniform(paddedColors[i]));
      this.heightUniforms.push(uniform(paddedHeights[i]));
    }

    // Create parameter uniforms
    this.numColorsUniform = uniform(
      Math.min(options.colors.length, MAX_COLORS),
    );
    this.noiseScaleUniform = uniform(options.noiseScale ?? 2.0);
    this.blendSharpnessUniform = uniform(options.blendSharpness ?? 1.0);
    this.craterScaleUniform = uniform(options.craterScale ?? 12.0);
    this.craterStrengthUniform = uniform(options.craterStrength ?? 0.5);
    this.simplePeriodUniform = uniform(options.simplePeriod ?? 1.0);
    this.undulationUniform = uniform(options.undulation ?? 0.1);

    // Create simple noise function using trig functions
    const simpleNoise = Fn(([p]: [any]) => {
      const x = p.x;
      const y = p.y;
      const z = p.z;

      // Multi-layer noise using sine - call sin() on the node values
      const n1 = mul(
        sin(add(mul(x, 12.9898), mul(y, 78.233))).mul(43758.5453),
        1.0,
      );
      const n2 = mul(
        sin(add(mul(y, 12.9898), mul(z, 78.233))).mul(43758.5453),
        1.0,
      );
      const n3 = mul(
        sin(add(mul(z, 12.9898), mul(x, 78.233))).mul(43758.5453),
        1.0,
      );

      // Fract to get fractional part
      const f1 = fract(n1);
      const f2 = fract(n2);
      const f3 = fract(n3);

      // Combine and normalize
      const combined = add(add(f1, f2), f3);
      return add(mul(combined, 0.333), float(-0.5));
    });

    // Create FBM (Fractal Brownian Motion)
    const asteroidFBM = Fn(([p]: [any]) => {
      // Build up FBM manually for 4 octaves
      const noise1 = simpleNoise(p).mul(0.5);
      const noise2 = simpleNoise(p.mul(2.02)).mul(0.25);
      const noise3 = simpleNoise(p.mul(2.02 * 2.02)).mul(0.125);
      const noise4 = simpleNoise(p.mul(2.02 * 2.02 * 2.02)).mul(0.0625);

      const sum = noise1.add(noise2).add(noise3).add(noise4);
      return sum.mul(1.0666); // Normalize (1 / 0.9375)
    });

    // Create main color calculation
    const colorCalc = Fn(() => {
      const pos = positionLocal;

      // Base noise coordinate with undulation
      const noiseCoord = pos.mul(this.simplePeriodUniform);
      const undulationNoise = simpleNoise(noiseCoord);
      const noiseCoordAdjusted = noiseCoord.add(
        undulationNoise.mul(this.undulationUniform),
      );

      // Get base noise value
      const baseNoise = asteroidFBM(
        noiseCoordAdjusted.mul(this.noiseScaleUniform),
      );

      // Height-based color blending - manually blend all colors
      const blend1 = smoothstep(
        this.heightUniforms[0],
        this.heightUniforms[1],
        baseNoise,
      );
      const color1 = mix(
        this.colorUniforms[0],
        this.colorUniforms[1],
        blend1.mul(this.blendSharpnessUniform),
      );

      const blend2 = smoothstep(
        this.heightUniforms[1],
        this.heightUniforms[2],
        baseNoise,
      );
      const color2 = mix(
        color1,
        this.colorUniforms[2],
        blend2.mul(this.blendSharpnessUniform),
      );

      const blend3 = smoothstep(
        this.heightUniforms[2],
        this.heightUniforms[3],
        baseNoise,
      );
      const color3 = mix(
        color2,
        this.colorUniforms[3],
        blend3.mul(this.blendSharpnessUniform),
      );

      // Add crater effects
      const craterCoord = pos.mul(this.craterScaleUniform);
      const craterNoise = simpleNoise(craterCoord);
      const craters = pow(abs(craterNoise), float(15.0));
      const craterDarkening = float(1.0).sub(
        craters.mul(this.craterStrengthUniform),
      );
      const finalColor = color3.mul(craterDarkening);

      return finalColor;
    });

    // Apply to material
    this.colorNode = colorCalc();

    // Asteroid surface properties
    this.roughnessNode = uniform(options.roughness ?? 0.9);
    this.metalnessNode = uniform(options.metallicFactor ?? 0.0);

    // Material settings
    this.transparent = false;
    this.side = THREE.FrontSide;
    this.depthTest = true;
    this.depthWrite = true;
  }

  /**
   * Update method (TSL materials handle lighting automatically)
   */
  update(
    time: number,
    timeScale: number,
    lightSources?: any,
    camera?: THREE.PerspectiveCamera,
    shadowCasters?: any,
  ): void {
    // TSL materials handle most updates automatically
    // No manual uniform updates needed for lighting
  }
}
