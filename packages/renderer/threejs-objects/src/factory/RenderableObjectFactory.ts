import { OSQuaternion, OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  CelestialType,
  RenderableCelestialObject,
} from "@teskooano/data-types";
import * as THREE from "three";
import { physicsToThreeJSPosition } from "../utils/coordinateUtils";
import { PhysicsStateProvider } from "@teskooano/core-state";
import { scaleSize } from "@teskooano/core-physics";
import { SCALE } from "@teskooano/data-values";
import { calculateLightSourceMaps } from "@teskooano/renderer-threejs-lighting";

/**
 * Cache entry for renderable object properties that don't change frequently
 */
interface RenderableCacheEntry {
  radius: number;
  mass: number;
  primaryLightSourceId: string | undefined;
  objectType: CelestialType;
  parentId?: string;
}

/**
 * A factory responsible for creating and updating `RenderableCelestialObject` instances.
 *
 * This class encapsulates the complex logic of transforming raw `CelestialObject` data
 * from the core state into the format required by the rendering engine. It handles
 * position scaling, rotation calculations, and property mapping.
 */
export class RenderableObjectFactory {
  // --- Reusable scratch variables for performance ---
  private rotationAxis = new OSVector3().setFromArray([0, 1, 0]);
  private tiltQuaternion = new OSQuaternion();
  private spinQuaternion = new OSQuaternion();
  private finalRotation = new OSQuaternion();
  private zAxis = new OSVector3().setFromArray([0, 0, 1]);

  // --- Caching system ---
  private cache = new Map<string, RenderableCacheEntry>();
  private lastLightSourceMap: Record<string, string | undefined> = {};
  private lastObjectKeys: string[] = [];

  /**
   * Calculates the final orientation of a celestial object.
   *
   * @param axialTilt The object's axial tilt in degrees or as a rotational axis vector.
   * @param siderealPeriod The time for one full rotation, in seconds.
   * @param simulationTime The current simulation time.
   * @returns An OSQuaternion representing the object's final orientation.
   */
  private calculateRotation(
    axialTilt: OSVector3 | number | undefined,
    siderealPeriod: number | undefined,
    simulationTime: number,
  ): OSQuaternion {
    this.tiltQuaternion.set(0, 0, 0, 1);
    this.spinQuaternion.set(0, 0, 0, 1);

    if (axialTilt instanceof OSVector3) {
      // The axialTilt is a unit vector representing the rotational axis direction
      // We need to create a quaternion that rotates from the default Y-axis to this direction
      const defaultAxis = new OSVector3().setFromArray([0, 1, 0]);
      const axisDirection = axialTilt.clone().normalize();

      // Calculate the rotation quaternion from default Y-axis to the tilted axis
      // Using the formula: q = (dot + 1, cross) normalized
      const dot = defaultAxis.dot(axisDirection);

      if (Math.abs(dot - 1.0) < 1e-6) {
        // Vectors are already aligned, no rotation needed
        this.tiltQuaternion.set(0, 0, 0, 1);
      } else if (Math.abs(dot + 1.0) < 1e-6) {
        // Vectors are opposite, rotate 180 degrees around any perpendicular axis
        // Choose Z-axis if Y is not aligned with it, otherwise use X-axis
        const axis =
          Math.abs(defaultAxis.y) < 0.9
            ? new OSVector3().setFromArray([0, 0, 1])
            : new OSVector3().setFromArray([1, 0, 0]);
        this.tiltQuaternion.setFromAxisAngle(axis, Math.PI);
      } else {
        // General case: calculate cross product and create quaternion
        const cross = defaultAxis.clone().cross(axisDirection);
        const s = Math.sqrt((1 + dot) * 2);
        const invs = 1 / s;

        this.tiltQuaternion.set(
          cross.x * invs,
          cross.y * invs,
          cross.z * invs,
          s * 0.5,
        );
      }
    } else if (typeof axialTilt === "number" && !isNaN(axialTilt)) {
      // For numeric values, apply tilt around the Z-axis (traditional approach)
      const rad = axialTilt * (Math.PI / 180);
      this.tiltQuaternion.setFromAxisAngle(this.zAxis, rad);
    }

    if (siderealPeriod && siderealPeriod !== 0) {
      // Calculate rotation around the tilted axis
      const rotationAngle = (simulationTime / siderealPeriod) * 2 * Math.PI;

      // The rotation axis is now the tilted axis (Y-axis in the tilted coordinate system)
      // We need to rotate the default Y-axis by the tilt quaternion to get the actual rotation axis
      const tiltedRotationAxis = this.rotationAxis
        .clone()
        .applyQuaternion(this.tiltQuaternion);

      this.spinQuaternion.setFromAxisAngle(tiltedRotationAxis, rotationAngle);
      this.finalRotation
        .copy(this.tiltQuaternion)
        .multiply(this.spinQuaternion);
    } else {
      this.finalRotation.copy(this.tiltQuaternion);
    }
    return this.finalRotation;
  }

  /**
   * Gets or creates a cache entry for an object's static properties
   */
  private getCachedProperties(obj: CelestialObject): RenderableCacheEntry {
    const cacheKey = `${obj.id}-${obj.type}-${obj.realRadius_m}-${obj.realMass_kg}-${obj.parentId || "none"}`;

    let cached = this.cache.get(cacheKey);
    if (!cached) {
      const realRadius = obj.realRadius_m ?? 0;
      cached = {
        radius: scaleSize(realRadius, obj.type),
        mass: (obj.realMass_kg ?? 0) * SCALE.MASS,
        primaryLightSourceId: undefined, // Will be set later

        objectType: obj.type,
        parentId: obj.parentId,
      };
      this.cache.set(cacheKey, cached);
    }

    return cached;
  }

  /**
   * Creates or updates a renderable representation of a standard celestial object.
   *
   * @param obj The raw celestial object from the core state.
   * @param lightSourceId The ID of the primary light source for this object.
   * @param simulationTime The current simulation time, for rotation calculations.
   * @returns A fully formed `RenderableCelestialObject`.
   */
  private processStandardObject(
    obj: CelestialObject,
    lightSourceId: string | undefined,
    simulationTime: number,
  ): RenderableCelestialObject | null {
    // Get cached properties
    const cached = this.getCachedProperties(obj);
    cached.primaryLightSourceId = lightSourceId;

    // Get physics state from the provider
    const physicsState = PhysicsStateProvider.getPhysicsState(obj);
    if (!physicsState) {
      console.warn(
        `[RenderableObjectFactory] Could not calculate physics state for ${obj.id}`,
      );
      return null;
    }

    const target = {
      ...obj, // Spread all properties from the original object
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      velocityMagnitude_mps: 0, // Raw velocity magnitude in m/s for display
      rotation: new THREE.Quaternion(),
      isVisible: true,
      isTargetable: true,
      isSelected: false,
      isFocused: false,
      showLabel: true, // Default to labels shown
      showOrbit: false, // Default to orbits hidden
      showPrediction: false, // Default to predictions hidden
      uniforms: {},
      radius: cached.radius,
      mass: cached.mass,
      primaryLightSourceId: cached.primaryLightSourceId,
      physicsStateReal: physicsState, // Add the calculated physics state
    };

    physicsToThreeJSPosition(target.position, physicsState.position_m);
    if (physicsState.velocity_mps) {
      // Keep velocity scaled for scene consistency (camera predictions, etc.)
      physicsToThreeJSPosition(target.velocity, physicsState.velocity_mps);
      // Store raw velocity magnitude for display purposes
      target.velocityMagnitude_mps = physicsState.velocity_mps.length();
    } else {
      // Use set(0, 0, 0) for zero velocity
      target.velocity.set(0, 0, 0);
    }
    target.rotation.copy(
      this.calculateRotation(
        obj.orbit.axialTilt,
        obj.orbit.siderealRotationPeriod_s,
        simulationTime,
      ).toThreeJS(),
    );

    return target;
  }

  /**
   * Creates or updates a renderable representation of a ring system.
   *
   * @param obj The ring system object from the core state.
   * @param objects The full map of all celestial objects.
   * @param lightSourceId The ID of the primary light source.
   * @returns A `RenderableCelestialObject` for the ring, or `null` if the parent is not found.
   */
  private processRingSystem(
    obj: CelestialObject,
    objects: Record<string, CelestialObject>,
    lightSourceId: string | undefined,
  ): RenderableCelestialObject | null {
    const parentId = obj.parentId;
    if (!parentId) return null;

    const parent = objects[parentId];
    const parentPhysicsState = PhysicsStateProvider.getPhysicsState(parent);
    if (!parentPhysicsState?.position_m) return null;

    // Get cached properties
    const cached = this.getCachedProperties(obj);
    cached.primaryLightSourceId = lightSourceId;

    const target = {
      ...obj, // Spread all properties from the original object
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      velocityMagnitude_mps: 0, // Raw velocity magnitude in m/s for display
      rotation: new THREE.Quaternion(),
      isVisible: true,
      isTargetable: false,
      isSelected: false,
      isFocused: false,
      showLabel: true, // Default to labels shown
      showOrbit: false, // Default to orbits hidden
      showPrediction: false, // Default to predictions hidden
      uniforms: {},
      radius: 0,
      mass: 0,
      primaryLightSourceId: cached.primaryLightSourceId,
      axialTilt: parent.orbit.axialTilt ?? 0,
      physicsStateReal: parentPhysicsState, // Use parent's physics state
    };

    physicsToThreeJSPosition(target.position, parentPhysicsState.position_m);
    if (parentPhysicsState.velocity_mps) {
      // Keep velocity scaled for scene consistency (camera predictions, etc.)
      physicsToThreeJSPosition(
        target.velocity,
        parentPhysicsState.velocity_mps,
      );
      // Store raw velocity magnitude for display purposes
      target.velocityMagnitude_mps = parentPhysicsState.velocity_mps.length();
    } else {
      // Use set(0, 0, 0) for zero velocity
      target.velocity.set(0, 0, 0);
    }
    // Rings use parent's tilt but do not have their own sidereal rotation
    target.rotation.copy(
      this.calculateRotation(parent.orbit.axialTilt, undefined, 0).toThreeJS(),
    );

    return target;
  }

  /**
   * Creates a complete map of renderable objects from the core celestial object data.
   *
   * @param objects The complete record of celestial objects from the core state.
   * @param simulationTime The current simulation time.
   * @returns A record of `RenderableCelestialObject`s, keyed by their ID.
   */
  public createRenderableObjects(
    objects: Record<string, CelestialObject>,
    simulationTime: number,
  ): Record<string, RenderableCelestialObject> {
    const objectKeys = Object.keys(objects);

    // Check if we need to recalculate light source maps
    const needsLightRecalculation =
      objectKeys.length !== this.lastObjectKeys.length ||
      !objectKeys.every((key) => this.lastObjectKeys.includes(key)) ||
      objectKeys.some((key) => {
        const obj = objects[key];
        const lastObj = this.lastObjectKeys.includes(key) ? objects[key] : null;
        return (
          !lastObj ||
          obj.type !== lastObj.type ||
          obj.parentId !== lastObj.parentId
        );
      });

    // Only recalculate light source maps when object hierarchy changes
    let lightSourceMap: Record<string, string | undefined>;
    if (needsLightRecalculation) {
      lightSourceMap = calculateLightSourceMaps(objects);
      this.lastLightSourceMap = lightSourceMap;
      this.lastObjectKeys = objectKeys;
    } else {
      lightSourceMap = this.lastLightSourceMap;
    }

    const renderableMap: Record<string, RenderableCelestialObject> = {};

    for (const id in objects) {
      const obj = objects[id];

      let renderableObject: RenderableCelestialObject | null = null;
      const lightSourceId = lightSourceMap[id];

      switch (obj.type) {
        case CelestialType.RING_SYSTEM:
          renderableObject = this.processRingSystem(
            obj,
            objects,
            lightSourceId,
          );
          break;
        case CelestialType.STAR:
        case CelestialType.PLANET:
        case CelestialType.MOON:
        case CelestialType.DWARF_PLANET:
        case CelestialType.GAS_GIANT:
        case CelestialType.COMET:
        case CelestialType.ASTEROID_FIELD:
        case CelestialType.OORT_CLOUD:
        case CelestialType.ASTEROID:
        case CelestialType.SATELLITE:
          renderableObject = this.processStandardObject(
            obj,
            lightSourceId,
            simulationTime,
          );
          break;
        default:
          // Safely ignore unhandled types
          break;
      }

      if (renderableObject) {
        renderableMap[id] = renderableObject;
      }
    }
    return renderableMap;
  }

  /**
   * Clears the cache when objects are added/removed or properties change significantly
   */
  public clearCache(): void {
    this.cache.clear();
    this.lastLightSourceMap = {};
    this.lastObjectKeys = [];
  }
}
