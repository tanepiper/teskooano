import * as THREE from "three";
import {
  PostMainSequenceStarRenderer,
  PostMainSequenceStarMaterial,
} from "./post-main-sequence-star-renderer";
import { CoronaMaterial } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { AU_METERS, SCALE } from "@teskooano/data-types";
import type { CelestialMeshOptions } from "../../common/CelestialRenderer";

/**
 * Material for red giant stars.
 * This class now primarily passes red-giant-specific parameters to the shared PostMainSequenceStarMaterial.
 */
export class RedGiantMaterial extends PostMainSequenceStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xff6633)) {
    super({
      starColor: color,
      coronaIntensity: 0.6, // Adjusted for red giant characteristics
      pulseSpeed: 0.05, // Slower pulse for larger stars
      glowIntensity: 1.0,
      temperatureVariation: 0.5, // More surface variation
      metallicEffect: 0.1, // Less pronounced metallic effect for cooler, larger stars
    });
  }
}

/**
 * Renderer for red giant stars - evolved stars with expanded, cooler envelopes
 * Characteristics:
 * - Large, cool, red appearance
 * - Variable brightness due to pulsations
 * - Large convection cells on surface
 * - Strong infrared emission
 * - Precursors to white dwarfs for lower-mass stars
 */
export class RedGiantRenderer extends PostMainSequenceStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): PostMainSequenceStarMaterial {
    const color = this.getStarColor(object);
    return new RedGiantMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Red giants are, as the name suggests, red
    return new THREE.Color(0xff3300);
  }

  /**
   * Override billboard size calculation for red giants.
   * Red giants can be quite large, requiring custom scaling.
   *
   * @param object The renderable celestial object
   * @returns The calculated sprite size for billboard rendering
   */
  protected override calculateBillboardSize(
    object: RenderableCelestialObject,
  ): number {
    // For red giants, scale based on radius
    const starRadius_AU = object.radius / AU_METERS;

    // Scale based on radius in AU
    const minSpriteSize = 0.1; // Slightly smaller minimum
    const maxSpriteSize = 0.6; // Smaller maximum for red giants

    // Linear scaling with modest exponential component
    const calculatedSpriteSize = 0.1 + starRadius_AU * 0.12;

    return Math.max(
      minSpriteSize,
      Math.min(maxSpriteSize, calculatedSpriteSize),
    );
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    // Adjust distance based on star size to make transition smoother
    const AU_IN_METERS = 149597870700; // 1 AU in meters
    const starRadius_AU = object.radius / AU_IN_METERS;
    const sizeBasedDistance = 40000 + starRadius_AU * 2000;
    return Math.min(60000, sizeBasedDistance) * scale;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 192, // Custom high detail for Red Giant
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: 96, // Custom medium detail for Red Giant
    });
    mediumDetailGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 1500 * scale, // Adjusted medium detail distance
    };

    return [level0, level1];
  }

  protected addCorona(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    // Enhanced corona due to stellar wind mass loss
    super.addCorona(object, group);

    // Add additional mass loss envelope using standard corona approach
    const starColor = this.getStarColor(object);
    const existingMaterials =
      this.coronaMaterials.get(object.celestialObjectId) || [];

    const massLossRadius = object.radius * 2.5;
    const massLossGeometry = new THREE.SphereGeometry(massLossRadius, 96, 96);

    // CoronaMaterial constructor expects: color, options, vertexShader, fragmentShader
    const massLossMaterial = new CoronaMaterial(
      new THREE.Color(0x441100), // Darker, dustier color for mass loss
      {
        scale: 2.5,
        opacity: 0.03,
        pulseSpeed: 0.1, // Slightly different pulse for this layer
        noiseScale: 1.5, // Different noise characteristics
      },
      this.getCoronaVertexShader(object), // Use the shared (simple) vertex shader
      this.getCoronaFragmentShader(object), // Use the shared corona fragment shader
    );

    existingMaterials.push(massLossMaterial);
    this.coronaMaterials.set(object.celestialObjectId, existingMaterials); // Ensure the map is updated
    const massLossMesh = new THREE.Mesh(massLossGeometry, massLossMaterial);
    massLossMesh.name = `${object.celestialObjectId}-mass-loss-envelope`;
    group.add(massLossMesh);
  }
}
