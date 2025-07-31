import type { StarProperties } from "@teskooano/data-types";
import { RenderableCelestialObject } from "@teskooano/data-types";
import {
  BaseCelestialRenderer,
  type BaseCelestialRendererOptions,
  type CelestialMeshOptions,
  type LightSourcesMap,
  GeometryUtilities,
} from "@teskooano/renderer-threejs-celestial";
import { LightingManager } from "@teskooano/renderer-threejs-lighting";
import type { LODLevel } from "@teskooano/renderer-threejs-lod";
import * as THREE from "three";
import enhancedStarVertexShader from "../shaders/enhanced-star.vertex.glsl?raw";
import enhancedStarFragmentShader from "../shaders/enhanced-star.fragment.glsl?raw";
import coronaVertexShader from "../shaders/corona.vertex.glsl?raw";
import coronaFragmentShader from "../shaders/corona.fragment.glsl?raw";
import { utils } from "@teskooano/core-math";

/**
 * Base material for stars with enhanced shader effects
 */
export abstract class BaseStarMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      // Basic plasma noise parameters
      noiseScale?: number;
      noiseIntensity?: number;
      plasmaTurbulence?: number;

      // Uniform lighting
      lightingIntensity?: number;
    } = {},
  ) {
    super({
      vertexShader: enhancedStarVertexShader,
      fragmentShader: enhancedStarFragmentShader,
      uniforms: {
        uTime: { value: 0.0 },

        // Colors
        uStarColor: { value: color },
        uHotColor: { value: color.clone().multiplyScalar(1.4) },
        uSurfaceColor: { value: color },
        uCoolColor: { value: color.clone().multiplyScalar(0.3) },

        // Plasma noise parameters
        uNoiseScale: { value: options.noiseScale ?? 1.0 },
        uNoiseIntensity: { value: options.noiseIntensity ?? 0.2 },
        uPlasmaTurbulence: { value: options.plasmaTurbulence ?? 0.1 },

        // Uniform lighting
        uLightingIntensity: { value: options.lightingIntensity ?? 1.0 },
      },
      transparent: false,
      side: THREE.FrontSide,
      depthTest: true,
      depthWrite: true, // Ensure stars write to depth buffer for proper occlusion
      blending: THREE.NormalBlending, // Use normal blending for opaque stars
    });
  }

  /**
   * Update the material with the current time
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    if (this.uniforms.uTime !== undefined) {
      // Create a time scale for visible animation cycles
      // Use a moderate scale to create visible animation cycles
      const animationTime = ((time * timeScale) / 1000) * 0.01; // Scale for visible animation
      this.uniforms.uTime.value = animationTime;
    }
    console.log("base star animationTime", this.uniforms.uTime.value);
  }

  /**
   * Dispose of any resources
   */
  dispose(): void {}
}

/**
 * Material for corona effect around stars
 */
export class CoronaMaterial extends THREE.ShaderMaterial {
  constructor(
    color: THREE.Color = new THREE.Color(0xffff00),
    options: {
      scale?: number;
      opacity?: number;
      pulseSpeed?: number;
      noiseScale?: number;
    } = {},
  ) {
    super({
      uniforms: {
        uTime: { value: 0 },
        uStarColor: { value: color },
        uOpacity: { value: options.opacity ?? 0.6 },
        uPulseSpeed: { value: options.pulseSpeed ?? 0.3 },
        uNoiseScale: { value: options.noiseScale ?? 3.0 },
      },
      vertexShader: coronaVertexShader,
      fragmentShader: coronaFragmentShader,
      transparent: true,
      side: THREE.DoubleSide,
      depthTest: true,
      depthWrite: false, // Corona should not write to depth buffer to avoid interfering with main star
      blending: THREE.AdditiveBlending, // Use additive blending for corona effect
    });
  }

  /**
   * Update the material with the current time
   */
  update(
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
    allMeshes?: Record<string, THREE.Object3D>,
  ): void {
    // Create a much smaller time scale for visible animation cycles
    // Use a very small scale to create fast, visible animation cycles
    const animationTime = ((time * timeScale) / 1000) * 0.001; // Scale down much more for faster animation
    this.uniforms.uTime.value = animationTime;
    console.log("corona animationTime", animationTime);
  }

  /**
   * Dispose of any resources
   */
  dispose(): void {}
}

/**
 * Base class for all star renderers.
 * @template TStarMaterial The specific star material type this renderer works with
 */
export abstract class BaseStarRenderer<
  TStarMaterial extends BaseStarMaterial = BaseStarMaterial,
> extends BaseCelestialRenderer<TStarMaterial> {
  protected coronaMaterials: Map<string, CoronaMaterial[]> = new Map();
  protected starLightingManager?: LightingManager;

  constructor(
    object: RenderableCelestialObject,
    options: BaseCelestialRendererOptions = {},
  ) {
    super(object, options);
    this.starLightingManager = options?.lightingManager;
  }

  /**
   * Abstract method for subclasses to create their specific star material.
   * This is called by the base class's createAndRegisterMaterial method.
   */
  protected abstract createMaterial(
    object: RenderableCelestialObject,
  ): TStarMaterial;

  /**
   * Abstract method for subclasses to provide their custom, high-detail LODs.
   * These will be combined with the standard billboard LOD.
   */
  protected abstract getCustomLODs(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[];

  /**
   * Abstract method for subclasses to define the distance at which the billboard appears.
   */
  protected abstract getBillboardLODDistance(
    object: RenderableCelestialObject,
  ): number;

  get materials(): Map<string, THREE.Material | THREE.Material[]> {
    return this.materialManager.materials;
  }

  setMaterialUniforms(key: string, uniform: THREE.Uniform) {
    const material = this.materialManager.getMaterial(
      key,
    ) as THREE.ShaderMaterial;
    if (material) {
      material.uniforms[key] = uniform;
    }
  }

  /**
   * Assembles and returns all LOD levels for the star, combining custom meshes
   * with a standard billboard for distant viewing.
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): LODLevel[] {
    const customLODs = this.getCustomLODs(object, options);
    const billboardDistance = this.getBillboardLODDistance(object);
    const starColor = this.getStarColor(object);

    const billboardLOD = this.billboardManager.createBillboardLOD(object, {
      distance: billboardDistance,
      size: 0.05,
      color: starColor,
      albedo: 1.0, // Stars are emissive
    });

    return [...customLODs, billboardLOD].sort(
      (a, b) => a.distance - b.distance,
    );
  }

  /**
   * Creates a group containing the corona meshes for a star.
   * This is separated to allow reuse in LOD generation.
   * @internal
   */
  protected _createCoronaGroup(object: RenderableCelestialObject): THREE.Group {
    const coronaGroup = new THREE.Group();
    coronaGroup.name = `${object.celestialObjectId}-corona-group`;
    this._addCoronaToGroup(object, coronaGroup);
    return coronaGroup;
  }

  /**
   * Add corona effect to a given group.
   * @internal
   */
  protected _addCoronaToGroup(
    object: RenderableCelestialObject,
    group: THREE.Group,
  ): void {
    const starColor = this.getStarColor(object);
    const coronaMaterials: CoronaMaterial[] = [];

    this.coronaMaterials.set(object.celestialObjectId, coronaMaterials);

    const coronaScales = [1.1, 1.2];
    const opacities = [0.1, 0.05];

    coronaScales.forEach((scale, index) => {
      const coronaRadius = object.radius * scale;
      const coronaSegments = GeometryUtilities.getOptimizedStarSegments(
        "high",
        128,
      );
      const coronaGeometry = new THREE.SphereGeometry(
        coronaRadius,
        coronaSegments,
        coronaSegments,
      );
      const coronaMaterial = new CoronaMaterial(starColor, {
        scale: scale,
        opacity: opacities[index],
        pulseSpeed: 0.12 + index * 0.03,
        noiseScale: 1.2 + index * 0.3,
      });
      coronaMaterials.push(coronaMaterial);
      const coronaMesh = new THREE.Mesh(coronaGeometry, coronaMaterial);
      coronaMesh.name = `${object.celestialObjectId}-corona-${index}`;
      coronaMesh.material.depthWrite = false;
      coronaMesh.material.side = THREE.DoubleSide;
      group.add(coronaMesh);
    });
  }

  /**
   * Gets the color of the star from its properties.
   * @param object The celestial object.
   * @returns A THREE.Color instance.
   */
  protected getStarColor(object: RenderableCelestialObject): THREE.Color {
    const properties = object.properties as StarProperties;
    const colorValue = properties?.color || [1, 1, 1];
    // Ensure values are numbers before passing to constructor
    return new THREE.Color(
      Number(colorValue[0]),
      Number(colorValue[1]),
      Number(colorValue[2]),
    );
  }

  /**
   * The update loop for the star renderer.
   */
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

    const material = this.getMaterial(
      object.celestialObjectId,
    ) as TStarMaterial;
    if (material) {
      // Update material with current time
      if (material.update) {
        material.update(
          time * timeScale,
          timeScale,
          lightSources,
          camera,
          allObjects,
          allMeshes,
        );
      }

      // Update star colors from top-level properties (only if uniforms exist)
      const starProps = object.properties as StarProperties;
      if (starProps?.color && material.uniforms.uStarColor) {
        if (typeof starProps.color === "string") {
          material.uniforms.uStarColor.value.set(starProps.color);
        }
      }

      if (starProps?.hotColor && material.uniforms.uHotColor) {
        if (typeof starProps.hotColor === "string") {
          material.uniforms.uHotColor.value.set(starProps.hotColor);
        }
      }

      if (starProps?.surfaceColor && material.uniforms.uSurfaceColor) {
        if (typeof starProps.surfaceColor === "string") {
          material.uniforms.uSurfaceColor.value.set(starProps.surfaceColor);
        }
      }

      if (starProps?.coolColor && material.uniforms.uCoolColor) {
        if (typeof starProps.coolColor === "string") {
          material.uniforms.uCoolColor.value.set(starProps.coolColor);
        }
      }

      // Update noise parameters if they exist
      if (starProps?.materialParams) {
        this._updateStarMaterialUniforms(material, starProps.materialParams);
      }

      // Update time uniform if it exists (different materials may have different time uniform names)
      // Removed redundant uTime update here, as BaseStarMaterial's update method handles it.
      // if (material.uniforms.uTime) {
      //   // Create a much smaller time scale for visible animation cycles
      //   // Use a very small scale to create fast, visible animation cycles
      //   const animationTime = ((time * timeScale) / 1000) * 1e-8; // Scale down much more for faster animation
      //   material.uniforms.uTime.value = animationTime;
      // } else if (material.uniforms.time) {
      //   // Create a much smaller time scale for visible animation cycles
      //   // Use a very small scale to create fast, visible animation cycles
      //   const animationTime = ((time * timeScale) / 1000) * 1e-8; // Scale down much more for faster animation
      //   material.uniforms.time.value = animationTime;
      // }
    }
  }

  /**
   * Update material uniforms from star properties
   */
  private _updateStarMaterialUniforms(
    material: TStarMaterial,
    materialParams: any,
  ): void {
    const updateUniform = (uniformName: string, value: any) => {
      if (material.uniforms[uniformName] && value !== undefined) {
        material.uniforms[uniformName].value = value;
      }
    };

    // Update noise parameters
    updateUniform("uNoiseScale", materialParams.noiseScale);
    updateUniform("uNoiseIntensity", materialParams.noiseIntensity);
    updateUniform("uPlasmaTurbulence", materialParams.plasmaTurbulence);

    // Update lighting
    updateUniform("uLightingIntensity", materialParams.lightingIntensity);
  }

  /**
   * Helper method to update a uniform if it exists and the value is defined
   */
  private _updateUniformIfDefined(
    material: TStarMaterial,
    uniformName: string,
    value: any,
  ): void {
    if (material.uniforms[uniformName] && value !== undefined) {
      material.uniforms[uniformName].value = value;
    }
  }

  public override dispose(): void {
    super.dispose();
    this.materialManager.dispose();
    this.coronaMaterials.forEach((materials) => {
      materials.forEach((material) => material.dispose());
    });
    this.coronaMaterials.clear();
  }
}
