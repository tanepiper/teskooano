import * as THREE from "three";
import {
  EvolvedSpecialStarRenderer,
  EvolvedSpecialStarMaterial,
} from "./evolved-special-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { AU_METERS, SCALE } from "@teskooano/data-types";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

// Placeholder shaders for Carbon Star dusty shell
const CARBON_SHELL_VERTEX_SHADER = `
varying vec3 vNormal;
varying vec2 vUv;
void main() {
  vNormal = normalize(normalMatrix * normal);
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const CARBON_SHELL_FRAGMENT_SHADER = `
uniform float time;
uniform vec3 shellColor;
uniform float opacity;
varying vec3 vNormal;
varying vec2 vUv;

float simpleNoise(vec2 uv, float scale, float speed) {
  return fract(sin(dot(uv * scale + time * speed, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float noise1 = simpleNoise(vUv, 3.0, 0.01);
  float noise2 = simpleNoise(vUv * 1.5 + vec2(0.5,0.5), 5.0, 0.005);
  float combinedNoise = noise1 * 0.6 + noise2 * 0.4;
  float edgeFactor = pow(smoothstep(0.0, 1.0, 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)))), 1.5);
  float finalAlpha = combinedNoise * edgeFactor * opacity;
  gl_FragColor = vec4(shellColor, finalAlpha);
}
`;

/**
 * Material for the main body of Carbon stars.
 */
export class CarbonStarMaterial extends EvolvedSpecialStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff4422)) {
    super({
      starColor: color, // Deep red
      coronaIntensity: 0.3, // Often obscured by dust
      pulseSpeed: 0.1, // Can be variable, pulsation common
      glowIntensity: 0.6,
      temperatureVariation: 0.4,
      metallicEffect: 0.05, // Not a prominent feature visually
    });
  }
}

/**
 * Renderer for Carbon Stars - old, cool stars rich in carbon.
 */
export class CarbonStarRenderer extends EvolvedSpecialStarRenderer {
  protected getMaterial(
    object: RenderableCelestialObject,
  ): EvolvedSpecialStarMaterial {
    const color = this.getStarColor(object);
    return new CarbonStarMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Carbon stars are distinctly red-orange to reddish-purple
    return new THREE.Color(0xff3300);
  }

  /**
   * Override billboard size calculation for Carbon stars.
   * Carbon stars are typically larger than main sequence stars and have dusty shells.
   *
   * @param object The renderable celestial object
   * @returns The calculated sprite size for billboard rendering
   */
  protected override calculateBillboardSize(
    object: RenderableCelestialObject,
  ): number {
    const starRadius_AU = object.radius / AU_METERS;

    // Carbon stars can be large with prominent dust shells
    const minSpriteSize = 0.12;
    const maxSpriteSize = 0.7;

    // Add scaling for the dust shell effect
    const calculatedSpriteSize = 0.12 + starRadius_AU * 0.15;

    return Math.max(
      minSpriteSize,
      Math.min(maxSpriteSize, calculatedSpriteSize),
    );
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    // Adjust distance based on star size for smooth transition
    const starRadius_AU = object.radius / AU_METERS;
    const sizeBasedDistance = 35000 + starRadius_AU * 2000;
    return Math.min(60000, sizeBasedDistance) * scale;
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const shellRadius = object.radius * 3.0; // Larger, diffuse shell
    const shellGeometry = new THREE.SphereGeometry(shellRadius, 48, 48); // Fewer segments for a soft look
    const shellMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        shellColor: { value: new THREE.Color(0x502010) }, // Sooty, dark red/brown
        opacity: { value: 0.4 },
      },
      vertexShader: CARBON_SHELL_VERTEX_SHADER,
      fragmentShader: CARBON_SHELL_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.NormalBlending, // Normal blending for a dusty look, not additive
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.effectMaterials.set(
      `${object.celestialObjectId}-dust-shell`,
      shellMaterial,
    );

    const shellMesh = new THREE.Mesh(shellGeometry, shellMaterial);
    shellMesh.name = `${object.celestialObjectId}-dust-shell`;
    return shellMesh;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96, // Carbon stars are large, but not needing extreme detail on body
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 48,
    });
    const existingEffect = mediumStarOnlyGroup.getObjectByName(
      `${object.celestialObjectId}-dust-shell`,
    );
    if (existingEffect) {
      mediumStarOnlyGroup.remove(existingEffect);
    }
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 1500 * scale,
    };

    return [level0, level1];
  }
}
