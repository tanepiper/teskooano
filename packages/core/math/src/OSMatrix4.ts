import { OSVector3 } from "./OSVector3";
import { OSQuaternion } from "./OSQuaternion";
import * as THREE from "three";
import { EPSILON } from "./constants";

/**
 * Represents a 4x4 matrix.
 * The elements are stored in column-major order.
 */
export class OSMatrix4 {
  public elements: number[];

  constructor() {
    this.elements = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
  }

  /**
   * Sets the elements of this matrix.
   */
  set(
    n11: number,
    n12: number,
    n13: number,
    n14: number,
    n21: number,
    n22: number,
    n23: number,
    n24: number,
    n31: number,
    n32: number,
    n33: number,
    n34: number,
    n41: number,
    n42: number,
    n43: number,
    n44: number,
  ): this {
    const te = this.elements;
    te[0] = n11;
    te[4] = n12;
    te[8] = n13;
    te[12] = n14;
    te[1] = n21;
    te[5] = n22;
    te[9] = n23;
    te[13] = n24;
    te[2] = n31;
    te[6] = n32;
    te[10] = n33;
    te[14] = n34;
    te[3] = n41;
    te[7] = n42;
    te[11] = n43;
    te[15] = n44;
    return this;
  }

  /**
   * Resets this matrix to the identity matrix.
   */
  identity(): this {
    return this.set(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1);
  }

  /**
   * Creates a clone of this matrix.
   */
  clone(): OSMatrix4 {
    const m = new OSMatrix4();
    m.elements = [...this.elements];
    return m;
  }

  /**
   * Copies the elements from another OSMatrix4.
   */
  copy(m: OSMatrix4): this {
    this.elements = [...m.elements];
    return this;
  }

  /**
   * Sets the rotation component of this matrix from a quaternion.
   */
  makeRotationFromQuaternion(q: OSQuaternion): this {
    const te = this.elements;
    const x = q.x,
      y = q.y,
      z = q.z,
      w = q.w;
    const x2 = x + x,
      y2 = y + y,
      z2 = z + z;
    const xx = x * x2,
      xy = x * y2,
      xz = x * z2;
    const yy = y * y2,
      yz = y * z2,
      zz = z * z2;
    const wx = w * x2,
      wy = w * y2,
      wz = w * z2;

    te[0] = 1 - (yy + zz);
    te[4] = xy - wz;
    te[8] = xz + wy;

    te[1] = xy + wz;
    te[5] = 1 - (xx + zz);
    te[9] = yz - wx;

    te[2] = xz - wy;
    te[6] = yz + wx;
    te[10] = 1 - (xx + yy);

    // Reset translation and scale parts to identity
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;
    te[12] = 0;
    te[13] = 0;
    te[14] = 0;
    te[15] = 1;

    return this;
  }

  /**
   * Constructs a rotation matrix, looking from `eye` to `target` with configured `up` direction.
   */
  lookAt(eye: OSVector3, target: OSVector3, up: OSVector3): this {
    const te = this.elements;

    let zx = eye.x - target.x;
    let zy = eye.y - target.y;
    let zz = eye.z - target.z;
    let zlen = zx * zx + zy * zy + zz * zz;
    if (zlen > 0) {
      zlen = 1 / Math.sqrt(zlen);
      zx *= zlen;
      zy *= zlen;
      zz *= zlen;
    }

    let xx = up.y * zz - up.z * zy;
    let xy = up.z * zx - up.x * zz;
    let xz = up.x * zy - up.y * zx;
    let xlen = xx * xx + xy * xy + xz * xz;
    if (xlen > 0) {
      xlen = 1 / Math.sqrt(xlen);
      xx *= xlen;
      xy *= xlen;
      xz *= xlen;
    }

    const yx = zy * xz - zz * xy;
    const yy = zz * xx - zx * xz;
    const yz = zx * xy - zy * xx;

    te[0] = xx;
    te[4] = yx;
    te[8] = zx;
    te[1] = xy;
    te[5] = yy;
    te[9] = zy;
    te[2] = xz;
    te[6] = yz;
    te[10] = zz;

    return this;
  }

  /**
   * Multiplies this matrix by another matrix.
   */
  multiply(m: OSMatrix4): this {
    const ae = this.elements;
    const be = m.elements;

    const a11 = ae[0],
      a12 = ae[4],
      a13 = ae[8],
      a14 = ae[12];
    const a21 = ae[1],
      a22 = ae[5],
      a23 = ae[9],
      a24 = ae[13];
    const a31 = ae[2],
      a32 = ae[6],
      a33 = ae[10],
      a34 = ae[14];
    const a41 = ae[3],
      a42 = ae[7],
      a43 = ae[11],
      a44 = ae[15];

    const b11 = be[0],
      b12 = be[4],
      b13 = be[8],
      b14 = be[12];
    const b21 = be[1],
      b22 = be[5],
      b23 = be[9],
      b24 = be[13];
    const b31 = be[2],
      b32 = be[6],
      b33 = be[10],
      b34 = be[14];
    const b41 = be[3],
      b42 = be[7],
      b43 = be[11],
      b44 = be[15];

    ae[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
    ae[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
    ae[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
    ae[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

    ae[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
    ae[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
    ae[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
    ae[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

    ae[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
    ae[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
    ae[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
    ae[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

    ae[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
    ae[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
    ae[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
    ae[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;

    return this;
  }

  /**
   * Transposes this matrix.
   */
  transpose(): this {
    const te = this.elements;
    let tmp;
    tmp = te[1];
    te[1] = te[4];
    te[4] = tmp;
    tmp = te[2];
    te[2] = te[8];
    te[8] = tmp;
    tmp = te[3];
    te[3] = te[12];
    te[12] = tmp;
    tmp = te[6];
    te[6] = te[9];
    te[9] = tmp;
    tmp = te[7];
    te[7] = te[13];
    te[13] = tmp;
    tmp = te[11];
    te[11] = te[14];
    te[14] = tmp;
    return this;
  }

  /**
   * Calculates the determinant of this matrix.
   */
  determinant(): number {
    const te = this.elements;
    const n11 = te[0],
      n12 = te[4],
      n13 = te[8],
      n14 = te[12];
    const n21 = te[1],
      n22 = te[5],
      n23 = te[9],
      n24 = te[13];
    const n31 = te[2],
      n32 = te[6],
      n33 = te[10],
      n34 = te[14];
    const n41 = te[3],
      n42 = te[7],
      n43 = te[11],
      n44 = te[15];

    return (
      n41 *
        (+n14 * n23 * n32 -
          n13 * n24 * n32 -
          n14 * n22 * n33 +
          n12 * n24 * n33 +
          n13 * n22 * n34 -
          n12 * n23 * n34) +
      n42 *
        (+n11 * n23 * n34 -
          n11 * n24 * n33 +
          n14 * n21 * n33 -
          n13 * n21 * n34 +
          n13 * n24 * n31 -
          n14 * n23 * n31) +
      n43 *
        (+n11 * n24 * n32 -
          n11 * n22 * n34 -
          n14 * n21 * n32 +
          n12 * n21 * n34 +
          n14 * n22 * n31 -
          n12 * n24 * n31) +
      n44 *
        (-n13 * n22 * n31 -
          n11 * n23 * n32 +
          n11 * n22 * n33 +
          n13 * n21 * n32 -
          n12 * n21 * n33 +
          n12 * n23 * n31)
    );
  }

  /**
   * Inverts this matrix.
   */
  invert(): this {
    const te = this.elements,
      n11 = te[0],
      n21 = te[1],
      n31 = te[2],
      n41 = te[3],
      n12 = te[4],
      n22 = te[5],
      n32 = te[6],
      n42 = te[7],
      n13 = te[8],
      n23 = te[9],
      n33 = te[10],
      n43 = te[11],
      n14 = te[12],
      n24 = te[13],
      n34 = te[14],
      n44 = te[15],
      t11 =
        n23 * n34 * n42 -
        n24 * n33 * n42 +
        n24 * n32 * n43 -
        n22 * n34 * n43 -
        n23 * n32 * n44 +
        n22 * n33 * n44,
      t12 =
        n14 * n33 * n42 -
        n13 * n34 * n42 -
        n14 * n32 * n43 +
        n12 * n34 * n43 +
        n13 * n32 * n44 -
        n12 * n33 * n44,
      t13 =
        n13 * n24 * n42 -
        n14 * n23 * n42 +
        n14 * n22 * n43 -
        n12 * n24 * n43 -
        n13 * n22 * n44 +
        n12 * n23 * n44,
      t14 =
        n14 * n23 * n32 -
        n13 * n24 * n32 -
        n14 * n22 * n33 +
        n12 * n24 * n33 +
        n13 * n22 * n34 -
        n12 * n23 * n34;

    const det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;

    if (det === 0) {
      console.error(
        "OSMatrix4.invert(): can't invert matrix, determinant is 0",
      );
      return this.identity();
    }

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] =
      (n24 * n33 * n41 -
        n23 * n34 * n41 -
        n24 * n31 * n43 +
        n21 * n34 * n43 +
        n23 * n31 * n44 -
        n21 * n33 * n44) *
      detInv;
    te[2] =
      (n22 * n34 * n41 -
        n24 * n32 * n41 +
        n24 * n31 * n42 -
        n21 * n34 * n42 -
        n22 * n31 * n44 +
        n21 * n32 * n44) *
      detInv;
    te[3] =
      (n23 * n32 * n41 -
        n22 * n33 * n41 -
        n23 * n31 * n42 +
        n21 * n33 * n42 +
        n22 * n31 * n43 -
        n21 * n32 * n43) *
      detInv;

    te[4] = t12 * detInv;
    te[5] =
      (n13 * n34 * n41 -
        n14 * n33 * n41 +
        n14 * n31 * n43 -
        n11 * n34 * n43 -
        n13 * n31 * n44 +
        n11 * n33 * n44) *
      detInv;
    te[6] =
      (n14 * n32 * n41 -
        n12 * n34 * n41 -
        n14 * n31 * n42 +
        n11 * n34 * n42 +
        n12 * n31 * n44 -
        n11 * n32 * n44) *
      detInv;
    te[7] =
      (n12 * n33 * n41 -
        n13 * n32 * n41 +
        n13 * n31 * n42 -
        n11 * n33 * n42 -
        n12 * n31 * n43 +
        n11 * n32 * n43) *
      detInv;

    te[8] = t13 * detInv;
    te[9] =
      (n14 * n23 * n41 -
        n13 * n24 * n41 -
        n14 * n21 * n43 +
        n11 * n24 * n43 +
        n13 * n21 * n44 -
        n11 * n23 * n44) *
      detInv;
    te[10] =
      (n12 * n24 * n41 -
        n14 * n22 * n41 +
        n14 * n21 * n42 -
        n11 * n24 * n42 -
        n12 * n21 * n44 +
        n11 * n22 * n44) *
      detInv;
    te[11] =
      (n13 * n22 * n41 -
        n12 * n23 * n41 -
        n13 * n21 * n42 +
        n11 * n23 * n42 +
        n12 * n21 * n43 -
        n11 * n22 * n43) *
      detInv;

    te[12] = t14 * detInv;
    te[13] =
      (n13 * n24 * n31 -
        n14 * n23 * n31 +
        n14 * n21 * n33 -
        n11 * n24 * n33 -
        n13 * n21 * n34 +
        n11 * n23 * n34) *
      detInv;
    te[14] =
      (n14 * n22 * n31 -
        n12 * n24 * n31 -
        n14 * n21 * n32 +
        n11 * n24 * n32 +
        n12 * n21 * n34 -
        n11 * n22 * n34) *
      detInv;
    te[15] =
      (n12 * n23 * n31 -
        n13 * n22 * n31 +
        n13 * n21 * n32 -
        n11 * n23 * n32 -
        n12 * n21 * n33 +
        n11 * n22 * n33) *
      detInv;

    return this;
  }

  /**
   * Creates a perspective projection matrix.
   */
  makePerspective(
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number,
  ): this {
    const te = this.elements;
    const x = (2 * near) / (right - left);
    const y = (2 * near) / (top - bottom);
    const a = (right + left) / (right - left);
    const b = (top + bottom) / (top - bottom);
    const c = -(far + near) / (far - near);
    const d = (-2 * far * near) / (far - near);

    te[0] = x;
    te[4] = 0;
    te[8] = a;
    te[12] = 0;
    te[1] = 0;
    te[5] = y;
    te[9] = b;
    te[13] = 0;
    te[2] = 0;
    te[6] = 0;
    te[10] = c;
    te[14] = d;
    te[3] = 0;
    te[7] = 0;
    te[11] = -1;
    te[15] = 0;

    return this;
  }

  /**
   * Creates an orthographic projection matrix.
   */
  makeOrthographic(
    left: number,
    right: number,
    top: number,
    bottom: number,
    near: number,
    far: number,
  ): this {
    const te = this.elements;
    const w = 1.0 / (right - left);
    const h = 1.0 / (top - bottom);
    const p = 1.0 / (far - near);
    const x = (right + left) * w;
    const y = (top + bottom) * h;
    const z = (far + near) * p;

    te[0] = 2 * w;
    te[4] = 0;
    te[8] = 0;
    te[12] = -x;
    te[1] = 0;
    te[5] = 2 * h;
    te[9] = 0;
    te[13] = -y;
    te[2] = 0;
    te[6] = 0;
    te[10] = -2 * p;
    te[14] = -z;
    te[3] = 0;
    te[7] = 0;
    te[11] = 0;
    te[15] = 1;

    return this;
  }

  /**
   * Converts this OSMatrix4 to a THREE.Matrix4.
   */
  toThreeJS(): THREE.Matrix4 {
    return new THREE.Matrix4().fromArray(this.elements);
  }

  /**
   * Creates an OSMatrix4 from a THREE.Matrix4.
   */
  static fromThreeJS(m: THREE.Matrix4): OSMatrix4 {
    const newM = new OSMatrix4();
    newM.elements = m.toArray();
    return newM;
  }
}
