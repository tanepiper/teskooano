import * as THREE from "three";
import {
  uniform,
  float,
  vec3,
  positionLocal,
  normalLocal,
  mix,
  sin,
  mul,
  add,
  smoothstep,
  fract,
  Fn,
} from "three/tsl";
import { MeshStandardNodeMaterial } from "three/webgpu";
import type {
  RenderableCelestialObject,
  StarProperties,
} from "@teskooano/data-types";

/**
 * Enhanced Star Material using TSL for WebGPU
 * Implements plasma effects with procedural noise
 */
export class EnhancedStarNodeMaterial extends MeshStandardNodeMaterial {
  private object: RenderableCelestialObject;
  private timeUniform: any;
  private noiseScaleUniform: any;
  private noiseIntensityUniform: any;
  private plasmaTurbulenceUniform: any;
  private lightingIntensityUniform: any;
  private starColorUniform: any;
  private hotColorUniform: any;
  private surfaceColorUniform: any;
  private coolColorUniform: any;

  constructor(
    object: RenderableCelestialObject,
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      noiseScale?: number;
      noiseIntensity?: number;
      plasmaTurbulence?: number;
      lightingIntensity?: number;
    } = {},
  ) {
    super();

    console.log("[EnhancedStarNodeMaterial] Creating WebGPU TSL star material");

    this.object = object;

    // Get star properties for intelligent defaults
    const starProps = object.properties as StarProperties;

    // Set up colors with fallbacks
    const hotColor = starProps?.hotColor
      ? new THREE.Color(starProps.hotColor)
      : color.clone().multiplyScalar(1.4);
    const surfaceColor = starProps?.surfaceColor
      ? new THREE.Color(starProps.surfaceColor)
      : color;
    const coolColor = starProps?.coolColor
      ? new THREE.Color(starProps.coolColor)
      : color.clone().multiplyScalar(0.3);

    // Create uniform nodes
    this.timeUniform = uniform(0.0);
    this.noiseScaleUniform = uniform(options.noiseScale ?? 1.0);
    this.noiseIntensityUniform = uniform(options.noiseIntensity ?? 0.2);
    this.plasmaTurbulenceUniform = uniform(options.plasmaTurbulence ?? 0.1);
    this.lightingIntensityUniform = uniform(options.lightingIntensity ?? 1.0);
    this.starColorUniform = uniform(color);
    this.hotColorUniform = uniform(hotColor);
    this.surfaceColorUniform = uniform(surfaceColor);
    this.coolColorUniform = uniform(coolColor);

    // Create simplex noise function
    const snoise = Fn(([p, res, time]: [any, any, any]) => {
      // Simplified hash-based noise using sin and fract
      const seed = add(add(p.x.mul(12.9898), p.y.mul(78.233)), p.z.mul(45.164));
      const scaled = mul(seed, add(res, mul(time, 0.1 / 40000.0)));

      // Hash function using sin
      const noise = fract(sin(scaled).mul(43758.5453));

      return add(mul(noise, 2.0), float(-1.0));
    });

    // Create FBM (Fractal Brownian Motion) function
    const fbm = Fn(([p, time]: [any, any]) => {
      // Build up FBM manually for 3 octaves
      const noise1 = snoise(p, float(8.0), time).mul(1.0);
      const p2 = p.mul(1.1).add(vec3(0.5, 0.8, 0.3));
      const noise2 = snoise(p2.mul(2.0), float(8.0), time).mul(0.5);
      const p3 = p2.mul(1.1).add(vec3(0.5, 0.8, 0.3));
      const noise3 = snoise(p3.mul(4.0), float(8.0), time).mul(0.25);

      return noise1.add(noise2).add(noise3);
    });

    // Create animated plasma effect
    const plasmaEffect = Fn(() => {
      const pos = positionLocal;
      const time = mul(this.timeUniform, 0.1 / 40000.0);

      // Animated position for plasma noise
      const animatedPosition = add(
        pos,
        vec3(mul(time, 2.0), mul(time, 3.0), mul(time, 4.0)),
      );
      const plasmaCoord = mul(animatedPosition, this.noiseScaleUniform);
      const plasmaNoise = fbm(plasmaCoord, time);

      // Turbulence with different time offset
      const turbulenceCoord = add(
        mul(mul(animatedPosition, this.noiseScaleUniform), 1.5),
        vec3(mul(time, 4.0), mul(time, 2.0), mul(time, 6.0)),
      );
      const turbulence = mul(
        mul(fbm(turbulenceCoord, time), this.plasmaTurbulenceUniform),
        0.5,
      );

      // Combine noise effects
      const combined = mul(
        add(plasmaNoise, turbulence),
        mul(this.noiseIntensityUniform, 2.0),
      );

      // Create sharper plasma pattern
      const plasmaPattern = smoothstep(float(-0.6), float(0.6), combined);

      // Mix colors based on plasma intensity
      const hotPlasma = mix(
        this.surfaceColorUniform,
        this.hotColorUniform,
        mul(plasmaPattern, 0.8),
      );
      const coolPlasma = mix(
        this.surfaceColorUniform,
        this.coolColorUniform,
        mul(add(float(1.0), mul(plasmaPattern, -1.0)), 0.6),
      );

      // Final color blend
      const finalColor = mix(coolPlasma, hotPlasma, plasmaPattern);

      // Add position-based variation
      const positionCoord = add(
        mul(animatedPosition, 0.3),
        vec3(mul(time, 1.0), mul(time, 1.5), mul(time, 2.0)),
      );
      const positionVariation = fbm(positionCoord, time);
      const variedColor = mix(
        finalColor,
        mul(finalColor, 1.1),
        mul(positionVariation, 0.2),
      );

      // Apply lighting intensity
      return mul(variedColor, this.lightingIntensityUniform);
    });

    // Apply the plasma effect to the material's color
    this.colorNode = plasmaEffect();

    // Stars are emissive, not metallic
    this.emissiveNode = mul(this.colorNode, 0.8);
    this.roughnessNode = float(1.0);
    this.metalnessNode = float(0.0);

    // Material properties
    this.transparent = false;
    this.side = THREE.FrontSide;
    this.depthTest = true;
    this.depthWrite = true;
  }

  /**
   * Update the material with current time and state
   */
  update(
    time: number,
    timeScale: number,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Update time uniform for animation
    this.timeUniform.value = time;

    // Update star colors from object properties
    const starProps = this.object.properties as StarProperties;
    this.updateStarColors(starProps);

    // Update from state if available
    if (starProps?.materialParams) {
      this.updateFromState(starProps.materialParams);
    }
  }

  /**
   * Update star colors from properties
   */
  private updateStarColors(starProps: StarProperties): void {
    if (starProps.color) {
      this.starColorUniform.value.set(starProps.color);
    }

    if (starProps.hotColor) {
      this.hotColorUniform.value.set(starProps.hotColor);
    } else if (starProps.color) {
      const hotColor = new THREE.Color(starProps.color);
      hotColor.multiplyScalar(1.4);
      this.hotColorUniform.value.copy(hotColor);
    }

    if (starProps.surfaceColor) {
      this.surfaceColorUniform.value.set(starProps.surfaceColor);
    } else if (starProps.color) {
      this.surfaceColorUniform.value.set(starProps.color);
    }

    if (starProps.coolColor) {
      this.coolColorUniform.value.set(starProps.coolColor);
    } else if (starProps.color) {
      const coolColor = new THREE.Color(starProps.color);
      coolColor.multiplyScalar(0.3);
      this.coolColorUniform.value.copy(coolColor);
    }
  }

  /**
   * Update noise parameters from state
   */
  private updateFromState(materialParams: any): void {
    if (materialParams.noiseScale !== undefined) {
      this.noiseScaleUniform.value = materialParams.noiseScale;
    }
    if (materialParams.noiseIntensity !== undefined) {
      this.noiseIntensityUniform.value = materialParams.noiseIntensity;
    }
    if (materialParams.plasmaTurbulence !== undefined) {
      this.plasmaTurbulenceUniform.value = materialParams.plasmaTurbulence;
    }
    if (materialParams.lightingIntensity !== undefined) {
      this.lightingIntensityUniform.value = materialParams.lightingIntensity;
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
  }
}
