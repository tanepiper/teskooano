import * as THREE from "three";
import type {
  RenderableCelestialObject,
  StarProperties,
} from "@teskooano/data-types";
import type { LightSourcesMap } from "@teskooano/renderer-threejs-celestial";
import { MeshStandardNodeMaterial } from "three/webgpu";
import {
  uniform,
  vec3,
  vec4,
  float,
  color,
  positionLocal,
  normalLocal,
  uv,
  Fn,
  mul,
  add,
  sub,
  div,
  mod,
  pow,
  sin,
  cos,
  floor,
  fract,
  dot,
  mix,
  smoothstep,
  clamp,
  abs,
} from "three/tsl";

/**
 * Enhanced Star Material with plasma effects using WebGPU TSL
 * Features dynamic plasma, color variation, and animated surface turbulence
 */
export class EnhancedStarTSLMaterial extends MeshStandardNodeMaterial {
  private object: RenderableCelestialObject;
  private timeUniform: ReturnType<typeof uniform>;
  private lightingIntensityUniform: ReturnType<typeof uniform>;

  constructor(
    object: RenderableCelestialObject,
    baseColor: THREE.Color = new THREE.Color(0xffff00),
    options: {
      noiseScale?: number;
      noiseIntensity?: number;
      plasmaTurbulence?: number;
      lightingIntensity?: number;
    } = {},
  ) {
    super();

    this.object = object;
    const starProps = object.properties as StarProperties;

    // Set up colors with fallbacks
    const hotColor = starProps?.hotColor
      ? new THREE.Color(starProps.hotColor)
      : baseColor.clone().multiplyScalar(1.4);
    const surfaceColor = starProps?.surfaceColor
      ? new THREE.Color(starProps.surfaceColor)
      : baseColor;
    const coolColor = starProps?.coolColor
      ? new THREE.Color(starProps.coolColor)
      : baseColor.clone().multiplyScalar(0.3);

    // Create uniform nodes
    this.timeUniform = uniform(float(0.0));
    const starColorUniform = uniform(color(baseColor));
    const hotColorUniform = uniform(color(hotColor));
    const surfaceColorUniform = uniform(color(surfaceColor));
    const coolColorUniform = uniform(color(coolColor));

    const noiseScaleUniform = uniform(float(options.noiseScale ?? 1.0));
    const noiseIntensityUniform = uniform(float(options.noiseIntensity ?? 0.2));
    const plasmaTurbulenceUniform = uniform(float(options.plasmaTurbulence ?? 0.1));
    this.lightingIntensityUniform = uniform(float(options.lightingIntensity ?? 1.0));

    // ======================
    // NOISE FUNCTIONS (TSL)
    // ======================

    /**
     * Improved noise function for stellar plasma
     */
    const snoise = Fn(([uvParam, resParam, timeParam]: [any, any, any]) => {
      const s = vec3(1.0, 100.0, 10000.0);
      const scaledUv = mul(uvParam, add(resParam, mul(div(timeParam, float(40000.0)), float(0.1))));
      
      const uv0 = mul(floor(mod(scaledUv, resParam)), s);
      const uv1 = mul(floor(mod(add(scaledUv, vec3(1.0, 1.0, 1.0)), resParam)), s);
      const f = fract(scaledUv);
      const f2 = mul(mul(f, f), sub(float(3.0), mul(float(2.0), f)));
      
      const v = vec4(
        add(add(uv0.x, uv0.y), uv0.z),
        add(add(uv1.x, uv0.y), uv0.z),
        add(add(uv0.x, uv1.y), uv0.z),
        add(add(uv1.x, uv1.y), uv0.z),
      );
      
      const r = fract(mul(sin(mul(v, float(1e-3))), float(1e5)));
      const r0 = mix(mix(r.x, r.y, f2.x), mix(r.z, r.w, f2.x), f2.y);
      
      const r_next = fract(mul(sin(mul(add(v, sub(uv1.z, uv0.z)), float(1e-3))), float(1e5)));
      const r1 = mix(mix(r_next.x, r_next.y, f2.x), mix(r_next.z, r_next.w, f2.x), f2.y);
      
      return sub(mul(mix(r0, r1, f2.z), float(2.0)), float(1.0));
    }).setLayout({
      name: "snoise",
      type: "float",
      inputs: [
        { name: "uv", type: "vec3" },
        { name: "res", type: "float" },
        { name: "time", type: "float" },
      ],
    });

    /**
     * FBM for stellar plasma effects
     */
    const fbm = Fn(([p, time]: [any, any]) => {
      let sum = float(0.0);
      let amplitude = float(1.0);
      let frequency = float(1.0);

      // Manually unroll 3 octaves for WebGPU
      const offset1 = vec3(0.5, 0.8, 0.3);
      
      // Octave 1
      sum = add(sum, mul(snoise(mul(p, frequency), float(8.0), time), amplitude));
      amplitude = mul(amplitude, float(0.5));
      frequency = mul(frequency, float(2.0));
      const p1 = add(mul(p, float(1.1)), offset1);
      
      // Octave 2
      sum = add(sum, mul(snoise(mul(p1, frequency), float(8.0), time), amplitude));
      amplitude = mul(amplitude, float(0.5));
      frequency = mul(frequency, float(2.0));
      const p2 = add(mul(p1, float(1.1)), offset1);
      
      // Octave 3
      sum = add(sum, mul(snoise(mul(p2, frequency), float(8.0), time), amplitude));
      
      return sum;
    }).setLayout({
      name: "fbm",
      type: "float",
      inputs: [
        { name: "p", type: "vec3" },
        { name: "time", type: "float" },
      ],
    });

    // ======================
    // MAIN SHADER LOGIC
    // ======================

    const plasmaShader = Fn(() => {
      const time = div(this.timeUniform, float(40000.0)).mul(float(0.1));
      
      // Create animated coordinates for plasma noise
      const animatedPosition = add(
        positionLocal,
        vec3(
          mul(time, float(2.0)),
          mul(time, float(3.0)),
          mul(time, float(4.0)),
        ),
      );
      const plasmaCoord = mul(animatedPosition, noiseScaleUniform);
      const plasmaNoise = fbm(plasmaCoord, time);
      
      // Create turbulence with different time offset
      const turbulenceCoord = add(
        mul(animatedPosition, mul(noiseScaleUniform, float(1.5))),
        vec3(
          mul(time, float(4.0)),
          mul(time, float(2.0)),
          mul(time, float(6.0)),
        ),
      );
      const turbulence = mul(mul(fbm(turbulenceCoord, time), plasmaTurbulenceUniform), float(0.5));
      
      // Combine noise effects
      const plasmaEffect = mul(add(plasmaNoise, turbulence), mul(noiseIntensityUniform, float(2.0)));
      
      // Create plasma pattern with sharp transitions
      const plasmaPattern = smoothstep(float(-0.6), float(0.6), plasmaEffect);
      
      // Mix colors based on plasma intensity
      const hotPlasma = mix(surfaceColorUniform, hotColorUniform, mul(plasmaPattern, float(0.8)));
      const coolPlasma = mix(
        surfaceColorUniform,
        coolColorUniform,
        mul(sub(float(1.0), plasmaPattern), float(0.6)),
      );
      
      // Final color blend
      let finalColor = mix(coolPlasma, hotPlasma, plasmaPattern);
      
      // Add subtle position-based variation
      const positionCoord = add(
        mul(animatedPosition, float(0.3)),
        vec3(
          mul(time, float(1.0)),
          mul(time, float(1.5)),
          mul(time, float(2.0)),
        ),
      );
      const positionVariation = fbm(positionCoord, time);
      finalColor = mix(finalColor, mul(finalColor, float(1.1)), mul(positionVariation, float(0.2)));
      
      // Apply lighting intensity
      finalColor = mul(finalColor, this.lightingIntensityUniform);
      
      return vec4(finalColor.x, finalColor.y, finalColor.z, float(1.0));
    });

    // Assign to material nodes
    this.colorNode = plasmaShader();
    this.emissiveNode = plasmaShader(); // Stars are self-luminous
    this.roughnessNode = uniform(float(1.0)); // Stars are rough (not reflective)
    this.metalnessNode = uniform(float(0.0)); // Stars are not metallic

    // Configure material properties
    this.transparent = false;
    this.side = THREE.FrontSide;
    this.depthTest = true;
    this.depthWrite = true;

    console.log("[EnhancedStarTSLMaterial] Created WebGPU TSL star material");
  }

  /**
   * Update the material with current time and state
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Update time uniform for animation
    this.timeUniform.value = time;

    // Update star colors from object properties if changed
    const starProps = this.object.properties as StarProperties;
    // TSL materials handle color updates through uniform nodes automatically
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();
  }
}
