import * as THREE from "three";
import { OSVector3 } from "./OSVector3";
import { EPSILON, DEG_TO_RAD } from "./constants";

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
   * Calculates the dot product of this quaternion with another.
   * @param q The other quaternion.
   * @returns The dot product.
   */
  dot(q: OSQuaternion): number {
    return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
  }

  /**
   * Calculates the squared length of this quaternion.
   * @returns The squared length.
   */
  lengthSq(): number {
    return this.dot(this);
  }

  /**
   * Calculates the length of this quaternion.
   * @returns The length.
   */
  length(): number {
    return Math.sqrt(this.lengthSq());
  }

  /**
   * Normalizes this quaternion to have a length of 1.
   * @returns This quaternion for chaining.
   */
  normalize(): this {
    const len = this.length();
    if (len > EPSILON) {
      const invLen = 1 / len;
      this.x *= invLen;
      this.y *= invLen;
      this.z *= invLen;
      this.w *= invLen;
    } else {
      // Identity quaternion
      this.x = 0;
      this.y = 0;
      this.z = 0;
      this.w = 1;
    }
    return this;
  }

  /**
   * Computes the conjugate of this quaternion.
   * For a quaternion (x, y, z, w), the conjugate is (-x, -y, -z, w).
   * @returns This quaternion for chaining.
   */
  conjugate(): this {
    this.x *= -1;
    this.y *= -1;
    this.z *= -1;
    return this;
  }

  /**
   * Inverts this quaternion.
   * The result is the conjugate divided by the squared length.
   * For a normalized quaternion, the inverse is simply the conjugate.
   * @returns This quaternion for chaining.
   */
  invert(): this {
    const lenSq = this.lengthSq();
    if (lenSq > EPSILON) {
      this.conjugate();
      const invLenSq = 1 / lenSq;
      this.x *= invLenSq;
      this.y *= invLenSq;
      this.z *= invLenSq;
      this.w *= invLenSq;
    }
    return this;
  }

  /**
   * Multiplies this quaternion by another quaternion.
   * @param q The quaternion to multiply by (on the right).
   * @returns This quaternion for chaining.
   */
  multiply(q: OSQuaternion): this {
    const ax = this.x,
      ay = this.y,
      az = this.z,
      aw = this.w;
    const bx = q.x,
      by = q.y,
      bz = q.z,
      bw = q.w;

    this.x = ax * bw + aw * bx + ay * bz - az * by;
    this.y = ay * bw + aw * by + az * bx - ax * bz;
    this.z = az * bw + aw * bz + ax * by - ay * bx;
    this.w = aw * bw - ax * bx - ay * by - az * bz;

    return this;
  }

  /**
   * Performs a Spherical Linear Interpolation (slerp) between this quaternion and another.
   * @param qb The target quaternion.
   * @param t The interpolation factor (0.0 to 1.0).
   * @returns This quaternion for chaining.
   */
  slerp(qb: OSQuaternion, t: number): this {
    if (t === 0) return this;
    if (t === 1) return this.copy(qb);

    const ax = this.x,
      ay = this.y,
      az = this.z,
      aw = this.w;
    let bx = qb.x,
      by = qb.y,
      bz = qb.z,
      bw = qb.w;

    let cosHalfTheta = aw * bw + ax * bx + ay * by + az * bz;

    // To avoid taking the long path, if cosHalfTheta is negative,
    // we use the opposite of the target quaternion.
    if (cosHalfTheta < 0) {
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
      cosHalfTheta = -cosHalfTheta;
    }

    // If the quaternions are very close, use linear interpolation to avoid precision issues.
    if (cosHalfTheta >= 1.0 - EPSILON) {
      this.w = aw + t * (bw - aw);
      this.x = ax + t * (bx - ax);
      this.y = ay + t * (by - ay);
      this.z = az + t * (bz - az);
      return this.normalize();
    }

    const halfTheta = Math.acos(cosHalfTheta);
    const sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta * cosHalfTheta);

    // If sinHalfTheta is zero, the quaternions are opposite.
    // There is no unique path, so we can't do a slerp.
    // A simple linear interpolation is a reasonable fallback.
    if (Math.abs(sinHalfTheta) < EPSILON) {
      this.w = 0.5 * (aw + bw);
      this.x = 0.5 * (ax + bx);
      this.y = 0.5 * (ay + by);
      this.z = 0.5 * (az + bz);
      return this;
    }

    const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta;
    const ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

    this.w = aw * ratioA + bw * ratioB;
    this.x = ax * ratioA + bx * ratioB;
    this.y = ay * ratioA + by * ratioB;
    this.z = az * ratioA + bz * ratioB;

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
   * Sets this quaternion's rotation from a set of Euler angles.
   * @param euler An OSVector3 representing the Euler angles in degrees.
   * @param order The order of axis rotations. Only 'XYZ' is currently supported.
   * @returns This quaternion for chaining.
   */
  setFromEuler(euler: OSVector3, order: "XYZ"): this {
    // http://www.mathworks.com/matlabcentral/fileexchange/
    // 	20696-function-to-convert-between-dcm-euler-angles-quaternions-and-rotation-vectors
    const x = euler.x * DEG_TO_RAD;
    const y = euler.y * DEG_TO_RAD;
    const z = euler.z * DEG_TO_RAD;

    const c1 = Math.cos(x / 2);
    const c2 = Math.cos(y / 2);
    const c3 = Math.cos(z / 2);

    const s1 = Math.sin(x / 2);
    const s2 = Math.sin(y / 2);
    const s3 = Math.sin(z / 2);

    if (order === "XYZ") {
      this.x = s1 * c2 * c3 + c1 * s2 * s3;
      this.y = c1 * s2 * c3 - s1 * c2 * s3;
      this.z = c1 * c2 * s3 + s1 * s2 * c3;
      this.w = c1 * c2 * c3 - s1 * s2 * s3;
    } else {
      console.warn(`OSQuaternion.setFromEuler: '${order}' not supported.`);
    }

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
