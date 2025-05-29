uniform float time;
uniform vec3 shellColor;
uniform float opacity;
varying vec3 vNormal;
varying vec2 vUv;

float simpleNoise(vec2 uv, float scale, float speed) {
  return fract(sin(dot(uv * scale + time * speed, vec2(12.9898, 78.233))) * 43758.5453);
}

void main() {
  float noise1 = simpleNoise(vUv, 3.0, 0.01);
  float noise2 = simpleNoise(vUv * 1.5 + vec2(0.5,0.5), 5.0, 0.005);
  float combinedNoise = noise1 * 0.6 + noise2 * 0.4;
  float edgeFactor = pow(smoothstep(0.0, 1.0, 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)))), 1.5);
  float finalAlpha = combinedNoise * edgeFactor * opacity;
  gl_FragColor = vec4(shellColor, finalAlpha);
} 