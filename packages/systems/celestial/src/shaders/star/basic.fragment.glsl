uniform vec3 baseColor;
uniform float surfaceIntensity;

varying vec2 vUv;
varying vec3 vNormal;

void main() {
  // Simple output - just the base color modulated by intensity
  gl_FragColor = vec4(baseColor * surfaceIntensity, 1.0);
} 