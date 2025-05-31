import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import { BaseStarRenderer } from "../base/base-star";
import { GravitationalLensingHelper } from "../../effects/gravitational-lensing";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions, LightSourceData } from "../../common/types";
import { LODLevel } from "../../index";
import { SCALE } from "@teskooano/data-types";
import {
  BaseBlackHoleRenderer,
  EventHorizonMaterial,
} from "./base-black-hole-renderer";

/**
 * Material for Schwarzschild black holes
 * - Non-rotating black hole
 * - Spherically symmetric
 * - Defined only by mass
 * - Has event horizon and photon sphere
 * - No charge or angular momentum
 */
export class SchwarzschildBlackHoleMaterial extends THREE.ShaderMaterial {
  constructor() {
    const horizonShader = {
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        varying vec3 vNormal;
        
        void main() {
          
          vec3 baseColor = vec3(0.0, 0.0, 0.0);
          
          
          float rimLight = 1.0 - max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
          rimLight = pow(rimLight, 4.0) * 0.5;
          
          
          vec3 finalColor = baseColor + vec3(0.0, 0.1, 0.2) * rimLight;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `,
    };

    super({
      uniforms: horizonShader.uniforms,
      vertexShader: horizonShader.vertexShader,
      fragmentShader: horizonShader.fragmentShader,
      transparent: false,
      side: THREE.FrontSide,
    });
  }

  /**
   * Update the material with the current time
   */
  update(time: number): void {
    if (this.uniforms.time) this.uniforms.time.value = time;
  }

  /**
   * Dispose of material resources
   */
  dispose(): void {}
}

/**
 * Material for black hole accretion disk
 */
export class AccretionDiskMaterial extends THREE.ShaderMaterial {
  constructor(
    options: {
      diskColor1?: THREE.Color;
      diskColor2?: THREE.Color;
      diskColor3?: THREE.Color;
    } = {},
  ) {
    const diskShader = {
      uniforms: {
        time: { value: 0 },
        diskColor1: { value: options.diskColor1 ?? new THREE.Color(0xffcc33) }, // Hot yellow-orange
        diskColor2: { value: options.diskColor2 ?? new THREE.Color(0xff6600) }, // Orange-red
        diskColor3: { value: options.diskColor3 ?? new THREE.Color(0x993300) }, // Darker red
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPosition;
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 diskColor1;
        uniform vec3 diskColor2;
        uniform vec3 diskColor3;
        varying vec2 vUv;
        varying vec3 vWorldPosition;

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        float fbm(vec2 p) {
          float f = 0.0;
          float w = 0.5;
          for (int i = 0; i < 4; i++) { // Reduced iterations for performance
            f += w * noise(p);
            p *= 2.0;
            w *= 0.5;
          }
          return f;
        }

        void main() {
          vec2 centerOffset = vUv - vec2(0.5);
          float distFromCenter = length(centerOffset);

          // Define the ring shape of the disk (e.g., inner radius 0.2, outer radius 0.5 in UV space)
          float innerRadius = 0.2;
          float outerRadius = 0.48; // Slightly less than 0.5 to avoid edge artifacts
          float ringShape = smoothstep(innerRadius, innerRadius + 0.05, distFromCenter) * 
                            (1.0 - smoothstep(outerRadius - 0.05, outerRadius, distFromCenter));

          if (ringShape < 0.01) discard; // Discard fragments outside the visible disk area

          float angle = atan(centerOffset.y, centerOffset.x);
          float rotationSpeed = 0.35; // Increased rotation speed
          // Simulate differential rotation (inner parts faster)
          float adjustedRotation = (time * rotationSpeed * (1.0 / (distFromCenter + 0.1))) + angle;
          
          vec2 rotatedUv = vec2(cos(adjustedRotation) * distFromCenter, sin(adjustedRotation) * distFromCenter) + vec2(0.5);

          float turbulence = fbm(rotatedUv * 12.0 + time * 0.05); // Increased scale for finer texture

          // Color gradient based on distance from center
          vec3 color = mix(diskColor1, diskColor2, smoothstep(innerRadius, (innerRadius + outerRadius) / 2.0, distFromCenter));
          color = mix(color, diskColor3, smoothstep((innerRadius + outerRadius) / 2.0, outerRadius, distFromCenter));

          color *= (0.7 + turbulence * 0.6); // Modulate color by turbulence more strongly
          
          // Fade out alpha at the edges of the disk
          float alpha = ringShape * (0.6 + turbulence * 0.3); // Adjusted alpha modulation
          alpha = clamp(alpha, 0.0, 0.9);

          gl_FragColor = vec4(color, alpha);
        }
      `,
    };

    super({
      uniforms: diskShader.uniforms,
      vertexShader: diskShader.vertexShader,
      fragmentShader: diskShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending, // Good for hot, emissive effects
      side: THREE.DoubleSide,
      depthWrite: false,
    });
  }

  update(time: number): void {
    this.uniforms.time.value = time;
  }
}

/**
 * Renderer for Schwarzschild black holes (non-rotating).
 */
export class SchwarzschildBlackHoleRenderer extends BaseBlackHoleRenderer {
  private accretionDiskMaterialInstance: AccretionDiskMaterial | null = null;
  private schwarzschildHorizonMaterial: SchwarzschildBlackHoleMaterial;

  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, { ...options });
    this.schwarzschildHorizonMaterial = new SchwarzschildBlackHoleMaterial();
    this.registerMaterial(
      `${object.celestialObjectId}-schwarzschild-horizon`,
      this.schwarzschildHorizonMaterial,
    );
  }

  /**
   * Override to use the custom SchwarzschildBlackHoleMaterial for the event horizon.
   */
  protected override getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial {
    return this.schwarzschildHorizonMaterial;
  }

  /**
   * Adds the accretion disk effect for a Schwarzschild black hole.
   */
  protected override getBlackHoleEffectsGroup(
    object: RenderableCelestialObject,
    mainGroup: THREE.Group, // mainGroup is where the event horizon is, effects are added relative to it
    options?: CelestialMeshOptions,
  ): THREE.Group | null {
    const effectsGroup = new THREE.Group();
    effectsGroup.name = `${object.celestialObjectId}-effects-group`;

    const eventHorizonRadius =
      object.radius || 0.1 * (typeof SCALE === "number" ? SCALE : 1);
    // Accretion disk parameters (example values)
    const diskInnerRadius = eventHorizonRadius * 1.5; // Start disk outside event horizon
    const diskOuterRadius = eventHorizonRadius * 5.0;
    // const diskThickness = eventHorizonRadius * 0.1; // Thickness not used for RingGeometry

    // Using RingGeometry for a flat disk. Rotate to be in XZ plane.
    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      64,
      8,
    );
    diskGeometry.rotateX(-Math.PI / 2);

    if (!this.accretionDiskMaterialInstance) {
      this.accretionDiskMaterialInstance = new AccretionDiskMaterial();
      this.registerMaterial(
        `${object.celestialObjectId}-accretion-disk`,
        this.accretionDiskMaterialInstance,
      );
    }

    const diskMesh = new THREE.Mesh(
      diskGeometry,
      this.accretionDiskMaterialInstance,
    );
    diskMesh.name = `${object.celestialObjectId}-accretion-disk`;
    effectsGroup.add(diskMesh);

    return effectsGroup;
  }

  /**
   * Provides custom LOD levels for Schwarzschild black holes.
   * Level 0: Event Horizon + Accretion Disk + Lensing
   * Level 1: Event Horizon + Lensing (simplified disk, or no disk)
   * Billboard is handled by BaseStarRenderer using getStarColor (which is black).
   */
  protected override getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, options);
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumGroup = new THREE.Group();
    mediumGroup.name = `${object.celestialObjectId}-medium-lod`;
    const eventHorizonMesh = this.createEventHorizonMesh(object);
    mediumGroup.add(eventHorizonMesh);

    const level1: LODLevel = {
      object: mediumGroup,
      distance: 1500 * scale,
    };

    return [level0, level1];
  }

  /**
   * Provide a concrete implementation for the billboard distance.
   */
  protected override getBillboardLODDistance(
    object: RenderableCelestialObject,
  ): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 18000 * scale; // Schwarzschild specific value, or can match BaseBlackHoleRenderer's 20000
  }

  override dispose(): void {
    super.dispose();
    this.accretionDiskMaterialInstance = null;
  }
}
