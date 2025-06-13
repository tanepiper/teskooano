import * as THREE from "three";

/**
 * Create debug visualization objects
 */
export function createDebugVisuals(
  baseDistance: number,
  layerMultipliers: number[],
): THREE.Group {
  const debugGroup = new THREE.Group();

  const colors = ["#FF0000", "#00FF00", "#0000FF"];

  const createLayerSphere = (radius: number, color: string) => {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.1,
    });
    const sphere = new THREE.Mesh(geometry, material);
    debugGroup.add(sphere);
  };

  layerMultipliers.forEach((multiplier, index) => {
    createLayerSphere(baseDistance * multiplier, colors[index % colors.length]);
  });

  const axesHelper = new THREE.AxesHelper(baseDistance * 0.1);
  debugGroup.add(axesHelper);

  return debugGroup;
}

/**
 * Clean up debug visuals from a group
 */
export function cleanupDebugVisuals(debugGroup: THREE.Group): void {
  while (debugGroup.children.length > 0) {
    const child = debugGroup.children[0];
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
    debugGroup.remove(child);
  }
}
