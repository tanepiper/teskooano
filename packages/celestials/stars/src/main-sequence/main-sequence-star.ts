import * as THREE from "three";
import type { StarProperties } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../base/base-star";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  GeometryUtilities,
  LightSourcesMap,
} from "@teskooano/renderer-threejs-celestial";
import { EnhancedStarMaterial } from "../materials/enhanced-star.material";

/**
 * Material for main sequence stars with shader effects
 */
export class MainSequenceStarMaterial extends EnhancedStarMaterial {
  constructor(
    object: RenderableCelestialObject,
    color: THREE.Color = new THREE.Color(0xffff00),
  ) {
    super(object, color);
  }
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
    if (this.materialCache.has(object.id)) {
      return this.materialCache.get(object.id)!;
    }
    const color = this.getStarColor(object);
    const material = new MainSequenceStarMaterial(
      object,
      color,
    ) as TMainSequenceMaterial;
    this.materialCache.set(object.id, material);
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
    mesh.name = `${object.id}-body`;

    const group = new THREE.Group();
    group.name = `${object.id}-high-lod-group`;
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
    mediumMesh.name = `${object.id}-medium-lod`;
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
