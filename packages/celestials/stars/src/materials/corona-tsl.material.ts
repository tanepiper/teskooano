import * as THREE from "three";
import type { LightSourcesMap } from "@teskooano/renderer-threejs-celestial";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { MeshBasicNodeMaterial } from "three/webgpu";
import {
  uniform,
  vec3,
  vec4,
  float,
  color,
  positionLocal,
  normalLocal,
  normalWorld,
  positionWorld,
  cameraPosition,
  Fn,
  mul,
  add,
  sub,
  div,
  pow,
  sin,
  cos,
  fract,
  dot,
  mix,
  smoothstep,
  abs,
  length,
  normalize,
} from "three/tsl";

/**
 * Corona Material with pulsing glow effect using WebGPU TSL
 */
export class CoronaTSLMaterial extends MeshBasicNodeMaterial {
  private timeUniform: ReturnType<typeof uniform>;
  private opacityUniform: ReturnType<typeof uniform>;

  constructor(
    starColor: THREE.Color = new THREE.Color(0xffff00),
    options: {
      scale?: number;
      opacity?: number;
      pulseSpeed?: number;
      noiseScale?: number;
    } = {},
  ) {
    super();

    // Create uniforms
    this.timeUniform = uniform(float(0.0));
    const colorUniform = uniform(color(starColor));
    this.opacityUniform = uniform(float(options.opacity ?? 0.6));
    const pulseSpeedUniform = uniform(float(options.pulseSpeed ?? 0.3));
    const noiseScaleUniform = uniform(float(options.noiseScale ?? 3.0));

    // ======================
    // NOISE FUNCTION
    // ======================

    /**
     * Simple noise for corona effects
     */
    const coronaNoise = Fn(([p]: [any]) => {
      const h = dot(p, vec3(127.1, 311.7, 74.7));
      return fract(mul(sin(h), float(43758.5453)));
    }).setLayout({
      name: "coronaNoise",
      type: "float",
      inputs: [{ name: "p", type: "vec3" }],
    });

    // ======================
    // CORONA SHADER
    // ======================

    const coronaEffect = Fn(() => {
      // Calculate view direction
      const viewDir = normalize(sub(cameraPosition, positionWorld));
      const viewAngle = dot(viewDir, normalWorld);
      const absViewAngle = abs(viewAngle);
      
      // Edge glow effect - stronger at edges
      const edgeGlow = pow(sub(float(1.0), absViewAngle), float(2.0));
      
      // Pulsing animation
      const pulse = add(
        float(1.0),
        mul(
          sin(mul(this.timeUniform, pulseSpeedUniform)),
          float(0.3),
        ),
      );
      
      // Noise variation for corona turbulence
      const noisePos = mul(positionLocal, noiseScaleUniform);
      const noise = coronaNoise(add(noisePos, vec3(this.timeUniform, this.timeUniform, float(0.0))));
      const noiseFactor = add(float(0.7), mul(noise, float(0.3)));
      
      // Combine effects
      const coronaIntensity = mul(mul(edgeGlow, pulse), noiseFactor);
      const finalOpacity = mul(coronaIntensity, this.opacityUniform);
      
      return vec4(colorUniform.r, colorUniform.g, colorUniform.b, finalOpacity);
    });

    // Assign to material
    this.colorNode = colorUniform;
    this.opacityNode = mul(
      pow(sub(float(1.0), abs(dot(normalize(sub(cameraPosition, positionWorld)), normalWorld))), float(2.0)),
      this.opacityUniform,
    );

    // Configure material properties
    this.transparent = true;
    this.side = THREE.DoubleSide;
    this.depthTest = true;
    this.depthWrite = false; // Corona doesn't write depth
    this.blending = THREE.AdditiveBlending;

    console.log("[CoronaTSLMaterial] Created WebGPU TSL corona material");
  }

  /**
   * Update the material with the current time
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Update time for animation
    const animationTime = ((time * timeScale) / 1000) * 0.001;
    this.timeUniform.value = animationTime;
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
  }
}
