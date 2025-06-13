import type {
  CelestialStatus,
  CelestialType,
  OrbitalParameters,
  CelestialSpecificPropertiesUnion,
} from "./celestial";
import type { OSVector3 } from "@teskooano/core-math";
import type * as THREE from "three";

/**
 * Defines the structure of a celestial object once it has been processed
 * and is ready for use by the rendering engine. It contains a flattened,
 * renderer-friendly representation of the core `CelestialObject` data.
 */
export interface RenderableCelestialObject {
  /** The unique identifier linking back to the original `CelestialObject`. */
  celestialObjectId: string;
  /** The common name of the object. */
  name: string;
  /** The classification of the celestial object (e.g., Star, Planet). */
  type: CelestialType;
  /** The current lifecycle status (e.g., Stable, Destroyed). */
  status: CelestialStatus;
  /** A seed value used for procedural generation. */
  seed: string;

  /** The scaled radius of the object in renderer units. */
  radius: number;
  /** The mass of the object in kilograms. */
  mass: number;
  /** The 3D position of the object in the renderer's coordinate system. */
  position: THREE.Vector3;
  /** The rotational orientation of the object. */
  rotation: THREE.Quaternion;

  /** Type-specific physical properties (e.g., stellar class, planet composition). */
  properties?: CelestialSpecificPropertiesUnion;
  /** The orbital parameters describing the object's path, if applicable. */
  orbit?: OrbitalParameters;

  /** The ID of the celestial object this object orbits around. */
  parentId?: string;
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

  /** The object's actual radius in meters, unscaled. */
  realRadius_m: number;

  /** Average surface or effective temperature in Kelvin. */
  temperature: number;

  /** The tilt of the object's rotational axis relative to its orbital plane. */
  axialTilt?: OSVector3 | number;

  /** A collection of values intended to be passed as uniforms to shaders. */
  uniforms: { [key: string]: any };
}
