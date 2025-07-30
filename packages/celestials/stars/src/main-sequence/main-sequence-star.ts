import * as THREE from "three";
import type { StarProperties } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for main sequence stars with shader effects
 */
export class MainSequenceStarMaterial extends BaseStarMaterial {
  // The constructor is inherited from BaseStarMaterial
}

/**
 * Main sequence star renderer
 * @template TMainSequenceMaterial The specific main sequence star material type this renderer works with
 */
export class MainSequenceStarRenderer<
  TMainSequenceMaterial extends
    MainSequenceStarMaterial = MainSequenceStarMaterial,
> extends BaseStarRenderer<TMainSequenceMaterial> {
  private materialCache: Map<string, TMainSequenceMaterial> = new Map();

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
  ): TMainSequenceMaterial {
    if (this.materialCache.has(object.celestialObjectId)) {
      return this.materialCache.get(object.celestialObjectId)!;
    }
    const color = this.getStarColor(object);
    const material = new MainSequenceStarMaterial(
      color,
    ) as TMainSequenceMaterial;
    this.materialCache.set(object.celestialObjectId, material);
    return material;
  }

  protected getCustomLODs(
    object: RenderableCelestialObject<StarProperties>,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const material = this.createAndRegisterMaterial(object);
    const segments = GeometryUtilities.getOptimizedStarSegments(
      options?.detailLevel,
      64,
    );
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.celestialObjectId}-body`;

    const group = new THREE.Group();
    group.name = `${object.celestialObjectId}-high-lod-group`;
    group.add(mesh);
    this._addCoronaToGroup(object, group);

    // Main sequence stars can have a simpler medium LOD
    const mediumSegments = GeometryUtilities.getOptimizedStarSegments(
      "medium",
      32,
    );
    const mediumGeometry = new THREE.SphereGeometry(
      object.radius,
      mediumSegments,
      mediumSegments,
    );
    const mediumMesh = new THREE.Mesh(mediumGeometry, material);
    mediumMesh.name = `${object.celestialObjectId}-medium-lod`;
    const mediumGroup = new THREE.Group();
    mediumGroup.name = `${object.celestialObjectId}-medium-lod-group`;
    mediumGroup.add(mediumMesh);

    return [
      { object: group, distance: 0 },
      { object: mediumGroup, distance: object.radius * 100 },
    ];
  }

  protected getBillboardLODDistance(
    object: RenderableCelestialObject<StarProperties>,
  ): number {
    // Make billboards much more distant to avoid occlusion issues
    // Only use billboards when objects are truly far away
    return object.radius * 2000; // Increased from 500
  }

  /**
   * Get the star color based on its properties
   */
  protected getStarColor(
    star: RenderableCelestialObject<StarProperties>,
  ): THREE.Color {
    const properties = star.properties!;

    if (properties && properties.color) {
      return new THREE.Color(properties.color);
    }

    return new THREE.Color(0xffcc00);
  }
}
