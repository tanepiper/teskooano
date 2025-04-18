uniform float time;
uniform vec3 planetColor;
uniform vec3 oceanColor;
uniform float cloudCoverage;
uniform float landRatio;
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

// Noise functions for terrain and clouds
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

// Cloud noise function
float cloudNoise(vec2 p) {
  // Moving clouds
  float cloudSpeed = time * 0.01;
  vec2 cloudOffset = vec2(cloudSpeed, cloudSpeed * 0.5);
  
  // Multi-layered cloud patterns
  float largeCloudPattern = fbm(p * 2.0 + cloudOffset);
  float smallCloudPattern = fbm(p * 5.0 + cloudOffset * 1.2);
  
  return mix(largeCloudPattern, smallCloudPattern, 0.5);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(vSunDirection);
  vec3 viewDir = normalize(vViewDirection);

  // --- Base Color (Land/Ocean) --- 
  vec3 baseColor;
  float isLand = 0.0;
  if (hasTexture) {
    baseColor = texture2D(surfaceTexture, vUv).rgb;
    // Estimate isLand from texture if possible (e.g., based on blue channel)
    // isLand = step(0.5, 1.0 - baseColor.b);
  } else {
    vec2 noiseCoord = vUv * 8.0;
    float elevation = fbm(noiseCoord);
    isLand = smoothstep(1.0 - landRatio - 0.05, 1.0 - landRatio + 0.05, elevation);
    vec3 lowlandColor = mix(planetColor, planetColor * 0.7, 0.3);
    vec3 highlandColor = mix(planetColor, planetColor * 1.3, 0.3);
    vec3 landColor = mix(lowlandColor, highlandColor, smoothstep(1.0 - landRatio, 0.9, elevation));
    vec3 deepOceanColor = oceanColor * 0.7;
    vec3 shallowOceanColor = mix(oceanColor, oceanColor * 1.3, 0.5);
    vec3 waterColor = mix(deepOceanColor, shallowOceanColor, smoothstep(0.0, 1.0 - landRatio, elevation));
    baseColor = mix(waterColor, landColor, isLand);
    float coastalFactor = smoothstep(1.0 - landRatio - 0.08, 1.0 - landRatio - 0.02, elevation);
    baseColor = mix(baseColor, mix(oceanColor * 1.2, landColor * 1.1, 0.5), coastalFactor * (1.0 - isLand) * 0.4 * uSurfaceVariation);
  }

  // --- Cloud Layer --- 
  float cloudPattern = cloudNoise(vUv);
  float cloudMask = smoothstep(1.0 - cloudCoverage, 1.0, cloudPattern);
  vec3 cloudColor = vec3(1.0);

  // --- Phong Lighting --- 
  // Ambient
  float ambientStrength = 0.2;
  vec3 ambient = ambientStrength * uLightColor;

  // Diffuse (affect color beneath clouds)
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // Specular (reduce on land, strong on water)
  float waterRoughness = 0.1; // Water is much smoother than land
  float currentRoughness = mix(waterRoughness, roughness, isLand);
  float specularStrength = mix(0.7, 0.3, currentRoughness); 
  vec3 halfVec = normalize(lightDir + viewDir);
  float shininess = pow(2.0, (1.0 - currentRoughness) * 8.0);
  float spec = pow(max(dot(normal, halfVec), 0.0), shininess);
  vec3 specular = specularStrength * spec * uLightColor;

  // Combine lighting
  vec3 litColor = ambient + diffuse + specular;
  
  // Apply lighting to base color
  vec3 surfaceColor = baseColor * litColor;

  // Apply clouds (lit by diffuse light) on top
  vec3 finalColor = mix(surfaceColor, cloudColor * (ambient + diffuse), cloudMask * 0.8); // Clouds block specular
  
  // Rim lighting (uses viewDir, now correct)
  float rimFactor = 1.0 - max(dot(viewDir, normal), 0.0);
  rimFactor = pow(rimFactor, 3.0);
  finalColor += vec3(0.5, 0.7, 1.0) * rimFactor * 0.2;

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
} 