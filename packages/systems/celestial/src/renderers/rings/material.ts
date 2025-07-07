import { Color, DoubleSide, ShaderMaterial, Vector3 } from "three";
import {
  LightArrayUtils,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import ringVertexShader from "../../shaders/ring/ring.vertex.glsl";
import ringFragmentShader from "../../shaders/ring/ring.fragment.glsl";

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
        color: { value: ringColor },
        opacity: { value: options.opacity ?? 0.8 },
        time: { value: 0 },
        rotationAngle: { value: 0.0 },
        rotationRate: { value: options.rotationRate ?? 0.01 },
        uParentPosition: { value: new Vector3(0, 0, 0) },
        uParentRadius: { value: 1.0 },
        uNumLights: { value: 0 },
        uLightSources: {
          value: LightArrayUtils.createLightSourceArray(MAX_LIGHTS),
        },
        uNumShadowCasters: { value: 0 },
        uShadowCasters: {
          value: LightArrayUtils.createShadowCasterArray(MAX_SHADOW_CASTERS),
        },
        uDynamicAmbientIntensity: { value: 0.001 }, // Dynamic ambient uniform
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

  private resizeLightArrays(newSize: number): void {
    this.uniforms.uLightSources.value = LightArrayUtils.resizeLightArray(
      this,
      newSize,
      this.uniforms.uLightSources.value,
    );
    this.currentNumLights = newSize;
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
  ) {
    this.uniforms.time.value = time;

    // Update rotation angle based on time and rotation rate
    const rotationRate = this.uniforms.rotationRate.value;
    this.uniforms.rotationAngle.value = (time * rotationRate) % (Math.PI * 2);

    this.uniforms.uParentPosition.value.copy(parentPosition);
    this.uniforms.uParentRadius.value = parentRadius;

    const numLights = lightSources?.size ?? 0;
    if (numLights !== this.currentNumLights) {
      this.resizeLightArrays(numLights);
    }

    this.uniforms.uNumLights.value = numLights;
    if (lightSources) {
      let i = 0;
      for (const light of lightSources.values()) {
        const uniformLight = this.uniforms.uLightSources.value[i];
        uniformLight.position.copy(light.position);
        uniformLight.color.copy(light.color);
        uniformLight.intensity = light.intensity;
        i++;
      }
    }

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
