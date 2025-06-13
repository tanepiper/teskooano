import { EPSILON } from "./constants";
import * as THREE from "three";
import { OSQuaternion } from "./OSQuaternion";

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
   * Linearly interpolates between this vector and another vector.
   * @param v The vector to interpolate towards.
   * @param alpha The interpolation factor, typically in the range [0, 1].
   * @returns This vector for chaining.
   */
  lerp(v: OSVector3, alpha: number): this {
    this.x += (v.x - this.x) * alpha;
    this.y += (v.y - this.y) * alpha;
    this.z += (v.z - this.z) * alpha;
    return this;
  }

  /**
   * Calculates the angle between this vector and another vector in radians.
   * @param v The other vector.
   * @returns The angle in radians. Returns 0 if either vector has zero length.
   */
  angleTo(v: OSVector3): number {
    const denominator = Math.sqrt(this.lengthSq() * v.lengthSq());
    if (denominator === 0) return 0;

    const theta = this.dot(v) / denominator;
    return Math.acos(Math.max(-1, Math.min(1, theta))); // clamp to avoid floating point errors
  }

  /**
   * Projects this vector onto another vector.
   * @param v The vector to project onto.
   * @returns This vector for chaining.
   */
  projectOnVector(v: OSVector3): this {
    const denominator = v.lengthSq();
    if (denominator === 0) {
      this.set(0, 0, 0);
      return this;
    }
    const scalar = this.dot(v) / denominator;
    return this.copy(v).multiplyScalar(scalar);
  }

  /**
   * Reflects this vector off a plane specified by its normal vector.
   * @param normal The normal vector of the plane (must be a unit vector).
   * @returns This vector for chaining.
   */
  reflect(normal: OSVector3): this {
    // Uses the formula: v' = v - 2 * (v . n) * n
    const dotProduct = this.dot(normal);
    this.x -= 2 * dotProduct * normal.x;
    this.y -= 2 * dotProduct * normal.y;
    this.z -= 2 * dotProduct * normal.z;
    return this;
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
   * Creates an OSVector3 from a THREE.Vector3.
   * @param v - The THREE.Vector3 to convert from.
   * @returns A new OSVector3 instance.
   */
  static fromThreeJS(v: THREE.Vector3): OSVector3 {
    return new OSVector3(v.x, v.y, v.z);
  }

  /**
   * Applies an OSQuaternion rotation to this vector.
   * @param q - The OSQuaternion to apply.
   * @returns This vector for chaining.
   */
  applyQuaternion(q: OSQuaternion): this {
    const x = this.x,
      y = this.y,
      z = this.z;
    const qx = q.x,
      qy = q.y,
      qz = q.z,
      qw = q.w;

    // calculate quat * vector
    const ix = qw * x + qy * z - qz * y;
    const iy = qw * y + qz * x - qx * z;
    const iz = qw * z + qx * y - qy * x;
    const iw = -qx * x - qy * y - qz * z;

    // calculate result * inverse quat
    this.x = ix * qw + iw * -qx + iy * -qz - iz * -qy;
    this.y = iy * qw + iw * -qy + iz * -qx - ix * -qz;
    this.z = iz * qw + iw * -qz + ix * -qy - iy * -qx;

    return this;
  }
}
