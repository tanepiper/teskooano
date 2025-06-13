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
});
