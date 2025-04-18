// Cloud Fragment Shader - Simple Procedural Layer

precision highp float;
precision highp int;

uniform float time;
uniform vec3 sunPosition;
uniform vec3 cloudColor;
uniform float cloudOpacity;
uniform float cloudSpeed;
// uniform float planetRadius; // No longer needed by shader logic

varying vec2 vUv; // Keep for potential future use
varying vec3 vWorldPosition;
varying vec3 vNormal; // World normal from vertex shader
varying vec3 vViewDirection; // Vector from surface point to camera

// --- Procedural Noise Functions (hash, gradientNoise) --- //
float hash(vec3 p) {
  p = fract(p * vec3(123.4, 234.5, 345.6));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y * p.z);
}

float gradientNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float a = hash(i + vec3(0.0, 0.0, 0.0));
  float b = hash(i + vec3(1.0, 0.0, 0.0));
  float c = hash(i + vec3(0.0, 1.0, 0.0));
  float d = hash(i + vec3(1.0, 1.0, 0.0));
  float e = hash(i + vec3(0.0, 0.0, 1.0));
  float f_ = hash(i + vec3(1.0, 0.0, 1.0));
  float g = hash(i + vec3(0.0, 1.0, 1.0));
  float h = hash(i + vec3(1.0, 1.0, 1.0));

  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, f_, u.x), mix(g, h, u.x), u.y),
    u.z
  ) * 2.0 - 1.0; // Output range [-1, 1]
}

// --- FBM Function --- //
float fbm(vec3 p, int octaves, float persistence, float lacunarity) {
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0; // Used for normalizing result to 0.0 - 1.0
    for(int i=0; i<octaves; i++) {
        total += gradientNoise(p * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence;
        frequency *= lacunarity;
    }
    return (total / maxValue + 1.0) * 0.5; // Normalize to [0, 1]
}

void main() {
  vec3 worldNormal = normalize(vNormal);
  vec3 viewDir = normalize(vViewDirection);
  vec3 sunDir = normalize(sunPosition);

  // 1. Noise Coordinates: Use world position (scaled) instead of normalized position
  float noiseScale = 0.05; 
  vec3 noiseCoordBase = vWorldPosition * noiseScale;

  // Define FBM parameters
  int octaves = 6;
  float persistence = 0.5;
  float lacunarity = 2.0;

  // Add time-based movement
  vec3 noiseCoord = noiseCoordBase + time * cloudSpeed * 0.1 * vec3(1.0, 0.2, -0.5);
  float noiseValue = fbm(noiseCoord, octaves, persistence, lacunarity);

  // --- Cloud Density / Alpha (Simplified Mapping) --- //
  // Make clouds appear above a threshold, smoother transition
  float density = smoothstep(0.45, 0.7, noiseValue); // Clouds appear in upper half of noise range
  // Removed pow(density, 1.5);

  // --- Edge Fade (Softer) --- //
  float edgeFade = pow(max(0.0, dot(worldNormal, viewDir)), 0.8); 

  // --- Latitude Banding --- //
  vec3 normalizedPos = normalize(vWorldPosition);
  float latitude = normalizedPos.y;
  float latitudeFadeFactor = smoothstep(0.5, 0.9, abs(latitude));
  density *= (1.0 - latitudeFadeFactor * 0.5);

  // Final Alpha Calculation
  float alpha = density * edgeFade * cloudOpacity;
  if (alpha < 0.01) discard;

  // --- Cloud Color / Lighting (Boosted Ambient, No Rim) --- //
  float diffuse = max(0.0, dot(worldNormal, sunDir));
  // Significantly boosted base ambient from 0.7 to 0.9
  vec3 litColor = cloudColor * (0.9 + 0.5 * diffuse); 

  // REMOVED: Rim Lighting for testing
  /*
  float rim = pow(1.0 - max(dot(viewDir, worldNormal), 0.0), 2.5); 
  litColor += cloudColor * rim * 0.4; 
  */

  // Output final color
  gl_FragColor = vec4(clamp(litColor, 0.0, 1.0) * alpha, alpha);
}