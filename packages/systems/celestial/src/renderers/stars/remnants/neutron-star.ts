import { SCALE, type StarProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";
import { GravitationalLensingMaterial } from "../../effects/gravitational-lensing";
import { LODLevel } from "../../index";
import {
  RemnantStarMaterial,
  RemnantStarRenderer,
} from "./remnant-star-renderer";

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
export class NeutronStarMaterial extends RemnantStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xddddff)) {
    super({
      starColor: color, // Very hot, often appearing bluish-white
      coronaIntensity: 0.01, // Almost no visible corona, extreme gravity
      pulseSpeed: 0.0, // Pulsation is via jets, not surface typically
      glowIntensity: 0.2, // Intense for its size, but small
      temperatureVariation: 0.01, // Extremely uniform or unobservable due to conditions
      metallicEffect: 0.0,
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

// Placeholder shaders for Neutron Star / Pulsar jets
const PULSAR_JET_VERTEX_SHADER = `
varying vec2 vUv;
varying float vDistanceFromBase; 
uniform float time;

void main() {
  vUv = uv;
  // Assuming the jet geometry is a cylinder aligned with Y-axis
  // and its base is at y = 0, extending to y = 1 (before scaling)
  vDistanceFromBase = position.y; 

  vec3 pos = position;
  
  // Pulsating width for the jet
  float pulseFactor = 0.5 + sin(time * 10.0 + position.y * 2.0) * 0.5; // Faster, more dynamic pulse
  pos.xz *= (1.0 + pulseFactor * 0.2); // Modest width pulsation

  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const PULSAR_JET_FRAGMENT_SHADER = `
uniform float time;
uniform vec3 jetColor;
uniform float jetOpacity; // Renamed for clarity
varying vec2 vUv;
varying float vDistanceFromBase; // Normalized distance from 0 to 1 along the jet

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale + time * 0.1, vec2(13.9898, 75.233))) * 43758.5453);
}

void main() {
  // vDistanceFromBase is used to fade the jet along its length
  float intensityFalloff = pow(1.0 - vDistanceFromBase, 1.5); // Stronger falloff near the tip

  // Create a more focused beam effect using vUv.x (radial distance from center of jet)
  // This assumes UVs are set up such that vUv.x = 0.5 is the center of the jet.
  float radialDistance = abs(vUv.x - 0.5) * 2.0; // Map 0..1 to 0..1 across the jet width
  float beamConcentration = 1.0 - pow(radialDistance, 2.0); // Sharper core
  beamConcentration = smoothstep(0.0, 1.0, beamConcentration);
  
  float noise = simpleNoise(vUv * vec2(1.0, 5.0), 1.0); // Noise for texture
  
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
    // Simplified: No specific property reading for now
  }

  /**
   * Returns the appropriate material for a neutron star
   */
  protected getMaterial(
    object: RenderableCelestialObject,
  ): RemnantStarMaterial {
    const color = this.getStarColor(object);
    return new NeutronStarMaterial(color);
  }

  /**
   * Neutron stars are pale blue/white
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xddddff);
  }

  /**
   * For now, no specific effect layer for a simplified NeutronStar.
   * This can be expanded later to add pulsar jets if starProps.stellarType === 'PULSAR'.
   */
  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    // For now, always assume it's a pulsar for demonstration.
    // In a real scenario, check object.properties.isPulsar or similar.
    const isPulsar = true; // Placeholder

    if (!isPulsar) {
      return null;
    }

    const starRadius = object.radius || 0.01; // Neutron stars are tiny
    const jetLength = starRadius * 200; // Jets are very long
    const jetRadius = starRadius * 2; // Jets are relatively thin

    // Create two jets, one for each pole
    const jetsGroup = new THREE.Group();
    jetsGroup.name = `${object.celestialObjectId}-pulsar-jets`;

    const jetGeometry = new THREE.CylinderGeometry(
      jetRadius * 0.5, // Tapered jet: radiusTop
      jetRadius, // radiusBottom
      jetLength, // height
      12, // radialSegments
      1, // heightSegments
      true, // openEnded (no caps)
    );
    // Adjust UVs for the cylinder to map vUv.y along the length
    // and vUv.x around the circumference.
    // This might require manual UV generation if the default isn't suitable.
    // For PULSAR_JET_FRAGMENT_SHADER, vUv.y is vDistanceFromBase (0 to 1 up the cylinder)
    // and vUv.x is for radial patterns.

    const jetMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        jetColor: { value: new THREE.Color(0x99ccff) }, // Light blue/cyan jet
        jetOpacity: { value: 0.7 },
      },
      vertexShader: PULSAR_JET_VERTEX_SHADER,
      fragmentShader: PULSAR_JET_FRAGMENT_SHADER,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide, // Render both sides if the geometry is open
    });

    this.effectMaterials.set(
      `${object.celestialObjectId}-jet-material`,
      jetMaterial,
    );

    // Jet 1 (e.g., North pole)
    const jetMesh1 = new THREE.Mesh(jetGeometry, jetMaterial);
    jetMesh1.position.y = jetLength / 2 + starRadius * 0.5; // Position above the star surface
    jetMesh1.name = `${object.celestialObjectId}-jet-N`;
    jetsGroup.add(jetMesh1);

    // Jet 2 (e.g., South pole)
    const jetMesh2 = new THREE.Mesh(jetGeometry.clone(), jetMaterial); // Use clone for geometry
    jetMesh2.position.y = -(jetLength / 2 + starRadius * 0.5); // Position below the star surface
    jetMesh2.rotation.x = Math.PI; // Rotate to point downwards
    jetMesh2.name = `${object.celestialObjectId}-jet-S`;
    jetsGroup.add(jetMesh2);

    // Optional: Add a slight tilt to the jets
    // jetsGroup.rotation.z = Math.PI / 12; // ~15 degrees tilt

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

    // High detail group - will use base corona from RemnantStarRenderer
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 32, // Neutron stars are tiny, high segments less critical for the body
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium detail: star body only (no effects)
    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: 16,
    });
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 2000 * scale,
    };

    return [level0, level1];
  }

  /**
   * Provides the billboard LOD distance for neutron stars.
   */
  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 15000 * scale; // Still visually distinct at a distance due to brightness/jets (if re-added)
  }

  override addGravitationalLensing(
    objectData: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    meshGroup: THREE.Object3D,
  ): void {
    this._lensingScene = scene;
    this._lensingRenderer = renderer;
    this._lensingCamera = camera;
    this._currentRenderableObject = objectData;

    if (!this.lensingMesh) {
      const starRadius = objectData.radius || 0.01;
      // Neutron star lensing is weaker, adjust parameters accordingly
      const lensingSphereRadius = starRadius * 10; // Larger apparent radius for lensing effect due to extreme density

      this.lensingMaterialInstance = new GravitationalLensingMaterial({
        intensity: 0.5, // Lower intensity for neutron stars vs black holes
        radius: lensingSphereRadius,
        distortionScale: 0.01, // Smaller distortion
      });

      const { width, height } = renderer.getSize(new THREE.Vector2());
      if (
        this.lensingRenderTarget &&
        (this.lensingRenderTarget.width !== width ||
          this.lensingRenderTarget.height !== height)
      ) {
        this.lensingRenderTarget.dispose();
        this.lensingRenderTarget = null;
      }
      if (!this.lensingRenderTarget) {
        this.lensingRenderTarget = new THREE.WebGLRenderTarget(width, height, {
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
          format: THREE.RGBAFormat,
        });
      }
      this.lensingMaterialInstance.uniforms.resolution.value.set(width, height);

      const lensingGeometry = new THREE.SphereGeometry(
        lensingSphereRadius,
        32,
        32,
      ); // Fewer segments
      this.lensingMesh = new THREE.Mesh(
        lensingGeometry,
        this.lensingMaterialInstance,
      );
      this.lensingMesh.name = `${objectData.celestialObjectId}-lensing-effect`;
      this.lensingMesh.renderOrder = 1;

      // Add to a specific group or the main meshGroup. For LOD, this needs care.
      // Assuming high-detail group exists as a child of meshGroup (the THREE.LOD object)
      let highDetailGroup = meshGroup.getObjectByName(
        `${objectData.celestialObjectId}-high-lod`,
      ); // Adapt name if different
      if (
        !highDetailGroup &&
        meshGroup.getObjectByName(
          `${objectData.celestialObjectId}-high-lod-group`,
        )
      ) {
        highDetailGroup = meshGroup.getObjectByName(
          `${objectData.celestialObjectId}-high-lod-group`,
        );
      } else if (!highDetailGroup && meshGroup instanceof THREE.Group) {
        highDetailGroup = meshGroup; // Assume meshGroup is the target if no specific LOD group name found
      }

      if (highDetailGroup) {
        highDetailGroup.add(this.lensingMesh);
      } else {
        console.warn(
          `[NeutronStarRenderer] Could not find high-detail group in`,
          meshGroup,
          `to add lensing mesh for ${objectData.celestialObjectId}. Lensing may not appear correctly.`,
        );
        // As a fallback, add to the main mesh group, but this might be the LOD object itself.
        // meshGroup.add(this.lensingMesh);
      }
      this.materials.set(this.lensingMesh.name, this.lensingMaterialInstance); // So super.update() updates time
    }
  }

  override update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.PerspectiveCamera,
    // scene and renderer are not standard in BaseStarRenderer's update, but needed for lensing pass
    // We stored them from addGravitationalLensing call
  ): void {
    super.update(time, lightSources, camera);

    if (
      this.lensingMaterialInstance &&
      this.lensingRenderTarget &&
      this._lensingScene &&
      this._lensingCamera &&
      this._lensingRenderer &&
      this.lensingMesh
    ) {
      let isLensingPotentiallyVisible = false;
      if (this.lensingMesh.parent) {
        isLensingPotentiallyVisible =
          this.lensingMesh.parent.visible && this.lensingMesh.visible;
      } else {
        isLensingPotentiallyVisible = this.lensingMesh.visible; // Should be parented though
      }

      if (isLensingPotentiallyVisible) {
        this.lensingMesh.visible = false;
        const originalRenderTarget = this._lensingRenderer.getRenderTarget();
        const originalClearAlpha = this._lensingRenderer.getClearAlpha();

        this._lensingRenderer.setClearAlpha(0.0);
        this._lensingRenderer.setRenderTarget(this.lensingRenderTarget);
        this._lensingRenderer.clear(true, true, true);
        this._lensingRenderer.render(this._lensingScene, this._lensingCamera);

        this._lensingRenderer.setRenderTarget(originalRenderTarget);
        this._lensingRenderer.setClearAlpha(originalClearAlpha);

        this.lensingMesh.visible = true;
        this.lensingMaterialInstance.uniforms.tBackground.value =
          this.lensingRenderTarget.texture;
      }
    }
  }

  override dispose(): void {
    super.dispose();
    if (this.lensingRenderTarget) {
      this.lensingRenderTarget.dispose();
      this.lensingRenderTarget = null;
    }
    this.lensingMaterialInstance = null; // Already disposed by super if in this.materials
    this.lensingMesh = null;
  }
}
