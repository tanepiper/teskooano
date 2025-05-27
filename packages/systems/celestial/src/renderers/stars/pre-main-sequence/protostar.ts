import * as THREE from "three";
import { BaseStarRenderer, BaseStarMaterial } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";

/**
 * Material for protostars with dusty, irregular appearance
 */
export class ProtostarMaterial extends BaseStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff4400)) {
    super(color, {
      coronaIntensity: 0.8,
      pulseSpeed: 0.2,
      glowIntensity: 0.6,
      temperatureVariation: 0.3,
      metallicEffect: 0.2,
    });

    // Override fragment shader for dusty, irregular appearance
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
        for(int i = 0; i < 6; i++) {
          t += abs(noise(p * f) / f);
          f *= 2.0;
          p = p * 1.3 + vec2(2.1, 1.9);
        }
        return t;
      }
      
      void main() {
        vec3 color = starColor;
        
        // Heavy turbulence for dusty, chaotic appearance
        float turb = turbulence(vUv * 4.0 + time * 0.05);
        float dustPattern = turbulence(vUv * 8.0 + time * 0.02);
        
        // Irregular surface with dust clouds
        float surfaceDetail = smoothstep(0.1, 0.9, turb);
        float dustClouds = smoothstep(0.3, 0.8, dustPattern);
        
        // Dim, reddish glow typical of protostars
        vec3 dustColor = mix(color * 0.3, vec3(0.8, 0.2, 0.1), dustClouds);
        vec3 hotSpots = mix(color * 1.2, vec3(1.0, 0.6, 0.2), surfaceDetail);
        
        vec3 finalColor = mix(dustColor, hotSpots, surfaceDetail * 0.6);
        
        // Irregular pulsing
        float pulse = sin(time * pulseSpeed * 0.7) * 0.15 + 0.85;
        finalColor *= pulse;
        
        // Add some infrared glow
        float infraredGlow = 1.0 - smoothstep(0.3, 1.2, length(vPosition));
        finalColor += vec3(0.6, 0.1, 0.05) * infraredGlow * glowIntensity;
        
        gl_FragColor = vec4(finalColor, 1.0);
      }
    `;

    this.needsUpdate = true;
  }
}

/**
 * Renderer for protostars - young stellar objects still accreting material
 * Characteristics:
 * - Dusty, irregular appearance
 * - Heavy infrared emission
 * - Variable brightness
 * - Often surrounded by accretion disks
 */
export class ProtostarRenderer extends BaseStarRenderer {
  protected getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    const color = this.getStarColor(object);
    return new ProtostarMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Protostars are typically red/orange due to dust and low temperature
    return new THREE.Color(0xff4400);
  }

  protected addCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    // Add dusty envelope instead of typical corona
    const starColor = this.getStarColor(object);
    const coronaMaterials: any[] = [];

    this.coronaMaterials.set(object.celestialObjectId, coronaMaterials);

    // Dusty envelope - larger and more diffuse than normal corona
    const envelopeScales = [1.3, 1.6, 2.0];
    const opacities = [0.15, 0.08, 0.04];

    envelopeScales.forEach((scale, index) => {
      const envelopeRadius = object.radius * scale;
      const envelopeGeometry = new THREE.SphereGeometry(envelopeRadius, 16, 16);

      const envelopeMaterial = new THREE.ShaderMaterial({
        uniforms: {
          time: { value: 0 },
          starColor: { value: new THREE.Color(0x663311) },
          opacity: { value: opacities[index] },
          pulseSpeed: { value: 0.05 + index * 0.02 },
          noiseScale: { value: 2.0 + index * 0.5 },
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
            for(int i = 0; i < 5; i++) {
              sum += noise(p * freq) * amp;
              amp *= 0.5;
              freq *= 2.0;
              p = p * 1.2 + vec2(0.3, 0.7);
            }
            return sum;
          }
          
          void main() {
            vec2 centeredUV = vUv * 2.0 - 1.0;
            float dist = length(centeredUV);
            
            // Irregular dust cloud pattern
            float dustPattern = fbm((centeredUV * 0.5 + 0.5) * noiseScale + time * 0.01);
            float clumpiness = fbm((centeredUV * 1.2 + 0.5) * noiseScale * 1.5 + time * 0.008);
            
            float edgeFade = smoothstep(0.9, 1.1, dist);
            float pulse = 0.8 + sin(time * pulseSpeed) * 0.2;
            
            float alpha = (1.0 - edgeFade) * opacity * pulse;
            alpha *= (0.4 + dustPattern * 0.6) * (0.5 + clumpiness * 0.5);
            
            // Dusty brown/red color
            vec3 dustColor = mix(starColor, vec3(0.4, 0.2, 0.1), 0.6);
            
            gl_FragColor = vec4(dustColor, alpha);
          }
        `,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      coronaMaterials.push(envelopeMaterial);
      const envelopeMesh = new THREE.Mesh(envelopeGeometry, envelopeMaterial);
      envelopeMesh.name = `${object.celestialObjectId}-dust-envelope-${index}`;
      group.add(envelopeMesh);
    });
  }

  update(time?: number): void {
    super.update(time);

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
