import { SCALE, type StarProperties, StellarType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { CelestialMeshOptions, LightSourceData } from "../../common/types";
import { GravitationalLensingMaterial } from "../../effects/gravitational-lensing";
import { LODLevel } from "../../index";
import {
  RemnantStarMaterial,
  RemnantStarRenderer,
} from "./remnant-star-renderer";
import type { BaseStarUniformArgs } from "../main-sequence/main-sequence-star";

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

// Placeholder shaders for Neutron Star / Pulsar jets
const PULSAR_JET_VERTEX_SHADER = `
varying vec2 vUv;
varying float vDistanceFromBase; 
uniform float time;

void main() {
  vUv = uv;
  vDistanceFromBase = position.y; 

  vec3 pos = position;
  
  float pulseFactor = 0.5 + sin(time * 10.0 + position.y * 2.0) * 0.5;
  pos.xz *= (1.0 + pulseFactor * 0.2);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const PULSAR_JET_FRAGMENT_SHADER = `
uniform float time;
uniform vec3 jetColor;
uniform float jetOpacity;
varying vec2 vUv;
varying float vDistanceFromBase;

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale + time * 0.1, vec2(13.9898, 75.233))) * 43758.5453);
}

void main() {
  float intensityFalloff = pow(1.0 - vDistanceFromBase, 1.5);
  float radialDistance = abs(vUv.x - 0.5) * 2.0;
  float beamConcentration = 1.0 - pow(radialDistance, 2.0);
  beamConcentration = smoothstep(0.0, 1.0, beamConcentration);
  
  float noise = simpleNoise(vUv * vec2(1.0, 5.0), 1.0);
  
  float finalAlpha = intensityFalloff * beamConcentration * (0.5 + noise * 0.5) * jetOpacity;
  finalAlpha = clamp(finalAlpha, 0.0, 1.0);

  gl_FragColor = vec4(jetColor, finalAlpha);
}
`;

/**
 * Renderer for neutron stars
 */
export class NeutronStarRenderer extends RemnantStarRenderer {
  private lensingRenderTarget: THREE.WebGLRenderTarget | null = null;
  private lensingMaterialInstance: GravitationalLensingMaterial | null = null;
  private lensingMesh: THREE.Mesh | null = null;
  private _lensingScene?: THREE.Scene;
  private _lensingRenderer?: THREE.WebGLRenderer;
  private _lensingCamera?: THREE.PerspectiveCamera;
  private _currentRenderableObject: RenderableCelestialObject | null = null;

  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
    this._currentRenderableObject = object;
  }

  /**
   * Returns the appropriate material for a neutron star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): RemnantStarMaterial {
    const color = this.getStarColor(object);
    const properties = object.properties as StarProperties;

    const classDefaults: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      coronaIntensity: 0.01,
      pulseSpeed: 0.0, // Pulsation usually via jets
      glowIntensity: 0.2,
      temperatureVariation: 0.01,
      metallicEffect: 0.0,
      noiseEvolutionSpeed: 0.005, // Extremely stable visually, apart from jets
    };

    const propsUniforms = properties.shaderUniforms?.baseStar;
    const propsTimeOffset = properties.timeOffset;

    const finalMaterialOptions: Partial<BaseStarUniformArgs> & {
      timeOffset?: number;
    } = {
      ...classDefaults,
      ...(propsUniforms || {}),
      timeOffset:
        propsTimeOffset ?? classDefaults.timeOffset ?? Math.random() * 1000.0,
    };
    // Pass RemnantStarMaterial's specific shaders if needed, else it uses its defaults.
    return new RemnantStarMaterial(color, finalMaterialOptions);
  }

  /**
   * Neutron stars are pale blue/white
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    const properties = object.properties as StarProperties;
    if (properties?.color) {
      try {
        return new THREE.Color(properties.color);
      } catch (e) {
        console.warn(
          `[NeutronStarRenderer] Invalid color '${properties.color}' in star properties. Falling back to class default.`,
        );
      }
    }
    return new THREE.Color(0xddddff); // Default Neutron star color (Pale blue/white)
  }

  /**
   * For now, no specific effect layer for a simplified NeutronStar.
   * This can be expanded later to add pulsar jets if starProps.stellarType === 'PULSAR'.
   */
  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starProps = object.properties as StarProperties;
    const isPulsar =
      starProps.stellarType === StellarType.NEUTRON_STAR &&
      starProps.characteristics?.isPulsar === true;

    if (!isPulsar) {
      return null;
    }

    const starRadius = object.radius || 0.00001; // Neutron stars are extremely small (e.g. 10km = 1e-5 solar radii approx)
    const jetLength = starRadius * 20000; // Jets are very long relative to star size
    const jetRadius = starRadius * 200;

    const jetsGroup = new THREE.Group();
    jetsGroup.name = `${object.celestialObjectId}-pulsar-jets`;

    const jetGeometry = new THREE.CylinderGeometry(
      jetRadius * 0.5,
      jetRadius,
      jetLength,
      12,
      1,
      true,
    );

    // Use hardcoded defaults for jet material as shaderUniforms.pulsarJet is not defined yet
    const jetColor = new THREE.Color(0x99ccff); // Default jet color
    const jetPulseSpeed = 10.0; // Default pulse speed
    const jetOpacity = 0.7; // Default opacity

    const jetMaterial = new PulsarJetMaterial(jetColor, {
      pulseSpeed: jetPulseSpeed,
      opacity: jetOpacity,
    });

    this.effectMaterials.set(`${object.celestialObjectId}-jets`, jetMaterial);

    const topJet = new THREE.Mesh(jetGeometry, jetMaterial);
    topJet.position.y = jetLength / 2;
    topJet.name = "top-jet";

    const bottomJetMaterial = jetMaterial.clone(); // Clone for potentially different animation phase or if uniforms were to diverge
    this.effectMaterials.set(
      `${object.celestialObjectId}-bottom-jet`,
      bottomJetMaterial,
    );
    const bottomJet = new THREE.Mesh(jetGeometry, bottomJetMaterial);
    bottomJet.position.y = -jetLength / 2;
    bottomJet.rotation.x = Math.PI;
    bottomJet.name = "bottom-jet";

    jetsGroup.add(topJet);
    jetsGroup.add(bottomJet);
    return jetsGroup;
  }

  /**
   * Provides custom LOD levels for neutron stars.
   */
  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 16, // Neutron stars are tiny and smooth
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumDetailGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 8,
      includeEffects: false, // Jets likely too small/thin to see at medium distance relative to star point
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 100 * scale,
    };

    return [level0, level1];
  }

  /**
   * Provides the billboard LOD distance for neutron stars.
   */
  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 500 * scale; // Neutron stars are very small, billboard relatively soon
  }

  // Override _createHighDetailGroup to add the lensing sphere
  protected override _createHighDetailGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    // Get the standard high detail group (star body, corona, pulsar jets if any)
    const group = super._createHighDetailGroup(object, options);

    // Create and add the gravitational lensing effect sphere if enabled
    if (
      this.options.enableGravitationalLensing &&
      this.lensingMaterialInstance
    ) {
      const starRadius = object.radius || 0.00001;
      // Lensing sphere should be larger than the star, e.g., 5-10 times the star's radius.
      // This factor might need tuning.
      const lensingSphereRadius = starRadius * 5.0;

      const lensingGeometry = new THREE.SphereGeometry(
        lensingSphereRadius,
        32,
        16,
      );
      this.lensingMesh = new THREE.Mesh(
        lensingGeometry,
        this.lensingMaterialInstance,
      );
      this.lensingMesh.name = `${object.celestialObjectId}-lensing-sphere`;
      // Lensing sphere should render after the star body but before transparent effects if order matters.
      // Or rely on depth testing and blending.
      // this.lensingMesh.renderOrder = 1; // Optional: adjust render order if needed
      group.add(this.lensingMesh);
      // console.warn(`[NeutronStarRenderer] Lensing sphere created for ${object.celestialObjectId}`);
    } else if (
      this.options.enableGravitationalLensing &&
      !this.lensingMaterialInstance
    ) {
      console.warn(
        `[NeutronStarRenderer] Lensing enabled for ${object.celestialObjectId} but lensingMaterialInstance is not ready in _createHighDetailGroup.`,
      );
    }

    return group;
  }

  override addGravitationalLensing(
    objectData: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    meshGroup: THREE.Object3D, // meshGroup is the LOD object, not directly modified here anymore
  ): void {
    this._lensingRenderer = renderer;
    this._lensingScene = scene;
    this._lensingCamera = camera;
    this._currentRenderableObject = objectData; // Ensure this is set

    if (!this.lensingRenderTarget) {
      this.lensingRenderTarget = new THREE.WebGLRenderTarget(
        renderer.domElement.width,
        renderer.domElement.height,
      );
    }
    if (!this.lensingMaterialInstance) {
      // It's crucial that objectRadius and objectWorldPosition are part of the material's defined uniforms.
      // We ensured this in the previous step for GravitationalLensingMaterial.
      this.lensingMaterialInstance = new GravitationalLensingMaterial();
    }

    // The lensingMesh (the effect sphere) will be created and assigned
    // in _createHighDetailGroup or similar LOD setup method.
    // We no longer find and replace the star body material here.
    // console.warn(`[NeutronStarRenderer] Gravitational lensing initialized for ${objectData.celestialObjectId}.`);
  }

  override update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.PerspectiveCamera,
  ): void {
    super.update(time, lightSources, camera); // Update base star, corona, and elapsedTime

    // Update Jets
    const jetMaterial = this.effectMaterials.get(
      `${this._currentRenderableObject?.celestialObjectId}-jets`,
    ) as PulsarJetMaterial | THREE.ShaderMaterial;
    const bottomJetMaterial = this.effectMaterials.get(
      `${this._currentRenderableObject?.celestialObjectId}-bottom-jet`,
    ) as PulsarJetMaterial | THREE.ShaderMaterial;

    if (jetMaterial && typeof (jetMaterial as any).update === "function") {
      (jetMaterial as any).update(this.elapsedTime);
    }
    if (
      bottomJetMaterial &&
      typeof (bottomJetMaterial as any).update === "function"
    ) {
      (bottomJetMaterial as any).update(this.elapsedTime + Math.PI); // Phase offset for bottom jet if needed
    }

    // Gravitational Lensing Pass
    if (
      this.lensingRenderTarget &&
      this.lensingMaterialInstance &&
      this._lensingScene &&
      this._lensingRenderer &&
      this._lensingCamera &&
      this.lensingMesh && // Ensure we have the mesh with the lensing material
      this._currentRenderableObject
    ) {
      this.lensingMesh.visible = false; // Hide the lensing effect sphere itself
      // The actual star body (from super._createHighDetailGroup) remains visible and gets rendered to the target.

      this._lensingRenderer.setRenderTarget(this.lensingRenderTarget);
      this._lensingRenderer.clear();
      this._lensingRenderer.render(this._lensingScene, this._lensingCamera);

      this.lensingMesh.visible = true; // Make the lensing effect sphere visible again for its pass
      // this.lensingMesh.material = this.lensingMaterialInstance; // Already set during creation

      this.lensingMaterialInstance.uniforms.tBackground.value =
        this.lensingRenderTarget.texture;

      // objectWorldPosition should be the world position of the actual neutron star,
      // not necessarily the lensingMesh if it has a different origin or scaling logic.
      // Assuming lensingMesh is centered on the star, its matrixWorld can be used.
      this.lensingMaterialInstance.uniforms.objectWorldPosition.value.setFromMatrixPosition(
        this.lensingMesh.matrixWorld,
      );

      // objectRadius is the actual radius of the neutron star.
      this.lensingMaterialInstance.uniforms.objectRadius.value =
        this._currentRenderableObject.radius;
      // No need to multiply by this.lensingMesh.scale.x as objectRadius is the true radius of the lensed object.

      this._lensingRenderer.setRenderTarget(null); // Reset render target
    }
  }

  override dispose(): void {
    super.dispose();
    this.lensingRenderTarget?.dispose();
    this.lensingMaterialInstance?.dispose();
    this.lensingRenderTarget = null;
    this.lensingMaterialInstance = null;
    this.lensingMesh = null;
  }
}
