import * as THREE from "three";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import { BaseStarMaterial, BaseStarRenderer } from "../../base/base-star";

import type { LODLevel } from "@teskooano/renderer-threejs-celestial";
import {
  BaseCelestialRendererOptions,
  CelestialMeshOptions,
  LightSourcesMap,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";

/**
 * Material for Wolf-Rayet stars
 * - Temperature: 30,000-200,000 K
 * - Color: Blue-white
 * - Typical mass: 10-25 M☉
 * - Strong stellar winds
 * - Rapidly losing mass
 * - Helium-burning phase
 * - Strong emission lines
 * - Precursor to supernovae
 */
export class WolfRayetMaterial extends BaseStarMaterial {
  constructor(
    object: RenderableCelestialObject,
    options: {
      noiseScale?: number;
      noiseIntensity?: number;
      plasmaTurbulence?: number;
      lightingIntensity?: number;
    } = {},
  ) {
    const blueWhiteColor = new THREE.Color(0xa0c8ff);

    super(blueWhiteColor, {
      noiseScale: options.noiseScale ?? 1.5,
      noiseIntensity: options.noiseIntensity ?? 0.6,
      plasmaTurbulence: options.plasmaTurbulence ?? 0.4,
      lightingIntensity: options.lightingIntensity ?? 1.2,
    });
  }

  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(time, timeScale, lightSources, camera, allObjects, allMeshes);
  }
}

/**
 * Renderer for Wolf-Rayet stars
 */
export class WolfRayetRenderer extends BaseStarRenderer<WolfRayetMaterial> {
  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
  }

  protected getCustomLODs(
    object: RenderableCelestialObject,
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
    group.add(mesh);
    this._addCoronaToGroup(object, group);

    return [{ object: group, distance: 0 }];
  }

  /**
   * Returns the appropriate material for a Wolf-Rayet star
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): WolfRayetMaterial {
    return new WolfRayetMaterial(object);
  }

  protected getBillboardLODDistance(object: RenderableCelestialObject): number {
    return object.radius * 2000;
  }

  /**
   * Wolf-Rayet stars are intense blue-white
   */
  protected getStarColor(star: RenderableCelestialObject): THREE.Color {
    return new THREE.Color(0xa0c8ff);
  }

  /**
   * Override to create more extensive corona for Wolf-Rayet stars
   */
  protected _addCoronaToGroup(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    super._addCoronaToGroup(object, group);

    const radius = object.radius || 1;
    const coronaScale = radius * 5;
    const color = this.getStarColor(object);

    const coronaSegments = GeometryUtilities.getOptimizedStarSegments(
      "medium",
      32,
    );
    const sphereGeometry = new THREE.SphereGeometry(
      coronaScale,
      coronaSegments,
      coronaSegments,
    );

    const stellarWindMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.08,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: true,
    });

    const stellarWindSphere = new THREE.Mesh(
      sphereGeometry,
      stellarWindMaterial,
    );
    stellarWindSphere.name = `${object.id}-stellar-wind`;
    group.add(stellarWindSphere);
  }
}
