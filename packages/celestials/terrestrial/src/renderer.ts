import {
  CelestialType,
  PlanetProperties,
  ProceduralSurfaceProperties,
  SCALE,
} from "@teskooano/data-types";
import * as THREE from "three";

import { AtmosphereMaterial } from "./materials/atmosphere.material";
import { ProceduralPlanetMaterial } from "./materials/procedural-planet.material";

import type { RenderableCelestialObject } from "@teskooano/data-types";
import { LODLevel } from "@teskooano/renderer-threejs-lod";
import {
  BaseCelestialRenderer,
  type CelestialMeshOptions,
  type LightSourcesMap,
  type CelestialRenderer,
  ShadowCasterUtils,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";
import { RingSystemRenderer } from "@teskooano/celestials-rings";
import {
  AtmosphereMeshResult,
  AtmosphereService,
} from "./utils/atmosphere-utils";
import { PlanetMaterialService } from "./utils/planet-material-utils";

export interface TerrestrialRendererDeps {
  renderers: Map<string, CelestialRenderer>;
}

const MAX_LIGHTS = 4;
const MAX_SHADOW_CASTERS = 4;

/**
 * Base renderer for terrestrial planets and moons
 * @template TTerrestrialMaterial The specific terrestrial material type this renderer works with
 */
export class BaseTerrestrialRenderer<
  TTerrestrialMaterial extends
    ProceduralPlanetMaterial = ProceduralPlanetMaterial,
> extends BaseCelestialRenderer<TTerrestrialMaterial> {
  protected atmosphereMaterials: Map<string, AtmosphereMaterial> = new Map();
  protected textureLoader: THREE.TextureLoader;
  protected ringSystemRenderer?: RingSystemRenderer;

  protected loadedTextures: Map<
    string,
    { color: THREE.Texture | null; normal: THREE.Texture | null }
  > = new Map();

  protected material: ProceduralPlanetMaterial | null = null;
  protected materialService: PlanetMaterialService;
  protected atmosphereService: AtmosphereService;

  constructor(
    object: RenderableCelestialObject,
    deps: TerrestrialRendererDeps,
  ) {
    super();
    this.textureLoader = new THREE.TextureLoader();
    this.materialService = new PlanetMaterialService();
    this.atmosphereService = new AtmosphereService();
    deps.renderers.set(object.celestialObjectId, this);
  }

  /**
   * Creates the appropriate material for this terrestrial object.
   * This implementation creates a ProceduralPlanetMaterial.
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): TTerrestrialMaterial {
    const bodyMaterial = this.materialService.createMaterial(object);
    return bodyMaterial as TTerrestrialMaterial;
  }

  /**
   * Creates and returns an array of LOD levels for the terrestrial object.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const planetLevels = this._createPlanetLODs(object, options);
    const planetProps = object.properties as PlanetProperties;

    // LAZY INITIALIZATION of RingSystemRenderer
    if (
      !this.ringSystemRenderer &&
      planetProps?.rings &&
      planetProps.rings.length > 0
    ) {
      this.ringSystemRenderer = new RingSystemRenderer(this);
    }

    if (
      this.ringSystemRenderer &&
      planetProps?.rings &&
      planetProps.rings.length > 0
    ) {
      const ringLODs = this.ringSystemRenderer.getLODLevels(object, options);

      // Combine planet and ring LODs
      return planetLevels.map((planetLOD, index) => {
        // The last level is the billboard, which should not have rings attached.
        if (index === planetLevels.length - 1) {
          return planetLOD;
        }

        const ringLOD = ringLODs[index] || ringLODs[ringLODs.length - 1]; // Fallback to last ring LOD
        const combinedGroup = new THREE.Group();
        combinedGroup.name = `${object.celestialObjectId}-lod-${index}-combined`;
        combinedGroup.add(planetLOD.object);
        if (ringLOD && ringLOD.object) {
          combinedGroup.add(ringLOD.object);
        }
        return {
          object: combinedGroup,
          distance: planetLOD.distance,
        };
      });
    }

    return planetLevels;
  }

  /**
   * Creates the LOD levels specifically for the planet body.
   * @internal
   */
  private _createPlanetLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const baseRadius = object.radius ?? 1;

    const highDetailGroup = this._createHighDetailGroup(
      object,
      options,
      baseRadius,
    );
    const level0: LODLevel = { object: highDetailGroup, distance: 0 };

    const mediumDetailGroup = this._createMediumDetailGroup(object, baseRadius);
    const level1: LODLevel = {
      object: mediumDetailGroup,
      distance: 250 * baseRadius,
    };

    const color = this.materialService.getBaseColor(object);
    let billboardDistance: number;
    let size: number;
    if (object.type === CelestialType.MOON) {
      size = 0.01;
      // Moons are small, billboard needs to appear at a larger multiple of its radius
      // to be seen from a reasonable distance away from its parent planet.
      billboardDistance = 4000 * baseRadius;
    } else {
      size = 0.02;
      // Planets are larger, so a smaller multiplier works.
      billboardDistance = 1000 * baseRadius;
    }

    const level2 = this.billboardManager.createBillboardLOD(object, {
      distance: billboardDistance,
      size,
      color: color,
      albedo: object.albedo ?? 1.0,
    });

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
      GeometryUtilities.getOptimizedHighDetailSegments(
        options?.detailLevel,
        64,
      );

    let bodyMesh: THREE.Mesh;
    try {
      const bodyMaterial = this.createAndRegisterMaterial(object);
      if (!bodyMaterial) {
        throw new Error(
          `Failed to create material for ${object.celestialObjectId}`,
        );
      }
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
    }
    bodyMesh.name = `${object.celestialObjectId}-body`;
    group.add(bodyMesh);

    const planetProps = object.properties as PlanetProperties;

    const atmosphereResult: AtmosphereMeshResult | null =
      this.atmosphereService.createAtmosphereMesh(object, segments, baseRadius);
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
  ): THREE.Group {
    const mediumSegments = GeometryUtilities.getOptimizedHighDetailSegments(
      "medium",
      32,
    );
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
   * Update uniforms for the planet based on time and lighting.
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.Camera,
    allObjects: Record<string, RenderableCelestialObject>,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);

    // Apply centralized light attenuation
    const attenuatedLightSources = this.applyLightAttenuation(
      object,
      lightSources,
    );

    // Calculate dynamic ambient light based on nearby stars
    const dynamicAmbientIntensity =
      this.lightingManager.calculateDynamicAmbientLightWithStarData(
        object,
        lightSources, // Use original light sources for ambient calculation, not attenuated
        allObjects,
      );

    const bodyMaterial = this.getMaterial(object.celestialObjectId);
    if (
      bodyMaterial &&
      bodyMaterial instanceof ProceduralPlanetMaterial &&
      "update" in bodyMaterial &&
      typeof bodyMaterial.update === "function"
    ) {
      const planetProps = object.properties as PlanetProperties;
      if (planetProps.surface) {
        this._updateSurfaceUniforms(
          bodyMaterial,
          planetProps.surface as ProceduralSurfaceProperties,
        );
      }

      // Update dynamic ambient lighting
      if (bodyMaterial.uniforms.uAmbientLightIntensity) {
        bodyMaterial.uniforms.uAmbientLightIntensity.value =
          dynamicAmbientIntensity;
      }

      // Find shadow casters using centralized utility
      const shadowCasters = this.findShadowCasters(object, allObjects);

      // Convert to shader format
      const shadowCastersForShader =
        ShadowCasterUtils.toShaderFormat(shadowCasters);

      bodyMaterial.update(
        time,
        timeScale,
        attenuatedLightSources,
        camera,
        shadowCastersForShader,
      );
    }

    const atmosphereMaterial = this.atmosphereMaterials.get(
      object.celestialObjectId,
    );
    if (atmosphereMaterial) {
      atmosphereMaterial.update(
        time,
        timeScale,
        camera,
        attenuatedLightSources,
      );
    }

    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.update(
        object,
        time,
        timeScale,
        attenuatedLightSources,
        camera,
        allObjects,
      );
    }
  }

  /**
   * Dispose of all materials and textures
   */
  dispose(): void {
    super.dispose();
    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.dispose();
    }

    this.atmosphereMaterials.forEach((material) => material.dispose());
    this.atmosphereMaterials.clear();

    this.loadedTextures.forEach((textures) => {
      textures.color?.dispose();
      textures.normal?.dispose();
    });
    this.loadedTextures.clear();
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

  /**
   * Initializes the renderer, including creating the ring system if needed.
   * This should be called after the constructor.
   */
  initialize(object: RenderableCelestialObject): void {
    const planetProps = object.properties as PlanetProperties;
    if (planetProps?.rings && planetProps.rings.length > 0) {
      this.ringSystemRenderer = new RingSystemRenderer(this);
    }
  }

  public getLOD(object: RenderableCelestialObject): THREE.LOD | undefined {
    return super.getLOD(object);
  }

  /**
   * Registers ring shadow casters with the lighting manager if rings exist.
   * @param lightingManager The lighting manager to register with
   * @param object The celestial object
   */
  public registerRingShadowCasters(
    lightingManager: any,
    object: RenderableCelestialObject,
  ): void {
    if (this.ringSystemRenderer) {
      this.ringSystemRenderer.registerWithLightingManager(
        lightingManager,
        object,
        object, // parent object (same as object for planets)
        "high", // register the high detail level for shadow casting
      );
    }
  }
}
