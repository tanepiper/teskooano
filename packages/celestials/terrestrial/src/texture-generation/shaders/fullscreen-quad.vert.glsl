/**
 * Fullscreen quad vertex shader for texture generation passes.
 * Simply passes through UV coordinates for fragment shader processing.
 */

varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = vec4(position, 1.0);
}
