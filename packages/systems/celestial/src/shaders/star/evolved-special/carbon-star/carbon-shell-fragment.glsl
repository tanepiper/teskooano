uniform float time;
uniform vec3 shellColor;
uniform float opacity;
varying vec3 vNormal;
varying vec2 vUv;
varying vec3 vPosition;

float simpleNoise(vec3 pos, float scale, float speed) {
  return fract(sin(dot(pos * scale + vec3(time * speed, time * speed * 0.5, time * speed * 0.25), vec3(12.9898, 78.233, 54.531))) * 43758.5453);
}

void main() {
  float noise1 = simpleNoise(vPosition * 0.1, 3.0, 0.01);
  float noise2 = simpleNoise(vPosition * 0.1 * 1.5 + vec3(0.05,0.05,0.05), 5.0, 0.005);
  float combinedNoise = noise1 * 0.6 + noise2 * 0.4;
  float edgeFactor = pow(smoothstep(0.0, 1.0, 1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0)))), 1.5);
  float finalAlpha = combinedNoise * edgeFactor * opacity;
  gl_FragColor = vec4(shellColor, finalAlpha);
} 