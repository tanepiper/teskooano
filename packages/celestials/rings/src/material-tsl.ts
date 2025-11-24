import { Color, DoubleSide, Vector3 } from "three";
import { MeshStandardNodeMaterial } from "three/webgpu";
import {
  uniform,
  vec3,
  vec4,
  float,
  positionWorld,
  normalWorld,
  uv,
  mul,
  add,
  sub,
  div,
  dot,
  normalize,
  length as lengthNode,
  clamp,
  smoothstep,
  sin,
  cos,
  pow,
  min,
  max,
  mix,
} from "three/tsl";

/**
 * TSL-based ring material for WebGPU rendering.
 * Provides semi-transparent ring rendering with lighting and shadow effects.
 */
export class RingNodeMaterial extends MeshStandardNodeMaterial {
  private colorUniform: any;
  private opacityUniform: any;
  private timeUniform: any;
  private rotationAngleUniform: any;
  private parentPositionUniform: any;
  private parentRadiusUniform: any;
  private segmentDensityUniform: any;
  private segmentWidthUniform: any;
  private particleDetailUniform: any;
  private densityVariationUniform: any;

  constructor(
    ringColor: Color = new Color(0xeeddaa),
    options: {
      opacity?: number;
      detailLevel?: "high" | "medium" | "low" | "very-low";
      rotationRate?: number;
      axialInclination?: number;
      ringTilt?: number;
      inheritParentTilt?: boolean;
      segmentDensity?: number;
      segmentWidth?: number;
      particleDetail?: number;
      densityVariation?: number;
    } = {},
  ) {
    super();

    console.log("[RingNodeMaterial] Creating WebGPU TSL ring material");

    // Initialize uniforms
    this.colorUniform = uniform(ringColor);
    this.opacityUniform = uniform(options.opacity ?? 0.8);
    this.timeUniform = uniform(0);
    this.rotationAngleUniform = uniform(0.0);
    this.parentPositionUniform = uniform(new Vector3(0, 0, 0));
    this.parentRadiusUniform = uniform(1.0);
    this.segmentDensityUniform = uniform(options.segmentDensity ?? 50.0);
    this.segmentWidthUniform = uniform(options.segmentWidth ?? 0.8);
    this.particleDetailUniform = uniform(options.particleDetail ?? 0.3);
    this.densityVariationUniform = uniform(options.densityVariation ?? 0.4);

    // Hash function for noise
    const hash = (p: any) => {
      const dotResult = dot(p, vec3(127.1, 311.7, 74.7));
      return sub(
        mul(sin(dotResult), float(43758.5453)),
        float(Math.floor(43758.5453)),
      );
    };

    // Simple noise function
    const noise = (st: any) => {
      const i = st.floor();
      const f = st.fract();
      const u = mul(f, mul(f, sub(float(3.0), mul(float(2.0), f))));

      return mix(
        mix(
          hash(add(i, vec3(0.0, 0.0, 0.0))),
          hash(add(i, vec3(1.0, 0.0, 0.0))),
          u.x,
        ),
        mix(
          hash(add(i, vec3(0.0, 1.0, 0.0))),
          hash(add(i, vec3(1.0, 1.0, 0.0))),
          u.x,
        ),
        u.y,
      );
    };

    // Ring segmentation effect
    const ringSegmentation = () => {
      const worldPos = positionWorld;
      const distanceFromCenter = lengthNode(
        sub(worldPos, this.parentPositionUniform),
      );

      // Segmentation pattern
      const segmentPattern = sin(
        mul(distanceFromCenter, this.segmentDensityUniform),
      );
      const segmentMask = smoothstep(
        sub(float(1.0), this.segmentWidthUniform),
        float(1.0),
        add(mul(segmentPattern, float(0.5)), float(0.5)),
      );

      // Particle detail noise
      const noiseValue = noise(mul(worldPos, float(20.0)));
      const particleVariation = mul(noiseValue, this.particleDetailUniform);

      // Density variation
      const densityNoise = noise(mul(worldPos, float(5.0)));
      const densityMask = add(
        float(1.0),
        mul(densityNoise, this.densityVariationUniform),
      );

      // Combine effects
      const finalOpacity = mul(
        mul(mul(segmentMask, densityMask), add(float(1.0), particleVariation)),
        this.opacityUniform,
      );

      return clamp(finalOpacity, float(0.0), float(1.0));
    };

    // Set color and opacity nodes
    this.colorNode = this.colorUniform;
    this.opacityNode = ringSegmentation();

    // Material settings for rings
    this.transparent = true;
    this.side = DoubleSide;
    this.depthWrite = false;

    // Use low metalness and roughness for icy/dusty appearance
    this.metalnessNode = float(0.1);
    this.roughnessNode = float(0.9);
  }

  /**
   * Update method for TSL ring material.
   * TSL materials handle most lighting automatically,
   * but we need to update animation and time-based effects.
   */
  update(time: number, parentPosition?: Vector3, parentRadius?: number): void {
    this.timeUniform.value = time;

    if (parentPosition) {
      this.parentPositionUniform.value.copy(parentPosition);
    }

    if (parentRadius !== undefined) {
      this.parentRadiusUniform.value = parentRadius;
    }

    // Rotation animation
    this.rotationAngleUniform.value += 0.01;
  }

  dispose(): void {
    super.dispose();
  }
}

/**
 * TSL-based accretion disk material for WebGPU rendering.
 * Used for black hole accretion disks with more intense effects.
 */
export class AccretionDiskNodeMaterial extends MeshStandardNodeMaterial {
  private colorUniform: any;
  private opacityUniform: any;
  private timeUniform: any;
  private intensityUniform: any;

  constructor(
    diskColor: Color = new Color(0xff8844),
    options: {
      opacity?: number;
      intensity?: number;
    } = {},
  ) {
    super();

    console.log(
      "[AccretionDiskNodeMaterial] Creating WebGPU TSL accretion disk material",
    );

    this.colorUniform = uniform(diskColor);
    this.opacityUniform = uniform(options.opacity ?? 0.9);
    this.timeUniform = uniform(0);
    this.intensityUniform = uniform(options.intensity ?? 2.0);

    // Accretion disk effect with hot inner regions
    const accretionEffect = () => {
      const worldPos = positionWorld;
      const distanceFromCenter = lengthNode(worldPos);

      // Hot inner region fades to cooler outer region
      const heatFalloff = div(float(1.0), add(distanceFromCenter, float(0.1)));
      const intensity = mul(
        this.intensityUniform,
        clamp(heatFalloff, float(0.0), float(2.0)),
      );

      return mul(intensity, this.opacityUniform);
    };

    // Set material properties
    this.colorNode = this.colorUniform;
    this.opacityNode = accretionEffect();
    this.emissiveNode = mul(
      this.colorUniform,
      mul(this.intensityUniform, float(0.5)),
    );

    // Material settings
    this.transparent = true;
    this.side = DoubleSide;
    this.depthWrite = false;

    // High emission for glowing accretion disk
    this.metalnessNode = float(0.0);
    this.roughnessNode = float(0.3);
  }

  update(time: number): void {
    this.timeUniform.value = time;
  }

  dispose(): void {
    super.dispose();
  }
}
