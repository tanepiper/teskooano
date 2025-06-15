import * as THREE from "three";
import type {
  CelestialObject,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import {
  BaseStarMaterial,
  BaseStarRenderer,
  CoronaMaterial,
} from "./base-star";
import { GravitationalLensingHelper } from "../effects/gravitational-lensing";
import type {
  CelestialMeshOptions,
  LightSourcesMap,
} from "../base/CelestialRenderer";
import { LODLevel } from "@teskooano/renderer-threejs-lod";

/**
 * Material for neutron stars
 * - Temperature: ~600,000 K
 * - Color: Pale blue
 * - Typical mass: 1.4-2.16 M☉
 * - Typical radius: ~10-15 km (extremely small)
 * - Extremely dense, rapid rotation
 * - Strong magnetic fields
 * - Pulsars are rotating neutron stars
 * - Highly magnetized
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

  update(
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
  ): void {
    if (this.uniforms.time !== undefined) {
      this.uniforms.time.value = time;
    }
    if (this.uniforms.pulseSpeed !== undefined) {
      this.uniforms.pulseSpeed.value =
        (this.uniforms.pulseSpeed.value as number) * timeScale;
    }
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
   * Creates and returns an array of LOD levels for the neutron star.
   * This includes the star body, a large corona, and pulsar jets.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // --- 1. Create all components once ---
    const starBody = this._createStarBody(object, options);
    const coronaGroup = this._createCoronaGroup(object);
    const jetsGroup = this._createJetsGroup(object);

    // --- 2. Assemble LOD levels ---

    // Level 0: High detail (Body + Corona + Jets)
    const highDetailGroup = new THREE.Group();
    highDetailGroup.name = `${object.celestialObjectId}-lod-high`;
    highDetailGroup.add(starBody.clone());
    highDetailGroup.add(coronaGroup.clone());
    highDetailGroup.add(jetsGroup.clone());
    const lod0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Level 1: Medium detail (Body + Corona)
    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.celestialObjectId}-lod-medium`;
    mediumDetailGroup.add(starBody); // reuse the original mesh
    mediumDetailGroup.add(coronaGroup);
    const lod1: LODLevel = { object: mediumDetailGroup, distance: 2000 };

    // Level 2: Low detail (Just a bright sprite)
    const lowDetailMesh = new THREE.Mesh(
      new THREE.SphereGeometry(object.radius * 2, 8, 8),
      new THREE.MeshBasicMaterial({ color: this.getStarColor(object) }),
    );
    lowDetailMesh.name = `${object.celestialObjectId}-lod-low`;
    const lod2: LODLevel = { object: lowDetailMesh, distance: 10000 };

    return [lod0, lod1, lod2];
  }

  /**
   * Creates the main, small, dense body of the neutron star.
   * @internal
   */
  private _createStarBody(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Mesh {
    const segments = options?.detailLevel === "high" ? 64 : 48;
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const material = this.getMaterial(object);
    this.materials.set(object.celestialObjectId, material as BaseStarMaterial);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.celestialObjectId}-body`;
    return mesh;
  }

  /**
   * Creates the pulsar jets characteristic of a neutron star.
   * @internal
   */
  private _createJetsGroup(object: RenderableCelestialObject): THREE.Group {
    const group = new THREE.Group();
    group.name = `${object.celestialObjectId}-jets`;

    const jetLength = object.radius * 10;
    const jetRadius = object.radius * 0.5;
    const jetGeometry = new THREE.CylinderGeometry(
      jetRadius,
      jetRadius,
      jetLength,
      16,
      1,
      true,
    );
    const jetMaterials: PulsarJetMaterial[] = [];
    const color = this.getStarColor(object);

    const northJetMaterial = new PulsarJetMaterial(color, {
      opacity: 0.7,
      pulseSpeed: 15.0,
    });
    jetMaterials.push(northJetMaterial);
    const northJet = new THREE.Mesh(jetGeometry.clone(), northJetMaterial);
    northJet.position.set(0, jetLength / 2, 0);
    northJet.name = `${object.celestialObjectId}-jet-north`;

    const southJetMaterial = new PulsarJetMaterial(color, {
      opacity: 0.7,
      pulseSpeed: 15.0,
    });
    jetMaterials.push(southJetMaterial);
    const southJet = new THREE.Mesh(jetGeometry, southJetMaterial);
    southJet.position.set(0, -jetLength / 2, 0);
    southJet.rotation.x = Math.PI;
    southJet.name = `${object.celestialObjectId}-jet-south`;

    group.add(northJet, southJet);
    this.jetMaterials.set(object.celestialObjectId, jetMaterials);

    return group;
  }

  /**
   * Overrides the base corona to be much larger and more intense.
   * @internal
   */
  protected _createCoronaGroup(object: RenderableCelestialObject): THREE.Group {
    const coronaGroup = new THREE.Group();
    coronaGroup.name = `${object.celestialObjectId}-corona-group`;

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

      // Create a second plane rotated 90 degrees for a more volumetric feel
      const coronaMesh2 = coronaMesh.clone();
      coronaMesh2.rotation.y = Math.PI / 2;
      coronaGroup.add(coronaMesh, coronaMesh2);
    });

    return coronaGroup;
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
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources?: LightSourcesMap,
    camera?: THREE.Camera,
    renderer?: THREE.WebGLRenderer,
    scene?: THREE.Scene,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);

    const material = this.materials.get(
      object.celestialObjectId,
    ) as NeutronStarMaterial;
    if (material) {
      material.update(this.elapsedTime, timeScale, lightSources, camera);
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
