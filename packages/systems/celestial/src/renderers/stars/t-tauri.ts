import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "./base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for T Tauri stars with variable, active surface
 */
export class TTauriMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff6600)) {
    super(color, {
      coronaIntensity: 0.6,
      pulseSpeed: 0.8,
      glowIntensity: 0.7,
      temperatureVariation: 0.4,
      metallicEffect: 0.3,
    });

    // Override fragment shader for variable, active appearance
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
        for(int i = 0; i < 5; i++) {
          t += abs(noise(p * f) / f);
          f *= 2.0;
          p = p * 1.4 + vec2(1.7, 2.3);
        }
        return t;
      }
      
      void main() {
        vec3 color = starColor;
        
        // Active surface with magnetic field lines
        float turb = turbulence(vUv * 5.0 + time * 0.3);
        float magneticActivity = turbulence(vUv * 8.0 + time * 0.5);
        
        // Variable brightness typical of T Tauri stars
        float variability = sin(time * 0.7) * 0.3 + sin(time * 1.3) * 0.2 + sin(time * 2.1) * 0.1;
        
        // Hot spots and cool regions
        float surfaceDetail = smoothstep(0.2, 0.8, turb);
        float magneticSpots = smoothstep(0.4, 0.9, magneticActivity);
        
        // Mix of hot and cool regions
        vec3 hotRegions = mix(color * 1.4, vec3(1.0, 0.8, 0.4), magneticSpots);
        vec3 coolRegions = mix(color * 0.7, vec3(0.8, 0.4, 0.2), 1.0 - surfaceDetail);
        
        vec3 finalColor = mix(coolRegions, hotRegions, surfaceDetail);
        
        // Apply variability
        finalColor *= (1.0 + variability * temperatureVariation);
        
        // Strong stellar wind glow
        float windGlow = 1.0 - smoothstep(0.4, 1.5, length(vPosition));
        finalColor += color * windGlow * glowIntensity * 0.8;
        
        // Magnetic field flares
        float flareIntensity = sin(time * 3.0 + magneticActivity * 10.0) * 0.5 + 0.5;
        finalColor += vec3(1.0, 0.6, 0.2) * magneticSpots * flareIntensity * 0.3;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.needsUpdate = true;
  }
}

/**
 * Renderer for T Tauri stars - young, pre-main sequence stars
 * Characteristics:
 * - Highly variable brightness
 * - Strong stellar winds
 * - Magnetic activity and flares
 * - Often have circumstellar disks
 */
export class TTauriRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new TTauriMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // T Tauri stars are typically orange/red, cooler than main sequence
    return new THREE.Color(0xff6600);
  }

  protected addCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    // Enhanced corona due to strong stellar winds
    const starColor = this.getStarColor(object);
    const coronaMaterials: any[] = [];

    this.coronaMaterials.set(object.celestialObjectId, coronaMaterials);

    // Multiple corona layers for stellar wind
    const coronaScales = [1.15, 1.3, 1.5];
    const opacities = [0.2, 0.12, 0.06];

    coronaScales.forEach((scale, index) => {
      const coronaRadius = object.radius * scale;
      const coronaGeometry = new THREE.SphereGeometry(coronaRadius, 24, 24);

      const coronaMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          starColor: { value: starColor },
          opacity: { value: opacities[index] },
          pulseSpeed: { value: 0.4 + index * 0.2 },
          noiseScale: { value: 3.0 + index * 1.0 },
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
          uniform vec3 starColor;
          uniform float opacity;
          uniform float pulseSpeed;
          uniform float noiseScale;
          
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vPosition;
          
          float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
          }
          
          float fbm(vec2 p) {
            float sum = 0.0;
            float amp = 1.0;
            float freq = 1.0;
            for(int i = 0; i < 4; i++) {
              sum += noise(p * freq) * amp;
              amp *= 0.5;
              freq *= 2.0;
              p = p * 1.3 + vec2(0.4, 0.6);
            }
            return sum;
          }
          
          void main() {
            vec2 centeredUV = vUv * 2.0 - 1.0;
            float dist = length(centeredUV);
            
            // Stellar wind patterns
            float windPattern = fbm((centeredUV * 0.5 + 0.5) * noiseScale + time * 0.1);
            float turbulence = fbm((centeredUV * 1.5 + 0.5) * noiseScale * 1.2 + time * 0.15);
            
            float edgeFade = smoothstep(0.8, 1.2, dist);
            
            // Variable pulsing for stellar activity
            float pulse = 0.7 + sin(time * pulseSpeed) * 0.2 + sin(time * pulseSpeed * 2.3) * 0.1;
            
            float alpha = (1.0 - edgeFade) * opacity * pulse;
            alpha *= (0.5 + windPattern * 0.5) * (0.6 + turbulence * 0.4);
            
            // Enhanced orange/yellow corona color
            vec3 coronaColor = mix(starColor * 1.2, vec3(1.0, 0.7, 0.3), 0.4);
            
            gl_FragColor = vec4(coronaColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      coronaMaterials.push(coronaMaterial);
      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.celestialObjectId}-stellar-wind-${index}`;
      group.add(coronaMesh);
    });
  }

  update(time?: number): void {
    super.update(time);

    // Update stellar wind materials
    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material: any) => {
        if (material.uniforms?.time) {
          material.uniforms.time.value = this.elapsedTime;
        }
      });
    });
  }
}
