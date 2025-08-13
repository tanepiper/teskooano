import * as THREE from "three";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { WhiteDwarfSubtype } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";
/**
 * Material for white dwarf stars with subtype-specific properties
 * - Temperature: 8,000-40,000 K
 * - Color: White to pale blue
 * - Typical mass: 0.5-0.7 M☉
 * - Typical radius: ~0.01 R☉ (Earth-sized)
 * - Very high density
 * - No fusion - cooling remnant of a star
 * - Electron-degenerate matter
 */
export class WhiteDwarfMaterial extends BaseStarMaterial {
  private subtype: WhiteDwarfSubtype;

  constructor(
    subtype: WhiteDwarfSubtype = WhiteDwarfSubtype.DA,
    options: {
      coronaIntensity?: number;
      pulseSpeed?: number;
      glowIntensity?: number;
      temperatureVariation?: number;
      metallicEffect?: number;
    } = {},
  ) {
    // Subtype-specific colors and properties
    let baseColor: THREE.Color;
    let coronaIntensity: number;
    let pulseSpeed: number;
    let glowIntensity: number;
    let temperatureVariation: number;
    let metallicEffect: number;

    switch (subtype) {
      case WhiteDwarfSubtype.DA:
        // Hydrogen-dominated - white with slight blue tint
        baseColor = new THREE.Color(0xf8fcff);
        coronaIntensity = 0.4;
        pulseSpeed = 0.2;
        glowIntensity = 0.7;
        temperatureVariation = 0.05;
        metallicEffect = 0.8;
        break;
      case WhiteDwarfSubtype.DB:
        // Helium-dominated - slightly bluer
        baseColor = new THREE.Color(0xe8f4ff);
        coronaIntensity = 0.3;
        pulseSpeed = 0.1;
        glowIntensity = 0.6;
        temperatureVariation = 0.03;
        metallicEffect = 0.9;
        break;
      case WhiteDwarfSubtype.DC:
        // Featureless spectrum - neutral white
        baseColor = new THREE.Color(0xffffff);
        coronaIntensity = 0.2;
        pulseSpeed = 0.0;
        glowIntensity = 0.5;
        temperatureVariation = 0.01;
        metallicEffect = 0.7;
        break;
      case WhiteDwarfSubtype.DO:
        // Helium-rich with ionized helium - bluish
        baseColor = new THREE.Color(0xd0e8ff);
        coronaIntensity = 0.5;
        pulseSpeed = 0.3;
        glowIntensity = 0.8;
        temperatureVariation = 0.08;
        metallicEffect = 0.85;
        break;
      case WhiteDwarfSubtype.DZ:
        // Metal-rich - slightly reddish
        baseColor = new THREE.Color(0xfff8f0);
        coronaIntensity = 0.25;
        pulseSpeed = 0.05;
        glowIntensity = 0.55;
        temperatureVariation = 0.04;
        metallicEffect = 0.75;
        break;
      case WhiteDwarfSubtype.DQ:
        // Carbon-rich - slightly yellowish
        baseColor = new THREE.Color(0xfffff0);
        coronaIntensity = 0.35;
        pulseSpeed = 0.15;
        glowIntensity = 0.65;
        temperatureVariation = 0.06;
        metallicEffect = 0.8;
        break;
      case WhiteDwarfSubtype.DX:
      default:
        // Unclassified - neutral white
        baseColor = new THREE.Color(0xffffff);
        coronaIntensity = 0.3;
        pulseSpeed = 0.1;
        glowIntensity = 0.6;
        temperatureVariation = 0.02;
        metallicEffect = 0.8;
        break;
    }

    super(baseColor, {
      noiseScale: 0.3,
      noiseIntensity: options.glowIntensity ?? glowIntensity,
      plasmaTurbulence: options.metallicEffect ?? metallicEffect,
      lightingIntensity: 1.0,
    });

    this.subtype = subtype;
  }
}

/**
 * Renderer for white dwarf stars
 */
export class WhiteDwarfRenderer extends BaseStarRenderer<WhiteDwarfMaterial> {
  private material: WhiteDwarfMaterial;
  private subtype: WhiteDwarfSubtype;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions & {
      subtype?: WhiteDwarfSubtype;
    } = {},
  ) {
    super(object, options);
    this.subtype = options?.subtype ?? WhiteDwarfSubtype.DA;
    this.material = new WhiteDwarfMaterial(this.subtype);
  }

  protected createMaterial(
    object: RenderableCelestialObject,
  ): WhiteDwarfMaterial {
    return this.material;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const segments = GeometryUtilities.getOptimizedStarSegments(
      options?.detailLevel,
      64,
    );
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const mesh = new THREE.Mesh(geometry, this.material);
    mesh.name = `${object.id}-body`;

    const group = new THREE.Group();
    group.add(mesh);
    this._addCoronaToGroup(object, group);

    return [{ object: group, distance: 0 }];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    // White dwarfs are small but very bright, so their billboard should appear from further away
    // Increased distance to avoid occlusion issues
    return object.radius * 2000; // Increased from 500
  }

  /**
   * White dwarfs are white with slight blue tint
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xf8fcff);
  }
}
