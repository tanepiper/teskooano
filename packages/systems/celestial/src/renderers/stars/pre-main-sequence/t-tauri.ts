import * as THREE from "three";
import {
  PreMainSequenceStarRenderer,
  PreMainSequenceStarMaterial,
} from "./pre-main-sequence-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { type StarProperties, SCALE } from "@teskooano/data-types";
import { LODLevel } from "../../index";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";

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
 * Material for the main body of T-Tauri stars.
 */
export class TTauriMaterial extends PreMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xffcc99)) {
    super({
      starColor: color, // Orangish-yellow
      coronaIntensity: 0.3,
      pulseSpeed: 0.6, // Often variable and active
      glowIntensity: 0.7,
      temperatureVariation: 0.6, // Active, turbulent surfaces
      metallicEffect: 0.0,
    });
  }
}

/**
 * Renderer for T-Tauri stars - young, variable stars with disks and jets.
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
    return new TTauriMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xffcc99);
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 0.1;
    const jetLength = starRadius * 20; // Jets can be quite long
    const jetBaseRadius = starRadius * 0.5;

    const jetGroup = new THREE.Group();

    const jetGeometry = new THREE.ConeGeometry(
      jetBaseRadius,
      jetLength,
      16,
      1,
      true,
    ); // Open ended cone
    // Position and orient the jets (one up, one down)
    const jetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        jetColor: { value: new THREE.Color(0xaaddff) }, // Bluish, ionized gas
        opacity: { value: 0.4 },
      },
      vertexShader: TTAURI_JET_VERTEX_SHADER,
      fragmentShader: TTAURI_JET_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    this.effectMaterials.set(`${object.celestialObjectId}-jets`, jetMaterial);

    const jetTop = new THREE.Mesh(jetGeometry, jetMaterial);
    jetTop.position.y = starRadius + jetLength / 2;
    jetTop.name = `${object.celestialObjectId}-jet-top`;
    jetGroup.add(jetTop);

    const jetBottom = new THREE.Mesh(jetGeometry, jetMaterial);
    jetBottom.position.y = -(starRadius + jetLength / 2);
    jetBottom.rotation.x = Math.PI; // Rotate to point downwards
    jetBottom.name = `${object.celestialObjectId}-jet-bottom`;
    jetGroup.add(jetBottom);

    jetGroup.name = `${object.celestialObjectId}-bipolar-jets`;
    return jetGroup;
  }

  // Override update to include T-Tauri specific variability if desired (e.g. jet brightness, star spots)
  override update(
    time: number,
    lightSources?: Map<string, any>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera);
    // Example: Modulate jet opacity or star material based on T-Tauri specific properties
    // const starProps = object.properties as StarProperties;
    // if (starProps && starProps.variabilityType === 'T_TAURI_FLARE') { ... }
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 8000 * scale;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 80,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 40,
    });
    const existingEffect = mediumStarOnlyGroup.getObjectByName(
      `${object.celestialObjectId}-bipolar-jets`,
    );
    if (existingEffect) {
      mediumStarOnlyGroup.remove(existingEffect);
    }
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 1000 * scale,
    };

    return [level0, level1];
  }
}
