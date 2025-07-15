import * as THREE from "three";
import { CSS2DObject } from "three/examples/jsm/renderers/CSS2DRenderer.js";
import { OSVector3 } from "@teskooano/core-math";

export interface DebugLabel {
  element: HTMLDivElement;
  sprite: CSS2DObject;
}

export function createDebugLabel(): DebugLabel {
  const element = document.createElement("div");
  element.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  element.style.color = "#fff";
  element.style.padding = "2px 5px";
  element.style.borderRadius = "3px";
  element.style.fontSize = "10px";
  element.style.fontFamily = "monospace";
  element.style.whiteSpace = "pre";
  element.style.pointerEvents = "none";
  element.textContent = "LOD: ?";

  const sprite = new CSS2DObject(element);
  sprite.position.set(0, 1.1, 0);
  sprite.center.set(0.5, 0);
  sprite.layers.set(0);
  sprite.visible = false;

  return { element, sprite };
}

export function updateDebugLabel(
  debugLabel: DebugLabel,
  lod: THREE.LOD,
  cameraPosition: THREE.Vector3,
): void {
  if (!debugLabel || !debugLabel.element || !lod) return;

  const currentLevel = lod.getCurrentLevel();

  // Get world position as THREE.Vector3 (needed for Three.js API)
  const worldPosThree = lod.getWorldPosition(new THREE.Vector3());

  // Convert to OSVector3 for calculations
  const worldPos = OSVector3.fromThreeJS(worldPosThree);
  const cameraPos = OSVector3.fromThreeJS(cameraPosition);

  // Calculate distance using OSVector3
  const distance = worldPos.distanceTo(cameraPos);

  debugLabel.element.textContent = `LOD: ${currentLevel}\nDist: ${distance.toFixed(0)}`;
}

export function disposeDebugLabel(debugLabel: DebugLabel): void {
  if (!debugLabel) return;
}

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
