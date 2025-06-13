import { describe, it, expect } from "vitest";
import { OSQuaternion } from "./OSQuaternion";
import { OSVector3 } from "./OSVector3";
import * as THREE from "three";

describe("OSQuaternion", () => {
  it("should initialize with correct default values (identity quaternion)", () => {
    const q = new OSQuaternion();
    expect(q.x).toBe(0);
    expect(q.y).toBe(0);
    expect(q.z).toBe(0);
    expect(q.w).toBe(1);
  });

  it("should initialize with provided values", () => {
    const q = new OSQuaternion(1, 2, 3, 4);
    expect(q.x).toBe(1);
    expect(q.y).toBe(2);
    expect(q.z).toBe(3);
    expect(q.w).toBe(4);
  });

  it("should clone the quaternion", () => {
    const q1 = new OSQuaternion(1, 2, 3, 4);
    const q2 = q1.clone();
    expect(q2.x).toBe(q1.x);
    expect(q2.y).toBe(q1.y);
    expect(q2.z).toBe(q1.z);
    expect(q2.w).toBe(q1.w);
    expect(q2).not.toBe(q1);
  });

  it("should set components", () => {
    const q = new OSQuaternion();
    q.set(1, 2, 3, 4);
    expect(q.x).toBe(1);
    expect(q.y).toBe(2);
    expect(q.z).toBe(3);
    expect(q.w).toBe(4);
  });

  it("should copy components from another quaternion", () => {
    const q1 = new OSQuaternion(1, 2, 3, 4);
    const q2 = new OSQuaternion();
    q2.copy(q1);
    expect(q2.x).toBe(1);
    expect(q2.y).toBe(2);
    expect(q2.z).toBe(3);
    expect(q2.w).toBe(4);
  });

  it("should set from axis-angle", () => {
    const axis = new OSVector3(0, 1, 0); // Y-axis
    const angle = Math.PI / 2; // 90 degrees
    const q = new OSQuaternion();
    q.setFromAxisAngle(axis, angle);

    const halfAngle = angle / 2;
    expect(q.x).toBeCloseTo(0);
    expect(q.y).toBeCloseTo(Math.sin(halfAngle));
    expect(q.z).toBeCloseTo(0);
    expect(q.w).toBeCloseTo(Math.cos(halfAngle));
  });

  it("should convert to a THREE.Quaternion", () => {
    const osq = new OSQuaternion(0.1, 0.2, 0.3, 0.4);
    const threeQ = osq.toThreeJS();
    expect(threeQ).toBeInstanceOf(THREE.Quaternion);
    expect(threeQ.x).toBe(0.1);
    expect(threeQ.y).toBe(0.2);
    expect(threeQ.z).toBe(0.3);
    expect(threeQ.w).toBe(0.4);
  });

  it("should create from a THREE.Quaternion", () => {
    const threeQ = new THREE.Quaternion(0.5, 0.6, 0.7, 0.8);
    const osq = OSQuaternion.fromThreeJS(threeQ);
    expect(osq).toBeInstanceOf(OSQuaternion);
    expect(osq.x).toBe(0.5);
    expect(osq.y).toBe(0.6);
    expect(osq.z).toBe(0.7);
    expect(osq.w).toBe(0.8);
  });

  it("should calculate the dot product", () => {
    const q1 = new OSQuaternion(1, 2, 3, 4);
    const q2 = new OSQuaternion(5, 6, 7, 8);
    const dot = q1.dot(q2);
    expect(dot).toBe(1 * 5 + 2 * 6 + 3 * 7 + 4 * 8); // 5 + 12 + 21 + 32 = 70
  });

  it("should calculate length and lengthSq", () => {
    const q = new OSQuaternion(1, 2, 3, 4);
    const lengthSq = q.lengthSq();
    expect(lengthSq).toBe(1 * 1 + 2 * 2 + 3 * 3 + 4 * 4); // 1 + 4 + 9 + 16 = 30
    expect(q.length()).toBe(Math.sqrt(30));
  });

  it("should normalize the quaternion", () => {
    const q = new OSQuaternion(3, 4, 0, 0);
    q.normalize();
    expect(q.length()).toBeCloseTo(1);
  });

  it("should invert the quaternion", () => {
    const q = new OSQuaternion(0, 0.7071, 0, 0.7071); // 90 deg rotation around Y
    const qInv = q.clone().invert();
    const v = new OSVector3(1, 0, 0);
    v.applyQuaternion(q).applyQuaternion(qInv);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(0);
    expect(v.z).toBeCloseTo(0);
  });

  it("should multiply two quaternions", () => {
    // 90 deg rotation around Y
    const q1 = new OSQuaternion().setFromAxisAngle(
      new OSVector3(0, 1, 0),
      Math.PI / 2,
    );
    // 90 deg rotation around X
    const q2 = new OSQuaternion().setFromAxisAngle(
      new OSVector3(1, 0, 0),
      Math.PI / 2,
    );

    const q3 = q1.clone().multiply(q2);

    const v = new OSVector3(0, 0, 1); // Point on Z axis
    v.applyQuaternion(q3);

    // Should be equivalent to rotating by q2 then q1
    const vCheck = new OSVector3(0, 0, 1);
    vCheck.applyQuaternion(q2).applyQuaternion(q1);

    expect(v.x).toBeCloseTo(vCheck.x);
    expect(v.y).toBeCloseTo(vCheck.y);
    expect(v.z).toBeCloseTo(vCheck.z);
  });

  it("should slerp between two quaternions", () => {
    const q1 = new OSQuaternion(); // Identity
    const q2 = new OSQuaternion().setFromAxisAngle(
      new OSVector3(0, 1, 0),
      Math.PI / 2,
    ); // 90 deg rot
    const qSlerp = q1.clone().slerp(q2, 0.5);

    // The result should be a 45-degree rotation
    const qCheck = new OSQuaternion().setFromAxisAngle(
      new OSVector3(0, 1, 0),
      Math.PI / 4,
    );

    expect(qSlerp.x).toBeCloseTo(qCheck.x);
    expect(qSlerp.y).toBeCloseTo(qCheck.y);
    expect(qSlerp.z).toBeCloseTo(qCheck.z);
    expect(qSlerp.w).toBeCloseTo(qCheck.w);
  });
});
