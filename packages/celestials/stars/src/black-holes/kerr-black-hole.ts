import * as THREE from "three";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import { SchwarzschildBlackHoleMaterial } from "./schwarzschild-black-hole";
import { GravitationalLensingHelper } from "./gravitational-lensing";
import { generateAccretionDiskProperties } from "@teskooano/celestials-rings";
import { RingSystemRenderer } from "@teskooano/celestials-rings";

import { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";

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
        
        // Improved noise function
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
          // Calculate spherical coordinates
          float r = length(vPosition);
          float theta = acos(vPosition.y / r);
          float phi = atan(vPosition.z, vPosition.x);
          
          // Frame dragging effect - rotation depends on latitude
          float rotationFactor = sin(theta); 
          phi += time * rotationSpeed * rotationFactor;
          
          // Create distorted UV coordinates
          vec2 distortedUv = vec2(
            phi / (2.0 * 3.14159) + 0.5,
            theta / 3.14159
          );
          
          // Add turbulence to the distortion
          float distortion = fbm(distortedUv * 4.0 + time * 0.1) * 0.1;
          distortedUv += distortion;
          
          // Energy distribution in the ergosphere
          float energy = fbm(distortedUv * 5.0 - time * 0.2 * rotationFactor);
          
          // Rim lighting for the ergosphere boundary
          float rim = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
          
          // Base color for the ergosphere
          vec3 baseColor = vec3(0.1, 0.0, 0.2);
          
          // Energy color varies with rotation
          vec3 energyColor = mix(
            vec3(0.2, 0.5, 1.0), 
            vec3(0.7, 0.2, 1.0), 
            energy
          );
          
          // Final color with energy and rim effects
          vec3 finalColor = baseColor + energyColor * energy * 0.7 + vec3(0.3, 0.4, 0.9) * rim * 0.6;
          
          // Alpha based on energy and rim
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
      depthWrite: true,
      blending: THREE.AdditiveBlending,
    });
  }

  /**
   * Update the material with the current time
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
  ): void {
    // Create a much smaller time scale for visible animation cycles
    // Use a very small scale to create fast, visible animation cycles
    const animationTime = ((time * timeScale) / 1000) * 0.001; // Scale down much more for faster animation
    this.uniforms.time.value = animationTime;
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
 * Renderer for Kerr black holes
 * - Has accretion disk using rings system
 * - Large gravitational lensing effect
 * - Emits light from accretion disk
 * - Has ergosphere (frame dragging region)
 */
export class KerrBlackHoleRenderer extends BaseStarRenderer<SchwarzschildBlackHoleMaterial> {
  private eventHorizonMaterial: SchwarzschildBlackHoleMaterial | null = null;
  private ergosphereMaterial: ErgosphereMaterial | null = null;
  private ringSystemRenderer: RingSystemRenderer | null = null;
  private rotationSpeed: number = 0.5;
  private lensingHelpers: Map<string, GravitationalLensingHelper> = new Map();
  private createdAccretionDisks: Set<string> = new Set(); // Track created disks

  /**
   * Constructor allows setting rotation speed
   */
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions & { rotationSpeed?: number } = {},
  ) {
    super(object, options);
    this.rotationSpeed = options.rotationSpeed ?? 0.5;
  }

  /**
   * Create material for the Kerr black hole
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): SchwarzschildBlackHoleMaterial {
    if (!this.eventHorizonMaterial) {
      this.eventHorizonMaterial = new SchwarzschildBlackHoleMaterial();
    }
    return this.eventHorizonMaterial;
  }

  /**
   * Get custom LOD levels for the Kerr black hole
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const levels: LODLevel[] = [];

    // High detail level (LOD 0) - Full black hole with accretion disk
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.id}-kerr-high`;

    // Create event horizon
    const eventHorizonSegments = GeometryUtilities.getOptimizedStarSegments(
      "high",
      64,
    );
    const eventHorizonGeometry = new THREE.SphereGeometry(
      1,
      eventHorizonSegments,
      eventHorizonSegments,
    );
    this.eventHorizonMaterial = new SchwarzschildBlackHoleMaterial();
    const eventHorizonMesh = new THREE.Mesh(
      eventHorizonGeometry,
      this.eventHorizonMaterial,
    );
    eventHorizonMesh.name = `${object.id}-event-horizon`;
    highDetailGroup.add(eventHorizonMesh);

    // Create ergosphere (rotating space-time region)
    const ergosphereSegments = GeometryUtilities.getOptimizedStarSegments(
      "high",
      64,
    );
    const ergosphereGeometry = new THREE.SphereGeometry(
      1.5,
      ergosphereSegments,
      ergosphereSegments,
    );
    this.ergosphereMaterial = new ErgosphereMaterial();
    this.ergosphereMaterial.setRotationSpeed(this.rotationSpeed);
    const ergosphereMesh = new THREE.Mesh(
      ergosphereGeometry,
      this.ergosphereMaterial,
    );
    ergosphereMesh.name = `${object.id}-ergosphere`;
    highDetailGroup.add(ergosphereMesh);

    // Create accretion disk using the rings system
    if (object.mass && !this.createdAccretionDisks.has(object.id)) {
      this.createdAccretionDisks.add(object.id);

      const accretionDiskProps = generateAccretionDiskProperties(
        object.mass,
        1e-8, // Default accretion rate
        0.8, // Spin parameter (0.8 for rotating black hole)
      );

      // Create a ring system object for the accretion disk
      const ringSystemObject = {
        ...object,
        realRadius_m: object.radius || 1, // Required for ring scaling
        properties: {
          type: "RING_SYSTEM",
          rings: [
            {
              innerRadius: accretionDiskProps.innerRadius,
              outerRadius: accretionDiskProps.outerRadius,
              color: accretionDiskProps.color,
              opacity: accretionDiskProps.opacity,
              rotationRate: accretionDiskProps.rotationRate,
              temperature: accretionDiskProps.temperature,
              accretionRate: accretionDiskProps.accretionRate,
              emissionType: accretionDiskProps.emissionType,
              isRelativistic: accretionDiskProps.isRelativistic,
              innerEdgeRadius: accretionDiskProps.innerEdgeRadius,
              isAccretionDisk: true, // Mark as accretion disk for special rendering
            },
          ],
        },
      };

      // Create ring system renderer for the accretion disk
      this.ringSystemRenderer = new RingSystemRenderer(
        ringSystemObject as any,
        this,
      );

      // Get the ring system's LOD levels
      const ringLODLevels = this.ringSystemRenderer.getLODLevels(
        ringSystemObject as any,
        options,
      );

      // Add the highest detail ring level (index 0) to the high detail group
      if (ringLODLevels.length > 0) {
        const highDetailRing = ringLODLevels[0].object;
        highDetailRing.name = `${object.id}-accretion-disk-high`;
        highDetailGroup.add(highDetailRing);
      }

      console.log(
        `[KerrBlackHoleRenderer] Created accretion disk for ${object.id}, ` +
          `temperature: ${accretionDiskProps.temperature.toFixed(0)}K, ` +
          `accretion rate: ${accretionDiskProps.accretionRate} M☉/year`,
      );
    }

    levels.push({ object: highDetailGroup, distance: 0 });

    // Medium detail level (LOD 1) - Simplified black hole with accretion disk
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.id}-kerr-medium`;

    const mediumEventHorizonMesh = new THREE.Mesh(
      eventHorizonGeometry,
      this.eventHorizonMaterial,
    );
    mediumDetailGroup.add(mediumEventHorizonMesh);

    // Add simplified ergosphere
    const mediumErgosphereMesh = new THREE.Mesh(
      ergosphereGeometry,
      this.ergosphereMaterial,
    );
    mediumDetailGroup.add(mediumErgosphereMesh);

    // Add medium detail accretion disk
    if (this.ringSystemRenderer && object.mass) {
      // Create a simplified accretion disk for medium detail
      const mediumDiskSegments = GeometryUtilities.getOptimizedRingSegments(
        "medium",
        32,
      );
      const mediumDiskGeometry = new THREE.RingGeometry(
        1.5,
        4,
        mediumDiskSegments,
        1,
      );
      const mediumDiskMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#FF6B35"),
        transparent: true,
        opacity: 0.7,
        side: THREE.DoubleSide,
      });
      const mediumDiskMesh = new THREE.Mesh(
        mediumDiskGeometry,
        mediumDiskMaterial,
      );
      mediumDiskMesh.name = `${object.id}-accretion-disk-medium`;
      mediumDiskMesh.rotation.x = -Math.PI / 2;
      mediumDetailGroup.add(mediumDiskMesh);
    }

    levels.push({ object: mediumDetailGroup, distance: 1000 });

    // Low detail level (LOD 2) - Event horizon with simple accretion disk
    const lowDetailGroup = new THREE.Group();
    lowDetailGroup.name = `${object.id}-kerr-low`;

    const lowEventHorizonMesh = new THREE.Mesh(
      eventHorizonGeometry,
      this.eventHorizonMaterial,
    );
    lowDetailGroup.add(lowEventHorizonMesh);

    // Add simple accretion disk for low detail
    if (object.mass) {
      const lowDiskSegments = GeometryUtilities.getOptimizedRingSegments(
        "low",
        16,
      );
      const lowDiskGeometry = new THREE.RingGeometry(
        1.2,
        3,
        lowDiskSegments,
        1,
      );
      const lowDiskMaterial = new THREE.MeshBasicMaterial({
        color: new THREE.Color("#FF4500"),
        transparent: true,
        opacity: 0.6,
        side: THREE.DoubleSide,
      });
      const lowDiskMesh = new THREE.Mesh(lowDiskGeometry, lowDiskMaterial);
      lowDiskMesh.name = `${object.id}-accretion-disk-low`;
      lowDiskMesh.rotation.x = -Math.PI / 2;
      lowDetailGroup.add(lowDiskMesh);
    }

    levels.push({ object: lowDetailGroup, distance: 5000 });

    return levels;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    return object.radius * 25000;
  }

  /**
   * Add the event horizon sphere to the group
   * @internal
   */
  private _createEventHorizon(object: RenderableCelestialObject): THREE.Mesh {
    const radius = object.radius || 1;
    const segments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const geometry = new THREE.SphereGeometry(radius, segments, segments);
    this.eventHorizonMaterial = new SchwarzschildBlackHoleMaterial();
    this.materials.set(object.id, this.eventHorizonMaterial as any);
    const eventHorizon = new THREE.Mesh(geometry, this.eventHorizonMaterial);
    eventHorizon.name = `${object.id}-event-horizon`;
    return eventHorizon;
  }

  /**
   * Add the ergosphere to the group - slightly oblate spheroid
   * @internal
   */
  private _createErgosphere(object: RenderableCelestialObject): THREE.Mesh {
    const radius = object.radius || 1;
    const ergoRadius = radius * 1.4;
    const segments = GeometryUtilities.getOptimizedStarSegments("high", 64);
    const geometry = new THREE.SphereGeometry(ergoRadius, segments, segments);
    geometry.scale(1.0, 0.8, 1.0); // Make it oblate

    this.ergosphereMaterial = new ErgosphereMaterial();
    this.ergosphereMaterial.setRotationSpeed(this.rotationSpeed);

    const ergosphere = new THREE.Mesh(geometry, this.ergosphereMaterial);
    ergosphere.name = `${object.id}-ergosphere`;
    return ergosphere;
  }

  /**
   * Add large gravitational lensing effect to the Kerr black hole
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
        intensity: 2.0, // Much larger lensing effect

        distortionScale:
          3.0 *
          (object.mass ? Math.min(12, object.mass / 4e6) : 1.0) *
          (1 + this.rotationSpeed * 0.6), // Enhanced scale

        lensSphereScale: 12.0, // Larger lensing sphere
      },
    );

    this.lensingHelpers.set(object.id, lensHelper);
  }

  /**
   * Update uniforms for the Kerr black hole based on time and lighting.
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);

    const currentTime = this.getElapsedTime();

    // Update event horizon material
    if (this.eventHorizonMaterial) {
      this.eventHorizonMaterial.update(
        currentTime,
        timeScale,
        lightSources,
        camera,
      );
    }

    // Update ergosphere material
    if (this.ergosphereMaterial) {
      this.ergosphereMaterial.update(
        currentTime,
        timeScale,
        lightSources,
        camera,
      );
    }

    // Update ring system (accretion disk)
    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.update(
        object,
        currentTime,
        timeScale,
        lightSources,
        camera,
        allObjects,
      );
    }

    // Note: Gravitational lensing update requires renderer, scene, and camera
    // which are not available in this update method. The lensing effect
    // will be updated separately when the renderer is available.
  }

  /**
   * Dispose of all materials
   */
  dispose(): void {
    // Dispose event horizon material
    if (this.eventHorizonMaterial) {
      this.eventHorizonMaterial.dispose();
      this.eventHorizonMaterial = null;
    }

    // Dispose ergosphere material
    if (this.ergosphereMaterial) {
      this.ergosphereMaterial.dispose();
      this.ergosphereMaterial = null;
    }

    // Dispose ring system renderer
    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.dispose();
      this.ringSystemRenderer = null;
    }

    // Dispose gravitational lensing helpers
    for (const helper of this.lensingHelpers.values()) {
      helper.dispose();
    }
    this.lensingHelpers.clear();

    // Clear tracking set
    this.createdAccretionDisks.clear();

    super.dispose();
  }
}
