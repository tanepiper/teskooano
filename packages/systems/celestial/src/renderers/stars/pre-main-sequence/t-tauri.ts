import * as THREE from "three";
import { SCALE } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions, LODLevel } from "../../common/types";
import type { StarProperties } from "@teskooano/data-types";
import {
  PreMainSequenceStarRenderer,
  PreMainSequenceStarMaterial,
} from "./pre-main-sequence-star-renderer";
import type { BaseStarUniformArgs } from "../main-sequence/main-sequence-star";

// Placeholder shaders for T-Tauri jets
const TTAURI_JET_VERTEX_SHADER = `
varying vec2 vUv;
varying float vDistanceFromBase;
attribute float coneAngle;

void main() {
  vUv = uv;
  vDistanceFromBase = position.y; // Assuming jet is aligned with Y-axis
  vec3 pos = position;
  // Taper the jet: make it thinner further from the star
  float taper = smoothstep(0.0, 10.0, position.y); // Adjust 10.0 for jet length
  pos.xz *= (1.0 - taper * 0.8); // Taper to 20% of base width

  // Add some wobble or twisting based on distance and time (passed as uniform or attribute if needed)
  // float angle = position.y * 0.1 + time * 0.5; 
  // mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  // pos.xz = rotation * pos.xz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const TTAURI_JET_FRAGMENT_SHADER = `
uniform float time;
uniform vec3 jetColor;
uniform float opacity;
varying vec2 vUv;
varying float vDistanceFromBase;

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale + time * 0.1, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float baseAlpha = smoothstep(0.0, 0.3, vUv.x) * (1.0 - smoothstep(0.7, 1.0, vUv.x)); // Fade at horizontal edges
  baseAlpha *= (1.0 - smoothstep(0.7, 1.0, vUv.y)); // Fade at the tip of the jet

  float noise = simpleNoise(vUv * vec2(1.0, 5.0), 5.0);
  float finalAlpha = baseAlpha * (0.5 + noise * 0.5) * opacity;
  
  // Make color brighter near the base
  vec3 color = jetColor * (1.0 + (1.0 - vUv.y) * 0.5);

  gl_FragColor = vec4(color, finalAlpha);
}
`;

/**
 * Renderer for T-Tauri stars.
 * These are young, variable stars, often with disks and strong stellar winds.
 */
export class TTauriRenderer extends PreMainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): PreMainSequenceStarMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.3,
      pulseSpeed: 0.5, // Variable stars, so pulse can be more pronounced
      glowIntensity: 0.5,
      temperatureVariation: 0.6, // Highly variable surface
      metallicEffect: 0.02,
      noiseEvolutionSpeed: 0.3, // Active surfaces
    };

    const propsUniforms = properties.shaderUniforms?.baseStar;
    const propsTimeOffset = properties.timeOffset;

    const finalMaterialOptions: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      ...classDefaults,
      ...(propsUniforms || {}),
      timeOffset:
        propsTimeOffset ?? classDefaults.timeOffset ?? Math.random() * 1000.0,
    };

    return new PreMainSequenceStarMaterial(color, finalMaterialOptions);
  }

  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[TTauriRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xffc8a0); // Default T-Tauri color (Orangey-yellow)
  }

  // T-Tauri stars often have disks, similar to protostars but perhaps less dense or different structure.
  // The getEffectLayer from PreMainSequenceStarRenderer might be specialized here.
  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    // Example: T-Tauri might have a less dense disk or just stellar winds visuals
    // For now, let's assume a simple disk, similar to a less prominent protostar disk
    const starRadius = object.radius || 0.1;
    const diskInnerRadius = starRadius * 2.0; // Disk further out
    const diskOuterRadius = starRadius * 8;

    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      32,
      5,
      0,
      Math.PI * 2,
    );
    diskGeometry.rotateX(-Math.PI / 2);

    // Could use a specific T-Tauri disk shader or a generic one
    const diskMaterial = new THREE.MeshBasicMaterial({
      color: new THREE.Color(0xaf8c73), // Dusty, slightly less dense than protostar
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.6,
    });
    this.effectMaterials.set(`${object.celestialObjectId}-disk`, diskMaterial);

    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
    diskMesh.name = `${object.celestialObjectId}-ttauri-disk`;
    return diskMesh;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 48, // T-Tauri stars are more defined than protostars but still young
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 24,
      includeEffects: false,
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 1000 * scale,
    };

    return [level0, level1];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 4000 * scale; // Brighter/more distinct than protostars usually
  }
}
