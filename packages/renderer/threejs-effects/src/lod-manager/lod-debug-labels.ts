import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";

// Interface for the Debug Label structure
export interface DebugLabel {
  element: HTMLDivElement;
  sprite: CSS2DObject; // Use CSS2DObject for better DOM integration
}

// Function to create a debug label element and sprite
export function createDebugLabel(): DebugLabel {
  const element = document.createElement("div");
  element.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  element.style.color = "#fff";
  element.style.padding = "2px 5px";
  element.style.borderRadius = "3px";
  element.style.fontSize = "10px";
  element.style.fontFamily = "monospace";
  element.style.whiteSpace = "pre"; // Keep formatting
  element.style.pointerEvents = "none"; // Don't block interactions
  element.textContent = "LOD: ?";

  const sprite = new CSS2DObject(element);
  sprite.position.set(0, 1.1, 0); // Position slightly above the object center (adjust as needed)
  sprite.center.set(0.5, 0); // Center horizontally, align bottom vertically
  sprite.layers.set(0); // Use default layer
  sprite.visible = false; // Start hidden until debug is enabled

  return { element, sprite };
}

// Function to update the debug label content
export function updateDebugLabel(
  debugLabel: DebugLabel,
  lod: THREE.LOD,
  cameraPosition: THREE.Vector3,
): void {
  if (!debugLabel || !debugLabel.element || !lod) return;

  const currentLevel = lod.getCurrentLevel();
  const worldPos = lod.getWorldPosition(new THREE.Vector3());
  const distance = worldPos.distanceTo(cameraPosition);

  debugLabel.element.textContent = `LOD: ${currentLevel}\nDist: ${distance.toFixed(0)}`;
}

// Function to dispose of a debug label's resources
export function disposeDebugLabel(debugLabel: DebugLabel): void {
  if (!debugLabel) return;

  // Remove element from DOM if it was attached (CSS2DRenderer handles this)
  // No specific THREE.js geometry/material to dispose for CSS2DObject itself

  // Clear references
  // (TypeScript should handle garbage collection, but explicit nulling can help)
  // debugLabel.element = null;
  // debugLabel.sprite = null;
}

// Function to set visibility for multiple debug labels
export function setDebugLabelVisibility(
  debugLabels: Map<string, DebugLabel>,
  visible: boolean,
): void {
  debugLabels.forEach((debugLabel) => {
    if (debugLabel.sprite) {
      debugLabel.sprite.visible = visible;
    }
  });
}
