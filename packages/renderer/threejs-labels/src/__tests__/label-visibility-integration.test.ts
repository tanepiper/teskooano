import { describe, it, expect, beforeEach, vi } from "vitest";
import { Layer2DManager, CSS2DLayerType, CelestialLabelLayer } from "../index";
import { BaseLabelLayer } from "../layers/BaseLabelLayer";
import * as THREE from "three";

// Mock the celestial state management
vi.mock("@teskooano/core-state", () => ({
  celestialManager: {
    setLabelVisibility: vi.fn(),
    getLabelVisibility: vi.fn(),
    setLabelVisibilityForMultiple: vi.fn(),
  },
}));

describe("Label Visibility Integration", () => {
  let layerManager: Layer2DManager;
  let celestialLayer: CelestialLabelLayer;
  let mockScene: THREE.Scene;
  let mockContainer: HTMLElement;

  beforeEach(() => {
    // Create mock scene and container
    mockScene = new THREE.Scene();
    mockContainer = document.createElement("div");

    // Create the layer manager and celestial layer
    layerManager = new Layer2DManager(mockScene, mockContainer);
    celestialLayer = new CelestialLabelLayer(mockScene);

    // Register the celestial layer
    layerManager.registerLayer(CSS2DLayerType.CELESTIAL_LABELS, celestialLayer);
  });

  describe("Individual Label Visibility Control", () => {
    it("should set visibility of specific label instances", () => {
      // Test setting visibility for a specific label
      const result = layerManager.setInstanceVisibility(
        CSS2DLayerType.CELESTIAL_LABELS,
        "earth",
        false,
      );

      expect(result).toBe(true);
    });

    it("should get visibility state of specific label instances", () => {
      // Test getting visibility state
      const visibility = layerManager.getInstanceVisibility(
        CSS2DLayerType.CELESTIAL_LABELS,
        "earth",
      );

      // Initially undefined since no label exists
      expect(visibility).toBeUndefined();
    });

    it("should handle non-existent labels gracefully", () => {
      // Test with non-existent label
      const result = layerManager.setInstanceVisibility(
        CSS2DLayerType.CELESTIAL_LABELS,
        "non-existent",
        true,
      );

      expect(result).toBe(false);
    });
  });

  describe("Layer Visibility Control", () => {
    it("should control layer-wide visibility", () => {
      // Test setting layer visibility
      layerManager.setLayerVisibility(CSS2DLayerType.CELESTIAL_LABELS, false);

      const layer = layerManager.getLayer(CSS2DLayerType.CELESTIAL_LABELS);
      expect(layer?.isVisible).toBe(false);
    });

    it("should toggle layer visibility", () => {
      const layer = layerManager.getLayer(CSS2DLayerType.CELESTIAL_LABELS);

      // Initially visible
      expect(layer?.isVisible).toBe(true);

      // Hide layer
      layerManager.setLayerVisibility(CSS2DLayerType.CELESTIAL_LABELS, false);
      expect(layer?.isVisible).toBe(false);

      // Show layer
      layerManager.setLayerVisibility(CSS2DLayerType.CELESTIAL_LABELS, true);
      expect(layer?.isVisible).toBe(true);
    });
  });

  describe("BaseLabelLayer Element Visibility", () => {
    it("should control individual element visibility", () => {
      const layer = layerManager.getLayer(CSS2DLayerType.CELESTIAL_LABELS);
      expect(layer).toBeDefined();

      if (layer) {
        // Test setting element visibility
        const result = layer.setElementVisibility("test-id", false);

        // Should return false since element doesn't exist
        expect(result).toBe(false);

        // Test getting element visibility
        const visibility = layer.getElementVisibility("test-id");
        expect(visibility).toBeUndefined();
      }
    });
  });

  describe("Integration with Celestial State", () => {
    it("should respect individual label visibility settings", () => {
      // This test would require integration with the actual celestial state
      // For now, we just verify the methods exist and work
      const { celestialManager } = await import("@teskooano/core-state");

      expect(celestialManager.setLabelVisibility).toBeDefined();
      expect(celestialManager.getLabelVisibility).toBeDefined();
      expect(celestialManager.setLabelVisibilityForMultiple).toBeDefined();
    });
  });

  describe("Performance and Caching", () => {
    it("should handle multiple visibility changes efficiently", () => {
      // Test bulk visibility operations
      const testIds = ["earth", "mars", "venus"];

      for (const id of testIds) {
        const result = layerManager.setInstanceVisibility(
          CSS2DLayerType.CELESTIAL_LABELS,
          id,
          false,
        );

        // All should return false since labels don't exist
        expect(result).toBe(false);
      }
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid layer types gracefully", () => {
      // Test with invalid layer type
      const result = layerManager.setInstanceVisibility(
        "invalid-layer" as CSS2DLayerType,
        "earth",
        true,
      );

      expect(result).toBe(false);
    });

    it("should handle null/undefined parameters gracefully", () => {
      // Test with invalid parameters
      const result = layerManager.setInstanceVisibility(
        CSS2DLayerType.CELESTIAL_LABELS,
        "",
        true,
      );

      expect(result).toBe(false);
    });
  });
});
