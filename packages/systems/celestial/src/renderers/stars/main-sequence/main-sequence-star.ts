import * as THREE from "three";
import type { StarProperties } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import type { CelestialMeshOptions } from "../../base";
import { BaseCelestialRendererOptions } from "../../base";

/**
 * Material for main sequence stars with shader effects
 */
export class MainSequenceStarMaterial extends BaseStarMaterial {
  // The constructor is inherited from BaseStarMaterial
}

/**
 * Main sequence star renderer
 */
export class MainSequenceStarRenderer extends BaseStarRenderer {
  private materialCache: Map<string, MainSequenceStarMaterial> = new Map();

  constructor(options: BaseCelestialRendererOptions = {}) {
    super(options);
  }

  /**
   * Returns the appropriate material for a main sequence star
   */
  public getMaterial(object: RenderableCelestialObject): BaseStarMaterial {
    if (this.materialCache.has(object.celestialObjectId)) {
      return this.materialCache.get(object.celestialObjectId)!;
    }
    const color = this.getStarColor(object);
    const material = new MainSequenceStarMaterial(color);
    this.materialCache.set(object.celestialObjectId, material);
    return material;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const material = this.getMaterial(object);
    const segments = this.getSegmentsForDetailLevel(options?.detailLevel);
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.celestialObjectId}-body`;

    const group = new THREE.Group();
    group.add(mesh);
    this._addCoronaToGroup(object, group);

    // Main sequence stars can have a simpler medium LOD
    const mediumSegments = this.getSegmentsForDetailLevel("medium");
    const mediumGeometry = new THREE.SphereGeometry(
      object.radius,
      mediumSegments,
      mediumSegments,
    );
    const mediumMesh = new THREE.Mesh(mediumGeometry, material);
    const mediumGroup = new THREE.Group();
    mediumGroup.add(mediumMesh);

    return [
      { object: group, distance: 0 },
      { object: mediumGroup, distance: object.radius * 10 },
    ];
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    return object.radius * 200;
  }

  /**
   * Get the star color based on its properties
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    const properties = star.properties as StarProperties;

    if (properties && properties.color) {
      return new THREE.Color(properties.color);
    }

    return new THREE.Color(0xffcc00);
  }
}
