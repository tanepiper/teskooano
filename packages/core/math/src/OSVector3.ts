import { EPSILON } from "./constants";
import * as THREE from "three";

/**
 * Represents a 3-dimensional vector using the Open Space engine's
 * coordinate system (Y-up, typically using meters for physics calculations).
 */
export class OSVector3 {
  public x: number;
  public y: number;
  public z: number;

  /**
   * Creates a new OSVector3 instance.
   * @param x - The x component. Defaults to 0.
   * @param y - The y component. Defaults to 0.
   * @param z - The z component. Defaults to 0.
   */
  constructor(x: number = 0, y: number = 0, z: number = 0) {
    this.x = x;
    this.y = y;
    this.z = z;
  }

  /**
   * Creates a clone of this vector.
   * @returns A new OSVector3 instance with the same components.
   */
  clone(): OSVector3 {
    return new OSVector3(this.x, this.y, this.z);
  }

  /**
   * Sets the components of this vector.
   * @param x - The new x component.
   * @param y - The new y component.
   * @param z - The new z component.
   * @returns This vector for chaining.
   */
  set(x: number, y: number, z: number): this {
    this.x = x;
    this.y = y;
    this.z = z;
    return this;
  }

  /**
   * Copies the components from another OSVector3.
   * @param v - The vector to copy from.
   * @returns This vector for chaining.
   */
  copy(v: OSVector3): this {
    this.x = v.x;
    this.y = v.y;
    this.z = v.z;
    return this;
  }

  /**
   * Adds another vector to this vector.
   * @param v - The vector to add.
   * @returns This vector for chaining.
   */
  add(v: OSVector3): this {
    this.x += v.x;
    this.y += v.y;
    this.z += v.z;
    return this;
  }

  /**
   * Subtracts another vector from this vector.
   * @param v - The vector to subtract.
   * @returns This vector for chaining.
   */
  sub(v: OSVector3): this {
    this.x -= v.x;
    this.y -= v.y;
    this.z -= v.z;
    return this;
  }

  /**
   * Multiplies this vector by a scalar value.
   * @param scalar - The scalar value.
   * @returns This vector for chaining.
   */
  multiplyScalar(scalar: number): this {
    this.x *= scalar;
    this.y *= scalar;
    this.z *= scalar;
    return this;
  }

  /**
   * Calculates the squared length (magnitude squared) of this vector.
   * Avoids a square root calculation, useful for comparisons.
   * @returns The squared length.
   */
  lengthSq(): number {
    return this.x * this.x + this.y * this.y + this.z * this.z;
  }

  /**
   * Calculates the length (magnitude) of this vector.
   * @returns The length.
   */
  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  /**
   * Normalizes this vector (makes it a unit vector with length 1).
   * If the length is zero, the vector remains unchanged.
   * @returns This vector for chaining.
   */
  normalize(): this {
    const len = this.length();
    if (len > EPSILON) {
      this.multiplyScalar(1 / len);
    } else {
      this.set(0, 0, 0);
    }
    return this;
  }

  /**
   * Calculates the dot product of this vector and another vector.
   * @param v - The other vector.
   * @returns The dot product.
   */
  dot(v: OSVector3): number {
    return this.x * v.x + this.y * v.y + this.z * v.z;
  }

  /**
   * Calculates the cross product of this vector and another vector.
   * Sets this vector to the result.
   * @param v - The other vector.
   * @returns This vector for chaining.
   */
  cross(v: OSVector3): this {
    const x = this.x,
      y = this.y,
      z = this.z;
    this.x = y * v.z - z * v.y;
    this.y = z * v.x - x * v.z;
    this.z = x * v.y - y * v.x;
    return this;
  }

  /**
   * Calculates the squared distance between this vector and another vector.
   * @param v - The other vector.
   * @returns The squared distance.
   */
  distanceToSquared(v: OSVector3): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    const dz = this.z - v.z;
    return dx * dx + dy * dy + dz * dz;
  }

  /**
   * Calculates the distance between this vector and another vector.
   * @param v - The other vector.
   * @returns The distance.
   */
  distanceTo(v: OSVector3): number {
    return Math.sqrt(this.distanceToSquared(v));
  }

  /**
   * Converts this OSVector3 to a string representation.
   * @returns A string in the format (x, y, z).
   */
  toString(): string {
    return `(${this.x.toExponential(3)}, ${this.y.toExponential(3)}, ${this.z.toExponential(3)})`;
  }

  /**
   * Converts this OSVector3 to a THREE.Vector3.
   * Note: This requires THREE to be available in the scope where OSVector3 is used.
   * Consider dependency injection or careful scoping if using in non-ThreeJS contexts.
   * @returns A new THREE.Vector3 instance.
   */
  toThreeJS(): THREE.Vector3 {
    return new THREE.Vector3(this.x, this.y, this.z);
  }

  /**
   * Applies a THREE.Quaternion rotation to this vector.
   * @param q - The THREE.Quaternion to apply.
   * @returns This vector for chaining.
   */
  applyQuaternion(q: THREE.Quaternion): this {
    const x = this.x,
      y = this.y,
      z = this.z;
    const qx = q.x,
      qy = q.y,
      qz = q.z,
      qw = q.w;

    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return this;
  }
}
