import { describe, it, expect } from "vitest";
import { OSMatrix3 } from "./OSMatrix3";
import * as THREE from "three";

describe("OSMatrix3", () => {
  it("should initialize as an identity matrix", () => {
    const m = new OSMatrix3();
    expect(m.elements).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("should set elements correctly", () => {
    const m = new OSMatrix3();
    m.set(1, 2, 3, 4, 5, 6, 7, 8, 9);
    expect(m.elements).toEqual([1, 4, 7, 2, 5, 8, 3, 6, 9]);
  });

  it("should reset to identity", () => {
    const m = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
    m.identity();
    expect(m.elements).toEqual([1, 0, 0, 0, 1, 0, 0, 0, 1]);
  });

  it("should clone the matrix", () => {
    const m1 = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
    const m2 = m1.clone();
    expect(m2.elements).toEqual(m1.elements);
    expect(m2).not.toBe(m1);
  });

  it("should copy another matrix", () => {
    const m1 = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
    const m2 = new OSMatrix3();
    m2.copy(m1);
    expect(m2.elements).toEqual(m1.elements);
  });

  it("should multiply by a scalar", () => {
    const m = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
    m.multiplyScalar(2);
    expect(m.elements).toEqual([2, 8, 14, 4, 10, 16, 6, 12, 18]);
  });

  it("should calculate the determinant", () => {
    const m = new OSMatrix3().set(2, 3, 1, 0, 1, 2, 0, 2, 1);
    // 2*(1*1 - 2*2) - 3*(0*1 - 2*0) + 1*(0*2 - 1*0) = 2*(-3) - 0 + 0 = -6
    expect(m.determinant()).toBe(-6);
  });

  it("should invert the matrix", () => {
    const m = new OSMatrix3().set(2, 0, 0, 0, 4, 0, 0, 0, 5);
    const mInv = m.clone().invert();
    expect(mInv.elements[0]).toBeCloseTo(1 / 2);
    expect(mInv.elements[4]).toBeCloseTo(1 / 4);
    expect(mInv.elements[8]).toBeCloseTo(1 / 5);

    // Check that M * M^-1 = I
    const threeM = m.toThreeJS();
    const threeMInv = mInv.toThreeJS();
    threeM.multiply(threeMInv);
    const identity = new OSMatrix3().elements;
    for (let i = 0; i < 9; i++) {
      expect(threeM.elements[i]).toBeCloseTo(identity[i]);
    }
  });

  it("should transpose the matrix", () => {
    const m = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
    m.transpose();
    // The original elements are stored column-major: [1, 4, 7, 2, 5, 8, 3, 6, 9]
    // The transposed matrix should have rows and columns swapped.
    // Original:         Transposed:
    // [ 1, 2, 3 ]       [ 1, 4, 7 ]
    // [ 4, 5, 6 ]  -->  [ 2, 5, 8 ]
    // [ 7, 8, 9 ]       [ 3, 6, 9 ]
    // The transposed elements stored column-major: [1, 2, 3, 4, 5, 6, 7, 8, 9]
    expect(m.elements).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("should convert to and from a THREE.Matrix3", () => {
    const m1 = new OSMatrix3().set(1, 2, 3, 4, 5, 6, 7, 8, 9);
    const threeM = m1.toThreeJS();
    const m2 = OSMatrix3.fromThreeJS(threeM);
    expect(m2.elements).toEqual(m1.elements);
    expect(threeM.elements).toEqual(m1.elements);
  });
});
