import * as THREE from "three";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  CometProperties,
  RenderableCelestialObject,
  SCALE,
} from "@teskooano/data-types";
import {
  BaseCelestialRenderer,
  CelestialMeshOptions,
  LightSourcesMap,
} from "../base";
import {
  CometComaMaterial,
  CometNucleusMaterial,
  CometParticleMaterial,
  CometSimplifiedTailMaterial,
} from "./material";
import { SimplexNoise } from "three/examples/jsm/math/SimplexNoise.js";

const MAX_PARTICLES = 12000;
const PARTICLE_LIFETIME = 5.0; // seconds

export class CometRenderer extends BaseCelestialRenderer {
  private nucleus?: THREE.Mesh;
  private coma?: THREE.Mesh;
  private particleTail?: THREE.Points;
  private particleGeometry?: THREE.BufferGeometry;
  private particlePositions?: Float32Array;
  private particleAttributes?: {
    size: Float32Array;
    alpha: Float32Array;
    lifetime: Float32Array;
    velocity: THREE.Vector3[];
  };
  private comaMaterial?: CometComaMaterial;
  private simplifiedTail?: THREE.Mesh;
  private simplifiedTailMaterial?: CometSimplifiedTailMaterial;
  private lastParticleIndex = 0;
  private clock = new THREE.Clock();
  private noise = new SimplexNoise();

  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    this.createNucleus(object);
    this.createComa(object);
    this.createParticleTail(object);
    this.createSimplifiedTail(object);

    // LOD 0: High detail with particle tail
    const lod0_container = new THREE.Group();
    lod0_container.add(this.nucleus!);
    lod0_container.add(this.coma!);
    lod0_container.add(this.particleTail!);

    // LOD 1: Lower detail with simplified mesh tail
    const lod1_container = new THREE.Group();
    const nucleus_lod1 = this.nucleus!.clone(false); // Clone geometry/material but not children
    lod1_container.add(nucleus_lod1);
    lod1_container.add(this.coma!.clone(false));
    lod1_container.add(this.simplifiedTail!);

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

  private createNucleus(object: RenderableCelestialObject): void {
    // Nucleus
    const nucleusGeometry = new THREE.BoxGeometry(1, 1, 1, 32, 32, 32);

    // Add procedural displacement to make it irregular
    const positionAttribute = nucleusGeometry.getAttribute("position");
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);

      // Spherify the cube
      const normalizedVertex = vertex.clone().normalize();

      // Get noise value
      const noiseFrequency = 2.0;
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

    const nucleusMaterial = new CometNucleusMaterial({
      color: new THREE.Color(0x96693d), // A brownish, rocky color
    });
    this.nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    this.registerMaterial(
      `comet-nucleus-${object.celestialObjectId}`,
      nucleusMaterial,
    );
  }

  private createComa(object: RenderableCelestialObject): void {
    const properties = object.properties as CometProperties;
    if (properties.visualComaRadius && properties.visualComaColor) {
      this.comaMaterial = new CometComaMaterial({
        color: new THREE.Color(properties.visualComaColor),
        opacity: 0,
      });
      this.registerMaterial(
        `comet-coma-${object.celestialObjectId}`,
        this.comaMaterial,
      );

      const comaGeometry = new THREE.SphereGeometry(
        properties.visualComaRadius,
        32,
        32,
      );
      this.coma = new THREE.Mesh(comaGeometry, this.comaMaterial);
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
        color: new THREE.Color(properties.visualTailColor),
      });

      this.particleTail = new THREE.Points(
        this.particleGeometry,
        particleMaterial,
      );
      this.registerMaterial(
        `comet-tail-${object.celestialObjectId}`,
        particleMaterial,
      );
    }
  }

  private createSimplifiedTail(object: RenderableCelestialObject): void {
    const properties = object.properties as CometProperties;
    const tailLength =
      properties.visualMaxTailLength || 2 * SCALE.RENDER_SCALE_AU;
    const tailColor = properties.visualTailColor || "#ffffff";

    this.simplifiedTailMaterial = new CometSimplifiedTailMaterial({
      color: new THREE.Color(tailColor),
      opacity: 1.0,
    });
    this.registerMaterial(
      `comet-simple-tail-${object.celestialObjectId}`,
      this.simplifiedTailMaterial,
    );

    const tailWidth = object.radius * 20;
    const tailGeometry = new THREE.PlaneGeometry(tailWidth, tailLength, 1, 20);
    // Anchor the plane at its base so it extends from the nucleus
    tailGeometry.translate(0, tailLength / 2, 0);

    this.simplifiedTail = new THREE.Mesh(
      tailGeometry,
      this.simplifiedTailMaterial,
    );
  }

  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
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

    const primaryLightSource = this.findPrimaryLightSource(
      object,
      lightSources,
    );
    if (!primaryLightSource) return;

    if (this.nucleus) {
      const material = this.nucleus.material as CometNucleusMaterial;
      material.uniforms.uLightPosition.value.copy(primaryLightSource.position);
      material.uniforms.uLightColor.value.set(primaryLightSource.color);
      material.uniforms.uLightIntensity.value = primaryLightSource.intensity;
    }

    const deltaTime = this.clock.getDelta();

    // Calculate distance to the sun
    const lightPosition = this._tempVector1.set(
      primaryLightSource.position.x,
      primaryLightSource.position.y,
      primaryLightSource.position.z,
    );
    const cometPosition = this._tempVector2.copy(object.position);
    const distanceToLight = cometPosition.distanceTo(lightPosition);

    const activityDistance = 2 * SCALE.RENDER_SCALE_AU;
    const activityFactor =
      1.0 - THREE.MathUtils.smoothstep(distanceToLight, 0, activityDistance);

    // Update Coma
    if (this.comaMaterial) {
      this.comaMaterial.uniforms.uOpacity.value = activityFactor * 0.8;
      this.comaMaterial.uniforms.uTime.value = time;
    }

    // Update Simplified Tail
    if (this.simplifiedTailMaterial) {
      this.simplifiedTailMaterial.uniforms.uTime.value = time;
      this.simplifiedTailMaterial.uniforms.uOpacity.value = activityFactor;
    }
    if (this.simplifiedTail) {
      const tailDirection = this._tempVector3
        .subVectors(cometPosition, lightPosition)
        .normalize();

      // Align the tail's Y-axis with the direction away from the sun
      this.simplifiedTail.quaternion.setFromUnitVectors(
        this._tempVector1.set(0, 1, 0),
        tailDirection,
      );
    }

    // Update Particle Tail
    if (
      this.particleTail &&
      this.particleGeometry &&
      this.particlePositions &&
      this.particleAttributes
    ) {
      const properties = object.properties as CometProperties;
      const tailDirection = this._tempVector3
        .subVectors(cometPosition, lightPosition)
        .normalize();

      // Update existing particles
      for (let i = 0; i < MAX_PARTICLES; i++) {
        if (this.particleAttributes.lifetime[i] > 0) {
          this.particleAttributes.lifetime[i] -= deltaTime;

          if (this.particleAttributes.lifetime[i] <= 0) {
            this.particleAttributes.lifetime[i] = -1.0; // Kill particle
            this.particlePositions[i * 3 + 0] = 0; // Hide it
            continue;
          }

          const velocity = this.particleAttributes.velocity[i];
          this.particlePositions[i * 3 + 0] += velocity.x * deltaTime;
          this.particlePositions[i * 3 + 1] += velocity.y * deltaTime;
          this.particlePositions[i * 3 + 2] += velocity.z * deltaTime;

          this.particleAttributes.alpha[i] =
            (this.particleAttributes.lifetime[i] / PARTICLE_LIFETIME) *
            activityFactor;
        }
      }

      // Emit new particles
      const particlesToEmit = Math.floor(activityFactor * 5); // Emit up to 5 particles per frame
      for (let i = 0; i < particlesToEmit; i++) {
        this.lastParticleIndex = (this.lastParticleIndex + 1) % MAX_PARTICLES;
        const pIndex = this.lastParticleIndex;

        // Start particles at the local origin (the nucleus position)
        this.particlePositions[pIndex * 3 + 0] = 0;
        this.particlePositions[pIndex * 3 + 1] = 0;
        this.particlePositions[pIndex * 3 + 2] = 0;

        this.particleAttributes.lifetime[pIndex] =
          PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);
        this.particleAttributes.size[pIndex] =
          object.radius * (1.0 + Math.random() * 2.0);

        const tailLength = properties.visualMaxTailLength!;
        const speed = (tailLength / PARTICLE_LIFETIME) * 0.5; // Spread particles along the tail

        this.particleAttributes.velocity[pIndex]
          .copy(tailDirection)
          .multiplyScalar(speed * (0.8 + Math.random() * 0.4))
          .add(
            this._tempVector1
              .random()
              .subScalar(0.5)
              .multiplyScalar(speed * 0.2), // Add some spread
          );
      }

      this.particleGeometry.attributes.position.needsUpdate = true;
      this.particleGeometry.attributes.size.needsUpdate = true;
      this.particleGeometry.attributes.alpha.needsUpdate = true;
    }
  }
}
