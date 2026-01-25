import { Color, DoubleSide, ShaderMaterial, Vector3 } from "three";
import {
  LightArrayUtils,
  LightingUniformPack,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import ringVertexShader from "./shaders/ring.vertex.glsl";
import ringFragmentShader from "./shaders/ring.fragment.glsl";
import accretionDiskFragmentShader from "./shaders/accretion-disk.fragment.glsl";

const MAX_LIGHTS = 4;
const MAX_SHADOW_CASTERS = 4;

const lightArrays = LightingUniformPack.createLightArrays(MAX_LIGHTS);

/**
 * Material for celestial object rings
 * Works for all ring types with configuration options
 */
export class RingMaterial extends ShaderMaterial {
  protected currentNumLights: number = 0;
  protected currentNumShadowCasters: number = 0;

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
    const detailLevel = options.detailLevel || "high";

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
      uniforms: {
        color: { value: ringColor },
        opacity: { value: options.opacity ?? 0.8 },
        time: { value: 0 },
        rotationAngle: { value: 0.0 },
        rotationRate: { value: options.rotationRate ?? 0.01 },
        uParentPosition: { value: new Vector3(0, 0, 0) },
        uParentRadius: { value: 1.0 },
        uNumLights: { value: 0 },
        uLightPositions: { value: lightArrays.positions },
        uLightColors: { value: lightArrays.colors },
        uLightIntensities: { value: lightArrays.intensities },
        uNumShadowCasters: { value: 0 },
        uShadowCasters: {
          value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS),
        },
        uAmbientColor: { value: new Color(0xffffff) },
        uAmbientIntensity: { value: 0.02 }, // Lowered for stronger shadow contrast

        // Enhanced Axial Inclination Controls
        uAxialInclination: { value: options.axialInclination ?? 0.0 },
        uRingTilt: { value: options.ringTilt ?? 0.0 },
        uInheritParentTilt: { value: options.inheritParentTilt ?? true },
        uParentAxialTilt: { value: new Vector3(0, 1, 0) }, // Default Y-axis
        uPrecessionAngle: { value: 0.0 },
        uPrecessionRate: { value: 0.0 },

        // Ring Segmentation Controls
        uSegmentDensity: { value: options.segmentDensity ?? 50.0 }, // Number of segments per ring
        uSegmentWidth: { value: options.segmentWidth ?? 0.8 }, // Width of each segment (0.0-1.0)
        uParticleDetail: { value: options.particleDetail ?? 0.3 }, // Intensity of particle detail
        uDensityVariation: { value: options.densityVariation ?? 0.4 }, // Intensity of density variations
      },
      vertexShader: ringVertexShader,
      fragmentShader: ringFragmentShader,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  private resizeShadowCasterArrays(newSize: number): void {
    this.uniforms.uShadowCasters.value =
      LightArrayUtils.resizeShadowCasterArray(
        this,
        newSize,
        this.uniforms.uShadowCasters.value,
      );
    this.currentNumShadowCasters = newSize;
  }

  update(
    time: number,
    parentPosition: Vector3,
    parentRadius: number,
    lightSources?: LightSourcesMap,
    shadowCasters?: { position: Vector3; radius: number }[],
    parentAxialTilt?: Vector3,
    precessionRate?: number,
  ) {
    this.uniforms.time.value = time;

    // Update rotation angle based on time and rotation rate
    const rotationRate = this.uniforms.rotationRate.value;
    this.uniforms.rotationAngle.value = (time * rotationRate) % (Math.PI * 2);

    // Update precession angle if provided
    if (precessionRate !== undefined) {
      this.uniforms.uPrecessionRate.value = precessionRate;
      this.uniforms.uPrecessionAngle.value =
        (time * precessionRate) % (Math.PI * 2);
    }

    this.uniforms.uParentPosition.value.copy(parentPosition);
    this.uniforms.uParentRadius.value = parentRadius;

    // Update parent axial tilt if provided
    if (parentAxialTilt) {
      this.uniforms.uParentAxialTilt.value.copy(parentAxialTilt);
    }

    LightingUniformPack.apply(
      {
        uNumLights: this.uniforms.uNumLights,
        uLightPositions: this.uniforms.uLightPositions,
        uLightColors: this.uniforms.uLightColors,
        uLightIntensities: this.uniforms.uLightIntensities,
        uAmbientColor: this.uniforms.uAmbientColor,
      },
      lightSources,
      MAX_LIGHTS,
    );

    const numShadowCasters = shadowCasters?.length ?? 0;
    if (numShadowCasters !== this.currentNumShadowCasters) {
      this.resizeShadowCasterArrays(numShadowCasters);
    }

    this.uniforms.uNumShadowCasters.value = numShadowCasters;
    if (shadowCasters) {
      for (let i = 0; i < numShadowCasters; i++) {
        const uniformCaster = this.uniforms.uShadowCasters.value[i];
        uniformCaster.position.copy(shadowCasters[i].position);
        uniformCaster.radius = shadowCasters[i].radius;
      }
    }
  }

  dispose(): void {
    super.dispose();
  }
}

/**
 * Material for accretion disks around black holes and compact objects
 * Includes temperature-based emission and relativistic effects
 */
export class AccretionDiskMaterial extends ShaderMaterial {
  protected currentNumLights: number = 0;
  protected currentNumShadowCasters: number = 0;

  constructor(
    diskColor: Color = new Color(0xffffff),
    options: {
      opacity?: number;
      detailLevel?: "high" | "medium" | "low" | "very-low";
      rotationRate?: number;
      temperature?: number;
      accretionRate?: number;
      emissionType?: "thermal" | "synchrotron" | "mixed";
      isRelativistic?: boolean;
      innerEdgeRadius?: number;
      axialInclination?: number;
      ringTilt?: number;
      inheritParentTilt?: boolean;
    } = {},
  ) {
    const detailLevel = options.detailLevel || "high";

    const MAX_LIGHTS = 4;
    const MAX_SHADOW_CASTERS = 4;

    super({
      defines: {
        MAX_LIGHTS: MAX_LIGHTS,
        MAX_SHADOW_CASTERS: MAX_SHADOW_CASTERS,
      },
      uniforms: {
        color: { value: diskColor },
        opacity: { value: options.opacity ?? 0.9 },
        time: { value: 0 },
        rotationAngle: { value: 0.0 },
        rotationRate: { value: options.rotationRate ?? 0.02 },
        uParentPosition: { value: new Vector3(0, 0, 0) },
        uParentRadius: { value: 1.0 },
        uNumLights: { value: 0 },
        uLightPositions: { value: lightArrays.positions },
        uLightColors: { value: lightArrays.colors },
        uLightIntensities: { value: lightArrays.intensities },
        uNumShadowCasters: { value: 0 },
        uShadowCasters: {
          value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS),
        },
        uAmbientColor: { value: new Color(0xffffff) },
        uAmbientIntensity: { value: 0.01 }, // System-wide minimum ambient for "just enough glow"

        // Accretion Disk Specific Uniforms
        uIsAccretionDisk: { value: true },
        uTemperature: { value: options.temperature ?? 10000.0 }, // 10,000 K default
        uAccretionRate: { value: options.accretionRate ?? 1e-8 }, // 10^-8 solar masses/year
        uEmissionType: {
          value:
            options.emissionType === "synchrotron"
              ? 1
              : options.emissionType === "mixed"
                ? 2
                : 0,
        },
        uIsRelativistic: { value: options.isRelativistic ?? false },
        uInnerEdgeRadius: { value: options.innerEdgeRadius ?? 3.0 }, // 3 gravitational radii

        // Enhanced Axial Inclination Controls
        uAxialInclination: { value: options.axialInclination ?? 0.0 },
        uRingTilt: { value: options.ringTilt ?? 0.0 },
        uInheritParentTilt: { value: options.inheritParentTilt ?? true },
        uParentAxialTilt: { value: new Vector3(0, 1, 0) }, // Default Y-axis
        uPrecessionAngle: { value: 0.0 },
        uPrecessionRate: { value: 0.0 },
      },
      vertexShader: ringVertexShader,
      fragmentShader: accretionDiskFragmentShader,
      transparent: true,
      side: DoubleSide,
      depthWrite: false,
    });

    this.currentNumLights = MAX_LIGHTS;
    this.currentNumShadowCasters = MAX_SHADOW_CASTERS;
  }

  private resizeShadowCasterArrays(newSize: number): void {
    this.uniforms.uShadowCasters.value =
      LightArrayUtils.resizeShadowCasterArray(
        this,
        newSize,
        this.uniforms.uShadowCasters.value,
      );
    this.currentNumShadowCasters = newSize;
  }

  update(
    time: number,
    parentPosition: Vector3,
    parentRadius: number,
    lightSources?: LightSourcesMap,
    shadowCasters?: { position: Vector3; radius: number }[],
    parentAxialTilt?: Vector3,
    precessionRate?: number,
  ) {
    this.uniforms.time.value = time;

    // Update rotation angle based on time and rotation rate
    const rotationRate = this.uniforms.rotationRate.value;
    this.uniforms.rotationAngle.value = (time * rotationRate) % (Math.PI * 2);

    // Update precession angle if provided
    if (precessionRate !== undefined) {
      this.uniforms.uPrecessionRate.value = precessionRate;
      this.uniforms.uPrecessionAngle.value =
        (time * precessionRate) % (Math.PI * 2);
    }

    this.uniforms.uParentPosition.value.copy(parentPosition);
    this.uniforms.uParentRadius.value = parentRadius;

    // Update parent axial tilt if provided
    if (parentAxialTilt) {
      this.uniforms.uParentAxialTilt.value.copy(parentAxialTilt);
    }

    LightingUniformPack.apply(
      {
        uNumLights: this.uniforms.uNumLights,
        uLightPositions: this.uniforms.uLightPositions,
        uLightColors: this.uniforms.uLightColors,
        uLightIntensities: this.uniforms.uLightIntensities,
        uAmbientColor: this.uniforms.uAmbientColor,
      },
      lightSources,
      MAX_LIGHTS,
    );

    const numShadowCasters = shadowCasters?.length ?? 0;
    if (numShadowCasters !== this.currentNumShadowCasters) {
      this.resizeShadowCasterArrays(numShadowCasters);
    }

    this.uniforms.uNumShadowCasters.value = numShadowCasters;
    if (shadowCasters) {
      for (let i = 0; i < numShadowCasters; i++) {
        const uniformCaster = this.uniforms.uShadowCasters.value[i];
        uniformCaster.position.copy(shadowCasters[i].position);
        uniformCaster.radius = shadowCasters[i].radius;
      }
    }
  }

  dispose(): void {
    super.dispose();
  }
}
