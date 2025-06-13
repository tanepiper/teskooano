/**
 * @file vertex.glsl
 * @description
 * This is the vertex shader for the procedural nebula effect. Its primary
 * responsibilities are:
 * 1. Pass the UV coordinates to the fragment shader.
 * 2. Calculate the world position of the vertex and pass it to the fragment shader.
 *    This is crucial for using 3D noise, as it bases the noise on the vertex's
 *    actual position in the scene, not just its 2D screen position.
 * 3. Calculate the final clip-space position of the vertex (gl_Position).
 */

varying vec2 vUv;
varying vec3 vWorldPosition;

void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
} 