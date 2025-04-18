uniform float time;
uniform vec3 planetColor;
uniform float roughness;
uniform vec3 viewPosition;
uniform vec3 lightPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewPosition;

float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float smoothNoise(vec2 p) {
  vec2 lv = fract(p);
  vec2 id = floor(p);
  
  lv = lv * lv * (3.0 - 2.0 * lv);
  
  float bl = noise(id);
  float br = noise(id + vec2(1.0, 0.0));
  float tl = noise(id + vec2(0.0, 1.0));
  float tr = noise(id + vec2(1.0, 1.0));
  
  float b = mix(bl, br, lv.x);
  float t = mix(tl, tr, lv.x);
  
  return mix(b, t, lv.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float freq = 1.0;
  float amp = 0.5;
  for(int i = 0; i < 5; i++) {
    sum += smoothNoise(p * freq) * amp;
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  // Normalize light direction
  vec3 lightDir = normalize(lightPosition);
  vec3 normal = normalize(vNormal);
  
  // Basic diffuse lighting
  float diff = max(dot(normal, lightDir), 0.0);
  
  // Generate ice-like surface with cracks and variations
  vec2 noiseCoord = vUv * 12.0;
  float iceNoise = fbm(noiseCoord);
  
  // Create cracking patterns in the ice
  float cracks = smoothstep(0.4, 0.6, fbm(noiseCoord * 3.0));
  
  // Base color with blue-white tint
  vec3 baseColor = planetColor;
  
  // Create color variations simulating different ice formations
  vec3 iceCrackColor = vec3(0.8, 0.9, 1.0) * 0.8; // Slightly blue cracks
  vec3 iceSurfaceColor = mix(baseColor, vec3(1.0, 1.0, 1.0), iceNoise * 0.3);
  
  // Final ice surface with cracks
  vec3 color = mix(iceSurfaceColor, iceCrackColor, cracks * roughness * 0.7);
  
  // Add subtle blue tint for shadows
  color = mix(color, vec3(0.8, 0.9, 1.0) * 0.7, (1.0 - diff) * 0.3);
  
  // Apply fresnel effect for ice shininess
  vec3 viewDir = normalize(vViewPosition);
  float fresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 5.0);
  
  // Add the fresnel effect to simulate ice reflectivity
  color += vec3(1.0) * fresnel * 0.3;
  
  // Apply diffuse lighting
  color = color * (diff * 0.7 + 0.3);
  
  gl_FragColor = vec4(color, 1.0);
} 