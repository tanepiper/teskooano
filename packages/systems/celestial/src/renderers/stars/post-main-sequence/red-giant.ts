import * as THREE from "three";
import {
  BaseStarRenderer,
  BaseStarMaterial,
  CoronaMaterial,
} from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for red giant stars with cooler, variable surface
 */
export class RedGiantMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff4422)) {
    super(color, {
      coronaIntensity: 0.5,
      pulseSpeed: 0.2,
      glowIntensity: 0.6,
      temperatureVariation: 0.3,
      metallicEffect: 0.3,
    });

    // Override fragment shader for red giant characteristics
    this.fragmentShader = `
      uniform float time;
      uniform vec3 starColor;
      uniform float coronaIntensity;
      uniform float pulseSpeed;
      uniform float glowIntensity;
      uniform float temperatureVariation;
      uniform float metallicEffect;
      
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      
      float noise(vec2 p) {
        return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
      }
      
      float turbulence(vec2 p) {
        float t = 0.0;
        float f = 1.0;
        for(int i = 0; i < 4; i++) {
          t += abs(noise(p * f) / f);
          f *= 2.0;
          p = p * 1.2 + vec2(1.5, 2.1);
        }
        return t;
      }
      
      void main() {
        vec3 color = starColor;
        
        // Large convection cells typical of red giants
        float convection = turbulence(vUv * 2.0 + time * 0.05);
        float granulation = turbulence(vUv * 6.0 + time * 0.1);
        
        // Variable surface brightness
        float surfaceDetail = smoothstep(0.3, 0.7, convection);
        float granules = smoothstep(0.4, 0.8, granulation);
        
        // Cool red surface with hot granules
        vec3 coolSurface = mix(color * 0.8, vec3(0.8, 0.3, 0.1), 0.6);
        vec3 hotGranules = mix(color * 1.3, vec3(1.0, 0.5, 0.2), 0.4);
        
        vec3 finalColor = mix(coolSurface, hotGranules, granules * 0.7);
        
        // Slow pulsation typical of red giants
        float pulsation = sin(time * pulseSpeed * 0.5) * 0.2 + 0.8;
        finalColor *= pulsation;
        
        // Enhanced infrared glow
        float infraredGlow = 1.0 - smoothstep(0.5, 1.8, length(vPosition));
        finalColor += vec3(0.7, 0.2, 0.1) * infraredGlow * glowIntensity;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.needsUpdate = true;
  }
}

/**
 * Renderer for red giant stars - evolved stars with expanded, cooler envelopes
 * Characteristics:
 * - Large, cool, red appearance
 * - Variable brightness due to pulsations
 * - Large convection cells on surface
 * - Strong infrared emission
 */
export class RedGiantRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new RedGiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Red giants are cool and red
    return new THREE.Color(0xff4422);
  }

  protected addCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    // Enhanced corona due to stellar wind mass loss
    super.addCorona(object, group);

    // Add additional mass loss envelope using standard corona approach
    const starColor = this.getStarColor(object);
    const existingMaterials =
      this.coronaMaterials.get(object.celestialObjectId) || [];

    const massLossRadius = object.radius * 2.5;
    const massLossGeometry = new THREE.SphereGeometry(massLossRadius, 16, 16);

    // Use the existing CoronaMaterial class for consistency
    const massLossMaterial = new CoronaMaterial(new THREE.Color(0x441100), {
      scale: 2.5,
      opacity: 0.03,
      pulseSpeed: 0.1,
      noiseScale: 1.5,
    });

    existingMaterials.push(massLossMaterial);
    const massLossMesh = new THREE.Mesh(massLossGeometry, massLossMaterial);
    massLossMesh.name = `${object.celestialObjectId}-mass-loss-envelope`;
    group.add(massLossMesh);
  }
}
