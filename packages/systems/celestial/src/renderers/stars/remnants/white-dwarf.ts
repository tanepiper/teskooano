import * as THREE from "three";
import {
  RemnantStarRenderer,
  RemnantStarMaterial,
} from "./remnant-star-renderer";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { LODLevel } from "../../index";
import { SCALE } from "@teskooano/data-types";
import type {
  CelestialMeshOptions,
  LightSourceData,
} from "../../common/CelestialRenderer";

// Import shaders using Vite's ?raw syntax
import whiteDwarfAuraVertexShader from "../../../shaders/star/remnants/white-dwarf/white_dwarf_aura.vert.glsl";
import whiteDwarfAuraFragmentShader from "../../../shaders/star/remnants/white-dwarf/white_dwarf_aura.frag.glsl";

/**
 * Material for White Dwarf stars.
 */
export class WhiteDwarfMaterial extends RemnantStarMaterial {
  constructor(color: THREE.Color = new THREE.Color(0xe0e0ff)) {
    super({
      starColor: color, // Very hot, white to bluish-white
      coronaIntensity: 0.02, // Minimal corona, reduced to make aura more visible
      pulseSpeed: 0.01, // Very stable
      glowIntensity: 0.3, // Intense but small, reduced for aura
      temperatureVariation: 0.05, // Relatively uniform surface
      metallicEffect: 0.0,
    });
  }
}

/**
 * Renderer for White Dwarf stars - dense remnants of low-to-medium mass stars.
 */
export class WhiteDwarfRenderer extends RemnantStarRenderer {
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ) {
    super(object, options);
  }

  protected getMaterial(
    object: RenderableCelestialObject,
  ): RemnantStarMaterial {
    const color = this.getStarColor(object);
    return new WhiteDwarfMaterial(color);
  }

  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    // Based on temperature, but typically very hot and white/blue
    // For simplicity, a default white-blue.
    // Could use object.properties.temperature if available.
    return new THREE.Color(0xe0e0ff);
  }

  /**
   * White dwarfs typically don't have prominent effect layers like disks or jets.
   * A very young one might have a fading planetary nebula, but we'll keep it simple for now.
   */
  protected getEffectLayer(
    object: RenderableCelestialObject,
    mainStarGroup: THREE.Group,
  ): THREE.Object3D | null {
    const starRadius = object.radius || 0.05; // White dwarfs are small
    const auraRadius = starRadius * 1.5; // Aura slightly larger than the star

    const auraGeometry = new THREE.SphereGeometry(auraRadius, 32, 32);
    const auraMaterial = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0.0 },
        glowColor: { value: new THREE.Color(0xadc8ff) }, // Pale blue glow
        glowIntensity: { value: 0.3 },
      },
      vertexShader: whiteDwarfAuraVertexShader,
      fragmentShader: whiteDwarfAuraFragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      side: THREE.BackSide, // Render on the inside for a halo effect
    });

    this.effectMaterials.set(`${object.celestialObjectId}-aura`, auraMaterial);

    const auraMesh = new THREE.Mesh(auraGeometry, auraMaterial);
    auraMesh.name = `${object.celestialObjectId}-aura`;

    // Ensure the aura is part of the main star group for transformations
    // mainStarGroup.add(auraMesh); // This should be handled by the base class when returning the mesh
    return auraMesh;
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    const scale = typeof SCALE === "number" ? SCALE : 1;
    return 10 * scale; // White dwarfs are small and faint from afar
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const scale = typeof SCALE === "number" ? SCALE : 1;

    // White dwarfs are small, so segments can be lower by default
    const highDetailGroup = this._createHighDetailGroup(object, {
      ...options,
      segments: options?.segments ?? 48,
    });
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    // Medium detail: just a slightly simpler sphere, as they are not complex visually.
    const mediumStarOnlyGroup = super._createHighDetailGroup(object, {
      ...options,
      segments: options?.segments ?? 48,
    });
    // No effect layer to remove for white dwarfs as per current getEffectLayer
    mediumStarOnlyGroup.name = `${object.celestialObjectId}-medium-lod`;
    const level1: LODLevel = {
      object: mediumStarOnlyGroup,
      distance: 5 * scale,
    };

    return [level0, level1];
  }

  update(
    time: number,
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera);

    const auraMaterial = this.effectMaterials.get(
      `${this.object.celestialObjectId}-aura`,
    );
    if (auraMaterial && auraMaterial instanceof THREE.ShaderMaterial) {
      auraMaterial.uniforms.time.value = this.elapsedTime;
    }
  }
}
