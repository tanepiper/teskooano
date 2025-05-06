import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";
import {
  createDebugLabel,
  updateDebugLabel,
  disposeDebugLabel,
  setDebugLabelVisibility,
} from "../../lod-manager/debug-visualizer";

const mockContext = {
  clearRect: vi.fn(),
  fillStyle: "",
  fillRect: vi.fn(),
  font: "",
  textAlign: "",
  fillText: vi.fn(),
};

const mockCanvas = {
  width: 256,
  height: 128,
  getContext: () => mockContext,
};

vi.spyOn(document, "createElement").mockImplementation((tagName) => {
  if (tagName === "canvas") {
    return mockCanvas as unknown as HTMLCanvasElement;
  }
  return document.createElement(tagName);
});

describe("Debug Visualizer Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createDebugLabel", () => {
    it("should create a debug label with sprite and material", () => {
      const debugLabel = createDebugLabel();

      expect(debugLabel).toBeDefined();
      expect(debugLabel.sprite).toBeDefined();
      expect(debugLabel.material).toBeDefined();

      expect(debugLabel.sprite).toBeInstanceOf(THREE.Sprite);

      expect(debugLabel.material).toBeInstanceOf(THREE.SpriteMaterial);

      expect(debugLabel.material.map).toBeDefined();
      expect(debugLabel.material.map).toBeInstanceOf(THREE.CanvasTexture);

      expect(debugLabel.sprite.scale.x).toBe(5);
      expect(debugLabel.sprite.scale.y).toBe(2.5);
      expect(debugLabel.sprite.scale.z).toBe(1);
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

      const cameraPosition = new THREE.Vector3(0, 0, 0);

      updateDebugLabel(debugLabel, lod, cameraPosition);

      expect(mockContext.clearRect).toHaveBeenCalledWith(
        0,
        0,
        mockCanvas.width,
        mockCanvas.height,
      );
      expect(mockContext.fillRect).toHaveBeenCalledWith(
        0,
        0,
        mockCanvas.width,
        mockCanvas.height,
      );
      expect(mockContext.fillText).toHaveBeenCalledTimes(2);
    });

    it("should handle missing map gracefully", () => {
      const debugLabel = {
        sprite: new THREE.Sprite(),
        material: new THREE.SpriteMaterial(),
      };

      debugLabel.material.map = null;

      const lod = new THREE.LOD();

      const cameraPosition = new THREE.Vector3(0, 0, 0);

      expect(() => {
        updateDebugLabel(debugLabel, lod, cameraPosition);
      }).not.toThrow();
    });
  });

  describe("disposeDebugLabel", () => {
    it("should dispose of a debug label and its resources", () => {
      const debugLabel = createDebugLabel();

      const spriteRemoveSpy = vi.spyOn(debugLabel.sprite, "removeFromParent");
      const materialDisposeSpy = vi.spyOn(debugLabel.material, "dispose");
      const mapDisposeSpy = vi.spyOn(debugLabel.material.map!, "dispose");

      disposeDebugLabel(debugLabel);

      expect(spriteRemoveSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
      expect(mapDisposeSpy).toHaveBeenCalled();
    });
  });

  describe("setDebugLabelVisibility", () => {
    it("should set the visibility of a debug label", () => {
      const debugLabel = createDebugLabel();

      setDebugLabelVisibility(debugLabel, false);

      expect(debugLabel.sprite.visible).toBe(false);

      setDebugLabelVisibility(debugLabel, true);

      expect(debugLabel.sprite.visible).toBe(true);
    });
  });
});
