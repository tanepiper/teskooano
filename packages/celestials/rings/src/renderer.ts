import type {
  RenderableCelestialObject,
  RendererBackend,
} from "@teskooano/data-types";
import { RingSystemConfiguration } from "@teskooano/data-types";
import * as THREE from "three";

import {
  BaseCelestialRenderer,
  type CelestialMeshOptions,
  GeometryUtilities,
  type LightSourcesMap,
  LODLevel,
} from "@teskooano/renderer-threejs-celestial";
import { AccretionDiskMaterial, RingMaterial } from "./material";
import { RingMaterialFactory } from "./material-factory";
import { calculateKeplerianRotationRate } from "./utils";

/**
 * Renderer for planetary ring systems
 *
 * This renderer extends BaseCelestialRenderer to provide consistent behavior
 * with other celestial renderers and proper LOD support.
 */
export class RingSystemRenderer extends BaseCelestialRenderer<RingMaterial> {
  /**
   * Map of ring materials by object ID and ring index
   */
  private ringMaterials: Map<string, THREE.Material> = new Map();

  /**
   * Parent renderer that owns this ring system
   * Used for material registration and coordination
   */
  private parentRenderer?: BaseCelestialRenderer;

  /**
   * Track which accretion disks have been logged to avoid duplicate messages
   */
  private loggedAccretionDisks: Set<string> = new Set();

  /**
   * Store references to ring meshes for shadow casting registration
   */
  private ringMeshes: Map<string, THREE.Object3D[]> = new Map();

  /**
   * Ring system configuration for enhanced controls
   */
  private ringSystemConfig?: RingSystemConfiguration;

  /**
   * Material factory for creating renderer-aware materials
   */
  private materialFactory: RingMaterialFactory;

  /**
   * Renderer backend (webgl or webgpu)
   */
  private rendererBackend: RendererBackend;

  /**
   * Create a new ring system renderer
   *
   * @param object The celestial object for this ring system
   * @param parentRenderer Optional parent renderer that owns this ring system
   */
  constructor(
    object: RenderableCelestialObject,
    parentRenderer?: BaseCelestialRenderer,
    rendererBackend: RendererBackend = "webgpu",
  ) {
    super(object);
    this.parentRenderer = parentRenderer;
    this.rendererBackend = rendererBackend;
    this.materialFactory = new RingMaterialFactory();
  }

  /**
   * Gets ring data from either the new ringSystem configuration or legacy rings property
   */
  private getRingData(
    object: RenderableCelestialObject,
  ): RingSystemConfiguration | null {
    const properties = object.properties as any;

    // Check for new ring system configuration first
    if (properties?.ringSystem) {
      return properties.ringSystem as RingSystemConfiguration;
    }

    // Fall back to legacy rings property
    if (properties?.rings && properties.rings.length > 0) {
      return {
        rings: properties.rings,
        inheritParentTilt: true,
        unifiedRendering: true,
      };
    }

    return null;
  }

  /**
   * Creates and returns LOD levels for the ring system
   *
   * @param object The celestial object with ring properties
   * @param options Options for creating the mesh, including parentLODDistances for backward compatibility
   * @returns Array of LOD levels
   */
  getLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & { parentLODDistances?: number[] },
  ): LODLevel[] {
    const ringData = this.getRingData(object);

    if (!ringData?.rings || ringData.rings.length === 0) {
      console.warn(`[RingSystemRenderer] No ring data found for ${object.id}`);
      const emptyGroup = new THREE.Group();
      emptyGroup.name = `${object.id}-no-rings-empty`;
      return [{ object: emptyGroup, distance: 0 }];
    }

    // Store the ring system configuration for later use
    this.ringSystemConfig = ringData;

    // Check if we should use the legacy mode with parentLODDistances
    if (options?.parentLODDistances && options.parentLODDistances.length > 0) {
      return this._createLegacyLODLevels(object, options);
    }

    // Create LOD levels with different detail
    const highDetailGroup = this._createRingGroup(object, {
      ...options,
      detailLevel: "high",
      segments:
        options?.segments ??
        GeometryUtilities.getOptimizedRingSegments("high", 64),
    });

    const mediumDetailGroup = this._createRingGroup(object, {
      ...options,
      detailLevel: "medium",
      segments: options?.segments
        ? Math.floor(options.segments / 2)
        : GeometryUtilities.getOptimizedRingSegments("medium", 32),
    });

    const lowDetailGroup = this._createRingGroup(object, {
      ...options,
      detailLevel: "low",
      segments: options?.segments
        ? Math.floor(options.segments / 4)
        : GeometryUtilities.getOptimizedRingSegments("low", 16),
    });

    // Calculate LOD distances based on object radius
    const objectRadius = object.radius ?? 1;
    const baseDistance = objectRadius * 10;

    return [
      { object: highDetailGroup, distance: 0 },
      { object: mediumDetailGroup, distance: baseDistance },
      { object: lowDetailGroup, distance: baseDistance * 3 },
    ];
  }

  /**
   * Creates LOD levels using the legacy approach with parentLODDistances
   * This maintains backward compatibility with existing parent renderers
   *
   * @param object The celestial object
   * @param options Options including parentLODDistances
   * @returns Array of LOD levels
   * @private
   */
  private _createLegacyLODLevels(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions & { parentLODDistances?: number[] },
  ): LODLevel[] {
    const detailedRingGroup = this._createRingGroup(object, options);
    const level0: LODLevel = { object: detailedRingGroup, distance: 0 };

    const lodLevels = [level0];

    if (options?.parentLODDistances && options.parentLODDistances.length > 0) {
      options.parentLODDistances.forEach((distance, index) => {
        if (distance > 0) {
          const emptyGroup = new THREE.Group();
          emptyGroup.name = `${object.id}-ring-lod-${index + 1}-empty`;
          lodLevels.push({ object: emptyGroup, distance: distance });
        } else if (index > 0) {
          console.warn(
            `[RingSystemRenderer] Parent LOD distance ${index} is 0, creating empty group anyway.`,
          );
          const emptyGroup = new THREE.Group();
          emptyGroup.name = `${object.id}-ring-lod-${index + 1}-empty`;

          lodLevels.push({ object: emptyGroup, distance: 0.001 * (index + 1) });
        }
      });
    } else {
      console.warn(
        `[RingSystemRenderer] No parentLODDistances provided for ${object.id}. Rings will always render at high detail.`,
      );
    }

    return lodLevels;
  }

  /**
   * Initialize the ring system for a celestial object
   *
   * @param object The celestial object
   * @param options Options for creating the mesh
   */
  public initialize(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): void {
    // Create LOD levels
    const lodLevels = this.getLODLevels(object, options);

    // Create THREE.LOD object
    const lod = new THREE.LOD();
    lod.name = `${object.id}-rings-lod`;

    // Add LOD levels
    lodLevels.forEach((level) => {
      lod.addLevel(level.object, level.distance);
    });

    // After a certain distance, rings are not visible, so we add an empty object.
    const emptyGroup = new THREE.Group();
    lod.addLevel(emptyGroup, 20000 * (object.radius ?? 1));

    // Store LOD object
    this.lodManager.registerLOD(object.id, lod);
    // The LOD object itself is not returned because the levels are managed internally.
    // The LOD object needs to be added to the scene, which is handled by the consumer
    // of this renderer. This method simply prepares the LOD object.
  }

  /**
   * Create a ring group with the specified options
   *
   * @param object The celestial object
   * @param options Options for creating the mesh
   * @returns THREE.Group containing ring meshes
   * @private
   */
  private _createRingGroup(
    object: RenderableCelestialObject,
    options?: CelestialMeshOptions,
  ): THREE.Group {
    const ringGroup = new THREE.Group();
    ringGroup.name = `${object.id}-rings`;

    const ringData = this.getRingData(object);
    if (!ringData?.rings || ringData.rings.length === 0) {
      console.warn(`[RingSystemRenderer] No ring data found for ${object.id}`);
      return ringGroup;
    }

    const parentRadius = object.realRadius_m;
    if (!parentRadius) {
      console.warn(
        `[RingSystemRenderer] Cannot create rings for ${object.id} because it has no 'realRadius_m' property for scaling.`,
      );
      return ringGroup;
    }

    const sortedRings = [...ringData.rings].sort(
      (a, b) => (a.innerRadius || 0) - (b.innerRadius || 0),
    );

    // Get segments based on detail level
    const segments =
      options?.segments ??
      GeometryUtilities.getOptimizedRingSegments(options?.detailLevel, 64);

    // Store ring meshes for shadow casting registration
    const meshesForThisGroup: THREE.Object3D[] = [];

    sortedRings.forEach((ringProps, index) => {
      const scaledInnerRadius =
        (ringProps.innerRadius ?? parentRadius) / parentRadius;
      const scaledOuterRadius =
        (ringProps.outerRadius ?? parentRadius) / parentRadius;
      const ringColor = new THREE.Color(ringProps.color ?? 0xffffff);
      const ringOpacity = ringProps.opacity ?? 0.7;

      // Calculate rotation rate based on ring properties or use Keplerian calculation
      let rotationRate: number;

      if (ringProps.rotationRate !== undefined) {
        // Use provided rotation rate if available
        rotationRate = ringProps.rotationRate;
      } else {
        // Calculate rotation rate based on Keplerian mechanics
        rotationRate = calculateKeplerianRotationRate(
          ringProps.innerRadius ?? parentRadius,
          ringProps.outerRadius ?? parentRadius * 2,
        );
      }

      if (scaledOuterRadius <= scaledInnerRadius) {
        console.warn(
          `[RingSystemRenderer] Invalid ring dimensions for ${object.id}, ring ${index}: Outer radius must be greater than inner radius.`,
        );
        return;
      }

      const ringGeometry = new THREE.RingGeometry(
        scaledInnerRadius,
        scaledOuterRadius,
        segments,
        8,
        0,
        Math.PI * 2,
      );

      // Determine if this is an accretion disk and create appropriate material
      let ringMaterial: THREE.Material;

      if (ringProps.isAccretionDisk) {
        // Create accretion disk material with physics-based properties
        ringMaterial = this.materialFactory.createAccretionDiskMaterial(
          this.rendererBackend,
          ringColor,
          {
            opacity: ringOpacity,
            rotationRate: rotationRate,
            temperature: ringProps.temperature ?? 10000.0,
            accretionRate: ringProps.accretionRate ?? 1e-8,
            emissionType: ringProps.emissionType ?? "thermal",
            isRelativistic: ringProps.isRelativistic ?? false,
            innerEdgeRadius: ringProps.innerEdgeRadius ?? 3.0,
            axialInclination:
              ringProps.axialInclination ??
              ringData.systemAxialInclination ??
              0.0,
            ringTilt: ringProps.ringTilt ?? 0.0,
            inheritParentTilt:
              ringProps.inheritParentTilt ?? ringData.inheritParentTilt ?? true,
          },
        );

        // Only log once per accretion disk creation
        const logKey = `${object.id}-accretion-disk`;
        if (!this.loggedAccretionDisks.has(logKey)) {
          this.loggedAccretionDisks.add(logKey);
          console.log(
            `[RingSystemRenderer] Created accretion disk for ${object.id}, ` +
              `temperature: ${ringProps.temperature ?? 10000}K, ` +
              `accretion rate: ${ringProps.accretionRate ?? 1e-8} M☉/year`,
          );
        }
      } else {
        // Create normal ring material with enhanced axial inclination controls and segmentation
        ringMaterial = this.materialFactory.createRingMaterial(
          this.rendererBackend,
          ringColor,
          {
            opacity: ringOpacity,
            rotationRate: rotationRate,
            axialInclination:
              ringProps.axialInclination ??
              ringData.systemAxialInclination ??
              0.0,
            ringTilt: ringProps.ringTilt ?? 0.0,
            inheritParentTilt:
              ringProps.inheritParentTilt ?? ringData.inheritParentTilt ?? true,
            // Enhanced segmentation parameters
            segmentDensity: ringProps.segmentDensity ?? 50.0,
            segmentWidth: ringProps.segmentWidth ?? 0.8,
            particleDetail: ringProps.particleDetail ?? 0.3,
            densityVariation: ringProps.densityVariation ?? 0.4,
          },
        );
      }

      const materialKey = `${object.id}-ring-${index}`;
      this.ringMaterials.set(materialKey, ringMaterial);

      // Register material with parent renderer if available, otherwise with this renderer
      if (this.parentRenderer) {
        this.parentRenderer.registerMaterial(materialKey, ringMaterial);
      } else {
        this.registerMaterial(materialKey, ringMaterial);
      }

      const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
      ringMesh.name = `${object.id}-ring-${index}`;
      ringMesh.rotation.x = -Math.PI / 2;
      ringGroup.add(ringMesh);

      // Store ring mesh for shadow casting registration
      meshesForThisGroup.push(ringMesh);
    });

    // Store ring meshes for this object
    const objectKey = `${object.id}-${options?.detailLevel || "high"}`;
    this.ringMeshes.set(objectKey, meshesForThisGroup);

    return ringGroup;
  }

  /**
   * Gets ring meshes for a specific detail level.
   * Used by parent renderers to register shadow casters.
   *
   * @param objectId The celestial object ID that owns the rings
   * @param detailLevel The detail level of rings to get (defaults to 'high')
   * @returns Array of ring meshes or undefined if not found
   */
  public getRingMeshes(
    objectId: string,
    detailLevel: string = "high",
  ): THREE.Object3D[] | undefined {
    const objectKey = `${objectId}-${detailLevel}`;
    return this.ringMeshes.get(objectKey);
  }

  /**
   * Registers ring shadow casters with the provided lighting manager.
   * This should be called by parent renderers after ring creation.
   *
   * @param lightingManager The lighting manager to register with
   * @param object The celestial object that owns the rings
   * @param parentObject The parent celestial object that rings orbit around
   * @param detailLevel The detail level of rings to register (defaults to 'high')
   */
  public registerWithLightingManager(
    lightingManager: any,
    object: RenderableCelestialObject,
    parentObject: RenderableCelestialObject,
    detailLevel: string = "high",
  ): void {
    const ringMeshes = this.getRingMeshes(object.id, detailLevel);

    if (!ringMeshes || ringMeshes.length === 0) {
      return;
    }

    if (
      lightingManager &&
      typeof lightingManager.registerRingShadowCasters === "function"
    ) {
      lightingManager.registerRingShadowCasters(
        `${object.id}-rings`,
        ringMeshes,
        object,
        parentObject,
      );
    }
  }

  /**
   * Update the ring system
   *
   * @param object The celestial object
   * @param time Current simulation time
   * @param timeScale Current time scale
   * @param lightSources Map of light sources
   * @param camera Scene camera
   * @param allObjects Map of all objects in the scene
   * @param allMeshes Map of all meshes in the scene
   */
  update(
    object: RenderableCelestialObject,
    time: number,
    timeScale: number,
    lightSources: LightSourcesMap,
    camera: THREE.PerspectiveCamera,
    allObjects?: Record<string, RenderableCelestialObject>,
  ): void {
    super.update(object, time, timeScale, lightSources, camera);

    // Calculate dynamic ambient light based on nearby stars
    const dynamicAmbientIntensity =
      this.lightingManager.calculateDynamicAmbientLight();

    if (this.ringMaterials && this.ringMaterials.size > 0) {
      // Find shadow casters using centralized utility
      const shadowCasters = this.findRingShadowCasters();

      // Get parent axial tilt if available
      let parentAxialTilt: THREE.Vector3 | undefined;
      if (this.ringSystemConfig?.inheritParentTilt) {
        // Try to get parent object's axial tilt
        const parentObject = allObjects?.[object.parentId || ""];
        if (parentObject?.axialTilt) {
          if (typeof parentObject.axialTilt === "number") {
            // Convert degrees to radians and create tilt vector
            const tiltRad = parentObject.axialTilt * (Math.PI / 180);
            parentAxialTilt = new THREE.Vector3(
              0,
              Math.cos(tiltRad),
              Math.sin(tiltRad),
            );
            console.log("parentAxialTilt - config", parentAxialTilt);
          } else if (parentObject.axialTilt.x !== undefined) {
            // Convert OSVector3 to THREE.Vector3 for shader uniforms
            parentAxialTilt = new THREE.Vector3(
              parentObject.axialTilt.x,
              parentObject.axialTilt.y,
              parentObject.axialTilt.z,
            );
            console.log("parentAxialTilt - parentObject", parentAxialTilt);
          }
        }
      }

      // Update all ring materials
      this.ringMaterials.forEach((material) => {
        // Update dynamic ambient lighting for GLSL materials
        if ("uniforms" in material && material.uniforms) {
          const uniforms = material.uniforms as any;
          if (uniforms.uDynamicAmbientIntensity) {
            uniforms.uDynamicAmbientIntensity.value = dynamicAmbientIntensity;
          }

          // GLSL material - call update with full parameters
          if ("update" in material && typeof material.update === "function") {
            (material as any).update(
              time,
              object.position,
              object.radius ?? 1.0,
              lightSources,
              shadowCasters,
              parentAxialTilt,
              this.ringSystemConfig?.precessionRate,
            );
          }
        } else if (
          "update" in material &&
          typeof material.update === "function"
        ) {
          // TSL material - call simplified update
          (material as any).update(time, object.position, object.radius ?? 1.0);
        }
      });
    }
  }

  /**
   * Clean up resources used by the renderer
   */
  dispose(): void {
    // Only dispose materials if this is not a child renderer
    if (!this.parentRenderer) {
      this.ringMaterials.forEach((material) => {
        material.dispose();
      });
    }

    this.ringMaterials.clear();
    this.ringMeshes.clear();
    this.loggedAccretionDisks.clear();

    // Call parent dispose method
    super.dispose();
  }
}
