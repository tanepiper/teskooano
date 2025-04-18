import * as THREE from 'three';
import type { CelestialObject } from '@teskooano/data-types';
import { BaseStarMaterial, BaseStarRenderer, CoronaMaterial } from './base-star';
import { GravitationalLensingHelper } from '../common/gravitational-lensing';
import type { RenderableCelestialObject } from '@teskooano/renderer-threejs';
import type { CelestialMeshOptions } from '../common/CelestialRenderer';

/**
 * Material for neutron stars
 * - Temperature: ~600,000 K
 * - Color: Pale blue
 * - Typical mass: 1.4-2.16 M☉
 * - Typical radius: ~10-15 km (extremely small)
 * - Extremely dense, rapid rotation
 * - Strong magnetic fields
 * - Pulsars are rotating neutron stars
 */
export class NeutronStarMaterial extends BaseStarMaterial {
  constructor(options: {
    coronaIntensity?: number;
    pulseSpeed?: number;
    glowIntensity?: number;
    temperatureVariation?: number;
    metallicEffect?: number;
  } = {}) {
    // Pale blue/white color for neutron stars
    const paleBlueColor = new THREE.Color(0xdcecff);
    
    super(paleBlueColor, {
      // Intense corona for neutron stars
      coronaIntensity: options.coronaIntensity ?? 1.5,
      // Rapid pulse to simulate fast rotation
      pulseSpeed: options.pulseSpeed ?? 5.0,
      // Extremely strong glow
      glowIntensity: options.glowIntensity ?? 2.0,
      // Low temperature variations (more uniform heat)
      temperatureVariation: options.temperatureVariation ?? 0.05,
      // Low metallic effect - more plasma-like
      metallicEffect: options.metallicEffect ?? 0.2
    });
  }
}

/**
 * Material for neutron star pulsing jets (for pulsars)
 */
export class PulsarJetMaterial extends THREE.ShaderMaterial {
  constructor(color: THREE.Color, options: { opacity?: number; pulseSpeed?: number } = {}) {
    const jetShader = {
      uniforms: {
        time: { value: 0 },
        color: { value: color },
        opacity: { value: options.opacity ?? 0.5 },
        pulseSpeed: { value: options.pulseSpeed ?? 10.0 }
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDistance;
        
        void main() {
          vUv = uv;
          vDistance = length(position) / 10.0; // Normalized distance from center
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 color;
        uniform float opacity;
        uniform float pulseSpeed;
        
        varying vec2 vUv;
        varying float vDistance;
        
        void main() {
          // Create pulsing effect radiating outward
          float pulse = sin(vDistance * 10.0 - time * pulseSpeed);
          pulse = pow(0.5 + 0.5 * pulse, 4.0); // Sharpen the pulse
          
          // Fade out with distance
          float fade = smoothstep(1.0, 0.0, vDistance);
          
          // Create radial gradient
          float radial = 1.0 - length(vUv * 2.0 - 1.0);
          radial = smoothstep(0.0, 0.6, radial);
          
          // Brighter center
          vec3 finalColor = mix(color * 1.5, color, vDistance);
          
          // Final alpha combines pulse, fade and radial gradient
          float alpha = pulse * fade * radial * opacity;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `
    };
    
    super({
      uniforms: jetShader.uniforms,
      vertexShader: jetShader.vertexShader,
      fragmentShader: jetShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide
    });
  }
  
  update(time: number): void {
    this.uniforms.time.value = time;
  }
  
  dispose(): void {
    // Clean up resources
  }
}

/**
 * Renderer for neutron stars
 */
export class NeutronStarRenderer extends BaseStarRenderer {
  private jetMaterials: Map<string, PulsarJetMaterial[]> = new Map();
  private lensingHelpers: Map<string, GravitationalLensingHelper> = new Map();
  
  /**
   * Returns the appropriate material for a neutron star
   */
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    return new NeutronStarMaterial();
  }
  
  /**
   * Neutron stars are pale blue/white
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xdcecff);
  }
  
  /**
   * Override the createMesh method to add radiation jets and make neutron star more visible
   */
  createMesh(object: RenderableCelestialObject, options?: CelestialMeshOptions): THREE.Object3D {
    // Call parent method to create the basic star
    const group = super.createMesh(object, options) as THREE.Group;
    
    // Add radiation jets (for pulsars)
    this.addRadiationJets(object, group);
    
    // Add bright glow around the neutron star
    this.addEnhancedGlow(object, group);
    
    return group;
  }
  
  /**
   * Override to create much larger corona for neutron stars
   */
  protected addCorona(object: RenderableCelestialObject, group: THREE.Group): void {
    const starColor = this.getStarColor(object);
    const coronaMaterials: CoronaMaterial[] = [];
    
    // Store materials for updates
    this.coronaMaterials.set(object.celestialObjectId, coronaMaterials);
    
    // Create multiple corona planes with MUCH larger scales for neutron stars
    // This makes them visible despite their small physical size
    const coronaScales = [3.0, 6.0, 10.0, 15.0]; // Much larger scales than normal stars
    const opacities = [0.7, 0.5, 0.3, 0.1]; // Higher opacity for better visibility
    
    coronaScales.forEach((scale, index) => {
      // Create a plane geometry for corona effect
      const coronaRadius = object.radius * scale;
      const coronaGeometry = new THREE.PlaneGeometry(coronaRadius * 2, coronaRadius * 2);
      
      // Create material with decreasing opacity for outer layers
      const coronaMaterial = new CoronaMaterial(starColor, {
        scale: scale,
        opacity: opacities[index],
        pulseSpeed: 0.5 + index * 0.2, // Faster pulse speeds
        noiseScale: 3.0 + index * 1.5   // Different noise scales
      });
      
      // Store for updates
      coronaMaterials.push(coronaMaterial);
      
      // Create mesh and add to group
      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.celestialObjectId}-corona-${index}`;
      
      // Create a second mesh at 90 degrees for a fuller effect
      const coronaMesh2 = coronaMesh.clone();
      coronaMesh2.name = `${object.celestialObjectId}-corona-${index}-2`;
      coronaMesh2.rotation.y = Math.PI / 2;
      
      // Add a third mesh at 45 degrees for even fuller effect
      const coronaMesh3 = coronaMesh.clone();
      coronaMesh3.name = `${object.celestialObjectId}-corona-${index}-3`;
      coronaMesh3.rotation.x = Math.PI / 4;
      coronaMesh3.rotation.y = Math.PI / 4;
      
      // Billboard effect - always face camera
      coronaMesh.rotation.order = 'YXZ';
      coronaMesh2.rotation.order = 'YXZ';
      coronaMesh3.rotation.order = 'YXZ';
      
      group.add(coronaMesh);
      group.add(coronaMesh2);
      group.add(coronaMesh3);
    });
  }
  
  /**
   * Add radiation jets to simulate pulsar behavior
   */
  private addRadiationJets(object: RenderableCelestialObject, group: THREE.Group): void {
    const jetMaterials: PulsarJetMaterial[] = [];
    this.jetMaterials.set(object.celestialObjectId, jetMaterials);
    
    const jetColor = new THREE.Color(0x8abfff); // Blueish jet color
    const jetLength = object.radius * 30; // Very long jets
    const jetRadius = object.radius * 3;
    
    // Create jet geometries - cones pointing in opposite directions
    const jetGeometry = new THREE.ConeGeometry(jetRadius, jetLength, 16, 1, true);
    
    // North pole jet
    const northJetMaterial = new PulsarJetMaterial(jetColor, { 
      opacity: 0.7,
      pulseSpeed: 15.0 
    });
    jetMaterials.push(northJetMaterial);
    
    const northJet = new THREE.Mesh(jetGeometry, northJetMaterial);
    northJet.position.set(0, jetLength / 2, 0);
    northJet.name = `${object.celestialObjectId}-jet-north`;
    
    // South pole jet (point in opposite direction)
    const southJetMaterial = new PulsarJetMaterial(jetColor, { 
      opacity: 0.7, 
      pulseSpeed: 15.0 
    });
    jetMaterials.push(southJetMaterial);
    
    const southJet = new THREE.Mesh(jetGeometry, southJetMaterial);
    southJet.position.set(0, -jetLength / 2, 0);
    southJet.rotation.x = Math.PI; // Flip it upside down
    southJet.name = `${object.celestialObjectId}-jet-south`;
    
    group.add(northJet);
    group.add(southJet);
  }
  
  /**
   * Add additional glow effect to make neutron star more visible
   */
  private addEnhancedGlow(object: RenderableCelestialObject, group: THREE.Group): void {
    // Add a bright point light to illuminate the scene
    const light = new THREE.PointLight(0xdcecff, 2.0, object.radius * 100);
    light.name = `${object.celestialObjectId}-light`;
    group.add(light);
    
    // Add a very bright center sphere
    const glowGeometry = new THREE.SphereGeometry(object.radius * 1.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending
    });
    
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    glowMesh.name = `${object.celestialObjectId}-enhanced-glow`;
    group.add(glowMesh);
  }
  
  /**
   * Add gravitational lensing effect to the neutron star
   * Should be called after the object is added to the scene
   * Neutron stars have weaker lensing than black holes, but still significant
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
        // Neutron stars have very subtle lensing compared to black holes
        intensity: 0.4, // Reduced from 0.8
        // Scale based on mass - neutron stars are less massive than black holes
        distortionScale: 0.0025 * (object.mass ? Math.min(3, object.mass / 3e6) : 1.0), // Reduced from 1.8 and adjusted scaling
        // Still needs large sphere for effect, but not as large as black holes
        lensSphereScale: 0.5 // Adjusted from 8.0
      }
    );
    
    // Store the helper for updates
    this.lensingHelpers.set(object.celestialObjectId, lensHelper);
  }
  
  /**
   * Update the renderer with the current time
   */
  update(time?: number, renderer?: THREE.WebGLRenderer, scene?: THREE.Scene, camera?: THREE.PerspectiveCamera): void {
    // Call parent update to update basic materials
    super.update(time);
    
    // Update jet materials
    this.jetMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.update(this.elapsedTime);
      });
    });
    
    // Update lensing helpers if renderer, scene and camera are provided
    if (renderer && scene && camera) {
      this.lensingHelpers.forEach(helper => {
        helper.update(renderer, scene, camera);
      });
    }
  }
  
  /**
   * Clean up resources
   */
  dispose(): void {
    // Call parent dispose
    super.dispose();
    
    // Dispose jet materials
    this.jetMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.dispose();
      });
    });
    
    this.jetMaterials.clear();
    
    // Dispose lensing helpers
    this.lensingHelpers.forEach(helper => {
      helper.dispose();
    });
    
    this.lensingHelpers.clear();
  }
} 