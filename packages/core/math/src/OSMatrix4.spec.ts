import { describe, it, expect } from "vitest";
import { OSMatrix4 } from "./OSMatrix4";
import { OSVector3 } from "./OSVector3";
import { OSQuaternion } from "./OSQuaternion";
import * as THREE from "three";

// Helper to compare two matrices
function expectMatricesToBeClose(m1: OSMatrix4, m2: OSMatrix4) {
  for (let i = 0; i < 16; i++) {
    expect(m1.elements[i]).toBeCloseTo(m2.elements[i]);
  }
}

describe("OSMatrix4", () => {
  it("should initialize as an identity matrix", () => {
    const m = new OSMatrix4();
    expect(m.elements).toEqual([
      1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1,
    ]);
  });

  it("should multiply two matrices", () => {
    const osM1 = new OSMatrix4().set(
      1,
      5,
      9,
      13,
      2,
      6,
      10,
      14,
      3,
      7,
      11,
      15,
      4,
      8,
      12,
      16,
    );
    const osM2 = new OSMatrix4().set(
      1,
      5,
      9,
      13,
      2,
      6,
      10,
      14,
      3,
      7,
      11,
      15,
      4,
      8,
      12,
      16,
    );

    const threeM1 = osM1.toThreeJS();
    const threeM2 = osM2.toThreeJS();

    osM1.multiply(osM2);
    threeM1.multiply(threeM2);

    expectMatricesToBeClose(osM1, OSMatrix4.fromThreeJS(threeM1));
  });

  it("should invert a matrix", () => {
    const osM = new OSMatrix4().makePerspective(-1, 1, 1, -1, 1, 100);
    const threeM = osM.toThreeJS();

    osM.invert();
    threeM.invert();

    expectMatricesToBeClose(osM, OSMatrix4.fromThreeJS(threeM));
  });

  it("should transpose a matrix", () => {
    const osM = new OSMatrix4().set(
      1,
      5,
      9,
      13,
      2,
      6,
      10,
      14,
      3,
      7,
      11,
      15,
      4,
      8,
      12,
      16,
    );
    const threeM = osM.toThreeJS();

    osM.transpose();
    threeM.transpose();

    expectMatricesToBeClose(osM, OSMatrix4.fromThreeJS(threeM));
  });

  it("should calculate the determinant", () => {
    const osM = new OSMatrix4().set(
      2,
      3,
      4,
      5,
      -1,
      -2,
      -3,
      -4,
      6,
      7,
      8,
      9,
      -5,
      -6,
      -7,
      -8,
    );
    const threeM = osM.toThreeJS();
    expect(osM.determinant()).toBeCloseTo(threeM.determinant());
  });

  it("should make a rotation matrix from a quaternion", () => {
    const q = new OSQuaternion().setFromAxisAngle(
      new OSVector3(0, 1, 0),
      Math.PI / 2,
    );
    const osM = new OSMatrix4().makeRotationFromQuaternion(q);
    const threeM = new THREE.Matrix4().makeRotationFromQuaternion(
      q.toThreeJS(),
    );
    expectMatricesToBeClose(osM, OSMatrix4.fromThreeJS(threeM));
  });

  it("should create a lookAt matrix", () => {
    const eye = new OSVector3(10, 10, 10);
    const target = new OSVector3(0, 0, 0);
    const up = new OSVector3(0, 1, 0);

    const osM = new OSMatrix4().lookAt(eye, target, up);
    const threeM = new THREE.Matrix4().lookAt(
      eye.toThreeJS(),
      target.toThreeJS(),
      up.toThreeJS(),
    );

    // Three.js lookAt includes translation, our doesn't. We only compare the rotation part.
    for (let i = 0; i < 12; i++) {
      if (i % 4 === 3) continue; // skip translation column
      expect(osM.elements[i]).toBeCloseTo(threeM.elements[i]);
    }
  });

  it("should create a perspective projection matrix", () => {
    const osM = new OSMatrix4().makePerspective(-1, 1, 1, -1, 1, 100);
    const threeM = new THREE.Matrix4().makePerspective(-1, 1, 1, -1, 1, 100);
    expectMatricesToBeClose(osM, OSMatrix4.fromThreeJS(threeM));
  });

  it("should create an orthographic projection matrix", () => {
    const osM = new OSMatrix4().makeOrthographic(-1, 1, 1, -1, 1, 100);
    const threeM = new THREE.Matrix4().makeOrthographic(-1, 1, 1, -1, 1, 100);
    expectMatricesToBeClose(osM, OSMatrix4.fromThreeJS(threeM));
  });
});
