import type { StarProperties } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/renderer-threejs";
import * as THREE from "three";
import type {
  CelestialMeshOptions,
  LightSourceData,
  LODLevel,
} from "../../common/types";
import { CelestialRenderer } from "../../common/CelestialRenderer";
import { BaseCelestialRenderer } from "../../common/BaseCelestialRenderer";
import {
  createBillboardLODLevel,
  createBillboardPointLight,
  createBillboardSprite,
  createBillboardTexture,
  calculateDistantSpriteSize,
} from "./billboard-utils";
import { CoronaMaterial } from "./base-star.material";
import { getStarColor } from "./star-color-utils";
import { BillboardInfo } from "./types";

/**
 * @module BaseStarRenderer
 * @description Abstract base class for rendering stars in a 3D scene.
 * It manages Level of Detail (LOD) for stars, transitioning from a detailed 3D model
 * at close distances to a 2D billboard sprite when far away.
 * This class provides foundational structures for star materials, corona effects,
 * and billboard management, which can be extended by specific star type renderers
 * (e.g., MainSequenceStarRenderer, RedGiantRenderer).
 *
 * Key responsibilities include:
 * - Defining the LOD structure, including a billboard for distant viewing.
 * - Handling the creation and update of star-specific shader materials.
 * - Managing corona effects and their materials.
 * - Providing a mechanism for subclasses to define custom LODs and billboard behavior.
 * - Updating animations and visual properties over time.
 * - Disposing of THREE.js resources when the renderer is no longer needed.
 */
export abstract class BaseStarRenderer extends BaseCelestialRenderer {
  /** Map to store primary shader materials for star bodies, keyed by celestial object ID. */
  protected starBodyMaterials: Map<string, THREE.ShaderMaterial> = new Map();
  /** Map to store arrays of CoronaMaterial instances for corona effects, keyed by celestial object ID. */
  protected coronaMaterials: Map<string, CoronaMaterial[]> = new Map();
  /** @deprecated Map to store glow materials, potentially for effects not covered by corona. Consider refactoring or removing. */
  private glowMaterials: Map<string, THREE.ShaderMaterial[]> = new Map();
  /** Map to store BillboardInfo for managing dynamic billboard properties, keyed by celestial object ID. */
  protected billboardsInfo: Map<string, BillboardInfo> = new Map();

  /** The renderable celestial object data this renderer is responsible for. */
  protected object: RenderableCelestialObject;
  /** Options configuring the rendering of the celestial object, such as detail level and effects. */
  protected options: CelestialMeshOptions;
  /** @internal Flag to control whether LOD is enabled for this renderer instance. */
  protected _internalEnableLOD: boolean;
  /** @internal Flag to indicate if this renderer should only render as a billboard. */
  protected _internalIsBillboard: boolean;
  /** @internal Flag to disable automatic rotation, if managed externally. */
  protected _internalDisableAutomaticRotation: boolean;

  /**
   * Constructs a BaseStarRenderer instance.
   * @param {RenderableCelestialObject} object - The data for the celestial object to be rendered.
   * @param {CelestialMeshOptions & { enableLOD?: boolean; isBillboard?: boolean; disableAutomaticRotation?: boolean; enableCorona?: boolean; }} [options] - Optional configuration for rendering.
   */
  constructor(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & {
      enableLOD?: boolean;
      isBillboard?: boolean;
      disableAutomaticRotation?: boolean;
      enableCorona?: boolean;
    },
  ) {
    super();
    this.object = object;
    this._internalEnableLOD = options?.enableLOD ?? true;
    this._internalIsBillboard = options?.isBillboard ?? false;
    this._internalDisableAutomaticRotation =
      options?.disableAutomaticRotation ?? false;

    const standardOptions: CelestialMeshOptions = { ...options };
    delete (standardOptions as any).enableLOD;
    delete (standardOptions as any).isBillboard;
    delete (standardOptions as any).disableAutomaticRotation;
    if (
      options?.enableCorona !== undefined &&
      standardOptions.includeEffects === undefined
    ) {
      standardOptions.includeEffects = options.enableCorona;
    }
    delete (standardOptions as any).enableCorona;

    this.options = standardOptions;
    this.trackObject(object.celestialObjectId);
  }

  /**
   * Abstract method to be implemented by subclasses.
   * Should return an array of custom LODLevels (typically high and medium detail meshes)
   * for the specific star type. These levels are combined with the base billboard LOD.
   * @param {RenderableCelestialObject} object - The celestial object data.
   * @param {CelestialMeshOptions} [options] - Rendering options.
   * @returns {LODLevel[]} An array of LODLevel objects, sorted from closest to farthest.
   */
  protected abstract getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  /**
   * Abstract method to be implemented by subclasses.
   * Should return the distance at which the billboard LOD (lowest detail) becomes active.
   * @param {RenderableCelestialObject} object - The celestial object data.
   * @returns {number} The activation distance for the billboard LOD.
   */
  protected abstract getBillboardLODDistance(
    object: RenderableCelestialObject,
  ): number;

  /**
   * Abstract method for subclasses to provide the vertex shader for corona effects.
   * @param {RenderableCelestialObject} object - The celestial object data.
   * @returns {string} The GLSL vertex shader code for the corona.
   */
  protected abstract getCoronaVertexShader(
    object: RenderableCelestialObject,
  ): string;

  /**
   * Abstract method for subclasses to provide the fragment shader for corona effects.
   * @param {RenderableCelestialObject} object - The celestial object data.
   * @returns {string} The GLSL fragment shader code for the corona.
   */
  protected abstract getCoronaFragmentShader(
    object: RenderableCelestialObject,
  ): string;

  /**
   * Assembles and returns all LOD levels for the star, including custom mesh levels
   * from subclasses and a base billboard level for distant viewing.
   * The billboard uses a dynamically generated texture and a point light.
   * @param {RenderableCelestialObject} object - The celestial object data.
   * @param {CelestialMeshOptions} [options] - Rendering options.
   * @returns {LODLevel[]} An array of all LODLevel objects, sorted by distance.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const customLODs = this.getCustomLODs(object, options);
    const billboardDistance = this.getBillboardLODDistance(object);
    const starColor = this.getStarColor(object);
    const starMaterial = this.getMaterial(object);

    const circleTexture = createBillboardTexture();

    let distantPointSize: number;
    if (typeof (this as any).calculateBillboardSize === "function") {
      distantPointSize = (this as any).calculateBillboardSize(object);
    } else {
      distantPointSize = calculateDistantSpriteSize(object);
    }

    const distantSprite = createBillboardSprite(
      object,
      circleTexture,
      distantPointSize,
      starColor,
    );
    const pointLight = createBillboardPointLight(
      object,
      starColor,
      starMaterial,
    );
    const billboardLOD = createBillboardLODLevel(
      object,
      distantSprite,
      pointLight,
      billboardDistance,
    );

    this.billboardsInfo.set(object.celestialObjectId, {
      sprite: distantSprite,
      activationDistance: billboardDistance,
      maxFadeDistance: billboardDistance * 5,
    });

    return [...customLODs, billboardLOD].sort(
      (a, b) => a.distance - b.distance,
    );
  }

  /**
   * Creates the high-detail THREE.Group for the star, typically used as the closest LOD (Level 0).
   * This group includes the main star mesh (SphereGeometry) and its associated material,
   * as well as corona effects if enabled.
   * @protected
   * @param {RenderableCelestialObject} object - The celestial object data.
   * @param {CelestialMeshOptions} [options] - Rendering options.
   * @returns {THREE.Group} The high-detail group for the star.
   */
  protected _createHighDetailGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    const group = new THREE.Group();
    group.name = `${object.celestialObjectId}-high-lod-group`;

    const segments =
      options?.segments ?? (options?.detailLevel === "high" ? 128 : 96);
    const geometry = new THREE.SphereGeometry(
      object.radius,
      segments,
      segments,
    );
    const material = this.getMaterial(object);
    this.starBodyMaterials.set(object.celestialObjectId, material);
    this.registerMaterial(object.celestialObjectId, material);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = `${object.celestialObjectId}-body`;
    group.add(mesh);
    // TODO: Consider making corona scales and base opacity configurable or dynamic
    this.addCorona(group, object, [1.1, 1.2], 0.1);
    return group;
  }

  /**
   * Adds corona effects to the star's visual representation.
   * Creates multiple layers of corona planes with varying scales and opacities.
   * Uses CoronaMaterial for the shader effects.
   * @protected
   * @param {THREE.Group} group - The parent group to which corona planes will be added.
   * @param {RenderableCelestialObject} object - The celestial object data.
   * @param {number[]} coronaScales - An array of scales for different corona layers.
   * @param {number} baseOpacity - The base opacity for the corona layers, which is then modulated.
   * @param {{ vertex: string; fragment: string; }} [shaderOverride] - Optional custom shaders for the corona.
   */
  protected addCorona(
    group: THREE.Group,
    object: RenderableCelestialObject,
    coronaScales: number[],
    baseOpacity: number,
    shaderOverride?: {
      vertex: string;
      fragment: string;
    },
  ): void {
    if (this.options.includeEffects === false) return;

    const coronaInstances: CoronaMaterial[] = [];
    const starColor = this.getStarColor(object);
    const properties = object.properties as StarProperties;
    const coronaUniforms = properties.shaderUniforms?.corona;
    const timeOffset = properties.timeOffset;

    const defaultVertex =
      shaderOverride?.vertex ?? this.getCoronaVertexShader(object);
    const defaultFragment =
      shaderOverride?.fragment ?? this.getCoronaFragmentShader(object);

    for (let i = 0; i < coronaScales.length; i++) {
      for (let j = 0; j < 3; j++) {
        const materialOptions = {
          scale: coronaScales[i],
          opacity: baseOpacity / (i + 1),
          pulseSpeed: coronaUniforms?.pulseSpeed,
          noiseScale: coronaUniforms?.noiseScale,
          noiseEvolutionSpeed: coronaUniforms?.noiseEvolutionSpeed,
          timeOffset: timeOffset,
        };

        const cleanMaterialOptions = Object.fromEntries(
          Object.entries(materialOptions).filter(
            ([, value]) => value !== undefined,
          ),
        ) as typeof materialOptions;

        const coronaMaterial = new CoronaMaterial(
          starColor,
          cleanMaterialOptions,
          defaultVertex,
          defaultFragment,
        );
        coronaInstances.push(coronaMaterial);

        // Use SphereGeometry instead of PlaneGeometry for a volumetric corona
        const sphereGeo = new THREE.SphereGeometry(1, 32, 16); // Radius 1, 32 width segments, 16 height segments
        const sphereMesh = new THREE.Mesh(sphereGeo, coronaMaterial);

        // Scale the sphere uniformly relative to the star's radius.
        // coronaScales[i] now acts as a multiplier for the object.radius.
        const scaleFactor = object.radius * coronaScales[i];
        sphereMesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
        sphereMesh.name = `corona_sphere_${i}_${j}`;
        group.add(sphereMesh);
      }
    }
    this.coronaMaterials.set(object.celestialObjectId, coronaInstances);
  }

  /**
   * Abstract method to be implemented by subclasses.
   * Should return the primary THREE.ShaderMaterial for the star's body.
   * @param {RenderableCelestialObject} object - The celestial object data.
   * @returns {THREE.ShaderMaterial} The shader material for the star.
   */
  protected abstract getMaterial(
    object: RenderableCelestialObject,
  ): THREE.ShaderMaterial;

  /**
   * Updates the renderer's state based on the elapsed time and camera position.
   * This method handles:
   * - Updating time-dependent uniforms in shader materials (star body, corona).
   * - Dynamically adjusting billboard sprite opacity for smooth LOD transitions.
   * - Explicitly managing billboard sprite visibility based on its opacity.
   * @param {number} time - The current global simulation time (often ignored in favor of internally calculated elapsed time).
   * @param {Map<string, LightSourceData>} [lightSources] - Optional map of light sources in the scene (currently unused in BaseStarRenderer).
   * @param {THREE.Camera} [camera] - The active camera, used for distance calculations for billboard fading.
   */
  update(
    time: number, // Note: elapsedTime is used internally for shader time
    lightSources?: Map<string, LightSourceData>,
    camera?: THREE.Camera,
  ): void {
    super.update(time, lightSources, camera);

    this.starBodyMaterials.forEach((material: any) => {
      if (typeof material.update === "function") {
        material.update(this.elapsedTime);
      }
    });

    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.update(this.elapsedTime);
      });
    });

    this.glowMaterials.forEach((materials) => {
      materials.forEach((material: any) => {
        if (material.uniforms && material.uniforms.time) {
          material.uniforms.time.value = this.elapsedTime;
        }
      });
    });

    if (camera && this.billboardsInfo.size > 0) {
      const cameraPosition = new THREE.Vector3();
      camera.getWorldPosition(cameraPosition);

      this.billboardsInfo.forEach((info) => {
        const { sprite, activationDistance } = info;
        const material = sprite.material as THREE.SpriteMaterial;
        if (!material) return;

        const spriteWorldPosition = new THREE.Vector3();
        sprite.getWorldPosition(spriteWorldPosition);
        const distanceToCamera = cameraPosition.distanceTo(spriteWorldPosition);

        let targetOpacity;
        const baseSpriteOpacity = 0.85;

        if (distanceToCamera >= activationDistance) {
          targetOpacity = baseSpriteOpacity;
        } else {
          targetOpacity = 0.0;
        }

        const currentOpacity = material.opacity;
        let newOpacity = THREE.MathUtils.lerp(
          currentOpacity,
          targetOpacity,
          0.1,
        );

        if (targetOpacity < 0.01 && newOpacity < 0.01) {
          newOpacity = 0;
        }
        material.opacity = newOpacity;
        sprite.visible = newOpacity > 0.001;
      });
    }
  }

  /**
   * Cleans up and disposes of all THREE.js resources (materials, textures, geometries)
   * managed by this renderer instance. This should be called when the renderer
   * is no longer needed to prevent memory leaks.
   */
  dispose(): void {
    this.starBodyMaterials.forEach((material: any) => {
      if (typeof material.dispose === "function") {
        material.dispose();
      }
    });
    this.starBodyMaterials.clear();

    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material) => {
        material.dispose();
      });
    });
    this.coronaMaterials.clear();

    this.glowMaterials.forEach((materials) => {
      materials.forEach((material: any) => {
        if (typeof material.dispose === "function") {
          material.dispose();
        }
      });
    });
    this.glowMaterials.clear();

    // Clear textures associated with billboards if they are CanvasTexture
    this.billboardsInfo.forEach(({ sprite }) => {
      if (
        sprite.material.map &&
        sprite.material.map instanceof THREE.CanvasTexture
      ) {
        sprite.material.map.dispose();
      }
      sprite.material.dispose();
    });

    this.billboardsInfo.clear();

    super.dispose();
  }

  /**
   * Retrieves the star's color. This method is a wrapper around the utility function.
   * @param {RenderableCelestialObject} object - The renderable celestial object.
   * @returns {THREE.Color} The color of the star.
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    return getStarColor(object);
  }

  /**
   * Placeholder for gravitational lensing effects. Base stars do not typically have this.
   * Subclasses like black hole or neutron star renderers should override this method
   * if they implement gravitational lensing.
   * @param {RenderableCelestialObject} objectData - The data for the celestial object.
   * @param {THREE.WebGLRenderer} renderer - The main WebGLRenderer instance.
   * @param {THREE.Scene} scene - The main Three.js scene.
   * @param {THREE.PerspectiveCamera} camera - The main Three.js camera.
   * @param {THREE.Object3D} mesh - The specific Three.js mesh/Object3D for the celestial object.
   */
  addGravitationalLensing(
    objectData: RenderableCelestialObject,
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    mesh: THREE.Object3D,
  ): void {}
}
