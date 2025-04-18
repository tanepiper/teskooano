import * as THREE from 'three';
import type { CelestialObject } from '@teskooano/data-types';
import { BaseStarMaterial, BaseStarRenderer } from './base-star';
import { GravitationalLensingHelper } from '../common/gravitational-lensing';
import { RenderableCelestialObject } from '@teskooano/renderer-threejs';
import type { CelestialMeshOptions } from '../common/CelestialRenderer';

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
    // For black holes, we need a special shader to render the event horizon
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
          // Deep black color for the event horizon
          vec3 baseColor = vec3(0.0, 0.0, 0.0);
          
          // Calculate rim lighting to show shape
          float rimLight = 1.0 - max(0.0, dot(normalize(vNormal), vec3(0.0, 0.0, 1.0)));
          rimLight = pow(rimLight, 4.0) * 0.5;
          
          // Final color with slight blue tint on rim
          vec3 finalColor = baseColor + vec3(0.0, 0.1, 0.2) * rimLight;
          
          gl_FragColor = vec4(finalColor, 1.0);
        }
      `
    };
    
    super({
      uniforms: horizonShader.uniforms,
      vertexShader: horizonShader.vertexShader,
      fragmentShader: horizonShader.fragmentShader,
      transparent: false,
      side: THREE.FrontSide
    });
  }
  
  /**
   * Update the material with the current time
   */
  update(time: number): void {
    this.uniforms.time.value = time;
  }
  
  /**
   * Dispose of material resources
   */
  dispose(): void {
    // Clean up resources
  }
}

/**
 * Material for black hole accretion disk
 */
export class AccretionDiskMaterial extends THREE.ShaderMaterial {
  constructor() {
    const diskShader = {
      uniforms: {
        time: { value: 0 },
      },
      vertexShader: `
        varying vec2 vUv;
        
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        varying vec2 vUv;
        
        // Noise function
        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        float fbm(vec2 p) {
          float f = 0.0;
          float w = 0.5;
          for (int i = 0; i < 5; i++) {
            f += w * noise(p);
            p *= 2.0;
            w *= 0.5;
          }
          return f;
        }
        
        void main() {
          // Distance from center (0.5, 0.5)
          vec2 center = vUv - vec2(0.5);
          float dist = length(center);
          
          // Create a ring shape
          float ring = smoothstep(0.2, 0.3, dist) * smoothstep(0.6, 0.5, dist);
          
          // Rotate UV coordinates based on distance from center and time
          float angle = atan(center.y, center.x);
          float rotationSpeed = time * 0.2; // Base rotation speed
          float radialGradient = 1.0 - smoothstep(0.3, 0.5, dist); // Faster toward center
          float adjustedRotation = rotationSpeed * (1.0 + radialGradient * 2.0);
          
          // Create spiraling UV coordinates
          vec2 rotatedUv = vec2(
            cos(angle + adjustedRotation) * dist,
            sin(angle + adjustedRotation) * dist
          );
          
          // Generate noise pattern for accretion disk
          float pattern = fbm(rotatedUv * 10.0 + time * 0.1);
          
          // Color gradient from hot (inner) to cooler (outer)
          vec3 innerColor = vec3(1.0, 0.8, 0.3); // Yellow/white hot inner disk
          vec3 midColor = vec3(1.0, 0.4, 0.1);   // Orange/red mid disk
          vec3 outerColor = vec3(0.6, 0.1, 0.3);  // Purple/dark outer disk
          
          // Mix colors based on distance
          vec3 diskColor = mix(innerColor, midColor, smoothstep(0.3, 0.4, dist));
          diskColor = mix(diskColor, outerColor, smoothstep(0.4, 0.5, dist));
          
          // Apply noise pattern to create turbulence
          diskColor = mix(diskColor, diskColor * 1.4, pattern * 0.5);
          
          // Final color with alpha
          gl_FragColor = vec4(diskColor * ring, ring * 0.9);
        }
      `
    };
    
    super({
      uniforms: diskShader.uniforms,
      vertexShader: diskShader.vertexShader,
      fragmentShader: diskShader.fragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
  }
  
  /**
   * Update the material with the current time
   */
  update(time: number): void {
    this.uniforms.time.value = time;
  }
  
  /**
   * Dispose of material resources
   */
  dispose(): void {
    // Clean up resources
  }
}

/**
 * Renderer for Schwarzschild black holes
 */
export class SchwarzschildBlackHoleRenderer extends BaseStarRenderer {
  private eventHorizonMaterial: SchwarzschildBlackHoleMaterial | null = null;
  private accretionDiskMaterials: Map<string, AccretionDiskMaterial> = new Map();
  private lensingHelpers: Map<string, GravitationalLensingHelper> = new Map();
  
  /**
   * Create the black hole mesh with event horizon and accretion disk
   */
  createMesh(object: RenderableCelestialObject, options?: CelestialMeshOptions): THREE.Object3D {
    const group = new THREE.Group();
    group.name = `blackhole-${object.celestialObjectId}`;
    
    // Create event horizon sphere
    this.addEventHorizon(object, group);
    
    // Create accretion disk
    this.addAccretionDisk(object, group);
    
    return group;
  }
  
  /**
   * Add the event horizon sphere to the group
   */
  private addEventHorizon(object: RenderableCelestialObject, group: THREE.Group): void {
    const radius = object.radius || 1;
    
    // Create the event horizon geometry and material
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    this.eventHorizonMaterial = new SchwarzschildBlackHoleMaterial();
    
    // Create the mesh and add to group
    const eventHorizon = new THREE.Mesh(geometry, this.eventHorizonMaterial);
    group.add(eventHorizon);
  }
  
  /**
   * Add the accretion disk to the group
   */
  private addAccretionDisk(object: RenderableCelestialObject, group: THREE.Group): void {
    const radius = object.radius || 1;
    const diskOuterRadius = radius * 5;
    const diskInnerRadius = radius * 1.5;
    
    // Create the accretion disk geometry
    const diskGeometry = new THREE.RingGeometry(diskInnerRadius, diskOuterRadius, 64, 1);
    const diskMaterial = new AccretionDiskMaterial();
    
    // Store the material for animation updates
    this.accretionDiskMaterials.set(object.celestialObjectId, diskMaterial);
    
    // Create the disk mesh and rotate it to horizontal position
    const accretionDisk = new THREE.Mesh(diskGeometry, diskMaterial);
    accretionDisk.rotation.x = Math.PI / 2;
    
    group.add(accretionDisk);
  }
  
  /**
   * Required by base class but not used for black holes
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    // Black holes don't use the standard star material
    // This is a placeholder to satisfy the abstract method requirement
    return {} as BaseStarMaterial;
  }
  
  /**
   * Add gravitational lensing effect to the black hole
   * Should be called after the object is added to the scene
   */
  addGravitationalLensing(
    object: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    group: THREE.Object3D
  ): void {
    // Create the gravitational lensing helper
    const lensHelper = new GravitationalLensingHelper(
      renderer,
      scene,
      camera,
      group,
      {
        // Black holes have strong lensing but less overwhelming
        intensity: 1.2, // Reduced from 2.0
        // Scale based on mass but more subtle
        distortionScale: 1.8 * (object.mass ? Math.min(6, object.mass / 8e6) : 1.0), // Reduced from 3.0 and adjusted scaling
        // Large sphere around the black hole
        lensSphereScale: 8.0 // Adjusted from 10.0
      }
    );
    
    // Store the helper for updates
    this.lensingHelpers.set(object.celestialObjectId, lensHelper);
  }
  
  /**
   * Update materials with current time
   */
  update(time?: number, renderer?: THREE.WebGLRenderer, scene?: THREE.Scene, camera?: THREE.PerspectiveCamera): void {
    const currentTime = time ?? (Date.now() / 1000 - this.startTime);
    this.elapsedTime = currentTime;
    
    // Update event horizon material
    if (this.eventHorizonMaterial) {
      this.eventHorizonMaterial.update(currentTime);
    }
    
    // Update accretion disk materials
    this.accretionDiskMaterials.forEach(material => {
      material.update(currentTime);
    });
    
    // Update lensing helpers if renderer, scene and camera are provided
    if (renderer && scene && camera) {
      this.lensingHelpers.forEach(helper => {
        helper.update(renderer, scene, camera);
      });
    }
  }
  
  /**
   * Dispose of all materials
   */
  dispose(): void {
    if (this.eventHorizonMaterial) {
      this.eventHorizonMaterial.dispose();
    }
    
    this.accretionDiskMaterials.forEach(material => {
      material.dispose();
    });
    
    this.accretionDiskMaterials.clear();
    
    // Dispose lensing helpers
    this.lensingHelpers.forEach(helper => {
      helper.dispose();
    });
    
    this.lensingHelpers.clear();
  }
} 