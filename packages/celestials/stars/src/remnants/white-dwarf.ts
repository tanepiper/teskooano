import * as THREE from "three";
import { BaseStarRenderer } from "../base/base-star";
import { RealisticStarMaterial } from "../materials/realistic-star.material";
import type {
  StarProperties,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import { WhiteDwarfSubtype } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-celestial";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";

/**
 * White dwarf star renderer
 * Uses volumetric ray-marching material with intense omnidirectional lighting
 *
 * Characteristics:
 * - Temperature: 8,000-40,000 K
 * - Color: White to pale blue (subtype-dependent)
 * - Typical mass: 0.5-0.7 M☉
 * - Typical radius: ~0.01 R☉ (Earth-sized)
 * - Very high density (1 million times denser than the Sun)
 * - No fusion - cooling remnant of a star
 * - Electron-degenerate matter
 * - Extremely bright despite small size
 *
 * Subtypes:
 * - DA: Hydrogen-dominated (white with blue tint)
 * - DB: Helium-dominated (bluer)
 * - DC: Featureless spectrum (neutral white)
 * - DO: Helium-rich with ionized helium (bluish)
 * - DZ: Metal-rich (slightly reddish)
 * - DQ: Carbon-rich (slightly yellowish)
 * - DX: Unclassified (neutral white)
 */
export class WhiteDwarfRenderer extends BaseStarRenderer<RealisticStarMaterial> {
  private materialCache: Map<string, RealisticStarMaterial> = new Map();
  private subtype: WhiteDwarfSubtype;
  private intenseLights: THREE.PointLight[] = [];

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions & {
      subtype?: WhiteDwarfSubtype;
    } = {},
  ) {
    super(object, options);
    this.subtype = options?.subtype ?? WhiteDwarfSubtype.DA;
  }

  /**
   * Get subtype-specific color for the white dwarf
   */
  private getSubtypeColor(subtype: WhiteDwarfSubtype): THREE.Color {
    switch (subtype) {
      case WhiteDwarfSubtype.DA:
        return new THREE.Color(0xf8fcff); // White with blue tint
      case WhiteDwarfSubtype.DB:
        return new THREE.Color(0xe8f4ff); // Bluer
      case WhiteDwarfSubtype.DC:
        return new THREE.Color(0xffffff); // Neutral white
      case WhiteDwarfSubtype.DO:
        return new THREE.Color(0xd0e8ff); // Bluish
      case WhiteDwarfSubtype.DZ:
        return new THREE.Color(0xfff8f0); // Slightly reddish
      case WhiteDwarfSubtype.DQ:
        return new THREE.Color(0xfffff0); // Slightly yellowish
      case WhiteDwarfSubtype.DX:
      default:
        return new THREE.Color(0xffffff); // Neutral white
    }
  }

  protected createMaterial(
    object: RenderableCelestialObject<StarProperties>,
  ): RealisticStarMaterial {
    if (this.materialCache.has(object.id)) {
      return this.materialCache.get(object.id)!;
    }
    const color = this.getSubtypeColor(this.subtype);
    const material = new RealisticStarMaterial(object, color);
    this.materialCache.set(object.id, material);
    return material;
  }

  /**
   * Creates intense omnidirectional lighting (Michael Bay style)
   */
  private createIntenseLighting(
    object: RenderableCelestialObject<StarProperties>,
    group: THREE.Group,
  ): void {
    const color = this.getSubtypeColor(this.subtype);

    // High intensity single light - white dwarfs are very bright despite small size
    // Distance limit prevents overpowering other stars in multi-star systems
    const maxLightDistance = object.radius * 1000; // Limit light reach
    const mainIntensity = 8000000; // 8 million - single concentrated light

    // Single intense point light at the center with shadow casting
    // decay=2.0 for physically accurate inverse-square falloff
    const mainLight = new THREE.PointLight(
      color,
      mainIntensity,
      maxLightDistance,
      2.0,
    );
    mainLight.name = `${object.id}-main-light`;
    mainLight.castShadow = true;
    group.add(mainLight);
    this.intenseLights.push(mainLight);
  }

  protected getCustomLODs(
    object: RenderableCelestialObject<StarProperties>,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const material = this.createAndRegisterMaterial(object);

    // Volumetric rendering for white dwarf
    const boxSize = object.radius * 4.0;
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.id}-body-volume`;

    const highLodGroup = new THREE.Group();
    highLodGroup.name = `${object.id}-high-lod-group`;
    highLodGroup.add(mesh);

    // Add intense Michael Bay-style lighting
    this.createIntenseLighting(object, highLodGroup);

    // Medium LOD - simpler volumetric render
    const mediumMesh = new THREE.Mesh(geometry, material);
    mediumMesh.name = `${object.id}-medium-lod-volume`;
    const mediumGroup = new THREE.Group();
    mediumGroup.name = `${object.id}-medium-lod-group`;
    mediumGroup.add(mediumMesh);

    return [
      { object: highLodGroup, distance: 0 },
      { object: mediumGroup, distance: object.radius * 100 },
    ];
  }

  protected getBillboardLODDistance(
    object: RenderableCelestialObject<StarProperties>,
  ): number {
    // White dwarfs are small but very bright, billboard from far away
    return object.radius * 2000;
  }

  /**
   * Get star color based on properties or use subtype default
   */
  protected getStarColor(
    star: RenderableCelestialObject<StarProperties>,
  ): THREE.Color {
    const properties = star.properties!;

    if (properties && properties.color) {
      if (Array.isArray(properties.color)) {
        return new THREE.Color(
          Number(properties.color[0]),
          Number(properties.color[1]),
          Number(properties.color[2]),
        );
      }
      return new THREE.Color(properties.color);
    }

    return this.getSubtypeColor(this.subtype);
  }

  public override update(
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
  }

  public override dispose(): void {
    // Clean up lights
    for (const light of this.intenseLights) {
      light.dispose();
    }
    this.intenseLights = [];

    // Clean up materials
    for (const material of this.materialCache.values()) {
      material.dispose();
    }
    this.materialCache.clear();

    super.dispose();
  }
}
