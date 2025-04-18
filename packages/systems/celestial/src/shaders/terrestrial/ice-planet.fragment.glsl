uniform float time;
uniform vec3 planetColor;
uniform vec3 iceCrackColor;
uniform float crackIntensity;
uniform float iceGloss;
uniform float roughness;
uniform sampler2D surfaceTexture;
uniform bool hasTexture;
uniform vec3 uLightColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying vec3 vViewDirection;

// Noise functions
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

// Special voronoi-like pattern for ice cracks
float iceCracks(vec2 p) {
  p *= 5.0;
  vec2 i = floor(p);
  vec2 f = fract(p);
  
  float minDist = 1.0;
  
  for(int y = -1; y <= 1; y++) {
    for(int x = -1; x <= 1; x++) {
      vec2 neighbor = vec2(float(x),float(y));
      vec2 point = neighbor + noise(i + neighbor) * 0.5;
      float dist = length(f - point);
      minDist = min(minDist, dist);
    }
  }
  
  // Create ridge-like pattern for cracks
  float cracks = 1.0 - smoothstep(0.0, 0.05, minDist);
  return cracks * crackIntensity;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(vSunDirection);
  vec3 viewDir = normalize(vViewDirection);

  // --- Ice Surface Color --- 
  vec3 baseColor;
  if (hasTexture) {
    baseColor = texture2D(surfaceTexture, vUv).rgb;
  } else {
    vec2 noiseCoord = vUv * 8.0;
    float elevation = fbm(noiseCoord);
    elevation = pow(elevation, 0.8);
    baseColor = mix(planetColor, planetColor * 1.2, elevation);
    float cracks = iceCracks(noiseCoord);
    baseColor = mix(baseColor, iceCrackColor, cracks);
    float bumpPattern = fbm(noiseCoord * 4.0) * roughness * 0.3;
    baseColor = mix(baseColor, planetColor * 0.9, bumpPattern);
    float deepIce = smoothstep(0.4, 0.8, elevation);
    baseColor = mix(baseColor, vec3(baseColor.r * 0.8, baseColor.g * 0.9, baseColor.b * 1.2), deepIce * 0.3);
  }

  // --- Phong Lighting --- 
  // Ambient
  float ambientStrength = 0.25; // Higher ambient for bright ice
  vec3 ambient = ambientStrength * uLightColor;

  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // Specular (using iceGloss)
  float specularStrength = 0.8 * iceGloss; // Control strength with gloss
  vec3 halfVec = normalize(lightDir + viewDir);
  float shininess = pow(2.0, iceGloss * 10.0); // Gloss (0-1) maps to shininess (1-1024)
  float spec = pow(max(dot(normal, halfVec), 0.0), shininess);
  vec3 specular = specularStrength * spec * uLightColor;

  // Combine lighting
  vec3 litColor = ambient + diffuse + specular;
  
  // Final color modulation
  vec3 finalColor = baseColor * litColor;
  
  // Rim lighting (keep this as an additive atmospheric effect)
  float rimFactor = 1.0 - max(dot(viewDir, normal), 0.0);
  rimFactor = pow(rimFactor, 3.0);
  finalColor += vec3(0.7, 0.8, 1.0) * rimFactor * 0.3; // Additive rim light

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.5), 1.0); // Allow brightness > 1 for ice glare
} 