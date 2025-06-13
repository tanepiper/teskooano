import { OSVector3 } from "./OSVector3";
import * as THREE from "three";

/**
 * Represents a 3x3 matrix.
 * The elements are stored in column-major order.
 * [ m11, m21, m31 ]
 * [ m12, m22, m32 ]
 * [ m13, m23, m33 ]
 */
export class OSMatrix3 {
  public elements: number[];

  /**
   * Creates a new OSMatrix3.
   * Initializes to the identity matrix if no elements are provided.
   */
  constructor() {
    this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1];
  }

  /**
   * Sets the elements of this matrix.
   * @param n11 - Element in row 1, column 1.
   * @param n12 - Element in row 1, column 2.
   * @param n13 - Element in row 1, column 3.
   * @param n21 - Element in row 2, column 1.
   * @param n22 - Element in row 2, column 2.
   * @param n23 - Element in row 2, column 3.
   * @param n31 - Element in row 3, column 1.
   * @param n32 - Element in row 3, column 2.
   * @param n33 - Element in row 3, column 3.
   * @returns This matrix for chaining.
   */
  set(
    n11: number,
    n12: number,
    n13: number,
    n21: number,
    n22: number,
    n23: number,
    n31: number,
    n32: number,
    n33: number,
  ): this {
    const te = this.elements;
    te[0] = n11;
    te[3] = n12;
    te[6] = n13;
    te[1] = n21;
    te[4] = n22;
    te[7] = n23;
    te[2] = n31;
    te[5] = n32;
    te[8] = n33;
    return this;
  }

  /**
   * Resets this matrix to the identity matrix.
   * @returns This matrix for chaining.
   */
  identity(): this {
    return this.set(1, 0, 0, 0, 1, 0, 0, 0, 1);
  }

  /**
   * Creates a clone of this matrix.
   * @returns A new OSMatrix3 instance with the same elements.
   */
  clone(): OSMatrix3 {
    const m = new OSMatrix3();
    m.elements = [...this.elements];
    return m;
  }

  /**
   * Copies the elements from another OSMatrix3.
   * @param m - The matrix to copy from.
   * @returns This matrix for chaining.
   */
  copy(m: OSMatrix3): this {
    this.elements = [...m.elements];
    return this;
  }

  /**
   * Multiplies this matrix by a scalar.
   * @param s - The scalar value.
   * @returns This matrix for chaining.
   */
  multiplyScalar(s: number): this {
    const te = this.elements;
    te[0] *= s;
    te[3] *= s;
    te[6] *= s;
    te[1] *= s;
    te[4] *= s;
    te[7] *= s;
    te[2] *= s;
    te[5] *= s;
    te[8] *= s;
    return this;
  }

  /**
   * Calculates the determinant of this matrix.
   * @returns The determinant.
   */
  determinant(): number {
    const te = this.elements;
    const a = te[0],
      b = te[1],
      c = te[2],
      d = te[3],
      e = te[4],
      f = te[5],
      g = te[6],
      h = te[7],
      i = te[8];

    return a * (e * i - f * h) - b * (d * i - f * g) + c * (d * h - e * g);
  }

  /**
   * Inverts this matrix.
   * @returns This matrix for chaining.
   */
  invert(): this {
    const te = this.elements,
      n11 = te[0],
      n21 = te[1],
      n31 = te[2],
      n12 = te[3],
      n22 = te[4],
      n32 = te[5],
      n13 = te[6],
      n23 = te[7],
      n33 = te[8],
      t11 = n33 * n22 - n32 * n23,
      t12 = n32 * n13 - n33 * n12,
      t13 = n23 * n12 - n22 * n13,
      det = n11 * t11 + n21 * t12 + n31 * t13;

    if (det === 0) {
      console.error(
        "OSMatrix3.invert(): can't invert matrix, determinant is 0",
      );
      return this.identity();
    }

    const detInv = 1 / det;

    te[0] = t11 * detInv;
    te[1] = (n31 * n23 - n33 * n21) * detInv;
    te[2] = (n21 * n32 - n31 * n22) * detInv;
    te[3] = t12 * detInv;
    te[4] = (n33 * n11 - n31 * n13) * detInv;
    te[5] = (n31 * n12 - n11 * n32) * detInv;
    te[6] = t13 * detInv;
    te[7] = (n13 * n21 - n11 * n23) * detInv;
    te[8] = (n11 * n22 - n12 * n21) * detInv;

    return this;
  }

  /**
   * Transposes this matrix.
   * @returns This matrix for chaining.
   */
  transpose(): this {
    const te = this.elements;
    let tmp;
    tmp = te[1];
    te[1] = te[3];
    te[3] = tmp;
    tmp = te[2];
    te[2] = te[6];
    te[6] = tmp;
    tmp = te[5];
    te[5] = te[7];
    te[7] = tmp;
    return this;
  }

  /**
   * Converts this OSMatrix3 to a THREE.Matrix3.
   * @returns A new THREE.Matrix3 instance.
   */
  toThreeJS(): THREE.Matrix3 {
    return new THREE.Matrix3().fromArray(this.elements);
  }

  /**
   * Creates an OSMatrix3 from a THREE.Matrix3.
   * @param m - The THREE.Matrix3 to convert from.
   * @returns A new OSMatrix3 instance.
   */
  static fromThreeJS(m: THREE.Matrix3): OSMatrix3 {
    const newM = new OSMatrix3();
    newM.elements = m.toArray();
    return newM;
  }
}
