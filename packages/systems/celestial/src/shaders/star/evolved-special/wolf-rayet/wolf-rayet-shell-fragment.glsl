uniform float time;
uniform vec3 shellColor;
uniform float opacity;
varying vec3 vNormal;
varying vec2 vUv;

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float noise = simpleNoise(vUv + time * 0.02, 5.0) * 0.5 + simpleNoise(vUv * 2.0 - time * 0.01, 15.0) * 0.5;
  float edgeFactor = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
  float finalAlpha = noise * edgeFactor * opacity;
  gl_FragColor = vec4(shellColor, finalAlpha);
} 