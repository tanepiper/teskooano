import type { OSVector3 } from "@teskooano/core-math";
import type * as THREE from "three";
import type { CelestialSpecificPropertiesUnion } from ".";
import type { PhysicsStateReal } from "../physics";
import type { CelestialObject } from "./core.types";
import type { CelestialDisplayOptions } from "./display.types";

/**
 * Defines the structure of a celestial object once it has been processed
 * and is ready for use by the rendering engine. It extends the core `CelestialObject<T>`
 * with renderer-specific properties and transformations.
 *
 * @template T - The specific properties type for this celestial object
 */
export interface RenderableCelestialObject<T = CelestialSpecificPropertiesUnion>
  extends CelestialObject<T> {
  /** The scaled radius of the object in renderer units (computed from realRadius_m). */
  radius: number;

  /** The mass of the object in kilograms (alias for realMass_kg). */
  mass: number;

  /** The 3D position of the object in the renderer's coordinate system (computed from physicsStateReal). */
  position: THREE.Vector3;

  /** The 3D velocity of the object in the renderer's coordinate system (scaled units/sec). */
  velocity?: THREE.Vector3;

  /** The magnitude of the object's velocity in real units (meters per second) for display purposes. */
  velocityMagnitude_mps?: number;

  /** The rotational orientation of the object (computed from physicsStateReal). */
  rotation: THREE.Quaternion;

  /** Contains the object's state used by the physics engine (real units). */
  physicsStateReal: PhysicsStateReal;

  /** The ID of the primary light source illuminating this object. */
  primaryLightSourceId?: string;

  /** Whether the object should be rendered. */
  isVisible?: boolean;

  /** Whether the user can select or interact with this object. */
  isTargetable?: boolean;

  /** Whether the object is currently selected by the user. */
  isSelected?: boolean;

  /** Whether the camera is currently focused on this object. */
  isFocused?: boolean;

  /** A collection of values intended to be passed as uniforms to shaders. */
  uniforms: { [key: string]: any };

  /** The axial tilt of the object (copied from orbit.axialTilt for convenience). */
  axialTilt?: OSVector3 | number;

  /** UI display options for this renderable object (labels, orbits, trails, etc.). */
  uiOptions?: CelestialDisplayOptions;
}

/**
 * Defines the quality levels for trail rendering.
 */
export enum TrailQuality {
  Low = "low",
  Medium = "medium",
  High = "high",
}
