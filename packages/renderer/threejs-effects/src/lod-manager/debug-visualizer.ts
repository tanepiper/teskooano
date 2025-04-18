import * as THREE from 'three';

/**
 * Interface for debug label components
 */
export interface DebugLabel {
  sprite: THREE.Sprite;
  material: THREE.SpriteMaterial;
}

/**
 * Create a debug label for an LOD object
 */
export function createDebugLabel(): DebugLabel {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const texture = new THREE.CanvasTexture(canvas);
  const material = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(5, 2.5, 1);
  
  return { sprite, material };
}

/**
 * Update the content of a debug label
 */
export function updateDebugLabel(
  debugLabel: DebugLabel,
  lod: THREE.LOD,
  cameraPosition: THREE.Vector3
): void {
  const texture = debugLabel.material.map;
  if (!texture) return;
  
  const canvas = texture.image;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set up text style
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Arial';
  ctx.textAlign = 'center';
  
  // Calculate distance to camera
  const distance = lod.getWorldPosition(new THREE.Vector3()).distanceTo(cameraPosition);
  
  // Get current LOD level
  const currentLevel = lod.getCurrentLevel();
  const totalLevels = lod.levels.length;
  
  // Draw debug info
  ctx.fillText(`Distance: ${distance.toFixed(0)}`, canvas.width/2, 40);
  ctx.fillText(`LOD: ${currentLevel}/${totalLevels-1}`, canvas.width/2, 80);
  
  // Update texture
  texture.needsUpdate = true;
}

/**
 * Dispose of a debug label and its resources
 */
export function disposeDebugLabel(debugLabel: DebugLabel): void {
  debugLabel.sprite.removeFromParent();
  debugLabel.material.dispose();
  if (debugLabel.material.map) {
    debugLabel.material.map.dispose();
  }
}

/**
 * Set visibility of a debug label
 */
export function setDebugLabelVisibility(debugLabel: DebugLabel, visible: boolean): void {
  debugLabel.sprite.visible = visible;
} 