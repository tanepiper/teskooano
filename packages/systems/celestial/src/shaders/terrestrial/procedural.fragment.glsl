// Define maximum number of lights the shader can handle
#define MAX_LIGHTS 4
#define HEIGHT_LEVELS 5

// MODIFIED: Added varyings from vertex shader
varying vec2 vUv;
varying float vHeight;       // Calculated height (0-1) from vertex shader
varying vec3 vWorldPosition;  // World space position of the fragment
varying vec3 vWorldNormal;    // Perturbed world normal from vertex shader
varying vec3 vObjectPosition; // Normalized object-space position for seamless noise
uniform vec3 uCameraPosition;

// Multi-Light Uniforms
uniform int uNumLights;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform vec3 uAmbientLightColor;
uniform float uAmbientLightIntensity;

// Procedural Generation Parameters
uniform float uTime;
uniform float uBumpScale;
uniform float persistence;
uniform float lacunarity;
uniform float uSimplePeriod;
uniform int uOctaves;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;
uniform float uHeight1;
uniform float uHeight2;
uniform float uHeight3;
uniform float uHeight4;
uniform float uHeight5;
uniform float uShininess;        // ADDED: Shininess factor
uniform float uSpecularStrength; // ADDED: Specular intensity

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
    // Start with ambient light
    vec3 totalLight = uAmbientLightColor * uAmbientLightIntensity;
    vec3 directionalLight = vec3(0.0);

    for (int i = 0; i < uNumLights; ++i) {
        if (i >= uNumLights) break; // Safety break
        vec3 lightDir = normalize(uLightPositions[i] - vWorldPosition);
        vec3 lightColor = uLightColors[i];
        float lightIntensity = uLightIntensities[i];

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * lightColor * lightIntensity * 0.3; // Reduced to 30%

        // Specular (Blinn-Phong)
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
        vec3 specular = uSpecularStrength * spec * lightColor * lightIntensity * 0.2; // Reduced to 20%

        directionalLight += diffuse + specular;
    }

    // Balance ambient and directional lighting
    totalLight = mix(totalLight, totalLight + directionalLight, 0.4); // Only add 40% of directional light

    return baseColor * totalLight;
}

// --- Main Function ---

void main() {
    // Use normalized object position as the basis for noise
    vec3 noiseCoord = vObjectPosition * uSimplePeriod; 

    // Calculate noise value (0 to 1 range from our fbm)
    float noiseValue = fbm(noiseCoord, uOctaves, persistence, lacunarity);

    // --- Lighting Calculation --- 
    vec3 baseNormal = normalize(vWorldNormal);
    vec3 viewDir = normalize(uCameraPosition - vWorldPosition);

    // Initialize base color with the lowest level
    vec3 baseColor = uColor1;
    
    // Array of colors and heights for the loop
    vec3 colors[HEIGHT_LEVELS];
    float heights[HEIGHT_LEVELS];
    
    colors[0] = uColor1;
    colors[1] = uColor2;
    colors[2] = uColor3;
    colors[3] = uColor4;
    colors[4] = uColor5;
    
    heights[0] = uHeight1;
    heights[1] = uHeight2;
    heights[2] = uHeight3;
    heights[3] = uHeight4;
    heights[4] = uHeight5;
    
    // Loop through height levels for color blending
    for(int i = 1; i < HEIGHT_LEVELS; i++) {
        float prevHeight = heights[i-1];
        float currHeight = heights[i];
        float blendFactor = smoothstep(prevHeight, currHeight, noiseValue);
        baseColor = mix(baseColor, colors[i], blendFactor);
    }

    // Calculate perturbed normal for bump mapping
    vec3 perturbedNormal = perturbNormal(baseNormal, vWorldPosition, uBumpScale);

    // Use perturbed normal for lighting
    vec3 finalColor = calculateLighting(baseColor, perturbedNormal, viewDir);

    // Output final lit color
    gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
} 