import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for variable stars with dramatic brightness changes
 */
export class VariableStarMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xffaa33)) {
    super(color, {
      coronaIntensity: 0.6,
      pulseSpeed: 1.2,
      glowIntensity: 0.8,
      temperatureVariation: 0.8,
      metallicEffect: 0.4,
    });

    // Override fragment shader for dramatic variability
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
      
      void main() {
        vec3 color = starColor;
        
        // Multiple overlapping cycles for complex variability
        float primaryCycle = sin(time * pulseSpeed) * 0.4;
        float secondaryCycle = sin(time * pulseSpeed * 1.7) * 0.2;
        float tertiaryCycle = sin(time * pulseSpeed * 0.3) * 0.3;
        
        float totalVariation = primaryCycle + secondaryCycle + tertiaryCycle;
        
        // Dramatic brightness changes
        float brightness = 0.5 + totalVariation * temperatureVariation;
        brightness = max(brightness, 0.1); // Prevent complete darkness
        
        // Color temperature changes with brightness
        vec3 hotColor = mix(color, vec3(1.0, 0.9, 0.7), 0.3);
        vec3 coolColor = mix(color, vec3(0.8, 0.5, 0.3), 0.4);
        
        vec3 finalColor = mix(coolColor, hotColor, brightness);
        finalColor *= brightness;
        
        // Enhanced glow during bright phases
        float glow = 1.0 - smoothstep(0.3, 1.5, length(vPosition));
        finalColor += color * glow * glowIntensity * brightness;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.needsUpdate = true;
  }
}

/**
 * Renderer for variable stars - stars with dramatic brightness variations
 * Characteristics:
 * - Dramatic brightness changes over time
 * - Multiple pulsation periods
 * - Color changes with brightness
 * - Examples: Cepheids, RR Lyrae, Mira variables
 */
export class VariableStarRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new VariableStarMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Variable stars can be various colors - default to yellow
    return new THREE.Color(0xffaa33);
  }
}
