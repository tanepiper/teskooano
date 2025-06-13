import * as THREE from "three";
import { OSVector3 } from "./OSVector3";
import { EPSILON } from "./constants";

/**
 * Represents a rotation in 3D space using a quaternion.
 * This class is designed to be independent of the rendering engine's specifics,
 * but provides a conversion method to a THREE.Quaternion for interoperability.
 */
export class OSQuaternion {
  public x: number;
  public y: number;
  public z: number;
  public w: number;

  /**
   * Creates a new OSQuaternion instance.
   * @param x - The x component. Defaults to 0.
   * @param y - The y component. Defaults to 0.
   * @param z - The z component. Defaults to 0.
   * @param w - The w component. Defaults to 1.
   */
  constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
  }

  /**
   * Creates a clone of this quaternion.
   * @returns A new OSQuaternion instance with the same components.
   */
  clone(): OSQuaternion {
    return new OSQuaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * Sets the components of this quaternion.
   * @param x - The new x component.
   * @param y - The new y component.
   * @param z - The new z component.
   * @param w - The new w component.
   * @returns This quaternion for chaining.
   */
  set(x: number, y: number, z: number, w: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    this.w = w;
    return this;
  }

  /**
   * Copies the components from another OSQuaternion.
   * @param q - The quaternion to copy from.
   * @returns This quaternion for chaining.
   */
  copy(q: OSQuaternion): this {
    this.x = q.x;
    this.y = q.y;
    this.z = q.z;
    this.w = q.w;
    return this;
  }

  /**
   * Sets this quaternion from a rotation specified by an axis and an angle.
   * @param axis - The axis of rotation (must be normalized).
   * @param angle - The angle of rotation in radians.
   * @returns This quaternion for chaining.
   */
  setFromAxisAngle(axis: OSVector3, angle: number): this {
    const halfAngle = angle / 2;
    const s = Math.sin(halfAngle);

    this.x = axis.x * s;
    this.y = axis.y * s;
    this.z = axis.z * s;
    this.w = Math.cos(halfAngle);

    return this;
  }

  /**
   * Converts this OSQuaternion to a THREE.Quaternion.
   * This is the primary point of interoperability with the Three.js rendering engine.
   * @returns A new THREE.Quaternion instance.
   */
  toThreeJS(): THREE.Quaternion {
    return new THREE.Quaternion(this.x, this.y, this.z, this.w);
  }

  /**
   * Creates an OSQuaternion from a THREE.Quaternion.
   * @param q - The THREE.Quaternion to convert from.
   * @returns A new OSQuaternion instance.
   */
  static fromThreeJS(q: THREE.Quaternion): OSQuaternion {
    return new OSQuaternion(q.x, q.y, q.z, q.w);
  }
}
