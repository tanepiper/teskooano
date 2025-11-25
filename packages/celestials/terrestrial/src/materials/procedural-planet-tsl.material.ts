import type { ProceduralSurfaceProperties } from "@teskooano/data-types";
import { MeshStandardNodeMaterial } from "three/webgpu";
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
  length,
  normalize,
  abs,
  max,
  min,
} from "three/tsl";
import * as THREE from "three";
import type { LightSourceData } from "@teskooano/renderer-threejs-celestial";

/**
 * TSL-based procedural planet material for WebGPU rendering.
 * Implements multi-color terrain, procedural noise, and PBR lighting.
 */
export class ProceduralPlanetTSLMaterial extends MeshStandardNodeMaterial {
  // Store uniform references for updates
  private timeUniform: ReturnType<typeof uniform>;
  private cameraPositionUniform: ReturnType<typeof uniform>;

  // Material parameters
  private roughnessUniform: ReturnType<typeof uniform>;
  private metalnessUniform: ReturnType<typeof uniform>;

  constructor(surfaceProps: ProceduralSurfaceProperties) {
    super();

    const parseColor = (hex: string | undefined, defaultColor: string): THREE.Color => {
      try {
        return new THREE.Color(hex ?? defaultColor);
      } catch (e) {
        console.warn(`Error parsing color ${hex}, using default ${defaultColor}`, e);
        return new THREE.Color(defaultColor);
      }
    };

    // Create uniform nodes
    const persistence = uniform(float(surfaceProps.persistence ?? 0.5));
    const lacunarity = uniform(float(surfaceProps.lacunarity ?? 2.0));
    const octaves = uniform(float(surfaceProps.octaves ?? 6));
    const undulation = uniform(float(surfaceProps.undulation ?? 0.1));

    // Color uniforms
    const color1 = uniform(color(parseColor(surfaceProps.color1, "#5179B5")));
    const color2 = uniform(color(parseColor(surfaceProps.color2, "#4C9341")));
    const color3 = uniform(color(parseColor(surfaceProps.color3, "#836F27")));
    const color4 = uniform(color(parseColor(surfaceProps.color4, "#A0A0A0")));
    const color5 = uniform(color(parseColor(surfaceProps.color5, "#FFFFFF")));

    // Height thresholds
    const height1 = uniform(float(surfaceProps.height1 ?? 0.0));
    const height2 = uniform(float(surfaceProps.height2 ?? 0.2));
    const height3 = uniform(float(surfaceProps.height3 ?? 0.4));
    const height4 = uniform(float(surfaceProps.height4 ?? 0.6));
    const height5 = uniform(float(surfaceProps.height5 ?? 0.8));

    // Terrain parameters
    const terrainType = uniform(float(surfaceProps.terrainType ?? 2));
    const terrainAmplitude = uniform(float(surfaceProps.terrainAmplitude ?? 1.0));
    const terrainSharpness = uniform(float(surfaceProps.terrainSharpness ?? 1.0));
    const terrainOffset = uniform(float(surfaceProps.terrainOffset ?? 0.0));

    // Time and camera
    this.timeUniform = uniform(float(0.0));
    this.cameraPositionUniform = uniform(vec3(0, 0, 0));

    // Material properties
    const bumpScale = uniform(float(surfaceProps.bumpScale ?? 1.0));
    this.roughnessUniform = uniform(float(surfaceProps.roughness ?? 0.5));
    this.metalnessUniform = uniform(float(0.0)); // Planets are not metallic

    // ======================
    // NOISE FUNCTIONS (TSL)
    // ======================

    /**
     * Simple hash function for noise generation
     */
    const hash = Fn(([p]: [any]) => {
      const h = dot(p, vec3(127.1, 311.7, 74.7));
      return fract(mul(sin(h), float(43758.5453123)));
    }).setLayout({
      name: "hash",
      type: "float",
      inputs: [{ name: "p", type: "vec3" }],
    });

    /**
     * 3D noise function
     */
    const noise3D = Fn(([p]: [any]) => {
      const i = floor(p);
      const f = fract(p);

      // Cubic interpolation for smooth noise
      const u = mul(mul(f, f), sub(float(3.0), mul(float(2.0), f)));

      // Sample corners and interpolate
      return mix(
        mix(
          mix(hash(add(i, vec3(0, 0, 0))), hash(add(i, vec3(1, 0, 0))), u.x),
          mix(hash(add(i, vec3(0, 1, 0))), hash(add(i, vec3(1, 1, 0))), u.x),
          u.y,
        ),
        mix(
          mix(hash(add(i, vec3(0, 0, 1))), hash(add(i, vec3(1, 0, 1))), u.x),
          mix(hash(add(i, vec3(0, 1, 1))), hash(add(i, vec3(1, 1, 1))), u.x),
          u.y,
        ),
        u.z,
      );
    }).setLayout({
      name: "noise3D",
      type: "float",
      inputs: [{ name: "p", type: "vec3" }],
    });

    /**
     * Fractional Brownian Motion (FBM) for terrain
     */
    const fbm = Fn(([p, octavesParam, persistenceParam, lacunarityParam]: [any, any, any, any]) => {
      let value = float(0.0);
      let amplitude = float(1.0);
      let frequency = float(1.0);
      const octaveCount = 6; // Fixed for TSL loop unrolling

      // Manually unroll octaves for WebGPU compatibility
      for (let i = 0; i < octaveCount; i++) {
        value = add(value, mul(amplitude, noise3D(mul(p, frequency))));
        amplitude = mul(amplitude, persistenceParam);
        frequency = mul(frequency, lacunarityParam);
      }

      return value;
    }).setLayout({
      name: "fbm",
      type: "float",
      inputs: [
        { name: "p", type: "vec3" },
        { name: "octaves", type: "float" },
        { name: "persistence", type: "float" },
        { name: "lacunarity", type: "float" },
      ],
    });

    /**
     * Terrain generation with different types
     */
    const generateTerrain = Fn(
      ([position, typeParam, amplitudeParam, sharpnessParam, offsetParam]: [any, any, any, any, any]) => {
        const noiseValue = fbm(position, octaves, persistence, lacunarity);

        // Apply terrain type modifications
        // Type 1: Simple noise
        // Type 2: Sharp peaks (ridged)
        // Type 3: Sharp valleys

        let height = noiseValue;

        // Sharp peaks (ridged)
        const ridged = sub(float(1.0), abs(mul(noiseValue, float(2.0)).sub(float(1.0))));
        const sharpPeaks = pow(ridged, sharpnessParam);

        // Sharp valleys
        const valleys = pow(noiseValue, sharpnessParam);

        // Mix based on terrain type (simplified for TSL)
        // We use smoothstep to blend between types
        const isSharpPeaks = smoothstep(float(1.5), float(2.5), typeParam);
        const isValleys = smoothstep(float(2.5), float(3.5), typeParam);

        height = mix(height, sharpPeaks, isSharpPeaks);
        height = mix(height, valleys, isValleys);

        // Apply amplitude and offset
        return add(mul(height, amplitudeParam), offsetParam);
      },
    ).setLayout({
      name: "generateTerrain",
      type: "float",
      inputs: [
        { name: "position", type: "vec3" },
        { name: "type", type: "float" },
        { name: "amplitude", type: "float" },
        { name: "sharpness", type: "float" },
        { name: "offset", type: "float" },
      ],
    });

    /**
     * Multi-color blending based on height
     */
    const getTerrainColor = Fn(([heightValue]: [any]) => {
      // Smooth transitions between colors
      const t1 = smoothstep(height1, height2, heightValue);
      const t2 = smoothstep(height2, height3, heightValue);
      const t3 = smoothstep(height3, height4, heightValue);
      const t4 = smoothstep(height4, height5, heightValue);

      // Blend colors
      let finalColor = color1;
      finalColor = mix(finalColor, color2, t1);
      finalColor = mix(finalColor, color3, t2);
      finalColor = mix(finalColor, color4, t3);
      finalColor = mix(finalColor, color5, t4);

      return finalColor;
    }).setLayout({
      name: "getTerrainColor",
      type: "vec3",
      inputs: [{ name: "height", type: "float" }],
    });

    // ======================
    // MAIN SHADER LOGIC
    // ======================

    // Use normalized object-space position for seamless noise
    const objectPos = normalize(positionLocal);

    // Generate terrain height
    const terrainHeight = generateTerrain(objectPos, terrainType, terrainAmplitude, terrainSharpness, terrainOffset);

    // Get terrain color based on height
    const terrainColor = getTerrainColor(terrainHeight);

    // Apply undulation for subtle variation
    const undulationFactor = add(float(1.0), mul(sin(mul(terrainHeight, float(10.0))), undulation));
    const finalColor = mul(terrainColor, undulationFactor);

    // Assign nodes to material
    this.colorNode = finalColor;
    this.roughnessNode = this.roughnessUniform;
    this.metalnessNode = this.metalnessUniform;

    // Normal perturbation for bump mapping
    // Calculate gradient for normal mapping
    const epsilon = float(0.001);
    const heightX = generateTerrain(
      add(objectPos, vec3(epsilon, 0, 0)),
      terrainType,
      terrainAmplitude,
      terrainSharpness,
      terrainOffset,
    );
    const heightY = generateTerrain(
      add(objectPos, vec3(0, epsilon, 0)),
      terrainType,
      terrainAmplitude,
      terrainSharpness,
      terrainOffset,
    );
    const heightZ = generateTerrain(
      add(objectPos, vec3(0, 0, epsilon)),
      terrainType,
      terrainAmplitude,
      terrainSharpness,
      terrainOffset,
    );

    const gradient = vec3(
      sub(heightX, terrainHeight),
      sub(heightY, terrainHeight),
      sub(heightZ, terrainHeight),
    );

    // Perturb normal based on gradient and bump scale
    const perturbedNormal = normalize(sub(normalLocal, mul(gradient, bumpScale)));
    this.normalNode = perturbedNormal;

    // Configure material properties
    this.depthTest = true;
    this.depthWrite = true;
    this.transparent = false;

    console.log("[ProceduralPlanetTSLMaterial] Created WebGPU TSL material");
  }

  /**
   * Update material uniforms (called each frame by renderer)
   */
  update(
    time: number,
    timeScale: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.PerspectiveCamera,
    shadowCasters?: { position: THREE.Vector3; radius: number }[],
  ): void {
    this.timeUniform.value = time;

    if (camera) {
      this.cameraPositionUniform.value = camera.position;
    }

    // Note: MeshStandardNodeMaterial handles lighting automatically
    // No need for manual light source updates like in GLSL
  }
}
