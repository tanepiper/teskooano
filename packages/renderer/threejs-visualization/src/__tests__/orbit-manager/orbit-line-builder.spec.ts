import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as THREE from "three";
import {
  createOrbitLine,
  updateOrbitLine,
  disposeOrbitLine,
} from "../../orbit-manager/orbit-line-builder";

describe("Orbit Line Builder Module", () => {
  let mockPoints: THREE.Vector3[];

  beforeEach(() => {
    // Setup test data
    mockPoints = [
      new THREE.Vector3(1, 0, 0),
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-1, 0, 0),
      new THREE.Vector3(0, -1, 0),
    ];
  });

  describe("createOrbitLine", () => {
    it("should create a line with the provided points", () => {
      const line = createOrbitLine(mockPoints, false);

      // Check line was created and is a THREE.Line
      expect(line).toBeInstanceOf(THREE.Line);

      // Check material properties for planet orbit (not a moon)
      expect(line.material).toBeInstanceOf(THREE.LineBasicMaterial);
      const material = line.material as THREE.LineBasicMaterial;
      expect(material.color.getHexString()).toBe("444444");
      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(0.5);
      expect(material.linewidth).toBe(1);
      expect(material.depthTest).toBe(false);
      expect(material.depthWrite).toBe(false);
      expect(material.side).toBe(THREE.DoubleSide);
      expect(material.fog).toBe(false);

      // Check line rendering properties
      expect(line.renderOrder).toBe(1);
      expect(line.frustumCulled).toBe(false);

      // Check geometry
      expect(line.geometry).toBeInstanceOf(THREE.BufferGeometry);
      expect(line.geometry.attributes.position).toBeDefined();
    });

    it("should create a line with different styling for moon orbits", () => {
      const isMoon = true;
      const line = createOrbitLine(mockPoints, isMoon);

      // Check material properties for moon orbit
      expect(line.material).toBeInstanceOf(THREE.LineBasicMaterial);
      const material = line.material as THREE.LineBasicMaterial;
      expect(material.color.getHexString()).toBe("00ffff");
      expect(material.transparent).toBe(true);
      expect(material.opacity).toBe(0.8);
      expect(material.linewidth).toBe(2);
      expect(material.depthTest).toBe(false);
      expect(material.depthWrite).toBe(false);
      expect(material.side).toBe(THREE.DoubleSide);
      expect(material.fog).toBe(false);
    });
  });

  describe("updateOrbitLine", () => {
    it("should update the geometry of an existing line", () => {
      // Create an initial line
      const line = createOrbitLine(mockPoints, false);

      // Create new points for update
      const newPoints = [
        new THREE.Vector3(2, 0, 0),
        new THREE.Vector3(0, 2, 0),
        new THREE.Vector3(-2, 0, 0),
        new THREE.Vector3(0, -2, 0),
      ];

      // Update the line
      updateOrbitLine(line, newPoints);

      // Get the position attribute
      const positionAttribute = line.geometry.getAttribute(
        "position",
      ) as THREE.BufferAttribute;

      // Verify the geometry was updated with new points
      for (let i = 0; i < newPoints.length; i++) {
        const point = newPoints[i];
        const baseIndex = i * 3;
        expect(positionAttribute.array[baseIndex]).toBe(point.x);
        expect(positionAttribute.array[baseIndex + 1]).toBe(point.y);
        expect(positionAttribute.array[baseIndex + 2]).toBe(point.z);
      }
    });
  });

  describe("disposeOrbitLine", () => {
    it("should dispose of a line and its resources", () => {
      // Create a line to dispose
      const line = createOrbitLine(mockPoints, false);

      // Spy on dispose methods
      const geometryDisposeSpy = vi.spyOn(line.geometry, "dispose");
      const materialDisposeSpy = vi.spyOn(
        line.material as THREE.Material,
        "dispose",
      );

      // Dispose of the line
      disposeOrbitLine(line);

      // Check that geometry and material were disposed
      expect(geometryDisposeSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
    });
  });
});
