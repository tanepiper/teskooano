import * as THREE from "three";
import {
  PreMainSequenceStarRenderer,
  PreMainSequenceStarMaterial,
} from "./pre-main-sequence-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { SCALE } from "@teskooano/data-types";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

// Placeholder shaders for Herbig Ae/Be accretion disk
const HERBIG_DISK_VERTEX_SHADER = `
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;
void main() {
  vUv = uv;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * viewMatrix * worldPosition;
}
`;

const HERBIG_DISK_FRAGMENT_SHADER = `
uniform float time;
uniform vec3 diskColor;
uniform float diskOpacity;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale + time * 0.002, vec2(15.9898, 72.233))) * 41758.5453);
}

void main() {
  float distFromCenter = length(vUv - vec2(0.5));
  float radialFalloff = smoothstep(0.0, 0.5, distFromCenter) * (1.0 - smoothstep(0.48, 0.5, distFromCenter));

  float densityPattern = simpleNoise(vUv * vec2(30.0, 5.0) + vec2(0.0, time * 0.02), 1.0);
  densityPattern = pow(densityPattern, 1.5);
  
  float finalDensity = radialFalloff * (0.4 + densityPattern * 0.6);
  finalDensity = clamp(finalDensity, 0.0, 1.0);

  vec3 lightDir = normalize(vec3(0.5, 0.8, 0.7)); 
  float lightIntensity = max(0.1, dot(normalize(vNormal), lightDir)) * 0.7 + 0.3;
  
  gl_FragColor = vec4(diskColor * lightIntensity, finalDensity * diskOpacity);
}
`;

/**
 * Material for the main body of Herbig Ae/Be stars.
 */
export class HerbigAeBeMaterial extends PreMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xaaccff)) {
    super({
      starColor: color, // Bluish-white, hotter than T-Tauri
      coronaIntensity: 0.4,
      pulseSpeed: 0.3,
      glowIntensity: 0.9, // Brighter
      temperatureVariation: 0.4,
      metallicEffect: 0.0,
    });
  }
}

/**
 * Renderer for Herbig Ae/Be stars - intermediate mass pre-main-sequence stars.
 */
export class HerbigAeBeRenderer extends PreMainSequenceStarRenderer {
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
    return new HerbigAeBeMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xaaccff); // Bluish-white
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 0.15;
    const diskInnerRadius = starRadius * 2.0;
    const diskOuterRadius = starRadius * 15; // Can have substantial disks

    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      80,
      10,
    );
    diskGeometry.rotateX(-Math.PI / 2);

    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        diskColor: { value: new THREE.Color(0xeeeeff) }, // Lighter, icier disk color
        diskOpacity: { value: 0.35 },
      },
      vertexShader: HERBIG_DISK_VERTEX_SHADER,
      fragmentShader: HERBIG_DISK_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.NormalBlending,
      side: THREE.DoubleSide,
      depthWrite: true, // Disk may have some opacity
    });

    this.effectMaterials.set(
      `${object.celestialObjectId}-circumstellar-disk`,
      diskMaterial,
    );

    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
    diskMesh.name = `${object.celestialObjectId}-circumstellar-disk`;
    return diskMesh;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 10000 * scale;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 48,
    });
    const existingEffect = mediumStarOnlyGroup.getObjectByName(
      `${object.celestialObjectId}-circumstellar-disk`,
    );
    if (existingEffect) {
      mediumStarOnlyGroup.remove(existingEffect);
    }
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 1200 * scale,
    };

    return [level0, level1];
  }
}
