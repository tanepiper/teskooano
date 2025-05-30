uniform float time;
uniform vec3 diskColor;
uniform float diskOpacity;
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale + time * 0.002, vec2(15.9898, 72.233))) * 41758.5453);
}

void main() {
  float distFromCenter = length(vUv - vec2(0.5));
  float radialFalloff = smoothstep(0.0, 0.5, distFromCenter) * (1.0 - smoothstep(0.48, 0.5, distFromCenter));

  float densityPattern = simpleNoise(vUv * vec2(30.0, 5.0) + vec2(0.0, time * 0.02), 1.0);
  densityPattern = pow(densityPattern, 1.5);
  
  float finalDensity = radialFalloff * (0.4 + densityPattern * 0.6);
  finalDensity = clamp(finalDensity, 0.0, 1.0);

  vec3 lightDir = normalize(vec3(0.5, 0.8, 0.7)); 
  float lightIntensity = max(0.1, dot(normalize(vNormal), lightDir)) * 0.7 + 0.3;
  
  gl_FragColor = vec4(diskColor * lightIntensity, finalDensity * diskOpacity);
} 