import {
  CelestialType,
  PlanetProperties,
  ProceduralSurfaceProperties,
} from "@teskooano/data-types";
import * as THREE from "three";

import { AtmosphereMaterial } from "./materials/atmosphere.material";
import { ProceduralPlanetMaterial } from "./materials/procedural-planet.material";
import { TextureBasedPlanetMaterial } from "./materials/texture-based-planet.material";
import type { GeneratedPlanetTextures } from "./texture-generation/types";
import {
  TerrainTextureGenerator,
  type TextureGenerationOptions,
} from "./texture-generation/TerrainTextureGenerator";

import type { RenderableCelestialObject } from "@teskooano/data-types";
import {
  BaseCelestialRenderer,
  type CelestialMeshOptions,
  type LightSourcesMap,
  type CelestialRenderer,
  ShadowCasterUtils,
  GeometryUtilities,
  LODLevel,
} from "@teskooano/renderer-threejs-celestial";
import { RingSystemRenderer } from "@teskooano/celestials-rings";
import {
  AtmosphereMeshResult,
  AtmosphereService,
} from "./utils/atmosphere-utils";
import { PlanetMaterialService } from "./utils/planet-material-utils";
import { createCubeSphereGeometry } from "./geometry/cube-sphere";

/**
 * Dependencies for terrestrial renderer initialization.
 */
export interface TerrestrialRendererDeps {
  /** Map of renderer instances for caching */
  renderers: Map<string, CelestialRenderer>;
  /**
   * Whether to use texture-based rendering (default: true).
   * When true, generates textures with craters, erosion, etc.
   * Set to false to use legacy procedural shader-based generation.
   */
  useGeneratedTextures?: boolean;
  /** Options for texture generation */
  textureGenerationOptions?: TextureGenerationOptions;
  /** Pre-generated textures (skip generation if provided) */
  preGeneratedTextures?: GeneratedPlanetTextures;
}

const MAX_LIGHTS = 4;
const MAX_SHADOW_CASTERS = 4;

/** Type for planet materials (procedural or texture-based) */
type PlanetMaterialType = ProceduralPlanetMaterial | TextureBasedPlanetMaterial;

/**
 * Base renderer for terrestrial planets and moons.
 *
 * Supports two rendering modes:
 * 1. Procedural (default): Real-time shader-based terrain generation
 * 2. Texture-based: Pre-generated textures with craters, erosion, etc.
 *
 * @template TTerrestrialMaterial The specific terrestrial material type this renderer works with
 */
export class BaseTerrestrialRenderer<
  TTerrestrialMaterial extends PlanetMaterialType = ProceduralPlanetMaterial,
> extends BaseCelestialRenderer<TTerrestrialMaterial> {
  protected atmosphereMaterials: Map<string, AtmosphereMaterial> = new Map();
  protected textureLoader: THREE.TextureLoader;
  protected ringSystemRenderer?: RingSystemRenderer;

  protected loadedTextures: Map<
    string,
    { color: THREE.Texture | null; normal: THREE.Texture | null }
  > = new Map();

  protected material: PlanetMaterialType | null = null;
  protected materialService: PlanetMaterialService;
  protected atmosphereService: AtmosphereService;

  /** Whether to use texture-based rendering */
  protected useGeneratedTextures: boolean;
  /** Options for texture generation */
  protected textureGenerationOptions?: TextureGenerationOptions;
  /** Pre-generated textures (if provided) */
  protected generatedTextures?: GeneratedPlanetTextures;
  /** Promise for texture generation (if in progress) */
  private textureGenerationPromise?: Promise<GeneratedPlanetTextures | null>;
  /** Whether textures are currently being generated */
  private isGeneratingTextures: boolean = false;
  /** Frame counter for upgrade checks (check every 60 frames) */
  private frameCount: number = 0;

  constructor(
    object: RenderableCelestialObject,
    deps: TerrestrialRendererDeps,
  ) {
    super(object);
    this.textureLoader = new THREE.TextureLoader();
    this.materialService = new PlanetMaterialService();
    this.atmosphereService = new AtmosphereService();
    this.useGeneratedTextures = deps.useGeneratedTextures ?? true;
    this.textureGenerationOptions = deps.textureGenerationOptions;
    this.generatedTextures = deps.preGeneratedTextures;
    deps.renderers.set(object.id, this);

    // Start texture generation asynchronously if needed
    if (this.useGeneratedTextures && !this.generatedTextures) {
      this.startTextureGeneration(object);
    }
  }

  /**
   * Starts asynchronous texture generation in the background.
   * The renderer will use procedural material until textures are ready.
   */
  private startTextureGeneration(object: RenderableCelestialObject): void {
    if (this.isGeneratingTextures) return;

    console.log(
      `[BaseTerrestrialRenderer] Starting texture generation for ${object.id}`,
      {
        hasSurface: !!(object as { surface?: unknown }).surface,
        options: this.textureGenerationOptions,
      },
    );

    this.isGeneratingTextures = true;
    const startTime = performance.now();

    // Wrap in try-catch to prevent hard crashes
    try {
      this.textureGenerationPromise = TerrainTextureGenerator.generateTextures(
        object,
        this.textureGenerationOptions,
      )
        .then((textures) => {
          const duration = performance.now() - startTime;
          console.log(
            `[BaseTerrestrialRenderer] Texture generation completed for ${object.id} in ${duration.toFixed(0)}ms`,
            {
              hasHeightMap: !!textures?.heightMap,
              hasColorMap: !!textures?.colorMap,
              hasNormalMap: !!textures?.normalMap,
              hasRoughnessMap: !!textures?.roughnessMap,
            },
          );

          if (!textures) {
            console.error(
              `[BaseTerrestrialRenderer] Texture generation returned null for ${object.id}`,
            );
            this.isGeneratingTextures = false;
            return null;
          }

          this.generatedTextures = textures;
          this.isGeneratingTextures = false;

          // Immediately try to upgrade material when textures are ready
          // Use setTimeout to avoid blocking the promise chain
          setTimeout(() => {
            this.upgradeToTextureMaterialIfReady(object)
              .then((upgraded) => {
                if (upgraded) {
                  console.log(
                    `[BaseTerrestrialRenderer] Successfully upgraded ${object.id} to texture-based material`,
                  );
                }
              })
              .catch((error) => {
                console.warn(
                  `[BaseTerrestrialRenderer] Failed to upgrade material immediately for ${object.id}:`,
                  error,
                );
              });
          }, 0);

          return textures;
        })
        .catch((error) => {
          // Check if error is due to context loss
          const isContextError =
            error instanceof Error &&
            (error.message.includes("context") ||
              error.message.includes("Context Lost"));

          if (isContextError) {
            console.error(
              `[BaseTerrestrialRenderer] WebGL context lost during texture generation for ${object.id}. Disabling texture generation for this planet.`,
            );
            // Permanently disable texture generation for this planet
            this.useGeneratedTextures = false;
          } else {
            console.warn(
              `[BaseTerrestrialRenderer] Failed to generate textures for ${object.id}, using procedural material:`,
              error,
            );
          }

          this.isGeneratingTextures = false;
          // Return null to indicate failure, but don't throw
          return null;
        })
        .catch((outerError) => {
          // Catch any errors in the promise chain itself
          console.error(
            `[BaseTerrestrialRenderer] Unhandled error in texture generation promise for ${object.id}:`,
            outerError,
          );
          this.isGeneratingTextures = false;
          return null;
        });
    } catch (syncError) {
      // Catch synchronous errors during promise creation
      console.error(
        `[BaseTerrestrialRenderer] Synchronous error starting texture generation for ${object.id}:`,
        syncError,
      );
      this.isGeneratingTextures = false;
      this.textureGenerationPromise = Promise.resolve(null);
    }
  }

  /**
   * Creates the appropriate material for this terrestrial object.
   *
   * Returns either a ProceduralPlanetMaterial (real-time generation) or
   * a TextureBasedPlanetMaterial (pre-generated textures).
   *
   * If textures are being generated but not ready yet, uses procedural material
   * as a fallback. The material can be updated later when textures are ready.
   */
  protected createMaterial(
    object: RenderableCelestialObject,
  ): TTerrestrialMaterial {
    // Use texture-based material if textures are available
    if (this.useGeneratedTextures && this.generatedTextures) {
      const texturedMaterial = new TextureBasedPlanetMaterial({
        textures: this.generatedTextures,
        displacementScale: 0.05, // Match other texture material creation for consistency
      });
      return texturedMaterial as TTerrestrialMaterial;
    }

    // Fallback to procedural material (either disabled textures or still generating)
    const bodyMaterial = this.materialService.createMaterial(object);
    return bodyMaterial as TTerrestrialMaterial;
  }

  /**
   * Gets the texture generation promise if textures are being generated.
   * Can be used to wait for textures before rendering.
   */
  public getTextureGenerationPromise():
    | Promise<GeneratedPlanetTextures | null>
    | undefined {
    return this.textureGenerationPromise;
  }

  /**
   * Gets the current texture generation status for debugging.
   */
  public getTextureGenerationStatus(): {
    useGeneratedTextures: boolean;
    isGenerating: boolean;
    hasTextures: boolean;
    generationPromise: boolean;
  } {
    return {
      useGeneratedTextures: this.useGeneratedTextures,
      isGenerating: this.isGeneratingTextures,
      hasTextures: !!this.generatedTextures,
      generationPromise: !!this.textureGenerationPromise,
    };
  }

  /**
   * Checks if textures are ready and updates material if needed.
   * Call this periodically to upgrade from procedural to texture-based material.
   */
  public async upgradeToTextureMaterialIfReady(
    object: RenderableCelestialObject,
  ): Promise<boolean> {
    if (!this.useGeneratedTextures) {
      return false;
    }

    // Get existing material first to check if upgrade is needed
    const existingMaterial = this.getMaterial(object.id);
    if (!existingMaterial) {
      console.warn(
        `[BaseTerrestrialRenderer] No existing material found for ${object.id} to upgrade`,
      );
      return false;
    }

    // Check if it's already a texture-based material
    const isTextureBased =
      existingMaterial instanceof TextureBasedPlanetMaterial;
    if (isTextureBased) {
      // Already using texture-based material
      return false;
    }

    // Check if it's a procedural material that needs upgrading
    const isProcedural = existingMaterial instanceof ProceduralPlanetMaterial;
    if (!isProcedural) {
      // Different material type, can't upgrade
      return false;
    }

    // Get textures (either from cache or promise)
    let textures: GeneratedPlanetTextures | null | undefined =
      this.generatedTextures;

    if (!textures) {
      if (!this.textureGenerationPromise) {
        return false;
      }

      try {
        // Check if promise is already resolved
        const promiseResult = await Promise.resolve(
          this.textureGenerationPromise,
        );

        if (!promiseResult) {
          // Generation failed, already using procedural
          return false;
        }

        textures = promiseResult;
        this.generatedTextures = promiseResult || undefined;
      } catch (error) {
        console.warn(
          `[BaseTerrestrialRenderer] Error getting textures for ${object.id}:`,
          error,
        );
        return false;
      }
    }

    // At this point, textures must be defined
    if (!textures) {
      return false;
    }

    try {
      console.log(
        `[BaseTerrestrialRenderer] Upgrading ${object.id} from procedural to texture-based material`,
        {
          hasTextures: !!textures,
          textureResolution: textures?.resolution,
        },
      );

      // Create new texture-based material
      const newMaterial = new TextureBasedPlanetMaterial({
        textures,
        displacementScale: 0.05, // Increased from 0.02 for better visibility
      });

      // Replace material in registered materials
      this.registerMaterial(object.id, newMaterial);

      // Update mesh material in all LOD levels
      const lod = this.getLOD(object);
      if (lod) {
        let upgradedCount = 0;
        lod.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            // Check if this mesh uses the old material
            if (child.material === existingMaterial) {
              child.material = newMaterial;
              upgradedCount++;
            } else if (
              Array.isArray(child.material) &&
              child.material.includes(existingMaterial)
            ) {
              // Handle material arrays
              const index = child.material.indexOf(existingMaterial);
              if (index !== -1) {
                child.material[index] = newMaterial;
                upgradedCount++;
              }
            }
          }
        });

        if (upgradedCount > 0) {
          console.log(
            `[BaseTerrestrialRenderer] Upgraded ${upgradedCount} mesh(es) for ${object.id}`,
          );
        } else {
          console.warn(
            `[BaseTerrestrialRenderer] No meshes found to upgrade for ${object.id}`,
          );
        }
      } else {
        console.warn(
          `[BaseTerrestrialRenderer] No LOD found for ${object.id} to upgrade materials`,
        );
      }

      // Dispose old material
      existingMaterial.dispose();

      return true;
    } catch (error) {
      // Already handled in startTextureGeneration
      console.warn(
        `[BaseTerrestrialRenderer] Error upgrading material for ${object.id}:`,
        error,
      );
      return false;
    }
  }

  /**
   * Generates textures for this object if needed.
   * Called lazily when textures are first needed.
   */
  protected async generateTexturesIfNeeded(
    object: RenderableCelestialObject,
  ): Promise<void> {
    if (!this.useGeneratedTextures || this.generatedTextures) {
      return;
    }

    try {
      this.generatedTextures = await TerrainTextureGenerator.generateTextures(
        object,
        this.textureGenerationOptions,
      );
    } catch (error) {
      console.warn(
        `[BaseTerrestrialRenderer] Failed to generate textures for ${object.id}, falling back to procedural:`,
        error,
      );
      this.useGeneratedTextures = false;
    }
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
      this.ringSystemRenderer = new RingSystemRenderer(object, this);
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
        combinedGroup.name = `${object.id}-lod-${index}-combined`;
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

    // If textures are already ready, use them immediately
    if (
      this.useGeneratedTextures &&
      this.generatedTextures &&
      !this.isGeneratingTextures
    ) {
      // Textures are ready, create material with them
      const existingMaterial = this.getMaterial(object.id);
      if (
        !existingMaterial ||
        existingMaterial instanceof ProceduralPlanetMaterial
      ) {
        // Upgrade to texture material before creating mesh
        const newMaterial = new TextureBasedPlanetMaterial({
          textures: this.generatedTextures,
          displacementScale: 0.05, // Match the upgrade function for consistency
        });
        this.registerMaterial(object.id, newMaterial);
        if (existingMaterial) {
          existingMaterial.dispose();
        }
      }
    }

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
    group.name = `${object.id}-high-lod-group`;
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
        throw new Error(`Failed to create material for ${object.id}`);
      }
      const bodyGeometry = createCubeSphereGeometry(baseRadius, segments);

      bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    } catch (error) {
      console.error(
        `[BaseTerrestrialRenderer] Error creating procedural material for ${object.id}:`,
        error,
      );
      const fallbackMaterial = new THREE.MeshStandardMaterial({
        color: 0x808080,
        roughness: 0.8,
        metalness: 0.1,
      });
      this.registerMaterial(object.id, fallbackMaterial);
      const bodyGeometry = createCubeSphereGeometry(baseRadius, segments);
      bodyMesh = new THREE.Mesh(bodyGeometry, fallbackMaterial);
    }
    bodyMesh.name = `${object.id}-body`;
    group.add(bodyMesh);

    const planetProps = object.properties as PlanetProperties;

    const atmosphereResult: AtmosphereMeshResult | null =
      this.atmosphereService.createAtmosphereMesh(object, segments, baseRadius);
    if (atmosphereResult) {
      group.add(atmosphereResult.mesh);
      this.atmosphereMaterials.set(object.id, atmosphereResult.material);
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
    const mediumGeometry = createCubeSphereGeometry(baseRadius, mediumSegments);
    const mediumMaterial = new THREE.MeshStandardMaterial({
      color: this.materialService.getBaseColor(object),
      roughness: 0.8,
      metalness: 0.1,
    });
    const mediumMesh = new THREE.Mesh(mediumGeometry, mediumMaterial);
    mediumMesh.name = `${object.id}-medium-lod`;
    const level1Group = new THREE.Group();
    level1Group.name = `${object.id}-medium-lod-group`;
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
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);

    // Check if textures are ready and upgrade material
    // Check more frequently initially (every 5 frames for first 2 seconds), then every 30 frames
    this.frameCount++;
    const checkInterval = this.frameCount < 120 ? 5 : 30;

    if (
      this.frameCount % checkInterval === 0 &&
      this.textureGenerationPromise &&
      !this.generatedTextures &&
      !this.isGeneratingTextures
    ) {
      // Promise should be resolved by now if generation completed
      // Try to upgrade (this will await the promise if needed)
      this.upgradeToTextureMaterialIfReady(object).catch((error) => {
        // Silently fail - already using procedural material as fallback
        if (error && !error.message?.includes("No existing material")) {
          console.debug(
            `[BaseTerrestrialRenderer] Upgrade check for ${object.id}:`,
            error.message || error,
          );
        }
      });
    }

    // Update lighting manager with current light sources
    this.updateLightSources(lightSources);

    // Apply centralized light attenuation
    const attenuatedLightSources = this.applyLightAttenuation();

    // Calculate dynamic ambient light based on nearby stars
    const dynamicAmbientIntensity =
      this.lightingManager.calculateDynamicAmbientLight();

    const bodyMaterial = this.getMaterial(object.id);

    // Handle texture-based material
    if (bodyMaterial && bodyMaterial instanceof TextureBasedPlanetMaterial) {
      // Update ambient lighting
      bodyMaterial.updateAmbientLight(
        new THREE.Color(0.1, 0.1, 0.15),
        dynamicAmbientIntensity,
      );

      // Find and apply shadow casters
      const shadowCasters = this.findShadowCasters();
      const shadowCastersForMaterial = shadowCasters.map((sc) => ({
        position: sc.position,
        radius: sc.radius,
      }));
      bodyMaterial.updateShadowCasters(shadowCastersForMaterial);
    }
    // Handle procedural material
    else if (
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
      if (bodyMaterial.uniforms.uAmbientIntensity) {
        bodyMaterial.uniforms.uAmbientIntensity.value = dynamicAmbientIntensity;
      }

      // Find shadow casters using centralized utility
      const shadowCasters = this.findShadowCasters();

      // Convert to shader format
      const shadowCastersForShader =
        ShadowCasterUtils.toShaderFormat(shadowCasters);

      // Pass the object's position for light direction calculation
      (bodyMaterial as any).planetPosition = object.position;

      bodyMaterial.update(
        time,
        timeScale,
        attenuatedLightSources,
        camera,
        shadowCastersForShader,
      );
    }

    const atmosphereMaterial = this.atmosphereMaterials.get(object.id);
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

    // Dispose generated textures
    if (this.generatedTextures) {
      this.generatedTextures.dispose();
      this.generatedTextures = undefined;
    }
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
      this.ringSystemRenderer = new RingSystemRenderer(object, this);
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
