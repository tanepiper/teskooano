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

    // EXTREME intensity - white dwarfs are incredibly bright despite small size
    // Using massive values for that Michael Bay over-the-top effect
    const mainIntensity = 50000000; // 50 million
    const ringIntensity = 30000000; // 30 million
    const verticalIntensity = 25000000; // 25 million

    // Main intense point light at the center - NO DECAY for maximum brightness
    const mainLight = new THREE.PointLight(color, mainIntensity, 0, 0);
    mainLight.name = `${object.id}-main-light`;
    mainLight.castShadow = false;
    group.add(mainLight);
    this.intenseLights.push(mainLight);

    // Additional lights for dramatic Michael Bay-style omnidirectional glow
    const additionalLightCount = 8; // More lights for more intensity
    const lightDistance = object.radius * 3;

    for (let i = 0; i < additionalLightCount; i++) {
      const angle = (i / additionalLightCount) * Math.PI * 2;
      const x = Math.cos(angle) * lightDistance;
      const z = Math.sin(angle) * lightDistance;

      // Minimal decay for maximum reach
      const light = new THREE.PointLight(color, ringIntensity, 0, 0.5);
      light.position.set(x, 0, z);
      light.name = `${object.id}-intense-light-${i}`;
      light.castShadow = false;
      group.add(light);
      this.intenseLights.push(light);
    }

    // Top and bottom lights for complete coverage - MAXIMUM INTENSITY
    const verticalLight1 = new THREE.PointLight(
      color,
      verticalIntensity,
      0,
      0.5,
    );
    verticalLight1.position.set(0, lightDistance * 2, 0);
    verticalLight1.name = `${object.id}-top-light`;
    verticalLight1.castShadow = false;
    group.add(verticalLight1);
    this.intenseLights.push(verticalLight1);

    const verticalLight2 = new THREE.PointLight(
      color,
      verticalIntensity,
      0,
      0.5,
    );
    verticalLight2.position.set(0, -lightDistance * 2, 0);
    verticalLight2.name = `${object.id}-bottom-light`;
    verticalLight2.castShadow = false;
    group.add(verticalLight2);
    this.intenseLights.push(verticalLight2);

    // Add diagonal lights for even MORE intensity coverage
    const diagonalIntensity = 20000000; // 20 million
    const diagonalDistance = lightDistance * 1.5;

    // Four diagonal lights forming a 3D cross pattern
    const diagonalLight1 = new THREE.PointLight(
      color,
      diagonalIntensity,
      0,
      0.5,
    );
    diagonalLight1.position.set(diagonalDistance, diagonalDistance, 0);
    diagonalLight1.name = `${object.id}-diagonal-light-1`;
    diagonalLight1.castShadow = false;
    group.add(diagonalLight1);
    this.intenseLights.push(diagonalLight1);

    const diagonalLight2 = new THREE.PointLight(
      color,
      diagonalIntensity,
      0,
      0.5,
    );
    diagonalLight2.position.set(-diagonalDistance, diagonalDistance, 0);
    diagonalLight2.name = `${object.id}-diagonal-light-2`;
    diagonalLight2.castShadow = false;
    group.add(diagonalLight2);
    this.intenseLights.push(diagonalLight2);

    const diagonalLight3 = new THREE.PointLight(
      color,
      diagonalIntensity,
      0,
      0.5,
    );
    diagonalLight3.position.set(diagonalDistance, -diagonalDistance, 0);
    diagonalLight3.name = `${object.id}-diagonal-light-3`;
    diagonalLight3.castShadow = false;
    group.add(diagonalLight3);
    this.intenseLights.push(diagonalLight3);

    const diagonalLight4 = new THREE.PointLight(
      color,
      diagonalIntensity,
      0,
      0.5,
    );
    diagonalLight4.position.set(-diagonalDistance, -diagonalDistance, 0);
    diagonalLight4.name = `${object.id}-diagonal-light-4`;
    diagonalLight4.castShadow = false;
    group.add(diagonalLight4);
    this.intenseLights.push(diagonalLight4);
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
