import {
  CometProperties,
  RenderableCelestialObject,
  SCALE,
  scaleSize,
} from "@teskooano/data-types";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";

import { createSeededRandomSync } from "@teskooano/core-math";
import {
  BaseCelestialRenderer,
  GeometryUtilities,
  type CelestialMeshOptions,
  type LightSourcesMap,
  ShadowCasterUtils,
} from "@teskooano/renderer-threejs-celestial";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";
import {
  CometComaMaterial,
  CometJetMaterial,
  CometNucleusMaterial,
  CometParticleMaterial,
} from "./material";

const MAX_PARTICLES = 12000;
const PARTICLE_LIFETIME = 5.0; // seconds

/**
 * Renderer for comet objects with nucleus, coma, particle tails, and jet effects.
 *
 * Features:
 * - Procedurally displaced nucleus geometry with noise-based surface detail
 * - Dynamic coma that scales with solar activity
 * - Particle-based tail system with realistic physics
 * - Multiple gas jets emanating from the nucleus surface
 * - LOD system with simplified tail for distant viewing
 * - Activity-based visual changes (extinct comets show no coma/tail)
 */
export class CometRenderer extends BaseCelestialRenderer {
  private nucleus?: THREE.Mesh;
  private coma?: THREE.Mesh;
  private nucleus_lod1?: THREE.Mesh;
  private coma_lod1?: THREE.Mesh;
  private particleTail?: THREE.Points;
  private particleGeometry?: THREE.BufferGeometry;
  private particlePositions?: Float32Array;
  private particleAttributes?: {
    size: Float32Array;
    alpha: Float32Array;
    lifetime: Float32Array;
    velocity: THREE.Vector3[];
  };
  private jets: {
    points: THREE.Points;
    geometry: THREE.BufferGeometry;
    attributes: {
      size: Float32Array;
      alpha: Float32Array;
      lifetime: Float32Array;
      velocity: THREE.Vector3[];
    };
    lastParticleIndex: number;
    emissionPoint?: THREE.Vector3;
    emissionNormal?: THREE.Vector3;
    repositionTimer: number;
  }[] = [];
  private comaMaterial?: CometComaMaterial;
  private nucleusAndComaGroup?: THREE.Group; // New property for nucleus and coma
  private nucleusAndComaGroup_lod1?: THREE.Group; // New property for LOD 1 nucleus and coma
  private lastParticleIndex = 0;
  private clock = new THREE.Clock();
  private noise = new SimplexNoise();
  private random: () => number = () => 0;
  private camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera();

  constructor(object: RenderableCelestialObject) {
    super(object);
    this.random = createSeededRandomSync(object.seed ?? object.id);

    this.createNucleus(object);
    this.createComa(object);
    this.createParticleTail(object);
    this._createJets(object);
  }

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    // Initialize seeded random for this comet
    this.random = createSeededRandomSync(object.seed ?? object.id);

    // LOD 0: High detail with particle tail
    const lod0_container = new THREE.Group();
    lod0_container.name = `${object.id}-comet-lod0-container`;
    this.nucleusAndComaGroup = new THREE.Group(); // Initialize the group
    this.nucleusAndComaGroup.name = `${object.id}-nucleus-coma-group`;

    // Add nucleus (should always exist)
    if (this.nucleus) {
      this.nucleusAndComaGroup.add(this.nucleus);
    }

    // Add coma (only if it exists)
    if (this.coma) {
      this.nucleusAndComaGroup.add(this.coma);
    }

    lod0_container.add(this.nucleusAndComaGroup);

    // Add particle tail (only if it exists)
    if (this.particleTail) {
      lod0_container.add(this.particleTail);
    }

    // Add jets
    this.jets.forEach((jet) => lod0_container.add(jet.points));

    // LOD 1: Lower detail with simplified mesh tail
    const lod1_container = new THREE.Group();
    lod1_container.name = `${object.id}-comet-lod1-container`;
    this.nucleusAndComaGroup_lod1 = new THREE.Group(); // Initialize the LOD 1 group
    this.nucleusAndComaGroup_lod1.name = `${object.id}-nucleus-coma-group-lod1`;

    // Clone nucleus for LOD 1 (only if it exists)
    if (this.nucleus) {
      this.nucleus_lod1 = this.nucleus.clone(false); // Clone geometry/material but not children
      this.nucleusAndComaGroup_lod1.add(this.nucleus_lod1);
    }

    // Clone coma for LOD 1 (only if it exists)
    if (this.coma) {
      this.coma_lod1 = this.coma.clone(false);
      this.nucleusAndComaGroup_lod1.add(this.coma_lod1);
    }

    lod1_container.add(this.nucleusAndComaGroup_lod1);

    return [
      {
        distance: 0,
        object: lod0_container,
      },
      {
        distance: 5 * SCALE.RENDER_SCALE_AU,
        object: lod1_container,
      },
    ];
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(
      object,
      time,
      timeScale,
      lightSources,
      camera,
      allObjects,
      allMeshes,
    );

    this.camera.copy(camera);

    // Apply centralized light attenuation
    const attenuatedLightSources = this.applyLightAttenuation(
      object,
      lightSources,
    );

    // Calculate dynamic ambient light based on nearby stars
    const dynamicAmbientIntensity =
      this.lightingManager.calculateDynamicAmbientLightWithStarData(
        object,
        lightSources, // Use original light sources for ambient calculation, not attenuated
        allObjects,
      );

    this.updateNucleus(object, attenuatedLightSources, dynamicAmbientIntensity);
    this.updateParticleTail(object, attenuatedLightSources);
    this.updateJets(object, attenuatedLightSources);

    const deltaTime = this.clock.getDelta();
    const activityFactor = this.calculateActivityFactor(
      object,
      attenuatedLightSources,
    );

    this.updateNucleusRotation(object, deltaTime, activityFactor);
    this.updateComa(object, time, attenuatedLightSources, activityFactor);
    this.updateParticleTailPhysics(
      deltaTime,
      activityFactor,
      object,
      attenuatedLightSources,
    );
    this.updateJetsPhysics(deltaTime, activityFactor, object);
  }

  private createNucleus(object: RenderableCelestialObject): void {
    const nucleusGeometry = this.createNucleusGeometry(object);
    const nucleusMaterial = this.createNucleusMaterial(object);

    this.nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    this.nucleus.name = `${object.id}-nucleus`;
    this.registerMaterial(`comet-nucleus-${object.id}`, nucleusMaterial);
  }

  private createNucleusGeometry(
    object: RenderableCelestialObject,
  ): THREE.BufferGeometry {
    const nucleusGeometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);

    // Add procedural displacement to make it irregular
    const positionAttribute = nucleusGeometry.getAttribute("position");
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);

      // Spherify the cube
      const normalizedVertex = vertex.clone().normalize();

      // Get noise value
      const noiseFrequency = 1.0;
      const noisePosition = normalizedVertex
        .clone()
        .multiplyScalar(noiseFrequency);
      let displacement = this.noise.noise3d(
        noisePosition.x,
        noisePosition.y,
        noisePosition.z,
      ); // Range: -1 to 1

      // Apply displacement
      const bumpiness = 0.2;
      const finalRadius = object.radius * (1 + displacement * bumpiness);
      const finalPosition = normalizedVertex.multiplyScalar(finalRadius);

      positionAttribute.setXYZ(
        i,
        finalPosition.x,
        finalPosition.y,
        finalPosition.z,
      );
    }
    nucleusGeometry.computeVertexNormals(); // Recalculate normals for correct lighting

    return nucleusGeometry;
  }

  private createNucleusMaterial(
    object: RenderableCelestialObject,
  ): CometNucleusMaterial {
    const properties = object.properties as CometProperties;

    // Fallback for procedurally generated comets without explicit visual data.
    const colors = properties.colors ?? [
      "#2c3e50",
      "#596a7a",
      "#8c9baa",
      "#d0d5da",
    ];
    const heights = properties.heights ?? [0.0, 0.4, 0.6, 0.85];
    const visuals = properties.visuals ?? {};

    return new CometNucleusMaterial({
      colors: colors.map((c) => new THREE.Color(c)),
      heights: heights,
      ...visuals,
    });
  }

  private createComa(object: RenderableCelestialObject): void {
    const properties = object.properties as CometProperties;
    if (properties.visualComaRadius && properties.visualComaColor) {
      this.comaMaterial = new CometComaMaterial({
        color: new THREE.Color(properties.visualComaColor),
        opacity: properties.visualComaOpacity || 0.5,
      });
      this.comaMaterial.transparent = true;
      this.registerMaterial(`comet-coma-${object.id}`, this.comaMaterial);

      const comaSegments = GeometryUtilities.getOptimizedStarSegments(
        "medium",
        32,
      );
      const scaledComaRadius = scaleSize(
        properties.visualComaRadius,
        object.type,
      );
      const comaGeometry = new THREE.SphereGeometry(
        scaledComaRadius,
        comaSegments,
        comaSegments,
      );
      this.coma = new THREE.Mesh(comaGeometry, this.comaMaterial);
      this.coma.name = `${object.id}-coma`;
    }
  }

  private createParticleTail(object: RenderableCelestialObject): void {
    const properties = object.properties as CometProperties;
    if (properties.visualMaxTailLength && properties.visualTailColor) {
      this.particleGeometry = new THREE.BufferGeometry();
      this.particlePositions = new Float32Array(MAX_PARTICLES * 3);
      this.particleAttributes = {
        size: new Float32Array(MAX_PARTICLES),
        alpha: new Float32Array(MAX_PARTICLES),
        lifetime: new Float32Array(MAX_PARTICLES),
        velocity: Array.from(
          { length: MAX_PARTICLES },
          () => new THREE.Vector3(),
        ),
      };

      for (let i = 0; i < MAX_PARTICLES; i++) {
        this.particlePositions[i * 3 + 0] = 0;
        this.particlePositions[i * 3 + 1] = 0;
        this.particlePositions[i * 3 + 2] = 0;
        this.particleAttributes.lifetime[i] = -1.0; // Dead
      }

      this.particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(this.particlePositions, 3),
      );
      this.particleGeometry.setAttribute(
        "size",
        new THREE.BufferAttribute(this.particleAttributes.size, 1),
      );
      this.particleGeometry.setAttribute(
        "alpha",
        new THREE.BufferAttribute(this.particleAttributes.alpha, 1),
      );

      const particleMaterial = new CometParticleMaterial({
        color: new THREE.Color(properties.visualTailColor || "#DCE6FF"),
      });

      this.particleTail = new THREE.Points(
        this.particleGeometry,
        particleMaterial,
      );
      this.particleTail.name = `${object.id}-tail`;
      this.registerMaterial(`comet-tail-${object.id}`, particleMaterial);
    }
  }

  private updateNucleus(
    object: RenderableCelestialObject,
    attenuatedLightSources: Map<string, any> | undefined,
    dynamicAmbientIntensity: number,
  ): void {
    const nucleusMaterial = this.getMaterial(`comet-nucleus-${object.id}`) as
      | CometNucleusMaterial
      | undefined;

    if (nucleusMaterial && attenuatedLightSources) {
      // Update dynamic ambient lighting
      if (nucleusMaterial.uniforms.uAmbientStrength) {
        nucleusMaterial.uniforms.uAmbientStrength.value =
          dynamicAmbientIntensity;
      }

      // Update lighting
      nucleusMaterial.uniforms.uNumLights.value = attenuatedLightSources.size;
      let i = 0;
      for (const lightData of attenuatedLightSources.values()) {
        nucleusMaterial.uniforms.uLights.value[i].position.copy(
          lightData.position,
        );
        nucleusMaterial.uniforms.uLights.value[i].color.copy(lightData.color);
        nucleusMaterial.uniforms.uLights.value[i].intensity =
          lightData.intensity ?? 1.0;
        i++;
      }
      if (nucleusMaterial.uniforms.uCameraPosition) {
        nucleusMaterial.uniforms.uCameraPosition.value.copy(
          this.camera.position,
        );
      }
    }
  }

  private updateParticleTail(
    object: RenderableCelestialObject,
    attenuatedLightSources: Map<string, any> | undefined,
  ): void {
    if (this.particleTail) {
      const material = this.particleTail.material as CometParticleMaterial;
      const primaryLightSource = this.findClosestLightSource(
        object,
        attenuatedLightSources,
      );
      if (primaryLightSource) {
        material.uniforms.uLightIntensity.value = primaryLightSource.intensity;
      }
    }
  }

  private updateJets(
    object: RenderableCelestialObject,
    attenuatedLightSources: Map<string, any> | undefined,
  ): void {
    const primaryLightSourceForJets = this.findClosestLightSource(
      object,
      attenuatedLightSources,
    );
    if (primaryLightSourceForJets) {
      this.jets.forEach((jet) => {
        const material = jet.points.material as CometJetMaterial;
        material.uniforms.uLightPosition.value.copy(
          primaryLightSourceForJets.position,
        );
        material.uniforms.uLightColor.value.set(
          primaryLightSourceForJets.color,
        );
        material.uniforms.uLightIntensity.value =
          primaryLightSourceForJets.intensity;
      });
    }
  }

  private calculateActivityFactor(
    object: RenderableCelestialObject,
    attenuatedLightSources: Map<string, any> | undefined,
  ): number {
    const primaryLightSource = this.findClosestLightSource(
      object,
      attenuatedLightSources,
    );
    if (!primaryLightSource) return 0;

    // Store light position in a dedicated vector to avoid temp vector conflicts
    const lightPosition = new THREE.Vector3().copy(primaryLightSource.position);
    const cometPosition = this._tempVector1.copy(object.position);
    const distanceToLight = cometPosition.distanceTo(lightPosition);

    const activityDistance = 2 * SCALE.RENDER_SCALE_AU;
    let activityFactor =
      1.0 - THREE.MathUtils.smoothstep(distanceToLight, 0, activityDistance);

    // An extinct comet (activity = 0) has no activity, so no coma or tail.
    const properties = object.properties as CometProperties;
    if (properties.activity === 0) {
      activityFactor = 0.0;
    }

    return activityFactor;
  }

  private updateNucleusRotation(
    object: RenderableCelestialObject,
    deltaTime: number,
    activityFactor: number,
  ): void {
    if (this.nucleusAndComaGroup && object.orbit.siderealRotationPeriod_s) {
      // Use the actual rotation period from the comet object
      const rotationSpeed =
        (2 * Math.PI) / object.orbit.siderealRotationPeriod_s;

      // Apply rotation to the group with the correct speed
      // Comets tumble, so we rotate around multiple axes
      this.nucleusAndComaGroup.rotation.y += rotationSpeed * deltaTime;
      this.nucleusAndComaGroup.rotation.x += rotationSpeed * 0.25 * deltaTime; // Slight tilt for tumbling effect

      if (this.nucleusAndComaGroup_lod1) {
        this.nucleusAndComaGroup_lod1.rotation.copy(
          this.nucleusAndComaGroup.rotation,
        );
      }
    }
  }

  private updateComa(
    object: RenderableCelestialObject,
    time: number,
    attenuatedLightSources: Map<string, any> | undefined,
    activityFactor: number,
  ): void {
    if (this.comaMaterial) {
      // Skip expensive particle physics when comet is not active (far from star)
      if (activityFactor <= 0) {
        return;
      }
      this.comaMaterial.uniforms.uOpacity.value = activityFactor;
      this.comaMaterial.uniforms.uTime.value = time;
      if (attenuatedLightSources) {
        this.comaMaterial.uniforms.uNumLights.value =
          attenuatedLightSources.size;
        let i = 0;
        for (const lightData of attenuatedLightSources.values()) {
          this.comaMaterial.uniforms.uLights.value[i].position.copy(
            lightData.position,
          );
          this.comaMaterial.uniforms.uLights.value[i].color.copy(
            lightData.color,
          );
          this.comaMaterial.uniforms.uLights.value[i].intensity =
            lightData.intensity ?? 1.0;
          i++;
        }
      }
    }

    if (this.coma) {
      const comaScale = 1.0 + activityFactor * 0.5;
      this.coma.scale.setScalar(comaScale);
      // Coma rotation is now handled by the parent group
      // this.coma.rotation.copy(this.nucleus!.rotation);
      if (this.coma_lod1) {
        this.coma_lod1.scale.setScalar(comaScale);
        // Coma LOD 1 rotation is now handled by the parent group
        // this.coma_lod1.rotation.copy(this.nucleus!.rotation);
      }
    }
  }

  private updateParticleTailPhysics(
    deltaTime: number,
    activityFactor: number,
    object: RenderableCelestialObject,
    attenuatedLightSources: Map<string, any> | undefined,
  ): void {
    if (
      !this.particleTail ||
      !this.particleGeometry ||
      !this.particlePositions ||
      !this.particleAttributes
    ) {
      return;
    }

    // Skip expensive particle physics when comet is not active (far from star)
    if (activityFactor <= 0) {
      return;
    }

    const properties = object.properties as CometProperties;
    const primaryLightSource = this.findClosestLightSource(
      object,
      attenuatedLightSources,
    );
    if (!primaryLightSource) return;

    const lightPosition = new THREE.Vector3().copy(primaryLightSource.position);
    const cometPosition = this._tempVector1.copy(object.position);
    const tailDirection = this._tempVector2
      .subVectors(cometPosition, lightPosition)
      .normalize();

    this.updateExistingParticles(deltaTime, activityFactor);
    this.emitNewParticles(activityFactor, object, properties, tailDirection);

    this.particleGeometry.attributes.position.needsUpdate = true;
    this.particleGeometry.attributes.size.needsUpdate = true;
    this.particleGeometry.attributes.alpha.needsUpdate = true;
  }

  private updateExistingParticles(
    deltaTime: number,
    activityFactor: number,
  ): void {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (this.particleAttributes!.lifetime[i] > 0) {
        this.particleAttributes!.lifetime[i] -= deltaTime;

        if (this.particleAttributes!.lifetime[i] <= 0) {
          this.particleAttributes!.lifetime[i] = -1.0; // Kill particle
          this.particlePositions![i * 3 + 0] = 0; // Hide it
          continue;
        }

        const velocity = this.particleAttributes!.velocity[i];
        this.particlePositions![i * 3 + 0] += velocity.x * deltaTime;
        this.particlePositions![i * 3 + 1] += velocity.y * deltaTime;
        this.particlePositions![i * 3 + 2] += velocity.z * deltaTime;

        this.particleAttributes!.alpha[i] =
          (this.particleAttributes!.lifetime[i] / PARTICLE_LIFETIME) *
          activityFactor;
      }
    }
  }

  private emitNewParticles(
    activityFactor: number,
    object: RenderableCelestialObject,
    properties: CometProperties,
    tailDirection: THREE.Vector3,
  ): void {
    const particlesToEmit = Math.floor(activityFactor * 20); // Emit more particles when active
    for (let i = 0; i < particlesToEmit; i++) {
      this.lastParticleIndex = (this.lastParticleIndex + 1) % MAX_PARTICLES;
      const pIndex = this.lastParticleIndex;

      // Start particles at the local origin (the nucleus position)
      this.particlePositions![pIndex * 3 + 0] = 0;
      this.particlePositions![pIndex * 3 + 1] = 0;
      this.particlePositions![pIndex * 3 + 2] = 0;

      this.particleAttributes!.lifetime[pIndex] =
        PARTICLE_LIFETIME * (0.5 + this.random() * 0.5);
      this.particleAttributes!.size[pIndex] =
        object.radius * (1.0 + this.random() * 2.0) * (1.0 + activityFactor);

      const tailLength = properties.visualMaxTailLength!;
      // Increase speed with activity to make the tail longer
      const speed =
        (tailLength / PARTICLE_LIFETIME) * 0.5 * (1.0 + activityFactor * 2.0);

      this.particleAttributes!.velocity[pIndex].copy(tailDirection)
        .multiplyScalar(speed * (0.8 + this.random() * 0.4))
        .add(
          this._tempVector3
            .random()
            .subScalar(0.5)
            .multiplyScalar(speed * 0.2), // Add some spread
        );
    }
  }

  private updateJetsPhysics(
    deltaTime: number,
    activityFactor: number,
    object: RenderableCelestialObject,
  ): void {
    if (!this.nucleus || activityFactor <= 0) {
      this.jets.forEach((jet) => {
        jet.points.visible = false;
      });
      return;
    }

    this.jets.forEach((jet) => {
      this.updateJetParticles(jet, deltaTime, activityFactor);
      this.handleJetRepositioning(jet);
      this.emitJetParticles(jet, activityFactor, object);
    });
  }

  private updateJetParticles(
    jet: any,
    deltaTime: number,
    activityFactor: number,
  ): void {
    // Update existing particles
    const positions = jet.geometry.getAttribute("position")
      .array as Float32Array;
    for (let i = 0; i < jet.attributes.velocity.length; i++) {
      if (jet.attributes.lifetime[i] > 0) {
        jet.attributes.lifetime[i] -= deltaTime;
        if (jet.attributes.lifetime[i] <= 0) {
          jet.attributes.lifetime[i] = -1.0;
          continue;
        }

        const velocity = jet.attributes.velocity[i];
        positions[i * 3 + 0] += velocity.x * deltaTime;
        positions[i * 3 + 1] += velocity.y * deltaTime;
        positions[i * 3 + 2] += velocity.z * deltaTime;

        jet.attributes.alpha[i] =
          (jet.attributes.lifetime[i] / (PARTICLE_LIFETIME * 0.2)) *
          activityFactor;
      }
    }
  }

  private handleJetRepositioning(jet: any): void {
    jet.repositionTimer -= this.clock.getDelta();
    if (jet.repositionTimer <= 0) {
      jet.repositionTimer = 3.0 + this.random() * 4.0; // Reposition every 3-7 seconds
      const nucleusGeom = this.nucleus!.geometry;
      const positionAttribute = nucleusGeom.getAttribute("position");
      const normalAttribute = nucleusGeom.getAttribute("normal");
      const randomIndex = Math.floor(this.random() * positionAttribute.count);

      jet.emissionPoint = new THREE.Vector3().fromBufferAttribute(
        positionAttribute,
        randomIndex,
      );
      jet.emissionNormal = new THREE.Vector3().fromBufferAttribute(
        normalAttribute,
        randomIndex,
      );
    }
  }

  private emitJetParticles(
    jet: any,
    activityFactor: number,
    object: RenderableCelestialObject,
  ): void {
    if (!jet.emissionPoint || !jet.emissionNormal) return;

    // Emit new particles
    const particlesToEmit = Math.floor(activityFactor * 5); // Fewer particles than the main tail
    for (let i = 0; i < particlesToEmit; i++) {
      jet.lastParticleIndex =
        (jet.lastParticleIndex + 1) % jet.attributes.velocity.length;
      const pIndex = jet.lastParticleIndex;

      // Start particles at the emission point on the nucleus surface
      const positions = jet.geometry.getAttribute("position")
        .array as Float32Array;
      positions[pIndex * 3 + 0] = jet.emissionPoint.x;
      positions[pIndex * 3 + 1] = jet.emissionPoint.y;
      positions[pIndex * 3 + 2] = jet.emissionPoint.z;

      jet.attributes.lifetime[pIndex] =
        PARTICLE_LIFETIME * 0.2 * (0.5 + this.random() * 0.5); // Shorter lifetime
      jet.attributes.size[pIndex] =
        object.radius * (0.5 + this.random() * 1.0) * (1.0 + activityFactor);

      const speed = 20 * (1.0 + activityFactor);

      jet.attributes.velocity[pIndex]
        .copy(jet.emissionNormal)
        .multiplyScalar(speed * (0.8 + this.random() * 0.4))
        .add(
          this._tempVector3
            .random()
            .subScalar(0.5)
            .multiplyScalar(speed * 0.3),
        ); // Add some spread
    }

    jet.geometry.attributes.position.needsUpdate = true;
    jet.geometry.attributes.size.needsUpdate = true;
    jet.geometry.attributes.alpha.needsUpdate = true;
  }

  private _createJets(object: RenderableCelestialObject): void {
    const NUM_JETS = 3;
    const MAX_JET_PARTICLES = 200;

    for (let i = 0; i < NUM_JETS; i++) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(MAX_JET_PARTICLES * 3);
      const attributes = {
        size: new Float32Array(MAX_JET_PARTICLES),
        alpha: new Float32Array(MAX_JET_PARTICLES),
        lifetime: new Float32Array(MAX_JET_PARTICLES),
        velocity: Array.from(
          { length: MAX_JET_PARTICLES },
          () => new THREE.Vector3(),
        ),
      };

      for (let p = 0; p < MAX_JET_PARTICLES; p++) {
        attributes.lifetime[p] = -1.0; // Init as dead
      }

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3),
      );
      geometry.setAttribute(
        "size",
        new THREE.BufferAttribute(attributes.size, 1),
      );
      geometry.setAttribute(
        "alpha",
        new THREE.BufferAttribute(attributes.alpha, 1),
      );

      // Reuse the same material as the main tail
      const particleMaterial = new CometJetMaterial({
        color: new THREE.Color(
          (object.properties as CometProperties).visualTailColor || "#ffffff",
        ),
      });
      this.registerMaterial(`comet-jet-${i}-${object.id}`, particleMaterial);

      const points = new THREE.Points(geometry, particleMaterial);
      points.name = `comet-jet-${i}-${object.id}-points`;

      this.jets.push({
        points,
        geometry,
        attributes,
        lastParticleIndex: 0,
        repositionTimer: this.random() * 5, // Stagger repositioning
      });
    }
  }
}
