uniform float time;
uniform vec3 diskColor;
uniform sampler2D noiseTexture; // Optional: for more complex patterns
varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vNormal;

float simpleNoise(vec2 uv, float scale) {
  return fract(sin(dot(uv * scale, vec2(12.9898, 78.233 + time * 0.001))) * 43758.5453);
}

void main() {
  float distFromCenter = length(vUv - vec2(0.5)); // Assuming UVs are 0-1 for the disk
  float radialPattern = smoothstep(0.1, 0.5, distFromCenter) * (1.0 - smoothstep(0.45, 0.5, distFromCenter));
  
  float azimuthalNoise = simpleNoise(vUv, 20.0 + sin(vUv.x * 10.0 + time * 0.05) * 5.0);
  float density = radialPattern * (0.6 + azimuthalNoise * 0.4);
  density = clamp(density, 0.0, 1.0);

  // Lighting (simple lambertian)
  vec3 lightDir = normalize(vec3(0.5, 0.5, 1.0)); // Example light direction
  float lightIntensity = max(0.0, dot(normalize(vNormal), lightDir)) * 0.5 + 0.5;

  gl_FragColor = vec4(diskColor * lightIntensity * density, density * 0.9); // Alpha based on density
} 