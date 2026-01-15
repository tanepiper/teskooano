import * as THREE from "three";
import type { StarProperties } from "@teskooano/data-types";
import { BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-celestial";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  GeometryUtilities,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import { RealisticStarMaterial } from "../materials/realistic-star.material";

/**
 * Main sequence star renderer
 * Uses volumetric ray-marching material for realistic appearance
 */
export class MainSequenceStarRenderer extends BaseStarRenderer<RealisticStarMaterial> {
  private materialCache: Map<string, RealisticStarMaterial> = new Map();

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  /**
   * Returns the appropriate material for a main sequence star
   */
  protected createMaterial(
    object: RenderableCelestialObject<StarProperties>,
  ): RealisticStarMaterial {
    if (this.materialCache.has(object.id)) {
      return this.materialCache.get(object.id)!;
    }
    const color = this.getStarColor(object);
    const material = new RealisticStarMaterial(object, color);
    this.materialCache.set(object.id, material);
    return material;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject<StarProperties>,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const material = this.createAndRegisterMaterial(object);

    // The volumetric shader needs a volume to render within.
    // The provided example uses a box that is much larger than the star radius.
    // Box size 20 for radius 4 -> 5x radius.
    const boxSize = object.radius * 5.0;
    const geometry = new THREE.BoxGeometry(boxSize, boxSize, boxSize);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.id}-body-volume`;

    const group = new THREE.Group();
    group.name = `${object.id}-high-lod-group`;
    group.add(mesh);

    // Legacy corona layers are explicitly removed.
    // The shader handles all corona/glow effects internally.

    // Medium LOD also uses the box volume
    const mediumMesh = new THREE.Mesh(geometry, material);
    mediumMesh.name = `${object.id}-medium-lod-volume`;
    const mediumGroup = new THREE.Group();
    mediumGroup.name = `${object.id}-medium-lod-group`;
    mediumGroup.add(mediumMesh);

    return [
      { object: group, distance: 0 },
      { object: mediumGroup, distance: object.radius * 100 },
    ];
  }

  protected getBillboardLODDistance(
    object: RenderableCelestialObject<StarProperties>,
  ): number {
    return object.radius * 2000;
  }

  /**
   * Get the star color based on its properties
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

    return new THREE.Color(0xffcc00);
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
}
