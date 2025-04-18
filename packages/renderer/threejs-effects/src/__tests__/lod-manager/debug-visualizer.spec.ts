import { describe, it, expect, vi, beforeEach } from "vitest";
import * as THREE from "three";
import {
  createDebugLabel,
  updateDebugLabel,
  disposeDebugLabel,
  setDebugLabelVisibility,
} from "../../lod-manager/debug-visualizer";

// Create a mock canvas context
const mockContext = {
  clearRect: vi.fn(),
  fillStyle: "",
  fillRect: vi.fn(),
  font: "",
  textAlign: "",
  fillText: vi.fn(),
};

// Create a mock canvas element
const mockCanvas = {
  width: 256,
  height: 128,
  getContext: () => mockContext,
};

// Mock document.createElement only for canvas
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

      // Verify sprite is a THREE.Sprite
      expect(debugLabel.sprite).toBeInstanceOf(THREE.Sprite);

      // Verify material is a THREE.SpriteMaterial
      expect(debugLabel.material).toBeInstanceOf(THREE.SpriteMaterial);

      // Verify material has a map
      expect(debugLabel.material.map).toBeDefined();
      expect(debugLabel.material.map).toBeInstanceOf(THREE.CanvasTexture);

      // Verify sprite scale was set
      expect(debugLabel.sprite.scale.x).toBe(5);
      expect(debugLabel.sprite.scale.y).toBe(2.5);
      expect(debugLabel.sprite.scale.z).toBe(1);
    });
  });

  describe("updateDebugLabel", () => {
    it("should update the debug label content", () => {
      // Create a debug label
      const debugLabel = createDebugLabel();

      // Create LOD with some levels
      const lod = new THREE.LOD();
      lod.addLevel(new THREE.Object3D(), 0);
      lod.addLevel(new THREE.Object3D(), 100);
      lod.addLevel(new THREE.Object3D(), 1000);

      // Set LOD position
      lod.position.set(100, 0, 0);

      // Create camera position
      const cameraPosition = new THREE.Vector3(0, 0, 0);

      // Update the debug label
      updateDebugLabel(debugLabel, lod, cameraPosition);

      // Verify canvas context methods were called
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
      expect(mockContext.fillText).toHaveBeenCalledTimes(2); // Two lines of text
    });

    it("should handle missing map gracefully", () => {
      // Create a debug label with no map
      const debugLabel = {
        sprite: new THREE.Sprite(),
        material: new THREE.SpriteMaterial(),
      };

      // Remove map
      debugLabel.material.map = null;

      // Create LOD
      const lod = new THREE.LOD();

      // Create camera position
      const cameraPosition = new THREE.Vector3(0, 0, 0);

      // This should not throw an error
      expect(() => {
        updateDebugLabel(debugLabel, lod, cameraPosition);
      }).not.toThrow();
    });
  });

  describe("disposeDebugLabel", () => {
    it("should dispose of a debug label and its resources", () => {
      // Create a debug label
      const debugLabel = createDebugLabel();

      // Spy on dispose methods
      const spriteRemoveSpy = vi.spyOn(debugLabel.sprite, "removeFromParent");
      const materialDisposeSpy = vi.spyOn(debugLabel.material, "dispose");
      const mapDisposeSpy = vi.spyOn(debugLabel.material.map!, "dispose");

      // Dispose of it
      disposeDebugLabel(debugLabel);

      // Verify resources were disposed
      expect(spriteRemoveSpy).toHaveBeenCalled();
      expect(materialDisposeSpy).toHaveBeenCalled();
      expect(mapDisposeSpy).toHaveBeenCalled();
    });
  });

  describe("setDebugLabelVisibility", () => {
    it("should set the visibility of a debug label", () => {
      // Create a debug label
      const debugLabel = createDebugLabel();

      // Set visibility to false
      setDebugLabelVisibility(debugLabel, false);

      // Verify visibility was set
      expect(debugLabel.sprite.visible).toBe(false);

      // Set visibility to true
      setDebugLabelVisibility(debugLabel, true);

      // Verify visibility was set
      expect(debugLabel.sprite.visible).toBe(true);
    });
  });
});
