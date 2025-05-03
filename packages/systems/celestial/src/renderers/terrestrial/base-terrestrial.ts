import {
  PlanetProperties,
  PlanetType,
  ProceduralSurfaceProperties,
  SCALE,
  SurfaceType,
} from "@teskooano/data-types";
import * as THREE from "three";
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from "../index";
import { AtmosphereMaterial } from "./materials/atmosphere.material";
import { CloudMaterial } from "./materials/clouds.material";
import { ProceduralPlanetMaterial } from "./materials/procedural-planet.material";

import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  AtmosphereCloudService,
  AtmosphereMeshResult,
  CloudMeshResult,
} from "./utils/atmosphere-cloud-utils";
import { PlanetMaterialService } from "./utils/planet-material-utils";

const MAX_LIGHTS = 4;

/**
 * Base renderer for terrestrial planets and moons
 */
export class BaseTerrestrialRenderer implements CelestialRenderer {
  protected materials: Map<string, THREE.Material> = new Map();
  protected atmosphereMaterials: Map<string, AtmosphereMaterial> = new Map();
  protected cloudMaterials: Map<string, CloudMaterial> = new Map();
  protected textureLoader: THREE.TextureLoader;

  protected loadedTextures: Map<
    string,
    { color: THREE.Texture | null; normal: THREE.Texture | null }
  > = new Map();
  protected startTime: number = Date.now() / 1000;
  protected elapsedTime: number = 0;
  protected objectIds: Set<string> = new Set();

  private _worldPos = new THREE.Vector3();
  private _lightWorldPos = new THREE.Vector3();
  private _viewLightDir = new THREE.Vector3();

  protected material: ProceduralPlanetMaterial | null = null;
  protected materialService: PlanetMaterialService;
  protected atmosphereCloudService: AtmosphereCloudService;

  constructor() {
    this.textureLoader = new THREE.TextureLoader();
    this.materialService = new PlanetMaterialService();
    this.atmosphereCloudService = new AtmosphereCloudService();
  }

  /**
   * Creates and returns an array of LOD levels for the terrestrial object.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    this.objectIds.add(object.celestialObjectId);

    const baseRadius = object.radius ?? 1;
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(
      object,
      options,
      baseRadius,
    );
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumSegments = 32;
    const mediumGeometry = new THREE.SphereGeometry(
      baseRadius,
      mediumSegments,
      mediumSegments,
    );
    const mediumMaterial = new THREE.MeshStandardMaterial({
      color: this.materialService.getBaseColor(object),
      roughness: 0.8,
      metalness: 0.1,
    });
    const mediumMesh = new THREE.Mesh(mediumGeometry, mediumMaterial);
    mediumMesh.name = `${object.celestialObjectId}-medium-lod`;
    const level1Group = new THREE.Group();
    level1Group.add(mediumMesh);
    const level1: LODLevel = { object: level1Group, distance: 50 * scale };

    const lowSegments = 16;
    const lowGeometry = new THREE.SphereGeometry(
      baseRadius,
      lowSegments,
      lowSegments,
    );
    const lowMaterial = new THREE.MeshBasicMaterial({
      color: this.materialService.getBaseColor(object),
      wireframe: true,
    });
    const lowMesh = new THREE.Mesh(lowGeometry, lowMaterial);
    lowMesh.name = `${object.celestialObjectId}-low-lod`;
    const level2Group = new THREE.Group();
    level2Group.add(lowMesh);
    const level2: LODLevel = { object: level2Group, distance: 200 * scale };

    const levels = [level0, level1, level2];
    return levels;
  }

  /**
   * Helper to create the high-detail group (Level 0 LOD).
   * @internal
   */
  private _createHighDetailGroup(
    object: RenderableCelestialObject,
    options: CelestialMeshOptions | undefined,
    baseRadius: number,
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `${object.celestialObjectId}-high-lod-group`;
    const segments =
      options?.segments ?? (options?.detailLevel === "high" ? 64 : 48);

    let bodyMesh: THREE.Mesh;
    try {
      const bodyMaterial = this.materialService.createMaterial(object);
      this.initializeMaterialMap(object.celestialObjectId, bodyMaterial);
      const bodyGeometry = new THREE.SphereGeometry(
        baseRadius,
        segments,
        segments,
      );
      bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    } catch (error) {
      console.error(
        `[BaseTerrestrialRenderer] Error creating procedural material for ${object.celestialObjectId}:`,
        error,
      );
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.1,
      });
      this.initializeMaterialMap(object.celestialObjectId, fallbackMaterial);
      const bodyGeometry = new THREE.SphereGeometry(
        baseRadius,
        segments,
        segments,
      );
      bodyMesh = new THREE.Mesh(bodyGeometry, fallbackMaterial);
      console.warn(
        `[BaseTerrestrialRenderer] Created fallback body mesh for ${object.celestialObjectId}:`,
        bodyMesh,
      );
    }
    bodyMesh.name = `${object.celestialObjectId}-body`;
    group.add(bodyMesh);

    // Use service to get mesh and material
    const cloudResult: CloudMeshResult | null =
      this.atmosphereCloudService.createCloudMesh(object, segments, baseRadius);
    if (cloudResult) {
      group.add(cloudResult.mesh);
      this.cloudMaterials.set(object.celestialObjectId, cloudResult.material);
    }

    // Use service to get mesh and material
    const atmosphereResult: AtmosphereMeshResult | null =
      this.atmosphereCloudService.createAtmosphereMesh(
        object,
        segments,
        baseRadius,
      );
    if (atmosphereResult) {
      group.add(atmosphereResult.mesh);
      this.atmosphereMaterials.set(
        object.celestialObjectId,
        atmosphereResult.material,
      );
    }
    return group;
  }

  /**
   * Initialize the materials map with the created material
   */
  protected initializeMaterialMap(id: string, material: THREE.Material): void {
    this.materials.set(id, material);
  }

  /**
   * Update uniforms for the planet based on time and lighting.
   */
  update(
    time: number,
    lightSources?: Map<
      string,
      { position: THREE.Vector3; color: THREE.Color; intensity: number }
    >,
    camera?: THREE.Camera,
  ): void {
    if (!lightSources || lightSources.size === 0) {
      console.warn(
        "[BaseTerrestrialRenderer] No light sources provided, adding default light",
      );
      lightSources = new Map<
        string,
        { position: THREE.Vector3; color: THREE.Color; intensity: number }
      >();
      lightSources.set("default_sun", {
        position: new THREE.Vector3(1, 0.3, 0.5).normalize(),
        color: new THREE.Color(0xffffff),
        intensity: 1.5,
      });
    }

    this.materials.forEach((material) => {
      if (material instanceof ProceduralPlanetMaterial) {
        material.update(time, lightSources, camera);
      }
    });

    this.cloudMaterials.forEach((material) => {
      let sunPos: THREE.Vector3 | undefined = undefined;
      if (lightSources && lightSources.size > 0) {
        const firstLight = lightSources.values().next().value;
        if (firstLight) sunPos = firstLight.position;
      }
      if (camera) {
        material.update(time, camera.position, sunPos);
      } else {
        console.warn(
          "[BaseTerrestrialRenderer] Camera not available for cloud material update.",
        );
        material.update(time, new THREE.Vector3(0, 0, 1), sunPos);
      }
    });

    this.atmosphereMaterials.forEach((material) => {
      let sunPos: THREE.Vector3 | undefined = undefined;
      if (lightSources && lightSources.size > 0) {
        const firstLight = lightSources.values().next().value;
        if (firstLight) sunPos = firstLight.position;
      }
      material.update(time, sunPos);
    });
  }

  /**
   * Dispose of all materials and textures
   */
  dispose(): void {
    this.materials.forEach((material) => material.dispose());
    this.materials.clear();

    this.atmosphereMaterials.forEach((material) => material.dispose());
    this.atmosphereMaterials.clear();

    this.cloudMaterials.forEach((material) => material.dispose());
    this.cloudMaterials.clear();

    this.loadedTextures.forEach((textures) => {
      textures.color?.dispose();
      textures.normal?.dispose();
    });
    this.loadedTextures.clear();

    this.objectIds.clear();
  }
}
