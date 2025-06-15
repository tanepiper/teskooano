import * as THREE from "three";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import {
  SchwarzschildBlackHoleMaterial,
  AccretionDiskMaterial,
} from "./schwarzschild-black-hole";
import { GravitationalLensingHelper } from "../../effects/gravitational-lensing";
import type {
  CelestialMeshOptions,
  LightSourcesMap,
} from "../../base/CelestialRenderer";
import { LODLevel } from "@teskooano/renderer-threejs-lod";

/**
 * Material for Kerr black holes' ergosphere
 * - Represents the region where space-time is dragged by rotation
 */
export class ErgosphereMaterial extends THREE.ShaderMaterial {
  constructor() {
    const ergosphereShader = {
      uniforms: {
        time: { value: 0 },
        rotationSpeed: { value: 0.5 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          vPosition = position;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float rotationSpeed;
        varying vec2 vUv;
        varying vec3 vNormal;
        varying vec3 vPosition;
        
        
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float f = 0.0;
          float w = 0.5;
          for (int i = 0; i < 4; i++) {
            f += w * noise(p);
            p *= 2.0;
            w *= 0.5;
          }
          return f;
        }
        
        void main() {
          
          float r = length(vPosition);
          float theta = acos(vPosition.y / r);
          float phi = atan(vPosition.z, vPosition.x);
          
          
          float rotationFactor = sin(theta); 
          phi += time * rotationSpeed * rotationFactor;
          
          
          vec2 distortedUv = vec2(
            phi / (2.0 * 3.14159) + 0.5,
            theta / 3.14159
          );
          
          
          float distortion = fbm(distortedUv * 4.0 + time * 0.1) * 0.1;
          distortedUv += distortion;
          
          
          float energy = fbm(distortedUv * 5.0 - time * 0.2 * rotationFactor);
          
          
          float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          
          
          vec3 baseColor = vec3(0.1, 0.0, 0.2);
          
          
          vec3 energyColor = mix(
            vec3(0.2, 0.5, 1.0), 
            vec3(0.7, 0.2, 1.0), 
            energy
          );
          
          
          vec3 finalColor = baseColor + energyColor * energy * 0.7 + vec3(0.3, 0.4, 0.9) * rim * 0.6;
          
          
          float alpha = 0.2 + rim * 0.6 + energy * 0.2;
          
          gl_FragColor = vec4(finalColor, alpha * 0.8);
        }
      `,
    };

    super({
      uniforms: ergosphereShader.uniforms,
      vertexShader: ergosphereShader.vertexShader,
      fragmentShader: ergosphereShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
  }

  /**
   * Update the material with the current time
   */
  update(
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
  ): void {
    this.uniforms.time.value = time;
  }

  /**
   * Set the rotation speed of the black hole
   */
  setRotationSpeed(speed: number): void {
    this.uniforms.rotationSpeed.value = speed;
  }

  /**
   * Dispose of material resources
   */
  dispose(): void {}
}

/**
 * Material for rotating accretion disk with frame dragging effects
 */
export class KerrAccretionDiskMaterial extends AccretionDiskMaterial {
  constructor(rotationSpeed: number = 0.5) {
    super();

    this.uniforms.rotationSpeed = { value: rotationSpeed };
  }

  /**
   * Set the rotation speed of the black hole
   */
  setRotationSpeed(speed: number): void {
    this.uniforms.rotationSpeed.value = speed;
  }
}

/**
 * Renderer for Kerr black holes (rotating black holes)
 */
export class KerrBlackHoleRenderer extends BaseStarRenderer {
  private eventHorizonMaterial: SchwarzschildBlackHoleMaterial | null = null;
  private ergosphereMaterial: ErgosphereMaterial | null = null;
  private accretionDiskMaterials: Map<string, KerrAccretionDiskMaterial> =
    new Map();
  private rotationSpeed: number = 0.5;
  private lensingHelpers: Map<string, GravitationalLensingHelper> = new Map();

  /**
   * Constructor allows setting rotation speed
   */
  constructor(rotationSpeed: number = 0.5) {
    super();
    this.rotationSpeed = rotationSpeed;
  }

  /**
   * Creates and returns an array of LOD levels for the Kerr black hole.
   * This includes the event horizon, ergosphere, and accretion disk.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // --- 1. Create all components once ---
    const eventHorizon = this._createEventHorizon(object);
    const ergosphere = this._createErgosphere(object);
    const accretionDisk = this._createAccretionDisk(object);

    // --- 2. Assemble LOD levels ---

    // Level 0: High detail (Horizon + Ergosphere + Disk)
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.celestialObjectId}-lod-high`;
    highDetailGroup.add(eventHorizon.clone());
    highDetailGroup.add(ergosphere.clone());
    highDetailGroup.add(accretionDisk.clone());
    const lod0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Level 1: Medium detail (Horizon + Ergosphere)
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.celestialObjectId}-lod-medium`;
    mediumDetailGroup.add(eventHorizon.clone());
    mediumDetailGroup.add(ergosphere);
    const lod1: LODLevel = { object: mediumDetailGroup, distance: 8000 };

    // Level 2: Low detail (Horizon only)
    const lowDetailGroup = new THREE.Group();
    lowDetailGroup.name = `${object.celestialObjectId}-lod-low`;
    lowDetailGroup.add(eventHorizon);
    const lod2: LODLevel = { object: lowDetailGroup, distance: 20000 };

    return [lod0, lod1, lod2];
  }

  /**
   * Add the event horizon sphere to the group
   * @internal
   */
  private _createEventHorizon(object: RenderableCelestialObject): THREE.Mesh {
    const radius = object.radius || 1;
    const geometry = new THREE.SphereGeometry(radius, 64, 64);
    this.eventHorizonMaterial = new SchwarzschildBlackHoleMaterial();
    this.materials.set(
      object.celestialObjectId,
      this.eventHorizonMaterial as any,
    );
    const eventHorizon = new THREE.Mesh(geometry, this.eventHorizonMaterial);
    eventHorizon.name = `${object.celestialObjectId}-event-horizon`;
    return eventHorizon;
  }

  /**
   * Add the ergosphere to the group - slightly oblate spheroid
   * @internal
   */
  private _createErgosphere(object: RenderableCelestialObject): THREE.Mesh {
    const radius = object.radius || 1;
    const ergoRadius = radius * 1.4;
    const geometry = new THREE.SphereGeometry(ergoRadius, 48, 48);
    geometry.scale(1.0, 0.8, 1.0); // Make it oblate

    this.ergosphereMaterial = new ErgosphereMaterial();
    this.ergosphereMaterial.setRotationSpeed(this.rotationSpeed);

    const ergosphere = new THREE.Mesh(geometry, this.ergosphereMaterial);
    ergosphere.name = `${object.celestialObjectId}-ergosphere`;
    return ergosphere;
  }

  /**
   * Add the accretion disk to the group with frame dragging effects
   * @internal
   */
  private _createAccretionDisk(object: RenderableCelestialObject): THREE.Mesh {
    const radius = object.radius || 1;
    const diskOuterRadius = radius * 6;
    const diskInnerRadius = radius * 1.2;

    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      96,
      1,
    );
    const diskMaterial = new KerrAccretionDiskMaterial(this.rotationSpeed);
    this.accretionDiskMaterials.set(object.celestialObjectId, diskMaterial);

    const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
    accretionDisk.rotation.x = Math.PI / 2;
    accretionDisk.name = `${object.celestialObjectId}-accretion-disk`;
    return accretionDisk;
  }

  /**
   * Required by base class but not used for black holes
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return {} as BaseStarMaterial;
  }

  /**
   * Add gravitational lensing effect to the black hole
   * Should be called after the object is added to the scene
   * Kerr black holes have asymmetric lensing due to frame dragging
   */
  addGravitationalLensing(
    object: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    group: THREE.Object3D,
  ): void {
    const lensHelper = new GravitationalLensingHelper(
      renderer,
      scene,
      camera,
      group,
      {
        intensity: 1.4,

        distortionScale:
          2.0 *
          (object.mass ? Math.min(8, object.mass / 6e6) : 1.0) *
          (1 + this.rotationSpeed * 0.4),

        lensSphereScale: 9.0,
      },
    );

    this.lensingHelpers.set(object.celestialObjectId, lensHelper);
  }

  /**
   * Update materials with current time
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);
    const currentTime = this.elapsedTime;

    if (this.eventHorizonMaterial) {
      this.eventHorizonMaterial.update(
        currentTime,
        timeScale,
        lightSources,
        camera,
      );
    }
    if (this.ergosphereMaterial) {
      this.ergosphereMaterial.update(
        currentTime,
        timeScale,
        lightSources,
        camera,
      );
    }

    const material = this.materials.get(object.celestialObjectId);
    if (material) {
      material.update(currentTime, timeScale, lightSources, camera);
    }

    const lensingHelper = this.lensingHelpers.get(object.celestialObjectId);
    if (
      lensingHelper &&
      renderer &&
      scene &&
      camera &&
      camera instanceof THREE.PerspectiveCamera
    ) {
      lensingHelper.update(renderer, scene, camera);
    }
  }

  /**
   * Dispose of all materials
   */
  dispose(): void {
    if (this.eventHorizonMaterial) {
      this.eventHorizonMaterial.dispose();
    }

    if (this.ergosphereMaterial) {
      this.ergosphereMaterial.dispose();
    }

    this.accretionDiskMaterials.forEach((material) => {
      material.dispose();
    });

    this.accretionDiskMaterials.clear();

    this.lensingHelpers.forEach((helper) => {
      helper.dispose();
    });

    this.lensingHelpers.clear();
  }
}
