import * as THREE from "three";

/**
 * Updates the position of the entire star field group based on the camera's position
 * to simulate a parallax effect. The background moves slightly opposite to the camera movement,
 * making distant stars appear stationary relative to closer ones.
 *
 * @param starsGroup - The `THREE.Group` containing all the star field layers.
 * @param camera - The main `THREE.PerspectiveCamera`.
 * @param parallaxStrength - A factor controlling the intensity of the parallax effect. Smaller values make the stars appear more distant (move less).
 */
export function updateParallax(
  starsGroup: THREE.Group,
  camera: THREE.PerspectiveCamera | null,
  parallaxStrength: number = 0.1,
): void {
  if (camera) {
    const cameraPos = camera.position;

    const parallaxX = -cameraPos.x * parallaxStrength;
    const parallaxY = -cameraPos.y * parallaxStrength;
    const parallaxZ = -cameraPos.z * parallaxStrength;

    starsGroup.position.set(parallaxX, parallaxY, parallaxZ);
  }
}

/**
 * Applies a subtle rotational animation to the individual star field layers.
 * Each layer rotates at a slightly different speed to enhance the perception of depth.
 * The overall group rotation is currently commented out.
 *
 * @param starsGroup - The `THREE.Group` containing all the star field layers (currently unused in this function).
 * @param starLayers - An array of the individual `THREE.Points` star field layers.
 * @param deltaTime - The time elapsed since the last frame, used for frame-rate independent animation.
 * @param rotationSpeed - The base speed factor for the rotation.
 */
export function animateStarField(
  starsGroup: THREE.Group,
  starLayers: THREE.Points[],
  deltaTime: number,
  rotationSpeed: number = 0.00000002,
): void {
  if (starLayers.length >= 3) {
    starLayers[0].rotation.y += rotationSpeed * deltaTime * 0.5;
    starLayers[1].rotation.y += rotationSpeed * deltaTime * 0.3;
    starLayers[2].rotation.y += rotationSpeed * deltaTime * 0.1;
  }
}
