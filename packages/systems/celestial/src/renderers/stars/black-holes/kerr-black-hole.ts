import { SCALE, type StarProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type { CelestialMeshOptions, LightSourceData } from "../../common/types";
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

    super({
      ...ergosphereShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.DoubleSide,
    });
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

  /**
   * Constructor allows setting rotation speed
   */
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
    rotationSpeed: number = 0.5,
  ) {
    super(object, options);
    this.rotationSpeed = Math.min(0.999, Math.max(0, rotationSpeed));
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
    const starProps = object.properties as StarProperties | undefined;

    const enableEffects = this.options.includeEffects !== false;

    // 1. Accretion Disk
    if (
      enableEffects &&
      starProps?.characteristics?.hasAccretionDisk !== false
    ) {
      const diskInnerRadius = eventHorizonRadius * 1.2;
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
        this.registerMaterial(
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
    }

    // 2. Ergosphere
    if (enableEffects && starProps?.characteristics?.hasErgosphere !== false) {
      const ergosphereOuterRadius =
        eventHorizonRadius *
        (1 + Math.sqrt(1 - this.rotationSpeed * this.rotationSpeed));
      const ergosphereInnerRadius = eventHorizonRadius * 1.01;
      const finalErgosphereOuterRadius = Math.max(
        ergosphereInnerRadius * 1.1,
        ergosphereOuterRadius,
      );

      const ergosphereGeometry = new THREE.SphereGeometry(
        finalErgosphereOuterRadius,
        48,
        48,
      );

      if (!this.ergosphereMaterialInstance) {
        this.ergosphereMaterialInstance = new ErgosphereMaterial(
          this.rotationSpeed,
        );
        this.registerMaterial(
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
    }

    // 3. Relativistic Jets
    if (enableEffects && starProps?.characteristics?.hasJets !== false) {
      const jetLength = eventHorizonRadius * 50;
      const jetRadius = eventHorizonRadius * 0.3;
      const jetGeometry = new THREE.CylinderGeometry(
        jetRadius * 0.5,
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
        this.registerMaterial(
          `${object.celestialObjectId}-jets`,
          this.jetMaterialInstance,
        );
      }

      const jet1 = new THREE.Mesh(
        jetGeometry.clone(),
        this.jetMaterialInstance,
      );
      jet1.position.y = jetLength / 2;
      jet1.name = `${object.celestialObjectId}-jet-north`;
      effectsGroup.add(jet1);

      const jet2Material = this.jetMaterialInstance.clone();
      this.registerMaterial(
        `${object.celestialObjectId}-jet-south-material`,
        jet2Material,
      );
      const jet2 = new THREE.Mesh(jetGeometry.clone(), jet2Material);
      jet2.position.y = -jetLength / 2;
      jet2.rotation.x = Math.PI;
      jet2.name = `${object.celestialObjectId}-jet-south`;
      effectsGroup.add(jet2);

      const rotationAxis =
        (starProps?.characteristics?.rotationAxis as THREE.Vector3) ||
        new THREE.Vector3(0, 1, 0);
      effectsGroup.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        rotationAxis.normalize(),
      );
    }

    return effectsGroup.children.length > 0 ? effectsGroup : null;
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

    const mediumDetailGroup = new THREE.Group();
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const eventHorizonMeshMedium = this.createEventHorizonMesh(object);
    mediumDetailGroup.add(eventHorizonMeshMedium);
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 1500 * scale,
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
    return 6000 * scale;
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
      // Implement lensing update logic here
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

    this.materials.forEach((material, key) => {
      if (
        key.startsWith(`${this.object.celestialObjectId}-`) &&
        key.endsWith("-material")
      ) {
        material.dispose();
      }
    });

    this.materials.clear();

    this.ergosphereMaterialInstance = null;
  }
}
