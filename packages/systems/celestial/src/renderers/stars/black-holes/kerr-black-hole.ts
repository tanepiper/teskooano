import { SCALE } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";
import { GravitationalLensingHelper } from "../../effects/gravitational-lensing";
import { LODLevel } from "../../index";
import { BaseBlackHoleRenderer } from "./base-black-hole-renderer";
import { AccretionDiskMaterial as SchwarzschildAccretionDiskMaterial } from "./schwarzschild-black-hole";

/**
 * Material for Kerr black holes' ergosphere
 * - Represents the region where space-time is dragged by rotation
 */
export class ErgosphereMaterial extends THREE.ShaderMaterial {
  constructor(rotationSpeed: number = 0.5) {
    const ergosphereShader = {
      uniforms: {
        time: { value: 0 },
        rotationSpeed: { value: rotationSpeed },
        ergosphereColor: { value: new THREE.Color(0x300530) }, // Deep purple/magenta hues
        noiseScale: { value: 1.5 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        varying vec2 vUv; // Using UV for some patterns
        void main() {
          vUv = uv;
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * viewMatrix * worldPosition;
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform float rotationSpeed;
        uniform vec3 ergosphereColor;
        uniform float noiseScale;
        varying vec3 vWorldPosition;
        varying vec2 vUv;

        float simpleNoise(vec3 p) {
          return fract(sin(dot(p, vec3(12.9898, 78.233, 151.7182))) * 43758.5453);
        }

        void main() {
          float T = time * 0.2 * rotationSpeed;
          // Swirling noise pattern based on world position and UVs
          float noiseVal = simpleNoise(vWorldPosition * noiseScale + vec3(T, T*0.5, 0.0) + vUv.x * 0.1);
          
          // Create a base transparency that is stronger near the poles and weaker at the equator
          // assuming the ergosphere is somewhat flattened or aligned with the disk
          vec3 normWorldPos = normalize(vWorldPosition);
          float equatorialFade = 1.0 - abs(normWorldPos.y); // Fades out at Y-poles, stronger at XZ plane (equator)
          
          float intensity = pow(noiseVal, 2.0) * (0.3 + equatorialFade * 0.7);
          intensity = clamp(intensity, 0.1, 0.6); // Keep it subtle

          gl_FragColor = vec4(ergosphereColor, intensity);
        }
      `,
    };

    super(ergosphereShader);
  }

  /**
   * Update the material with the current time
   */
  update(time: number): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }
  }

  /**
   * Set the rotation speed of the black hole
   */
  setRotationSpeed(speed: number): void {
    if (this.uniforms.rotationSpeed) {
      this.uniforms.rotationSpeed.value = speed;
    }
  }

  /**
   * Dispose of material resources
   */
  dispose(): void {}
}

/**
 * Material for rotating accretion disk with frame dragging effects
 */
export class KerrAccretionDiskMaterial extends SchwarzschildAccretionDiskMaterial {
  constructor(
    rotationSpeed: number = 0.5,
    options?: ConstructorParameters<
      typeof SchwarzschildAccretionDiskMaterial
    >[0],
  ) {
    super(options ?? {}); // Ensure options is an object
    // If Kerr disk needs specific uniforms beyond Schwarzschild's, add them here.
    // Example: this.uniforms.kerrRotation = { value: rotationSpeed };
    // This requires the fragment shader of SchwarzschildAccretionDiskMaterial or a new one for Kerr
    // to actually use such a uniform.
  }
  // public update(time: number): void { // Add update if specific logic is needed beyond base
  //   super.update(time);
  //   // if (this.uniforms.kerrRotation) { /* ... */ }
  // }
}

/**
 * Material for Kerr black hole relativistic jets.
 */
export class KerrJetMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xaaaaff),
    jetSpeed: number = 5.0,
  ) {
    super({
      uniforms: {
        time: { value: 0.0 },
        jetColor: { value: color },
        jetSpeed: { value: jetSpeed }, // Controls speed of patterns along the jet
        jetLength: { value: 10.0 }, // Characteristic length for patterns
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
        uniform vec3 jetColor;
        uniform float jetSpeed;
        uniform float jetLength;
        varying vec2 vUv; // vUv.y is distance along jet (0 at base, 1 at tip)

        float noise(vec2 p) {
          return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }

        void main() {
          float distAlongJet = vUv.y;
          float radialPos = abs(vUv.x - 0.5) * 2.0; // 0 at center, 1 at edge

          // Pattern moving along the jet
          float pattern = noise(vec2(vUv.x * 2.0, distAlongJet * jetLength - time * jetSpeed));
          pattern = pow(pattern, 1.5);

          // Intensity: fades towards tip and edges
          float intensity = (1.0 - distAlongJet) * (1.0 - pow(radialPos, 2.0));
          intensity = smoothstep(0.0, 1.0, intensity);

          float alpha = intensity * pattern * 0.8; // Base alpha
          alpha = clamp(alpha, 0.0, 0.7);

          gl_FragColor = vec4(jetColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
  }
  update(time: number): void {
    if (this.uniforms.time) {
      this.uniforms.time.value = time;
    }
  }
}

/**
 * Renderer for Kerr black holes (rotating black holes)
 */
export class KerrBlackHoleRenderer extends BaseBlackHoleRenderer {
  private ergosphereMaterialInstance: ErgosphereMaterial | null = null;
  private accretionDiskMaterialInstance: KerrAccretionDiskMaterial | null =
    null;
  private jetMaterialInstance: KerrJetMaterial | null = null;
  private rotationSpeed: number;
  private lensingHelpers: Map<string, GravitationalLensingHelper> = new Map();

  /**
   * Constructor allows setting rotation speed
   */
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
    rotationSpeed: number = 0.5,
  ) {
    super(object, options);
    this.rotationSpeed = rotationSpeed;
  }

  /**
   * @internal
   * Create the black hole mesh with event horizon, ergosphere and accretion disk
   */
  protected override getBlackHoleEffectsGroup(
    object: RenderableCelestialObject,
    mainGroup: THREE.Group,
    options?: CelestialMeshOptions,
  ): THREE.Group | null {
    const effectsGroup = new THREE.Group();
    effectsGroup.name = `${object.celestialObjectId}-kerr-effects`;

    const eventHorizonRadius =
      object.radius || 0.1 * (typeof SCALE === "number" ? SCALE : 1);

    // 1. Accretion Disk (potentially flatter or warped due to frame-dragging)
    const diskInnerRadius = eventHorizonRadius * 1.2; // Closer for Kerr due to ergosphere
    const diskOuterRadius = eventHorizonRadius * 4.0;
    const diskGeometry = new THREE.RingGeometry(
      diskInnerRadius,
      diskOuterRadius,
      64,
      8,
    );
    diskGeometry.rotateX(-Math.PI / 2);
    if (!this.accretionDiskMaterialInstance) {
      this.accretionDiskMaterialInstance = new KerrAccretionDiskMaterial(
        this.rotationSpeed,
      );
      this.materials.set(
        `${object.celestialObjectId}-accretion-disk`,
        this.accretionDiskMaterialInstance,
      );
    }
    const diskMesh = new THREE.Mesh(
      diskGeometry,
      this.accretionDiskMaterialInstance,
    );
    diskMesh.name = `${object.celestialObjectId}-accretion-disk`;
    effectsGroup.add(diskMesh);

    // 2. Ergosphere (a transparent, dynamic region)
    const ergosphereMaxRadius =
      eventHorizonRadius *
      (1.0 +
        Math.sqrt(1.0 - Math.pow(Math.min(0.99, this.rotationSpeed), 2.0))); // rotationSpeed capped at 0.99 to avoid sqrt(negative)
    const ergosphereEffectiveRadius = Math.max(
      eventHorizonRadius * 1.05,
      ergosphereMaxRadius,
    ); // Ensure it's outside EH
    // Shape of ergosphere is oblate spheroid, approximated here with a sphere or slightly flattened sphere
    const ergosphereGeometry = new THREE.SphereGeometry(
      ergosphereEffectiveRadius,
      48,
      32,
    );
    if (!this.ergosphereMaterialInstance) {
      this.ergosphereMaterialInstance = new ErgosphereMaterial(
        this.rotationSpeed,
      );
      this.materials.set(
        `${object.celestialObjectId}-ergosphere`,
        this.ergosphereMaterialInstance,
      );
    }
    const ergosphereMesh = new THREE.Mesh(
      ergosphereGeometry,
      this.ergosphereMaterialInstance,
    );
    ergosphereMesh.name = `${object.celestialObjectId}-ergosphere`;
    effectsGroup.add(ergosphereMesh);

    // 3. Relativistic Jets (if applicable, based on properties or always for Kerr)
    const jetLength = eventHorizonRadius * 150;
    const jetRadius = eventHorizonRadius * 1.5;
    const jetGeometry = new THREE.CylinderGeometry(
      jetRadius * 0.3,
      jetRadius,
      jetLength,
      12,
      1,
      true,
    );

    if (!this.jetMaterialInstance) {
      this.jetMaterialInstance = new KerrJetMaterial(
        new THREE.Color(0x88aaff),
        7.0,
      );
      this.materials.set(
        `${object.celestialObjectId}-jets`,
        this.jetMaterialInstance,
      );
    }

    const jetN = new THREE.Mesh(jetGeometry.clone(), this.jetMaterialInstance);
    jetN.position.y = jetLength / 2 + eventHorizonRadius * 0.8; // Adjusted offset
    jetN.name = `${object.celestialObjectId}-jet-N`;
    effectsGroup.add(jetN);

    const jetS = new THREE.Mesh(jetGeometry.clone(), this.jetMaterialInstance);
    jetS.position.y = -(jetLength / 2 + eventHorizonRadius * 0.8);
    jetS.rotation.x = Math.PI;
    jetS.name = `${object.celestialObjectId}-jet-S`;
    effectsGroup.add(jetS);

    // TODO: Orient jets along rotation axis if available from object.properties
    // effectsGroup.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), rotationAxis);

    return effectsGroup;
  }

  /**
   * Provides custom LOD levels for Kerr black holes.
   */
  protected override getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    const highDetailGroup = this._createHighDetailGroup(object, options);
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium LOD: Event Horizon + Ergosphere (simpler jets or no jets)
    const mediumGroup = new THREE.Group();
    mediumGroup.name = `${object.celestialObjectId}-medium-lod`;
    mediumGroup.add(this.createEventHorizonMesh(object));

    // Simplified Ergosphere for medium LOD
    const eventHorizonRadius = object.radius || 0.1 * scale;
    const ergosphereEffectiveRadiusMed = Math.max(
      eventHorizonRadius * 1.05,
      eventHorizonRadius *
        (1.0 +
          Math.sqrt(1.0 - Math.pow(Math.min(0.99, this.rotationSpeed), 2.0))),
    );
    const ergosphereGeoMed = new THREE.SphereGeometry(
      ergosphereEffectiveRadiusMed,
      24,
      16,
    );
    // Reuse ergosphere material instance if already created
    if (!this.ergosphereMaterialInstance) {
      this.ergosphereMaterialInstance = new ErgosphereMaterial(
        this.rotationSpeed,
      );
      this.materials.set(
        `${object.celestialObjectId}-ergosphere-med`,
        this.ergosphereMaterialInstance,
      );
    } else {
      // If ergosphereMaterialInstance is shared, ensure it's in the materials map for update by BaseStarRenderer
      if (
        !this.materials.has(`${object.celestialObjectId}-ergosphere-med`) &&
        !this.materials.has(`${object.celestialObjectId}-ergosphere`)
      ) {
        this.materials.set(
          `${object.celestialObjectId}-ergosphere`,
          this.ergosphereMaterialInstance,
        );
      }
    }
    const ergosphereMeshMed = new THREE.Mesh(
      ergosphereGeoMed,
      this.ergosphereMaterialInstance,
    );
    mediumGroup.add(ergosphereMeshMed);
    // No jets for medium LOD to save performance

    const level1: LODLevel = {
      object: mediumGroup,
      distance: 2500 * scale, // Effects fade out further for Kerr due to jets potential
    };
    return [level0, level1];
  }

  /**
   * Provides the billboard LOD distance for Kerr black holes.
   */
  protected override getBillboardLODDistance(
    object: RenderableCelestialObject,
  ): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 25000 * scale; // Kerr black holes with jets might be noticeable from further away
  }

  /**
   * Overrides BaseStarRenderer.getLODLevels to provide a custom "dark" billboard for black holes.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const customLODs = this.getCustomLODs(object, options);
    const billboardDistance = this.getBillboardLODDistance(object);

    // Create a simple black circle texture for the distant sprite
    const canvas = document.createElement("canvas");
    canvas.width = 32; // Small texture for a distant dark point
    canvas.height = 32;
    const context = canvas.getContext("2d");
    if (context) {
      context.fillStyle = "black";
      context.beginPath();
      context.arc(16, 16, 15, 0, Math.PI * 2);
      context.fill();
    }
    const darkCircleTexture = new THREE.CanvasTexture(canvas);

    // Miniscule sprite size for a distant black hole
    const distantPointSize = 0.02;

    const spriteMaterial = new THREE.SpriteMaterial({
      map: darkCircleTexture,
      color: 0x000000, // Black
      sizeAttenuation: false,
      transparent: false, // Could be true if we want to fade it with opacity
      // blending: THREE.NormalBlending, // No additive blending for a dark spot
    });

    const distantSprite = new THREE.Sprite(spriteMaterial);
    distantSprite.name = `${object.celestialObjectId}-distant-dark-spot`;
    distantSprite.scale.set(distantPointSize, distantPointSize, 1.0);

    // Black holes don't emit light, so no PointLight component for the billboard.
    const billboardGroup = new THREE.Group();
    billboardGroup.name = `${object.celestialObjectId}-billboard-lod`;
    billboardGroup.add(distantSprite);

    const billboardLOD: LODLevel = {
      object: billboardGroup,
      distance: billboardDistance,
    };

    return [...customLODs, billboardLOD].sort(
      (a, b) => a.distance - b.distance,
    );
  }

  /**
   * Update method for Kerr black holes.
   */
  update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
    scene?: THREE.Scene,
    renderer?: THREE.WebGLRenderer,
  ): void {
    const currentTime = time ?? Date.now() / 1000 - this.startTime;
    this.elapsedTime = currentTime;

    if (this.ergosphereMaterialInstance) {
      this.ergosphereMaterialInstance.update(currentTime);
    }

    this.accretionDiskMaterialInstance?.update(currentTime);

    if (renderer && scene && camera) {
      this.lensingHelpers.forEach((helper) => {
        helper.update(renderer, scene, camera as THREE.PerspectiveCamera);
      });
    }
  }

  /**
   * Dispose of all materials
   */
  override dispose(): void {
    super.dispose();
    if (this.ergosphereMaterialInstance) {
      this.ergosphereMaterialInstance.dispose();
    }

    this.accretionDiskMaterialInstance = null;
    this.jetMaterialInstance = null;

    this.lensingHelpers.forEach((helper) => {
      helper.dispose();
    });

    this.lensingHelpers.clear();

    this.ergosphereMaterialInstance = null;
  }
}
