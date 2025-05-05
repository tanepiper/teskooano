// Define maximum number of lights the shader can handle
#define MAX_LIGHTS 4

// MODIFIED: Added varyings from vertex shader
varying vec2 vUv;
varying float vHeight;       // Calculated height (0-1) from vertex shader
varying vec3 vWorldPosition;  // World space position of the fragment
varying vec3 vWorldNormal;    // Perturbed world normal from vertex shader
varying vec3 vObjectPosition; // Normalized object-space position for seamless noise

// --- Uniforms (Keep as they are) ---
uniform float uTime;
uniform vec3 uCameraPosition;

// Color/Transition/Blend Uniforms
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform float uTransition2;
uniform float uTransition3;
uniform float uTransition4;
uniform float uTransition5;
uniform float uBlend12;
uniform float uBlend23;
uniform float uBlend34;
uniform float uBlend45;

// Multi-Light Uniforms
uniform int uNumLights;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform vec3 uAmbientLightColor;
uniform float uAmbientLightIntensity;
uniform float uBumpScale;

// --- Noise/Shape Parameters (needed for fbm) ---
uniform float persistence;
uniform float lacunarity;

// --- New Simple Generation Parameters --- 
uniform float uSimplePeriod; // Controls the scale of the new noise pattern
uniform int uOctaves;

// --- NEW Color Uniforms for Simple Shader --- 
uniform vec3 uWaterColor;       // Replaces hardcoded blue water
uniform vec3 uTerrainColor1;    // Replaces hardcoded green terrain
uniform vec3 uTerrainColor2;    // Replaces hardcoded yellow terrain
uniform vec3 uTerrainEdgeColor; // Replaces hardcoded brown edge

// Configurable Colors
uniform vec3 uColorLow;
uniform vec3 uColorMid1;
uniform vec3 uColorMid2;
uniform vec3 uColorHigh;

// Include Simplex noise implementation
#include "../shared/simplex/3d" // Try without leading slash

// --- Helper Functions ---

// Function to calculate lighting contribution from a single light source
vec3 calculateLightContribution(vec3 lightPos, vec3 lightColor, float intensity, vec3 normal, vec3 viewDir, vec3 worldPos) {
    vec3 lightDir = normalize(lightPos - worldPos);
    float diff = max(dot(normal, lightDir), 0.0);
    vec3 diffuse = lightColor * diff * intensity;

    // Basic Blinn-Phong Specular
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0); // Shininess factor 32
    vec3 specular = lightColor * spec * intensity * 0.3; // Specular intensity 0.3

    return diffuse + specular;
}

// --- Noise Functions (Modified for vec3 input) --- 
/* REMOVED old hash function
float hash(vec3 p) {
  p = fract(p * vec3(123.4, 234.5, 345.6));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y * p.z);
}
*/

/* REMOVED old gradientNoise function
float gradientNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  // Hash corners of cube
  float a = hash(i + vec3(0.0, 0.0, 0.0));
  float b = hash(i + vec3(1.0, 0.0, 0.0));
  float c = hash(i + vec3(0.0, 1.0, 0.0));
  float d = hash(i + vec3(1.0, 1.0, 0.0));
  float e = hash(i + vec3(0.0, 0.0, 1.0));
  float f_ = hash(i + vec3(1.0, 0.0, 1.0));
  float g = hash(i + vec3(0.0, 1.0, 1.0));
  float h = hash(i + vec3(1.0, 1.0, 1.0));

  // Interpolate along x, then y, then z (trilinear interpolation)
  return mix(
    mix(mix(a, b, u.x), mix(c, d, u.x), u.y),
    mix(mix(e, f_, u.x), mix(g, h, u.x), u.y),
    u.z
  );
}
*/

// Basic FBM for vec3 input using Simplex Noise
float fbm(vec3 p, int octaves_param, float persistence_param, float lacunarity_param) {
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;  // Used for normalizing result to 0.0 - 1.0

    for(int i = 0; i < octaves_param; i++) {
        // Use snoise (from included file) which returns roughly -1.0 to 1.0
        total += snoise(p * frequency) * amplitude;
        
        maxValue += amplitude;
        amplitude *= persistence_param;
        frequency *= lacunarity_param;
    }

    // Normalize the result to be between 0.0 and 1.0
    // snoise range is approx -1 to 1, so total range is approx -maxValue to +maxValue
    // Shift and scale to [0, 1]
    return (total / maxValue) * 0.5 + 0.5;
}

// ADDED: Function to perturb normal based on noise gradient
vec3 perturbNormal(vec3 baseNormal, vec3 worldPos, float bumpScale) {
    float epsilon = 0.01; // Small offset for sampling gradient

    // Calculate noise coordinate (same as in main)
    vec3 noiseCoord = vObjectPosition * uSimplePeriod;

    // Sample noise at slightly offset positions
    float noiseX = fbm(noiseCoord + vec3(epsilon, 0.0, 0.0), uOctaves, persistence, lacunarity);
    float noiseY = fbm(noiseCoord + vec3(0.0, epsilon, 0.0), uOctaves, persistence, lacunarity);
    float noiseZ = fbm(noiseCoord + vec3(0.0, 0.0, epsilon), uOctaves, persistence, lacunarity);
    float noiseHere = fbm(noiseCoord, uOctaves, persistence, lacunarity);

    // Approximate gradient (how noise changes in each direction)
    vec3 gradient = vec3(
        (noiseX - noiseHere) / epsilon,
        (noiseY - noiseHere) / epsilon,
        (noiseZ - noiseHere) / epsilon 
    );

    // Project gradient onto the tangent plane (remove component along the normal)
    gradient -= dot(gradient, baseNormal) * baseNormal;

    // Perturb the normal using the gradient and scale
    vec3 perturbedNormal = normalize(baseNormal + gradient * bumpScale);

    return perturbedNormal;
}

// Simple lighting calculation (Blinn-Phongish)
vec3 calculateLighting(vec3 baseColor, vec3 normal, vec3 viewDir) {
    vec3 totalLight = uAmbientLightColor * uAmbientLightIntensity;
    float shininess = 32.0; // Example shininess
    float specularStrength = 0.3; // Example specular strength

    for (int i = 0; i < uNumLights; ++i) {
        if (i >= uNumLights) break; // Safety break
        vec3 lightDir = normalize(uLightPositions[i] - vWorldPosition);
        vec3 lightColor = uLightColors[i];
        float lightIntensity = uLightIntensities[i];

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * lightColor * lightIntensity;

        // Specular (Blinn-Phong)
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), shininess);
        vec3 specular = specularStrength * spec * lightColor * lightIntensity;

        totalLight += diffuse + specular;
    }

    return baseColor * totalLight;
}

// --- Main Function ---

void main() {
    // Use normalized object position as the basis for noise
    vec3 noiseCoord = vObjectPosition * uSimplePeriod; 

    // Calculate noise value (0 to 1 range from our fbm)
    float noiseValue = fbm(noiseCoord, uOctaves, persistence, lacunarity);

    // DEBUG: Output raw noise value as grayscale
    // gl_FragColor = vec4(vec3(noiseValue), 1.0);

    // Original color calculation (Uncommented)
    // Determine terrain mix factor (0 = low, 1 = high)
    float terrainFactor = smoothstep(0.5, 0.6, noiseValue); // Adjust thresholds as needed

    // Blend mid-level colors
    vec3 midColor = mix(uColorMid2, uColorMid1, smoothstep(0.3, 0.8, noiseValue)); 
    
    // Blend in high-level color
    midColor = mix(midColor, uColorHigh, smoothstep(0.6, 0.9, noiseValue));
    
    // Blend low and mid/high colors
    vec3 baseColor = mix(uColorLow, midColor, terrainFactor); 

    // DEBUG: Output baseColor directly
    gl_FragColor = vec4(baseColor, 1.0); 

    // --- Lighting Calculation (MODIFIED) --- 
    vec3 baseNormal = normalize(vWorldNormal); // Original normal
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

    // Calculate perturbed normal for bump mapping
    vec3 perturbedNormal = perturbNormal(baseNormal, vWorldPosition, uBumpScale); // Use the new function

    // Use perturbed normal for lighting
    vec3 finalColor = calculateLighting(baseColor, perturbedNormal, viewDir);

    // Output final lit color
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
} 