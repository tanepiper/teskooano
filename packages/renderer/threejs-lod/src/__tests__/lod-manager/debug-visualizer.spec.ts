import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";
import {
  createDebugLabel,
  updateDebugLabel,
  disposeDebugLabel,
  setDebugLabelVisibility,
} from "../../lod-manager/lod-debug-labels";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

describe("Debug Visualizer Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDebugLabel", () => {
    it("should create a debug label with element and CSS2D sprite", () => {
      const debugLabel = createDebugLabel();

      expect(debugLabel).toBeDefined();
      expect(debugLabel.sprite).toBeDefined();
      expect(debugLabel.element).toBeDefined();

      expect(debugLabel.sprite).toBeInstanceOf(CSS2DObject);
      expect(debugLabel.element).toBeInstanceOf(HTMLDivElement);

      expect(debugLabel.element.textContent).toBe("LOD: ?");
      expect(debugLabel.sprite.visible).toBe(false);
    });
  });

  describe("updateDebugLabel", () => {
    it("should update the debug label content", () => {
      const debugLabel = createDebugLabel();

      const lod = new THREE.LOD();
      lod.addLevel(new THREE.Object3D(), 0);
      lod.addLevel(new THREE.Object3D(), 100);
      lod.addLevel(new THREE.Object3D(), 1000);

      lod.position.set(100, 0, 0);
      
      // Mock getCurrentLevel method
      vi.spyOn(lod, "getCurrentLevel").mockReturnValue(1);

      const cameraPosition = new THREE.Vector3(0, 0, 0);

      updateDebugLabel(debugLabel, lod, cameraPosition);

      expect(debugLabel.element.textContent).toContain("LOD: 1");
      expect(debugLabel.element.textContent).toContain("Dist: 100");
    });

    it("should handle missing or null parameters gracefully", () => {
      const debugLabel = createDebugLabel();
      const lod = new THREE.LOD();
      const cameraPosition = new THREE.Vector3(0, 0, 0);

      expect(() => {
        updateDebugLabel(null as any, lod, cameraPosition);
      }).not.toThrow();

      expect(() => {
        updateDebugLabel(debugLabel, null as any, cameraPosition);
      }).not.toThrow();
    });
  });

  describe("disposeDebugLabel", () => {
    it("should dispose of a debug label gracefully", () => {
      const debugLabel = createDebugLabel();

      expect(() => {
        disposeDebugLabel(debugLabel);
      }).not.toThrow();

      expect(() => {
        disposeDebugLabel(null as any);
      }).not.toThrow();
    });
  });

  describe("setDebugLabelVisibility", () => {
    it("should set the visibility of debug labels in a map", () => {
      const debugLabel1 = createDebugLabel();
      const debugLabel2 = createDebugLabel();
      const debugLabels = new Map([
        ["obj1", debugLabel1],
        ["obj2", debugLabel2],
      ]);

      setDebugLabelVisibility(debugLabels, true);

      expect(debugLabel1.sprite.visible).toBe(true);
      expect(debugLabel2.sprite.visible).toBe(true);

      setDebugLabelVisibility(debugLabels, false);

      expect(debugLabel1.sprite.visible).toBe(false);
      expect(debugLabel2.sprite.visible).toBe(false);
    });
  });
});
