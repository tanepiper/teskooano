import { OSQuaternion, OSVector3 } from "@teskooano/core-math";
import {
  CelestialObject,
  CelestialType,
  RenderableCelestialObject,
  SCALE,
  scaleSize,
} from "@teskooano/data-types";
import * as THREE from "three";
import { physicsToThreeJSPosition } from "../utils/coordinateUtils";

/**
 * A factory responsible for creating and updating `RenderableCelestialObject` instances.
 *
 * This class encapsulates the complex logic of transforming raw `CelestialObject` data
 * from the core state into the format required by the rendering engine. It handles
 * position scaling, rotation calculations, and property mapping.
 */
export class RenderableObjectFactory {
  // --- Reusable scratch variables for performance ---
  private rotationAxis = new OSVector3(0, 1, 0);
  private tiltQuaternion = new OSQuaternion();
  private spinQuaternion = new OSQuaternion();
  private finalRotation = new OSQuaternion();
  private zAxis = new OSVector3(0, 0, 1);

  /**
   * Calculates the final orientation of a celestial object.
   *
   * @param axialTilt The object's axial tilt in degrees.
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
      this.tiltQuaternion.setFromEuler(axialTilt, "XYZ");
    } else if (typeof axialTilt === "number" && !isNaN(axialTilt)) {
      const rad = axialTilt * (Math.PI / 180);
      this.tiltQuaternion.setFromAxisAngle(this.zAxis, rad);
    }

    if (siderealPeriod && siderealPeriod !== 0) {
      const rotationAngle = (simulationTime / siderealPeriod) * 2 * Math.PI;
      this.spinQuaternion.setFromAxisAngle(this.rotationAxis, rotationAngle);
      this.finalRotation
        .copy(this.tiltQuaternion)
        .multiply(this.spinQuaternion);
    } else {
      this.finalRotation.copy(this.tiltQuaternion);
    }
    return this.finalRotation;
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
  ): RenderableCelestialObject {
    const realRadius = obj.realRadius_m ?? 0;

    const target = {
      celestialObjectId: obj.id,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      isVisible: true,
      isTargetable: true,
      isSelected: false,
      isFocused: false,
      uniforms: {},
      name: obj.name,
      type: obj.type,
      seed: obj?.seed ?? crypto.randomUUID(),
      radius: scaleSize(realRadius, obj.type),
      mass: (obj.realMass_kg ?? 0) * SCALE.MASS,
      properties: obj.properties,
      orbit: obj.orbit,
      parentId: obj.parentId,
      primaryLightSourceId: lightSourceId,
      realRadius_m: realRadius,
      axialTilt: obj.axialTilt ?? 0,
      status: obj.status,
      temperature: obj.temperature,
      albedo: obj.albedo ?? 0.3,
    };

    physicsToThreeJSPosition(target.position, obj.physicsStateReal.position_m);
    if (obj.physicsStateReal.velocity_mps) {
      physicsToThreeJSPosition(
        target.velocity,
        obj.physicsStateReal.velocity_mps,
      );
    }
    target.rotation.copy(
      this.calculateRotation(
        obj.axialTilt,
        obj.siderealRotationPeriod_s,
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
    if (!parent?.physicsStateReal?.position_m) return null;

    const target = {
      celestialObjectId: obj.id,
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      rotation: new THREE.Quaternion(),
      isVisible: true,
      isTargetable: false,
      isSelected: false,
      isFocused: false,
      uniforms: {},
      name: obj.name,
      type: obj.type,
      seed: obj?.seed ?? crypto.randomUUID(),
      radius: 0,
      mass: 0,
      properties: obj.properties,
      orbit: undefined,
      parentId: obj.parentId,
      primaryLightSourceId: lightSourceId,
      realRadius_m: 0,
      axialTilt: parent.axialTilt ?? 0,
      status: obj.status,
      temperature: obj.temperature,
      albedo: parent.albedo ?? 0,
    };

    physicsToThreeJSPosition(
      target.position,
      parent.physicsStateReal.position_m,
    );
    if (parent.physicsStateReal.velocity_mps) {
      physicsToThreeJSPosition(
        target.velocity,
        parent.physicsStateReal.velocity_mps,
      );
    }
    // Rings use parent's tilt but do not have their own sidereal rotation
    target.rotation.copy(
      this.calculateRotation(parent.axialTilt, undefined, 0).toThreeJS(),
    );

    return target;
  }

  /**
   * Creates a complete map of renderable objects from the core celestial object data.
   *
   * @param objects The complete record of celestial objects from the core state.
   * @param lightSourceMap A map linking object IDs to their primary light source IDs.
   * @param simulationTime The current simulation time.
   * @returns A record of `RenderableCelestialObject`s, keyed by their ID.
   */
  public createRenderableObjects(
    objects: Record<string, CelestialObject>,
    lightSourceMap: Record<string, string | undefined>,
    simulationTime: number,
  ): Record<string, RenderableCelestialObject> {
    const renderableMap: Record<string, RenderableCelestialObject> = {};

    for (const id in objects) {
      const obj = objects[id];
      if (
        !obj.physicsStateReal?.position_m &&
        obj.type !== CelestialType.RING_SYSTEM
      ) {
        continue;
      }

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
        case CelestialType.SPACE_ROCK:
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
}
