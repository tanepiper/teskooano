import * as THREE from "three";
import { CelestialObject } from "./celestial-object";
import {
  BasicRendererOptions,
  CelestialRenderer,
  LODLevel,
  CelestialPhysicalProperties,
  Billboard,
} from "./types";
import { OSVector3 } from "@teskooano/core-math";
import { DefaultBillboard } from "./default-billboard";

// Default values for LOD distances (these are factors multiplied by radius)
const DEFAULT_MEDIUM_DETAIL_DISTANCE = 20;
const DEFAULT_LOW_DETAIL_DISTANCE = 50;
const DEFAULT_BILLBOARD_DISTANCE = 100;
// const DEFAULT_BILLBOARD_LIGHT_INTENSITY = 1.0; // No longer used here, handled by DefaultBillboard or config

// Constants for geometry
const HIGH_DETAIL_SEGMENTS = 32;
const MEDIUM_DETAIL_SEGMENTS = 16;
const LOW_DETAIL_SEGMENTS = 8;
// const BILLBOARD_SIZE = 0.5; // No longer used here, handled by billboard generator/config

/**
 * A basic fallback renderer for celestial objects with multiple LOD support.
 * Each LOD level is a THREE.Group, allowing for complex compositions (mesh, lights, effects).
 * Subclasses should override the `create...DetailGroupLOD` methods for main visuals.
 * Billboard is handled by a configurable Billboard generator.
 * LOD distances and billboard settings can be configured via the `options` parameter.
 */
export class BasicCelestialRenderer implements CelestialRenderer {
  public lod: THREE.LOD;
  private celestial: CelestialObject;

  private highDetailGroup!: THREE.Group;
  private mediumDetailGroup!: THREE.Group;
  private lowDetailGroup!: THREE.Group;
  private billboardLODObject!: THREE.Object3D; // Stores the object part of the billboard LODLevel

  private options: BasicRendererOptions;
  private billboardGenerator: Billboard;

  /**
   * Creates an instance of BasicCelestialRenderer.
   * @param celestial The celestial object to render.
   * @param radius The radius of the celestial object, used for scaling default geometry and distances.
   * @param color The base color for default visual elements.
   * @param options Optional configuration for LOD distances and other renderer-specific settings.
   */
  constructor(
    celestial: CelestialObject,
    radius: number = 1,
    color: number = 0xffffff,
    options?: BasicRendererOptions,
  ) {
    this.celestial = celestial;
    this.lod = new THREE.LOD();
    this.options = options ?? {}; // Ensure options is an object

    this.billboardGenerator =
      this.options.billboardGenerator ?? new DefaultBillboard();

    this.createLODs(radius, color);
    this.update();
  }

  protected createLODs(radius: number, color: number): void {
    const mediumDetailDistanceFactor =
      this.options?.lodDistances?.medium ?? DEFAULT_MEDIUM_DETAIL_DISTANCE;
    const lowDetailDistanceFactor =
      this.options?.lodDistances?.low ?? DEFAULT_LOW_DETAIL_DISTANCE;
    const billboardDistanceFactor =
      this.options?.lodDistances?.billboard ?? DEFAULT_BILLBOARD_DISTANCE;

    this.highDetailGroup = this.createHighDetailGroupLOD(radius, color);
    this.lod.addLevel(this.highDetailGroup, 0);

    this.mediumDetailGroup = this.createMediumDetailGroupLOD(radius, color);
    this.lod.addLevel(
      this.mediumDetailGroup,
      radius * mediumDetailDistanceFactor,
    );

    this.lowDetailGroup = this.createLowDetailGroupLOD(radius, color);
    this.lod.addLevel(this.lowDetailGroup, radius * lowDetailDistanceFactor);

    const billboardLOD = this.createBillboardLOD(
      billboardDistanceFactor,
      color,
    );
    this.billboardLODObject = billboardLOD.object; // Store for disposal
    // Use distance from the returned LODLevel, which should match billboardActivationDistance
    this.lod.addLevel(billboardLOD.object, billboardLOD.distance);
  }

  /**
   * Creates the high-detail group for the closest LOD level.
   * Override this method in subclasses to provide a custom THREE.Group with high-detail visuals.
   * @param radius The radius of the celestial object, can be used for scaling elements.
   * @param color The base color for default elements.
   * @returns A THREE.Group for the high-detail LOD.
   */
  protected createHighDetailGroupLOD(
    radius: number,
    color: number,
  ): THREE.Group {
    console.warn(
      `BasicCelestialRenderer: createHighDetailGroupLOD is using the default base implementation for ${this.celestial.name || this.celestial.id}. Consider overriding it.`,
    );
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(
      radius,
      HIGH_DETAIL_SEGMENTS,
      HIGH_DETAIL_SEGMENTS,
    );
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    return group;
  }

  /**
   * Creates the medium-detail group.
   * Override this method in subclasses to provide a custom THREE.Group with medium-detail visuals.
   * @param radius The radius of the celestial object.
   * @param color The base color for default elements.
   * @returns A THREE.Group for the medium-detail LOD.
   */
  protected createMediumDetailGroupLOD(
    radius: number,
    color: number,
  ): THREE.Group {
    console.warn(
      `BasicCelestialRenderer: createMediumDetailGroupLOD is using the default base implementation for ${this.celestial.name || this.celestial.id}. Consider overriding it.`,
    );
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(
      radius,
      MEDIUM_DETAIL_SEGMENTS,
      MEDIUM_DETAIL_SEGMENTS,
    );
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    return group;
  }

  /**
   * Creates the low-detail group.
   * Override this method in subclasses to provide a custom THREE.Group with low-detail visuals.
   * @param radius The radius of the celestial object.
   * @param color The base color for default elements.
   * @returns A THREE.Group for the low-detail LOD.
   */
  protected createLowDetailGroupLOD(
    radius: number,
    color: number,
  ): THREE.Group {
    console.warn(
      `BasicCelestialRenderer: createLowDetailGroupLOD is using the default base implementation for ${this.celestial.name || this.celestial.id}. Consider overriding it.`,
    );
    const group = new THREE.Group();
    const geometry = new THREE.SphereGeometry(
      radius,
      LOW_DETAIL_SEGMENTS,
      LOW_DETAIL_SEGMENTS,
    );
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(color),
    });
    const mesh = new THREE.Mesh(geometry, material);
    group.add(mesh);
    return group;
  }

  /**
   * Creates the billboard LODLevel using the configured billboardGenerator.
   * @param objectRadius The radius of the celestial object.
   * @param baseObjectNumericColor The base color for default elements (as a number).
   * @param lodActivationDistance The distance at which this LOD becomes active.
   * @returns An LODLevel object for the billboard.
   */
  protected createBillboardLOD(
    billboardDistanceFactor: number,
    baseObjectNumericColor: number,
  ): LODLevel {
    console.warn(
      `BasicCelestialRenderer: Using ${this.billboardGenerator.constructor.name} for billboard LOD of ${this.celestial.name || this.celestial.id}.`,
    );

    const physicalProperties: CelestialPhysicalProperties = {
      radius: this.celestial.physicalProperties.radius,
      albedo: this.celestial.physicalProperties.albedo,
      temperature_k: this.celestial.physicalProperties.temperature_k,
      siderealRotationPeriod_s:
        this.celestial.physicalProperties.siderealRotationPeriod_s,
      axialTilt: this.celestial.physicalProperties.axialTilt,
    };
    const baseColorThree = new THREE.Color(baseObjectNumericColor);

    // For BasicCelestialRenderer, we don't have a star-specific ShaderMaterial.
    // Custom renderers that use specific billboard generators needing this would handle it.
    const starMaterial = undefined;

    return this.billboardGenerator.createLOD(
      this.celestial.id,
      physicalProperties,
      this.options.billboardConfig, // This is CelestialBillboardConfig | undefined
      baseColorThree,
      this.celestial.physicalProperties.radius * billboardDistanceFactor,
      starMaterial,
    );
  }

  /**
   * Updates the position of the celestial object
   * Extend this method to update other properties of the renderer.
   */
  public update(): void {
    if (this.celestial.physicsState?.position_m) {
      const position = this.celestial.physicsState.position_m as OSVector3;
      this.lod.position.set(position.x, position.y, position.z);
    }
  }

  /**
   * Disposes of the renderer, disposing of all geometry and materials.
   * This is called when the celestial object is disposed.
   * Extend this method to dispose of other resources.
   */
  public dispose(): void {
    const objectsToDispose = [
      this.highDetailGroup,
      this.mediumDetailGroup,
      this.lowDetailGroup,
      this.billboardLODObject,
    ];

    const ensureEmptyAndDispose = (object3D: THREE.Object3D) => {
      if (!object3D) return;

      // Dispose and remove children first (depth-first)
      // Iterate backwards because .remove() modifies the children array in place
      for (let i = object3D.children.length - 1; i >= 0; i--) {
        const child = object3D.children[i];
        ensureEmptyAndDispose(child); // Recursive call for the child
        object3D.remove(child); // Remove the cleaned child from its parent (current object3D)
      }

      // Now that children are handled (emptied and their resources disposed),
      // dispose resources of the current object3D itself.
      if (object3D instanceof THREE.Mesh) {
        object3D.geometry?.dispose();
        if (object3D.material) {
          if (Array.isArray(object3D.material)) {
            object3D.material.forEach((material) => material.dispose());
          } else {
            (object3D.material as THREE.Material).dispose();
          }
        }
      } else if (object3D instanceof THREE.Sprite) {
        // SpriteMaterial.dispose() should handle its map (texture)
        object3D.material?.dispose();
      } else if (object3D instanceof THREE.Light) {
        // Lights generally don't have explicit dispose methods for their core GPU resources
        // unless they use specific assets like textures (e.g., LightProbe with a texture).
        // Standard lights (PointLight, SpotLight, etc.) are effectively cleaned up
        // when they are removed from the scene graph and no longer referenced.
      }
      // Note: THREE.Group or basic THREE.Object3D instances do not have their own
      // specific .dispose() methods for direct resources. Their cleanup primarily involves
      // ensuring their children are properly disposed and they are removed from their parent.
    };

    objectsToDispose.forEach((obj) => {
      if (obj) {
        ensureEmptyAndDispose(obj);
      }
    });

    // Nullify references to help garbage collection
    this.highDetailGroup = undefined!;
    this.mediumDetailGroup = undefined!;
    this.lowDetailGroup = undefined!;
    this.billboardLODObject = undefined!;

    this.lod.levels = [];
  }
}
