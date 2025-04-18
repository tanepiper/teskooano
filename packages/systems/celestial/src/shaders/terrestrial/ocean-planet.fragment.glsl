uniform float time;
uniform vec3 oceanColor;
uniform vec3 deepOceanColor;
uniform vec3 landColor; 
uniform float landRatio;
uniform float waveHeight;
uniform float roughness;
uniform sampler2D surfaceTexture;
uniform bool hasTexture;
uniform vec3 uLightColor;
uniform float uSurfaceVariation;

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

// Ocean wave function
float oceanWaves(vec2 p, float t) {
  vec2 waveDir1 = vec2(1.0, 0.6);
  vec2 waveDir2 = vec2(-0.7, 0.8);
  vec2 waveDir3 = vec2(0.5, -0.8);
  
  float speed1 = t * 0.07;
  float speed2 = t * 0.05;
  float speed3 = t * 0.09;
  
  float wave1 = sin(dot(p, waveDir1) * 10.0 + speed1) * 0.5 + 0.5;
  float wave2 = sin(dot(p, waveDir2) * 8.0 + speed2) * 0.5 + 0.5;
  float wave3 = sin(dot(p, waveDir3) * 12.0 + speed3) * 0.5 + 0.5;
  
  return (wave1 + wave2 + wave3) / 3.0;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(vSunDirection);
  vec3 viewDir = normalize(vViewDirection);

  // --- Base Color (Ocean/Land) --- 
  vec3 baseColor;
  float isLand = 0.0;
  if (hasTexture) {
    baseColor = texture2D(surfaceTexture, vUv).rgb;
    // Cannot easily determine isLand from texture, assume mostly water for lighting
  } else {
    vec2 noiseCoord = vUv * 6.0;
    float elevation = fbm(noiseCoord);
    float waves = oceanWaves(noiseCoord, time) * waveHeight;
    isLand = smoothstep(1.0 - landRatio - 0.05, 1.0 - landRatio + 0.05, elevation);
    float oceanDepth = smoothstep(0.2, 0.8, elevation);
    vec3 waterColor = mix(deepOceanColor, oceanColor, oceanDepth);
    waterColor = mix(waterColor, waterColor * 1.3, waves * (1.0 - isLand) * 0.5 * uSurfaceVariation);
    vec3 islandColor = landColor * mix(0.8, 1.2, fbm(noiseCoord*3.0)); // Add variation to land
    baseColor = mix(waterColor, islandColor, isLand);
    float shoreline = smoothstep(1.0 - landRatio - 0.08, 1.0 - landRatio - 0.04, elevation);
    baseColor = mix(baseColor, vec3(0.9, 0.95, 1.0), shoreline * (1.0 - isLand) * 0.7);
  }

  // View-dependent water color adjustment
  float waterFresnel = pow(1.0 - max(dot(viewDir, normal), 0.0), 3.0);
  baseColor = mix(baseColor, deepOceanColor, waterFresnel * 0.5 * (1.0 - isLand)); // Only affect water

  // --- Phong Lighting --- 
  // Ambient
  float ambientStrength = 0.2;
  vec3 ambient = ambientStrength * uLightColor;

  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // Specular (stronger for water, controlled by roughness)
  float specularStrength = mix(0.8, 0.2, roughness); // Smoother water = stronger specular
  vec3 halfVec = normalize(lightDir + viewDir); // Blinn-Phong
  float shininess = pow(2.0, (1.0 - roughness) * 6.0); // Water shininess range
  float spec = pow(max(dot(normal, halfVec), 0.0), shininess);
  // Modulate specular by waves for choppy water effect
  float waveSpecularMask = 1.0 - oceanWaves(vUv * 10.0, time) * 0.5 * waveHeight;
  spec *= waveSpecularMask;
  vec3 specular = specularStrength * spec * uLightColor * (1.0 - isLand); // No specular on land

  // Combine lighting
  vec3 litColor = ambient + diffuse + specular;
  
  // Final color modulation
  vec3 finalColor = baseColor * litColor;
  
  // Rim lighting (keep as additive atmosphere)
  float rimFactor = 1.0 - max(dot(viewDir, normal), 0.0);
  rimFactor = pow(rimFactor, 2.0);
  finalColor += vec3(0.6, 0.8, 1.0) * rimFactor * 0.4;

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.5), 1.0); // Allow brightness > 1 for water glare
} 