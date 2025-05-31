import { SCALE, CelestialType, PlanetProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from "../index";
import { AtmosphereMaterial } from "./materials/atmosphere.material";
import { ProceduralPlanetMaterial } from "./materials/procedural-planet.material";

import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import {
  AtmosphereService,
  AtmosphereMeshResult,
} from "./utils/atmosphere-cloud-utils";
import { PlanetMaterialService } from "./utils/planet-material-utils";
import { BaseCelestialRenderer } from "../common/BaseCelestialRenderer";

const MAX_LIGHTS = 4;

/**
 * Base renderer for terrestrial planets and moons
 */
export class BaseTerrestrialRenderer extends BaseCelestialRenderer {
  protected atmosphereMaterials: Map<string, AtmosphereMaterial> = new Map();

  protected loadedTextures: Map<
    string,
    { color: THREE.Texture | null; normal: THREE.Texture | null }
  > = new Map();

  private _worldPos = new THREE.Vector3();
  private _lightWorldPos = new THREE.Vector3();
  private _viewLightDir = new THREE.Vector3();

  protected materialService: PlanetMaterialService;
  protected atmosphereCloudService: AtmosphereService;

  constructor() {
    super();
    this.materialService = new PlanetMaterialService();
    this.atmosphereCloudService = new AtmosphereService();
  }

  /**
   * Creates and returns an array of LOD levels for the terrestrial object.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    this.trackObject(object.celestialObjectId);

    const baseRadius = object.radius ?? 1;
    const scale = typeof SCALE === "number" ? SCALE : 1;

    const highDetailGroup = this._createHighDetailGroup(
      object,
      options,
      baseRadius,
    );
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumDetailGroup = this._createMediumDetailGroup(
      object,
      baseRadius,
      scale,
    );
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 50 * scale,
    };

    const lowDetailGroup = this._createLowDetailGroup(
      object,
      baseRadius,
      scale,
    );
    const level2: LODLevel = { object: lowDetailGroup, distance: Infinity };

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
      options?.segments ??
      (["high", "ultra"].includes(options?.detailLevel ?? "") ? 512 : 256);

    let bodyMesh: THREE.Mesh;
    try {
      const bodyMaterial = this.materialService.createMaterial(object);
      this.registerMaterial(object.celestialObjectId, bodyMaterial);
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
      this.registerMaterial(object.celestialObjectId, fallbackMaterial);
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

    const planetProps = object.properties as PlanetProperties;

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
   * Helper to create the medium-detail group (Level 1 LOD).
   * @internal
   */
  private _createMediumDetailGroup(
    object: RenderableCelestialObject,
    baseRadius: number,
    scale: number,
  ): THREE.Group {
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
    return level1Group;
  }

  /**
   * Helper to create the low-detail group (Level 2 LOD).
   * @internal
   */
  private _createLowDetailGroup(
    object: RenderableCelestialObject,
    baseRadius: number,
    scale: number,
  ): THREE.Group {
    const lowSegments = 8;
    const lowLodEffectiveRadius = baseRadius * 0.01;
    const lowGeometry = new THREE.SphereGeometry(
      lowLodEffectiveRadius,
      lowSegments,
      lowSegments,
    );
    const lowMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
    });
    lowMaterial.depthTest = false;

    const lowMesh = new THREE.Mesh(lowGeometry, lowMaterial);
    lowMesh.name = `${object.celestialObjectId}-low-lod`;
    lowMesh.renderOrder = 999;

    const level2Group = new THREE.Group();
    level2Group.add(lowMesh);
    return level2Group;
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
    super.update(time, lightSources, camera);

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

    this.atmosphereMaterials.forEach((material) => {
      material.update(this.elapsedTime, camera, lightSources);
    });
  }

  /**
   * Dispose of all materials and textures
   */
  dispose(): void {
    this.atmosphereMaterials.forEach((material) => material.dispose());
    this.atmosphereMaterials.clear();

    this.loadedTextures.forEach((textures) => {
      textures.color?.dispose();
      textures.normal?.dispose();
    });
    this.loadedTextures.clear();

    super.dispose();
  }

  private _updateUniformIfDefined(
    material: ProceduralPlanetMaterial,
    uniformName: string,
    value: any,
  ): void {
    if (value !== undefined && material.uniforms[uniformName]) {
      material.uniforms[uniformName].value = value;
    }
  }

  private _updateColorUniform(
    material: ProceduralPlanetMaterial,
    uniformName: string,
    colorValue: string,
  ): void {
    if (colorValue && material.uniforms[uniformName]) {
      material.uniforms[uniformName].value.set(colorValue);
    }
  }

  private _updateSurfaceUniforms(
    material: ProceduralPlanetMaterial,
    surfaceProps: any,
  ): void {
    // Update terrain generation parameters
    this._updateUniformIfDefined(
      material,
      "uTerrainType",
      surfaceProps.terrainType,
    );
    this._updateUniformIfDefined(
      material,
      "uTerrainAmplitude",
      surfaceProps.terrainAmplitude,
    );
    this._updateUniformIfDefined(
      material,
      "uTerrainSharpness",
      surfaceProps.terrainSharpness,
    );
    this._updateUniformIfDefined(
      material,
      "uTerrainOffset",
      surfaceProps.terrainOffset,
    );
    this._updateUniformIfDefined(
      material,
      "uUndulation",
      surfaceProps.undulation,
    );

    // Update noise parameters
    this._updateUniformIfDefined(
      material,
      "persistence",
      surfaceProps.persistence,
    );
    this._updateUniformIfDefined(
      material,
      "lacunarity",
      surfaceProps.lacunarity,
    );
    this._updateUniformIfDefined(
      material,
      "uSimplePeriod",
      surfaceProps.simplePeriod,
    );
    this._updateUniformIfDefined(material, "uOctaves", surfaceProps.octaves);
    this._updateUniformIfDefined(
      material,
      "uBumpScale",
      surfaceProps.bumpScale,
    );

    // Update colors
    this._updateColorUniform(material, "uColor1", surfaceProps.color1);
    this._updateColorUniform(material, "uColor2", surfaceProps.color2);
    this._updateColorUniform(material, "uColor3", surfaceProps.color3);
    this._updateColorUniform(material, "uColor4", surfaceProps.color4);
    this._updateColorUniform(material, "uColor5", surfaceProps.color5);

    // Update height controls
    this._updateUniformIfDefined(material, "uHeight1", surfaceProps.height1);
    this._updateUniformIfDefined(material, "uHeight2", surfaceProps.height2);
    this._updateUniformIfDefined(material, "uHeight3", surfaceProps.height3);
    this._updateUniformIfDefined(material, "uHeight4", surfaceProps.height4);
    this._updateUniformIfDefined(material, "uHeight5", surfaceProps.height5);

    // Update material properties
    this._updateUniformIfDefined(
      material,
      "uShininess",
      surfaceProps.shininess,
    );
    this._updateUniformIfDefined(
      material,
      "uSpecularStrength",
      surfaceProps.specularStrength,
    );
  }

  public updateWith(
    objectData: RenderableCelestialObject,
    groupMesh: THREE.Object3D,
  ): void {
    let bodyMesh = groupMesh.children.find(
      (child) => child.name === `${objectData.celestialObjectId}-body`,
    ) as THREE.Mesh;

    if (
      !bodyMesh &&
      groupMesh instanceof THREE.Mesh &&
      groupMesh.name === `${objectData.celestialObjectId}-body`
    ) {
      bodyMesh = groupMesh;
    }

    let material = this.materials.get(
      objectData.celestialObjectId,
    ) as ProceduralPlanetMaterial;

    if (bodyMesh && bodyMesh.material instanceof ProceduralPlanetMaterial) {
      material = bodyMesh.material as ProceduralPlanetMaterial;
    } else if (
      bodyMesh &&
      !(bodyMesh.material instanceof ProceduralPlanetMaterial)
    ) {
      console.warn(
        `[BaseTerrestrialRenderer] updateWith: Body mesh for ${objectData.celestialObjectId} does not have ProceduralPlanetMaterial.`,
      );
      if (!(material instanceof ProceduralPlanetMaterial)) return;
    } else if (!bodyMesh && !(material instanceof ProceduralPlanetMaterial)) {
      console.warn(
        `[BaseTerrestrialRenderer] updateWith: Could not find body mesh or suitable material for ${objectData.celestialObjectId}`,
      );
      return;
    }

    if (
      material &&
      material.uniforms &&
      objectData.properties &&
      (objectData.properties.type === CelestialType.PLANET ||
        objectData.properties.type === CelestialType.MOON ||
        objectData.properties.type === CelestialType.DWARF_PLANET)
    ) {
      const planetProps = objectData.properties as PlanetProperties;

      if (planetProps.surface) {
        this._updateSurfaceUniforms(material, planetProps.surface);
      } else {
        console.warn(
          `[BaseTerrestrialRenderer] updateWith: Planet ${objectData.celestialObjectId} has no surface properties defined.`,
        );
      }
    } else {
      console.warn(
        `[BaseTerrestrialRenderer] updateWith: Conditions not met for ${objectData.celestialObjectId}. Material:`,
        material,
        "Properties:",
        objectData.properties,
      );
    }
  }
}
