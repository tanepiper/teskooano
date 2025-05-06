import { SCALE, CelestialType, PlanetProperties } from "@teskooano/data-types";
import * as THREE from "three";
import { CelestialMeshOptions, CelestialRenderer, LODLevel } from "../index";
import { AtmosphereMaterial } from "./materials/atmosphere.material";
import { CloudMaterial } from "./materials/clouds.material";
import { ProceduralPlanetMaterial } from "./materials/procedural-planet.material";

import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import { AtmosphereCloudService } from "./utils/atmosphere-cloud-utils";
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
      options?.segments ??
      (["high", "ultra"].includes(options?.detailLevel ?? "") ? 512 : 256);

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

    // // Use service to get mesh and material
    // const cloudResult: CloudMeshResult | null =
    //   this.atmosphereCloudService.createCloudMesh(object, segments, baseRadius);
    // if (cloudResult) {
    //   group.add(cloudResult.mesh);
    //   this.cloudMaterials.set(object.celestialObjectId, cloudResult.material);
    // }

    // // Use service to get mesh and material
    // const atmosphereResult: AtmosphereMeshResult | null =
    //   this.atmosphereCloudService.createAtmosphereMesh(
    //     object,
    //     segments,
    //     baseRadius,
    //   );
    // if (atmosphereResult) {
    //   group.add(atmosphereResult.mesh);
    //   this.atmosphereMaterials.set(
    //     object.celestialObjectId,
    //     atmosphereResult.material,
    //   );
    // }
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

    // this.cloudMaterials.forEach((material) => {
    //   let sunPos: THREE.Vector3 | undefined = undefined;
    //   if (lightSources && lightSources.size > 0) {
    //     const firstLight = lightSources.values().next().value;
    //     if (firstLight) sunPos = firstLight.position;
    //   }
    //   if (camera) {
    //     material.update(time, camera.position, sunPos);
    //   } else {
    //     console.warn(
    //       "[BaseTerrestrialRenderer] Camera not available for cloud material update.",
    //     );
    //     material.update(time, new THREE.Vector3(0, 0, 1), sunPos);
    //   }
    // });

    // this.atmosphereMaterials.forEach((material) => {
    //   let sunPos: THREE.Vector3 | undefined = undefined;
    //   if (lightSources && lightSources.size > 0) {
    //     const firstLight = lightSources.values().next().value;
    //     if (firstLight) sunPos = firstLight.position;
    //   }
    //   material.update(time, sunPos);
    // });
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

  public updateWith(
    objectData: RenderableCelestialObject,
    groupMesh: THREE.Object3D,
  ): void {
    console.log(
      `[BaseTerrestrialRenderer] updateWith: Updating ${objectData.celestialObjectId} with groupMesh:`,
      groupMesh,
    );
    // The main body mesh is usually the first child of the high-detail group, or the group itself if not an LOD group for this specific update context.
    // We need to be careful how we retrieve the mesh that has the ProceduralPlanetMaterial.
    // Let's assume groupMesh is the direct output from MeshFactory for the highest LOD, which should be a THREE.Group containing the body mesh.
    let bodyMesh = groupMesh.children.find(
      (child) => child.name === `${objectData.celestialObjectId}-body`,
    ) as THREE.Mesh;

    // If the groupMesh itself is the body (e.g., if LOD structure isn't used or this is a direct mesh reference)
    if (
      !bodyMesh &&
      groupMesh instanceof THREE.Mesh &&
      groupMesh.name === `${objectData.celestialObjectId}-body`
    ) {
      bodyMesh = groupMesh;
    }

    // Fallback: Attempt to get from the materials map if direct mesh access fails or is ambiguous
    // This relies on initializeMaterialMap being called correctly during creation.
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
      // If material from map is not ProceduralPlanetMaterial either, we can't proceed.
      if (!(material instanceof ProceduralPlanetMaterial)) return;
    } else if (!bodyMesh && !(material instanceof ProceduralPlanetMaterial)) {
      console.warn(
        `[BaseTerrestrialRenderer] updateWith: Could not find body mesh or suitable material for ${objectData.celestialObjectId}`,
      );
      return;
    }

    // Add a type guard for PlanetProperties
    if (
      material &&
      material.uniforms &&
      objectData.properties &&
      (objectData.properties.type === CelestialType.PLANET ||
        objectData.properties.type === CelestialType.MOON ||
        objectData.properties.type === CelestialType.DWARF_PLANET)
    ) {
      // Now we can more safely cast to PlanetProperties
      const planetProps = objectData.properties as PlanetProperties;

      if (planetProps.surface) {
        console.log(
          `[BaseTerrestrialRenderer] updateWith called for ${objectData.celestialObjectId}. Current surface props:`,
          planetProps.surface,
        );
        const surfaceProps = planetProps.surface as any; // Or ProceduralSurfaceProperties if you're certain

        // Update uniforms
        if (
          surfaceProps.persistence !== undefined &&
          material.uniforms.persistence
        ) {
          material.uniforms.persistence.value = surfaceProps.persistence;
        }
        if (
          surfaceProps.lacunarity !== undefined &&
          material.uniforms.lacunarity
        ) {
          material.uniforms.lacunarity.value = surfaceProps.lacunarity;
        }
        if (
          surfaceProps.simplePeriod !== undefined &&
          material.uniforms.uSimplePeriod
        ) {
          material.uniforms.uSimplePeriod.value = surfaceProps.simplePeriod;
        }
        if (surfaceProps.octaves !== undefined && material.uniforms.uOctaves) {
          material.uniforms.uOctaves.value = surfaceProps.octaves;
        }
        if (
          surfaceProps.bumpScale !== undefined &&
          material.uniforms.uBumpScale
        ) {
          material.uniforms.uBumpScale.value = surfaceProps.bumpScale;
        }

        // For colors, assuming uColorLow etc. are THREE.Color uniforms
        // Ensure these uniform names match your ProceduralPlanetMaterial definition
        if (surfaceProps.colorLow && material.uniforms.uColorLow) {
          material.uniforms.uColorLow.value.set(surfaceProps.colorLow);
        }
        if (surfaceProps.colorMid1 && material.uniforms.uColorMid1) {
          material.uniforms.uColorMid1.value.set(surfaceProps.colorMid1);
        }
        if (surfaceProps.colorMid2 && material.uniforms.uColorMid2) {
          material.uniforms.uColorMid2.value.set(surfaceProps.colorMid2);
        }
        if (surfaceProps.colorHigh && material.uniforms.uColorHigh) {
          material.uniforms.uColorHigh.value.set(surfaceProps.colorHigh);
        }

        if (
          surfaceProps.shininess !== undefined &&
          material.uniforms.uShininess
        ) {
          material.uniforms.uShininess.value = surfaceProps.shininess;
        }
        if (
          surfaceProps.specularStrength !== undefined &&
          material.uniforms.uSpecularStrength
        ) {
          material.uniforms.uSpecularStrength.value =
            surfaceProps.specularStrength;
        }

        console.log(
          `[BaseTerrestrialRenderer] Updated uniforms for ${objectData.celestialObjectId}:`,
          JSON.parse(JSON.stringify(material.uniforms)),
        );
        // material.uniformsNeedUpdate = true; // Generally good for shader materials if unsure.
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
