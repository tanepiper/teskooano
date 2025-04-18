uniform float time;
uniform vec3 planetColor;
uniform vec3 secondaryColor;
uniform float dunePattern;
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

// More directional noise to create dune patterns
float duneNoise(vec2 p) {
  // Make more directional for dune-like patterns
  vec2 dir = vec2(1.0, 0.3); // Main dune direction
  float dirNoise = fbm(p * 3.0 * dir);
  float perpNoise = fbm((p + vec2(100.0, 100.0)) * 4.0 * vec2(-dir.y, dir.x));
  
  // Mix for realistic dunes
  return mix(dirNoise, perpNoise, 0.3);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(vSunDirection);
  vec3 viewDir = normalize(vViewDirection);

  // --- Base Color (Desert) --- 
  vec3 baseColor;
  if (hasTexture) {
    baseColor = texture2D(surfaceTexture, vUv).rgb;
  } else {
    vec2 noiseCoord = vUv * 10.0;
    float elevation = fbm(noiseCoord);
    float dunes = duneNoise(noiseCoord);
    dunes = pow(dunes, 1.5) * dunePattern;
    baseColor = mix(planetColor, secondaryColor, dunes * 0.7 * uSurfaceVariation);
    float craterPattern = smoothstep(0.4, 0.7, fbm(noiseCoord * 2.0 + 50.0));
    baseColor = mix(baseColor, secondaryColor * 0.8, craterPattern * roughness * 0.5 * uSurfaceVariation);
    float shimmer = sin(time * 0.5 + vUv.y * 20.0) * 0.02 * uSurfaceVariation;
    baseColor = mix(baseColor, baseColor * 1.1, shimmer + 0.5);
  }

  // --- Phong Lighting --- 
  // Ambient
  float ambientStrength = 0.2;
  vec3 ambient = ambientStrength * uLightColor;

  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // Specular (Less intense for dry desert)
  float specularStrength = 0.2;
  vec3 halfVec = normalize(lightDir + viewDir);
  float shininess = pow(2.0, (1.0 - roughness) * 5.0); // Lower shininess range
  float spec = pow(max(dot(normal, halfVec), 0.0), shininess);
  vec3 specular = specularStrength * spec * uLightColor;

  // Combine lighting
  vec3 litColor = ambient + diffuse + specular;
  
  // Final color modulation
  vec3 finalColor = baseColor * litColor;

  // Rim lighting (uses viewDir, now correct)
  float rimFactor = 1.0 - max(dot(viewDir, normal), 0.0);
  rimFactor = pow(rimFactor, 3.0);
  finalColor += vec3(0.8, 0.7, 0.5) * rimFactor * 0.15; // Sandy/dusty rim

  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
} 