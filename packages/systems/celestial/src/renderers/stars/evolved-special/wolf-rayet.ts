import * as THREE from "three";
import {
  EvolvedSpecialStarRenderer,
  EvolvedSpecialStarMaterial,
} from "./evolved-special-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { AU_METERS, SCALE } from "@teskooano/data-types";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

// Placeholder shaders for Wolf-Rayet wind shell
const WOLF_RAYET_SHELL_VERTEX_SHADER = `
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const WOLF_RAYET_SHELL_FRAGMENT_SHADER = `
uniform float time;
uniform vec3 shellColor;
uniform float opacity;
varying vec3 vNormal;
varying vec2 vUv;

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float noise = simpleNoise(vUv + time * 0.02, 5.0) * 0.5 + simpleNoise(vUv * 2.0 - time * 0.01, 15.0) * 0.5;
  float edgeFactor = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  float finalAlpha = noise * edgeFactor * opacity;
  gl_FragColor = vec4(shellColor, finalAlpha);
}
`;

/**
 * Material for the main body of Wolf-Rayet stars.
 */
export class WolfRayetMaterial extends EvolvedSpecialStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xcad7ff)) {
    super({
      starColor: color,
      coronaIntensity: 0.5, // Intense radiation field, less defined corona visually
      pulseSpeed: 0.4,
      glowIntensity: 1.5, // Very luminous
      temperatureVariation: 0.6, // Turbulent surface
      metallicEffect: 0.1, // Often obscured by dense winds
    });
  }
}

/**
 * Renderer for Wolf-Rayet stars - hot, massive stars with strong stellar winds.
 */
export class WolfRayetRenderer extends EvolvedSpecialStarRenderer {
  protected getMaterial(
    object: RenderableCelestialObject,
  ): EvolvedSpecialStarMaterial {
    const color = this.getStarColor(object);
    return new WolfRayetMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Wolf-Rayet stars are very hot, typically bluish or whitish
    return new THREE.Color(0xcad7ff);
  }

  /**
   * Override billboard size calculation for Wolf-Rayet stars.
   *
   * @param object The renderable celestial object
   * @returns The calculated sprite size for billboard rendering
   */
  protected override calculateBillboardSize(
    object: RenderableCelestialObject,
  ): number {
    const starRadius_AU = object.radius / AU_METERS;

    // Wolf-Rayet stars should have a prominent billboard due to their wind shells
    const minSpriteSize = 0.15;
    const maxSpriteSize = 0.8;

    // Add a multiplier for the wind shell effect
    const calculatedSpriteSize = 0.15 + starRadius_AU * 0.2;

    return Math.max(
      minSpriteSize,
      Math.min(maxSpriteSize, calculatedSpriteSize),
    );
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const shellRadius = object.radius * 2.5; // Example: shell is 2.5x star radius
    const shellGeometry = new THREE.SphereGeometry(shellRadius, 64, 64);
    const shellMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        shellColor: { value: new THREE.Color(0x88aaff) }, // Bluish-white, typical of ionized gas
        opacity: { value: 0.3 }, // Semi-transparent shell
      },
      vertexShader: WOLF_RAYET_SHELL_VERTEX_SHADER,
      fragmentShader: WOLF_RAYET_SHELL_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, // Render both sides for a voluminous effect
      depthWrite: false,
    });

    this.effectMaterials.set(
      `${object.celestialObjectId}-shell`,
      shellMaterial,
    );

    const shellMesh = new THREE.Mesh(shellGeometry, shellMaterial);
    shellMesh.name = `${object.celestialObjectId}-wind-shell`;
    return shellMesh;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    // Adjust distance based on star size to ensure smooth transition
    const starRadius_AU = object.radius / AU_METERS;
    const sizeBasedDistance = 40000 + starRadius_AU * 2500;
    return Math.min(70000, sizeBasedDistance) * scale;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    // High detail (includes effect layer via _createHighDetailGroup override)
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 128,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium detail: star body + corona, but no complex effect layer for performance.
    // We can refine this later if a simplified effect layer is needed for mid-LOD.
    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 64, // Reduced segments for star body at medium LOD
    });
    // Remove any pre-existing effect layer if super._createHighDetailGroup added one
    // (though our current EvolvedSpecialStarRenderer._createHighDetailGroup adds it *after* super call)
    const existingEffect = mediumStarOnlyGroup.getObjectByName(
      `${object.celestialObjectId}-wind-shell`,
    );
    if (existingEffect) {
      mediumStarOnlyGroup.remove(existingEffect);
    }
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 2000 * scale,
    };

    return [level0, level1];
  }
}
