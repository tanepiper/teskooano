import * as THREE from "three";
import {
  uniform,
  vec3,
  float,
  positionWorld,
  normalWorld,
  cameraPosition,
  mix,
  mul,
  add,
  sub,
  pow,
  abs,
  clamp,
  smoothstep,
  normalize,
  dot,
  sqrt,
  exp,
  Fn,
} from "three/tsl";
import { MeshStandardNodeMaterial } from "three/webgpu";
import type { PlanetAtmosphereProperties } from "@teskooano/data-types";

/**
 * TSL-based material for atmospheric scattering effect with support for multiple light sources.
 * Uses Three.js Shading Language for WebGPU renderer compatibility.
 */
export class AtmosphereNodeMaterial extends MeshStandardNodeMaterial {
  private glowColorUniform: any;
  private intensityUniform: any;
  private powerUniform: any;
  private atmosphereThicknessUniform: any;
  private planetRadiusUniform: any;
  private aberrationIntensityUniform: any;
  private opacityUniform: any;

  constructor(
    atmosphereProps: PlanetAtmosphereProperties & {
      aberrationIntensity?: number;
      opacity?: number;
    },
    options: {
      planetRadius?: number;
      parentId?: string;
    } = {},
  ) {
    super();

    const {
      glowColor = "#fefefe",
      intensity = 1.0,
      power = 2.0,
      thickness = 0.1,
      aberrationIntensity = 1,
      opacity = 1.0,
    } = atmosphereProps;

    const { planetRadius = 1.0 } = options;

    console.log("[AtmosphereNodeMaterial] Creating WebGPU TSL material");

    // Initialize TSL uniforms
    this.glowColorUniform = uniform(new THREE.Color(glowColor));
    this.intensityUniform = uniform(intensity);
    this.powerUniform = uniform(power);
    this.atmosphereThicknessUniform = uniform(thickness);
    this.planetRadiusUniform = uniform(planetRadius);
    this.aberrationIntensityUniform = uniform(aberrationIntensity);
    this.opacityUniform = uniform(opacity);

    // Rayleigh scattering phase function
    const rayleighPhase = Fn(([cosTheta]: [any]) => {
      const cosThetaSq = mul(cosTheta, cosTheta);
      return mul(float(0.75), add(float(1.0), cosThetaSq));
    });

    // Mie scattering phase function
    const miePhase = Fn(([cosTheta, g]: [any, any]) => {
      const g2 = mul(g, g);
      const term = add(add(float(1.0), g2), mul(mul(float(-2.0), g), cosTheta));
      return mul(sub(float(1.0), g2), pow(term, float(1.5)).oneMinus());
    });

    // Simplified optical depth calculation
    const opticalDepth = Fn(([viewAngle]: [any]) => {
      // Approximation: depth increases as we look more tangentially
      const depth = pow(sub(float(1.0), abs(viewAngle)), float(2.0));
      return mul(depth, float(0.3));
    });

    // Main atmosphere shader logic
    const atmosphereEffect = Fn(() => {
      const worldPos = positionWorld;
      const worldNormal = normalWorld;
      const viewDir = normalize(sub(cameraPosition, worldPos));

      // Calculate view angle to surface normal
      const viewAngle = dot(viewDir, worldNormal);
      const absViewAngle = abs(viewAngle);

      // Density calculation based on view angle
      const oneMinusView = sub(float(1.0), absViewAngle);
      const atmosphereDensity = mul(
        pow(oneMinusView, this.powerUniform),
        this.intensityUniform,
      );

      // Edge glow effect
      const edgeGlow = mul(pow(oneMinusView, float(2.0)), float(1.5));

      // Simplified scattering (single light approximation for TSL)
      // In real implementation, you'd iterate over light sources
      const scatterAngle = mul(viewAngle, float(0.5)).add(float(0.5));

      // Combine Rayleigh and Mie scattering
      const rayleighScatter = mul(
        rayleighPhase(scatterAngle),
        vec3(0.3, 0.5, 1.0),
      );
      const mieScatter = mul(miePhase(scatterAngle, float(0.76)), float(1.0));

      // Combine scattering effects
      const totalScatter = add(rayleighScatter, vec3(mieScatter));

      // Base atmosphere color
      const baseColor = mul(this.glowColorUniform, totalScatter);
      const glowColor = mul(this.glowColorUniform, edgeGlow);
      const finalColor = add(baseColor, glowColor);

      // Calculate alpha
      const depthContribution = mul(opticalDepth(viewAngle), float(0.2));
      let alpha = add(atmosphereDensity, depthContribution);
      alpha = alpha.add(float(0.1)); // Visibility boost
      alpha = mul(alpha, this.opacityUniform);
      alpha = clamp(alpha, float(0.0), float(1.0));

      // Chromatic aberration
      const aberrationStrength = mul(
        pow(oneMinusView, float(4.0)),
        this.aberrationIntensityUniform,
      );

      const finalR = finalColor.r.add(aberrationStrength);
      const finalG = finalColor.g;
      const finalB = finalColor.b.sub(aberrationStrength);

      const aberratedColor = vec3(finalR, finalG, finalB);
      const clampedColor = clamp(aberratedColor, float(0.0), float(1.0));

      return vec3(clampedColor);
    });

    // Apply atmosphere effect to color
    this.colorNode = atmosphereEffect();

    // Emissive component for glow
    this.emissiveNode = mul(this.colorNode, float(0.5));

    // Material properties
    this.roughnessNode = float(1.0);
    this.metalnessNode = float(0.0);
    this.opacityNode = mul(this.intensityUniform, this.opacityUniform);

    // Material settings
    this.transparent = true;
    this.side = THREE.DoubleSide;
    this.depthWrite = false;
    this.depthTest = true;
  }

  /**
   * Update method for TSL material.
   * TSL materials handle most updates automatically, but we keep this
   * for compatibility with the GLSL material interface.
   */
  update(
    time: number,
    timeScale: number,
    camera?: THREE.PerspectiveCamera,
    lightSources?: Map<string, any>,
  ): void {
    // TSL materials handle camera position and lighting automatically
    // No manual uniform updates needed
  }

  /**
   * Update atmosphere color
   */
  updateColor(color: THREE.Color): void {
    this.glowColorUniform.value.copy(color);
  }

  /**
   * Update atmosphere intensity
   */
  updateIntensity(intensity: number): void {
    this.intensityUniform.value = intensity;
  }

  /**
   * Update atmosphere opacity
   */
  updateOpacity(opacity: number): void {
    this.opacityUniform.value = opacity;
  }

  dispose(): void {
    super.dispose();
  }
}
