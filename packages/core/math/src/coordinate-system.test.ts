import { describe, it, expect } from "vitest";
import { OSVector3, OSQuaternion } from "./index";
import { Vector3, Quaternion } from "three";

describe("Coordinate System", () => {
  describe("OSVector3 Right-Handed Coordinate System", () => {
    it("should maintain right-handed cross product", () => {
      const x = new OSVector3(1, 0, 0); // X-axis
      const y = new OSVector3(0, 1, 0); // Y-axis
      const cross = x.clone().cross(y);

      // In a right-handed system: X × Y = Z
      expect(cross.x).toBeCloseTo(0, 10);
      expect(cross.y).toBeCloseTo(0, 10);
      expect(cross.z).toBeCloseTo(1, 10);
    });

    it("should maintain right-handed cross product for other axes", () => {
      const y = new OSVector3(0, 1, 0); // Y-axis
      const z = new OSVector3(0, 0, 1); // Z-axis
      const cross = y.clone().cross(z);

      // In a right-handed system: Y × Z = X
      expect(cross.x).toBeCloseTo(1, 10);
      expect(cross.y).toBeCloseTo(0, 10);
      expect(cross.z).toBeCloseTo(0, 10);
    });

    it("should maintain right-handed cross product for Z × X", () => {
      const z = new OSVector3(0, 0, 1); // Z-axis
      const x = new OSVector3(1, 0, 0); // X-axis
      const cross = z.clone().cross(x);

      // In a right-handed system: Z × X = Y
      expect(cross.x).toBeCloseTo(0, 10);
      expect(cross.y).toBeCloseTo(1, 10);
      expect(cross.z).toBeCloseTo(0, 10);
    });

    it("should handle cross product with negative components", () => {
      const a = new OSVector3(1, 2, 3);
      const b = new OSVector3(4, 5, 6);
      const cross = a.clone().cross(b);

      // Verify the result is perpendicular to both vectors
      expect(a.dot(cross)).toBeCloseTo(0, 10);
      expect(b.dot(cross)).toBeCloseTo(0, 10);

      // Verify the magnitude follows the right-hand rule
      const expectedMagnitude =
        a.length() * b.length() * Math.sin(a.angleTo(b));
      expect(cross.length()).toBeCloseTo(expectedMagnitude, 10);
    });
  });

  describe("OSQuaternion Right-Handed Rotations", () => {
    it("should rotate around Y-axis in right-handed direction", () => {
      const quat = new OSQuaternion().setFromAxisAngle(
        new OSVector3(0, 1, 0), // Y-axis
        Math.PI / 2, // 90 degrees
      );

      const vector = new OSVector3(1, 0, 0); // Point along X-axis
      vector.applyQuaternion(quat);

      // Rotating (1,0,0) 90° around Y-axis should give (0,0,-1) in right-handed system
      expect(vector.x).toBeCloseTo(0, 10);
      expect(vector.y).toBeCloseTo(0, 10);
      expect(vector.z).toBeCloseTo(-1, 10);
    });

    it("should rotate around X-axis in right-handed direction", () => {
      const quat = new OSQuaternion().setFromAxisAngle(
        new OSVector3(1, 0, 0), // X-axis
        Math.PI / 2, // 90 degrees
      );

      const vector = new OSVector3(0, 1, 0); // Point along Y-axis
      vector.applyQuaternion(quat);

      // Rotating (0,1,0) 90° around X-axis should give (0,0,1) in right-handed system
      expect(vector.x).toBeCloseTo(0, 10);
      expect(vector.y).toBeCloseTo(0, 10);
      expect(vector.z).toBeCloseTo(1, 10);
    });

    it("should rotate around Z-axis in right-handed direction", () => {
      const quat = new OSQuaternion().setFromAxisAngle(
        new OSVector3(0, 0, 1), // Z-axis
        Math.PI / 2, // 90 degrees
      );

      const vector = new OSVector3(1, 0, 0); // Point along X-axis
      vector.applyQuaternion(quat);

      // Rotating (1,0,0) 90° around Z-axis should give (0,1,0) in right-handed system
      expect(vector.x).toBeCloseTo(0, 10);
      expect(vector.y).toBeCloseTo(1, 10);
      expect(vector.z).toBeCloseTo(0, 10);
    });
  });

  describe("Three.js Compatibility", () => {
    it("should convert to Three.js Vector3 correctly", () => {
      const osVector = new OSVector3(1.5, 2.7, -3.2);
      const threeVector = osVector.toThreeJS();

      expect(threeVector.x).toBe(osVector.x);
      expect(threeVector.y).toBe(osVector.y);
      expect(threeVector.z).toBe(osVector.z);
    });

    it("should convert from Three.js Vector3 correctly", () => {
      const threeVector = new Vector3(1.5, 2.7, -3.2);
      const osVector = OSVector3.fromThreeJS(threeVector);

      expect(osVector.x).toBe(threeVector.x);
      expect(osVector.y).toBe(threeVector.y);
      expect(osVector.z).toBe(threeVector.z);
    });

    it("should maintain equality through Three.js conversion", () => {
      const original = new OSVector3(1.5, 2.7, -3.2);
      const threeVector = original.toThreeJS();
      const converted = OSVector3.fromThreeJS(threeVector);

      expect(original.equals(converted)).toBe(true);
    });

    it("should convert to Three.js Quaternion correctly", () => {
      const osQuat = new OSQuaternion(0.1, 0.2, 0.3, 0.9);
      const threeQuat = osQuat.toThreeJS();

      expect(threeQuat.x).toBe(osQuat.x);
      expect(threeQuat.y).toBe(osQuat.y);
      expect(threeQuat.z).toBe(osQuat.z);
      expect(threeQuat.w).toBe(osQuat.w);
    });

    it("should convert from Three.js Quaternion correctly", () => {
      const threeQuat = new Quaternion(0.1, 0.2, 0.3, 0.9);
      const osQuat = OSQuaternion.fromThreeJS(threeQuat);

      expect(osQuat.x).toBe(threeQuat.x);
      expect(osQuat.y).toBe(threeQuat.y);
      expect(osQuat.z).toBe(threeQuat.z);
      expect(osQuat.w).toBe(threeQuat.w);
    });
  });

  describe("Coordinate System Consistency", () => {
    it("should maintain Y-up coordinate system", () => {
      // Verify that our coordinate system is Y-up
      const up = new OSVector3(0, 1, 0);
      const right = new OSVector3(1, 0, 0);
      const forward = new OSVector3(0, 0, 1);

      // Y should be the "up" direction
      expect(up.y).toBe(1);
      expect(up.x).toBe(0);
      expect(up.z).toBe(0);

      // X should be the "right" direction
      expect(right.x).toBe(1);
      expect(right.y).toBe(0);
      expect(right.z).toBe(0);

      // Z should be the "forward" direction
      expect(forward.z).toBe(1);
      expect(forward.x).toBe(0);
      expect(forward.y).toBe(0);
    });

    it("should maintain right-handed orientation", () => {
      // Test the complete right-handed coordinate system
      const x = new OSVector3(1, 0, 0);
      const y = new OSVector3(0, 1, 0);
      const z = new OSVector3(0, 0, 1);

      // Verify right-handed cross products
      expect(x.clone().cross(y).equals(z)).toBe(true);
      expect(y.clone().cross(z).equals(x)).toBe(true);
      expect(z.clone().cross(x).equals(y)).toBe(true);

      // Verify left-handed cross products are negative
      expect(y.clone().cross(x).equals(z.clone().negate())).toBe(true);
      expect(z.clone().cross(y).equals(x.clone().negate())).toBe(true);
      expect(x.clone().cross(z).equals(y.clone().negate())).toBe(true);
    });
  });
});
