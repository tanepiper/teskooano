import { describe, it, expect } from "vitest";
import { OSVector3 } from "./OSVector3";
import { EPSILON } from "./constants";

describe("OSVector3", () => {
  it("should initialize with correct default values", () => {
    const v = new OSVector3();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
    expect(v.z).toBe(0);
  });

  it("should initialize with provided values", () => {
    const v = new OSVector3(1, 2, 3);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
  });

  it("should add another vector", () => {
    const v1 = new OSVector3(1, 2, 3);
    const v2 = new OSVector3(4, 5, 6);
    v1.add(v2);
    expect(v1.x).toBe(5);
    expect(v1.y).toBe(7);
    expect(v1.z).toBe(9);
  });

  it("should subtract another vector", () => {
    const v1 = new OSVector3(5, 7, 9);
    const v2 = new OSVector3(4, 5, 6);
    v1.sub(v2);
    expect(v1.x).toBe(1);
    expect(v1.y).toBe(2);
    expect(v1.z).toBe(3);
  });

  it("should calculate the dot product", () => {
    const v1 = new OSVector3(1, 2, 3);
    const v2 = new OSVector3(4, 5, 6);
    const dot = v1.dot(v2);
    expect(dot).toBe(1 * 4 + 2 * 5 + 3 * 6);
  });

  it("should calculate the cross product", () => {
    const v1 = new OSVector3(1, 0, 0); // X-axis
    const v2 = new OSVector3(0, 1, 0); // Y-axis
    v1.cross(v2);
    expect(v1.x).toBe(0);
    expect(v1.y).toBe(0);
    expect(v1.z).toBe(1); // Z-axis
  });

  it("should linearly interpolate between two vectors", () => {
    const v1 = new OSVector3(0, 0, 0);
    const v2 = new OSVector3(10, 20, 30);
    v1.lerp(v2, 0.5);
    expect(v1.x).toBe(5);
    expect(v1.y).toBe(10);
    expect(v1.z).toBe(15);
  });

  it("should calculate the angle between two vectors", () => {
    const v1 = new OSVector3(1, 0, 0);
    const v2 = new OSVector3(0, 1, 0);
    const angle = v1.angleTo(v2);
    expect(angle).toBeCloseTo(Math.PI / 2);
  });

  it("should project a vector onto another vector", () => {
    const v1 = new OSVector3(2, 3, 0);
    const v2 = new OSVector3(1, 0, 0); // Project onto X-axis
    v1.projectOnVector(v2);
    expect(v1.x).toBeCloseTo(2);
    expect(v1.y).toBeCloseTo(0);
    expect(v1.z).toBeCloseTo(0);
  });

  it("should reflect a vector off a normal", () => {
    const v = new OSVector3(1, -1, 0); // Incident vector
    const normal = new OSVector3(0, 1, 0); // Normal of the "floor"
    v.reflect(normal);
    expect(v.x).toBeCloseTo(1);
    expect(v.y).toBeCloseTo(1);
    expect(v.z).toBeCloseTo(0);
  });

  it("should normalize the vector", () => {
    const v = new OSVector3(3, 4, 0);
    v.normalize();
    expect(v.length()).toBeCloseTo(1);
    expect(v.x).toBeCloseTo(0.6);
    expect(v.y).toBeCloseTo(0.8);
    expect(v.z).toBeCloseTo(0);
  });

  it("should handle normalization of a zero vector", () => {
    const v = new OSVector3(0, 0, 0);
    v.normalize();
    expect(v.length()).toBe(0);
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
    expect(v.z).toBe(0);
  });

  it("should check vector equality with default tolerance", () => {
    const v1 = new OSVector3(1, 2, 3);
    const v2 = new OSVector3(1, 2, 3);
    const v3 = new OSVector3(1.1, 2, 3);

    expect(v1.equals(v2)).toBe(true);
    expect(v1.equals(v3)).toBe(false);
  });

  it("should check vector equality with custom tolerance", () => {
    const v1 = new OSVector3(1, 2, 3);
    const v2 = new OSVector3(1.05, 2.05, 3.05);

    expect(v1.equals(v2, 0.1)).toBe(true);
    expect(v1.equals(v2, 0.01)).toBe(false);
  });

  it("should handle floating point precision in equals", () => {
    const v1 = new OSVector3(0.1 + 0.2, 0.3, 0.4);
    const v2 = new OSVector3(0.3, 0.3, 0.4);

    // These should be equal within EPSILON tolerance using relative approach
    expect(v1.equals(v2)).toBe(true);
  });

  it("should use relative tolerance like THREE.js", () => {
    // Test with large numbers - relative tolerance should be more forgiving
    const v1 = new OSVector3(100, 200, 300);
    const v2 = new OSVector3(100.0001, 200.0001, 300.0001);

    expect(v1.equals(v2)).toBe(true);

    // Test with small numbers - should be stricter
    const v3 = new OSVector3(0.1, 0.2, 0.3);
    const v4 = new OSVector3(0.1000001, 0.2000001, 0.3000001);

    expect(v3.equals(v4)).toBe(true);
  });

  it("should add a scaled vector", () => {
    const v1 = new OSVector3(1, 2, 3);
    const v2 = new OSVector3(4, 5, 6);
    v1.addScaledVector(v2, 2);
    expect(v1.x).toBe(9); // 1 + 4*2
    expect(v1.y).toBe(12); // 2 + 5*2
    expect(v1.z).toBe(15); // 3 + 6*2
  });

  it("should subtract a scaled vector", () => {
    const v1 = new OSVector3(10, 12, 15);
    const v2 = new OSVector3(4, 5, 6);
    v1.subScaledVector(v2, 2);
    expect(v1.x).toBe(2); // 10 - 4*2
    expect(v1.y).toBe(2); // 12 - 5*2
    expect(v1.z).toBe(3); // 15 - 6*2
  });

  it("should negate a vector", () => {
    const v = new OSVector3(1, -2, 3);
    v.negate();
    expect(v.x).toBe(-1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(-3);
  });

  it("should set vector from array", () => {
    const v = new OSVector3();
    const array = [1, 2, 3, 4, 5, 6];
    v.setFromArray(array, 1); // Start from index 1
    expect(v.x).toBe(2);
    expect(v.y).toBe(3);
    expect(v.z).toBe(4);
  });

  it("should set vector from array with default offset", () => {
    const v = new OSVector3();
    const array = [1, 2, 3];
    v.setFromArray(array);
    expect(v.x).toBe(1);
    expect(v.y).toBe(2);
    expect(v.z).toBe(3);
  });

  it("should convert vector to array", () => {
    const v = new OSVector3(1, 2, 3);
    const array = v.toArray();
    expect(array).toEqual([1, 2, 3]);
  });

  it("should check if vector is finite", () => {
    const v1 = new OSVector3(1, 2, 3);
    const v2 = new OSVector3(1, NaN, 3);
    const v3 = new OSVector3(1, 2, Infinity);
    const v4 = new OSVector3(1, -Infinity, 3);

    expect(v1.isFinite()).toBe(true);
    expect(v2.isFinite()).toBe(false);
    expect(v3.isFinite()).toBe(false);
    expect(v4.isFinite()).toBe(false);
  });

  it("should set vector to zero", () => {
    const v = new OSVector3(1, 2, 3);
    v.setZero();
    expect(v.x).toBe(0);
    expect(v.y).toBe(0);
    expect(v.z).toBe(0);
  });
});
