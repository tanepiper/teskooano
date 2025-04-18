import * as THREE from 'three';
import { BASE_DISTANCE } from './star-field';

/**
 * Create debug visualization objects
 */
export function createDebugVisuals(): THREE.Group {
  const debugGroup = new THREE.Group();
  
  // Create spheres to show layer boundaries
  const createLayerSphere = (radius: number, color: string) => {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshBasicMaterial({
      color: color,
      wireframe: true,
      transparent: true,
      opacity: 0.1
    });
    const sphere = new THREE.Mesh(geometry, material);
    debugGroup.add(sphere);
  };
  
  // Create spheres for each layer
  createLayerSphere(BASE_DISTANCE * 0.5, '#FF0000');  // Close layer
  createLayerSphere(BASE_DISTANCE, '#00FF00');        // Middle layer
  createLayerSphere(BASE_DISTANCE * 1.1, '#0000FF');  // Far layer
  
  // Add axes helper
  const axesHelper = new THREE.AxesHelper(BASE_DISTANCE * 0.1);
  debugGroup.add(axesHelper);
  
  return debugGroup;
}

/**
 * Clean up debug visuals from a group
 */
export function cleanupDebugVisuals(debugGroup: THREE.Group): void {
  while(debugGroup.children.length > 0) {
    const child = debugGroup.children[0];
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      (child.material as THREE.Material).dispose();
    }
    debugGroup.remove(child);
  }
} 