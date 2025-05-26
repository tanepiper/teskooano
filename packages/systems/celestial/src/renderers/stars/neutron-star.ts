import * as THREE from "three";
import type { CelestialObject } from "@teskooano/data-types";
import {
  BaseStarMaterial,
  BaseStarRenderer,
  CoronaMaterial,
} from "./base-star";
import { GravitationalLensingHelper } from "../effects/gravitational-lensing";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import type { CelestialMeshOptions } from "../common/CelestialRenderer";

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
  constructor(
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    const paleBlueColor = new THREE.Color(0xdcecff);

    super(paleBlueColor, {
      coronaIntensity: options.coronaIntensity ?? 1.5,

      pulseSpeed: options.pulseSpeed ?? 5.0,

      glowIntensity: options.glowIntensity ?? 2.0,

      temperatureVariation: options.temperatureVariation ?? 0.05,

      metallicEffect: options.metallicEffect ?? 0.2,
    });
  }
}

/**
 * Material for neutron star pulsing jets (for pulsars)
 */
export class PulsarJetMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color,
    options: { opacity?: number; pulseSpeed?: number } = {},
  ) {
    const jetShader = {
      uniforms: {
        time: { value: 0 },
        color: { value: color },
        opacity: { value: options.opacity ?? 0.5 },
        pulseSpeed: { value: options.pulseSpeed ?? 10.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        varying float vDistance;
        
        void main() {
          vUv = uv;
          vDistance = length(position) / 10.0; 
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
          
          float pulse = sin(vDistance * 10.0 - time * pulseSpeed);
          pulse = pow(0.5 + 0.5 * pulse, 4.0); 
          
          
          float fade = smoothstep(1.0, 0.0, vDistance);
          
          
          float radial = 1.0 - length(vUv * 2.0 - 1.0);
          radial = smoothstep(0.0, 0.6, radial);
          
          
          vec3 finalColor = mix(color * 1.5, color, vDistance);
          
          
          float alpha = pulse * fade * radial * opacity;
          
          gl_FragColor = vec4(finalColor, alpha);
        }
      `,
    };

    super({
      uniforms: jetShader.uniforms,
      vertexShader: jetShader.vertexShader,
      fragmentShader: jetShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }

  update(time: number): void {
    this.uniforms.time.value = time;
  }

  dispose(): void {}
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
  createMesh(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Object3D {
    const group = super.createMesh(object, options) as THREE.Group;

    this.addRadiationJets(object, group);

    this.addEnhancedGlow(object, group);

    return group;
  }

  /**
   * Override to create much larger corona for neutron stars
   */
  protected addCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);
    const coronaMaterials: CoronaMaterial[] = [];

    this.coronaMaterials.set(object.celestialObjectId, coronaMaterials);

    const coronaScales = [3.0, 6.0, 10.0, 15.0];
    const opacities = [0.7, 0.5, 0.3, 0.1];

    coronaScales.forEach((scale, index) => {
      const coronaRadius = object.radius * scale;
      const coronaGeometry = new THREE.PlaneGeometry(
        coronaRadius * 2,
        coronaRadius * 2,
      );

      const coronaMaterial = new CoronaMaterial(starColor, {
        scale: scale,
        opacity: opacities[index],
        pulseSpeed: 0.5 + index * 0.2,
        noiseScale: 3.0 + index * 1.5,
      });

      coronaMaterials.push(coronaMaterial);

      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.celestialObjectId}-corona-${index}`;

      const coronaMesh2 = coronaMesh.clone();
      coronaMesh2.name = `${object.celestialObjectId}-corona-${index}-2`;
      coronaMesh2.rotation.y = Math.PI / 2;

      const coronaMesh3 = coronaMesh.clone();
      coronaMesh3.name = `${object.celestialObjectId}-corona-${index}-3`;
      coronaMesh3.rotation.x = Math.PI / 4;
      coronaMesh3.rotation.y = Math.PI / 4;

      coronaMesh.rotation.order = "YXZ";
      coronaMesh2.rotation.order = "YXZ";
      coronaMesh3.rotation.order = "YXZ";

      group.add(coronaMesh);
      group.add(coronaMesh2);
      group.add(coronaMesh3);
    });
  }

  /**
   * Add radiation jets to simulate pulsar behavior
   */
  private addRadiationJets(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const jetMaterials: PulsarJetMaterial[] = [];
    this.jetMaterials.set(object.celestialObjectId, jetMaterials);

    const jetColor = new THREE.Color(0x8abfff);
    const jetLength = object.radius * 30;
    const jetRadius = object.radius * 3;

    const jetGeometry = new THREE.ConeGeometry(
      jetRadius,
      jetLength,
      16,
      1,
      true,
    );

    const northJetMaterial = new PulsarJetMaterial(jetColor, {
      opacity: 0.7,
      pulseSpeed: 15.0,
    });
    jetMaterials.push(northJetMaterial);

    const northJet = new THREE.Mesh(jetGeometry, northJetMaterial);
    northJet.position.set(0, jetLength / 2, 0);
    northJet.name = `${object.celestialObjectId}-jet-north`;

    const southJetMaterial = new PulsarJetMaterial(jetColor, {
      opacity: 0.7,
      pulseSpeed: 15.0,
    });
    jetMaterials.push(southJetMaterial);

    const southJet = new THREE.Mesh(jetGeometry, southJetMaterial);
    southJet.position.set(0, -jetLength / 2, 0);
    southJet.rotation.x = Math.PI;
    southJet.name = `${object.celestialObjectId}-jet-south`;

    group.add(northJet);
    group.add(southJet);
  }

  /**
   * Add additional glow effect to make neutron star more visible
   */
  private addEnhancedGlow(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const light = new THREE.PointLight(0xdcecff, 2.0, object.radius * 100);
    light.name = `${object.celestialObjectId}-light`;
    group.add(light);

    const glowGeometry = new THREE.SphereGeometry(object.radius * 1.5, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
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
    group: THREE.Object3D,
  ): void {
    const lensHelper = new GravitationalLensingHelper(
      renderer,
      scene,
      camera,
      group,
      {
        intensity: 0.4,

        distortionScale:
          0.0025 * (object.mass ? Math.min(3, object.mass / 3e6) : 1.0),

        lensSphereScale: 0.5,
      },
    );

    this.lensingHelpers.set(object.celestialObjectId, lensHelper);
  }

  /**
   * Update the renderer with the current time
   */
  update(
    time?: number,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
    camera?: THREE.PerspectiveCamera,
  ): void {
    super.update(time);

    this.jetMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.update(this.elapsedTime);
      });
    });

    if (renderer && scene && camera) {
      this.lensingHelpers.forEach((helper) => {
        helper.update(renderer, scene, camera);
      });
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    super.dispose();

    this.jetMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.dispose();
      });
    });

    this.jetMaterials.clear();

    this.lensingHelpers.forEach((helper) => {
      helper.dispose();
    });

    this.lensingHelpers.clear();
  }
}
