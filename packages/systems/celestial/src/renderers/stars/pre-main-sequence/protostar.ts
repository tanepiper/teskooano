import * as THREE from "three";
import {
  PreMainSequenceStarRenderer,
  PreMainSequenceStarMaterial,
} from "./pre-main-sequence-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { SCALE } from "@teskooano/data-types";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";

// Placeholder shaders for Protostar accretion disk
const PROTOSTAR_DISK_VERTEX_SHADER = `
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

const PROTOSTAR_DISK_FRAGMENT_SHADER = `
uniform float time;
uniform vec3 diskColor;
uniform sampler2D noiseTexture; // Optional: for more complex patterns
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale, vec2(12.9898, 78.233 + time * 0.001))) * 43758.5453);
}

void main() {
  float distFromCenter = length(vUv - vec2(0.5)); // Assuming UVs are 0-1 for the disk
  float radialPattern = smoothstep(0.1, 0.5, distFromCenter) * (1.0 - smoothstep(0.45, 0.5, distFromCenter));
  
  float azimuthalNoise = simpleNoise(vUv, 20.0 + sin(vUv.x * 10.0 + time * 0.05) * 5.0);
  float density = radialPattern * (0.6 + azimuthalNoise * 0.4);
  density = clamp(density, 0.0, 1.0);

  // Lighting (simple lambertian)
  vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0)); // Example light direction
  float lightIntensity = max(0.0, dot(normalize(vNormal), lightDir)) * 0.5 + 0.5;

  gl_FragColor = vec4(diskColor * lightIntensity * density, density * 0.9); // Alpha based on density
}
`;

/**
 * Material for the main body of Protostars.
 */
export class ProtostarMaterial extends PreMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff9966)) {
    super({
      starColor: color, // Typically orange-red, embedded in dust
      coronaIntensity: 0.1, // Heavily obscured
      pulseSpeed: 0.1,
      glowIntensity: 0.4, // Dim, obscured by disk
      temperatureVariation: 0.3,
      metallicEffect: 0.0, // Not applicable
    });
  }
}

/**
 * Renderer for Protostars - very young stars still gathering mass.
 */
export class ProtostarRenderer extends PreMainSequenceStarRenderer {
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
    return new ProtostarMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xff9966); // Orange-red, embedded
  }

  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 0.1; // Default if radius is 0
    const diskInnerRadius = starRadius * 1.5;
    const diskOuterRadius = starRadius * 10;

    // Using RingGeometry for a flat disk. For thickness, consider a thin Cylinder or Torus.
    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      64, // Theta segments
      8, // Phi segments (for radial divisions)
      0, // Theta start
      Math.PI * 2, // Theta length
    );
    // Rotate disk to be horizontal (XZ plane)
    diskGeometry.rotateX(-Math.PI / 2);

    const diskMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        diskColor: { value: new THREE.Color(0x8b4513) }, // Dusty brown/saddlebrown
        // noiseTexture: { value: null } // Could add a texture later
      },
      vertexShader: PROTOSTAR_DISK_VERTEX_SHADER,
      fragmentShader: PROTOSTAR_DISK_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.NormalBlending, // Normal blending for dust
      side: THREE.DoubleSide,
      depthWrite: true, // Disk can obscure parts of itself or other objects
    });

    this.effectMaterials.set(
      `${object.celestialObjectId}-accretion-disk`,
      diskMaterial,
    );

    const diskMesh = new THREE.Mesh(diskGeometry, diskMaterial);
    diskMesh.name = `${object.celestialObjectId}-accretion-disk`;
    return diskMesh;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 5000 * scale; // Protostars are dim, billboard closer
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 64, // Protostar body itself might not need extreme detail
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium detail: star body + corona, maybe a very simplified disk or no disk.
    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 32,
    });
    const existingEffect = mediumStarOnlyGroup.getObjectByName(
      `${object.celestialObjectId}-accretion-disk`,
    );
    if (existingEffect) {
      mediumStarOnlyGroup.remove(existingEffect);
    }
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 800 * scale,
    };

    return [level0, level1];
  }

  /**
   * Update the renderer with the current time
   */
  update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera);

    // Update dust envelope materials
    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material: any) => {
        if (material.uniforms?.time) {
          material.uniforms.time.value = this.elapsedTime;
        }
      });
    });
  }
}
