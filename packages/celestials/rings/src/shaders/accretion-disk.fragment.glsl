#include <common>
#include <logdepthbuf_pars_fragment>

uniform vec3 color;
uniform float opacity;
uniform vec3 uParentPosition; // World position of the parent body
uniform float uParentRadius;  // Radius of the parent body (used for shadow calculation)
uniform float uDynamicAmbientIntensity; // Dynamic ambient lighting
uniform float time;

// Accretion Disk Specific Uniforms
uniform bool uIsAccretionDisk;
uniform float uTemperature; // Temperature in Kelvin
uniform float uAccretionRate; // Accretion rate in solar masses per year
uniform int uEmissionType; // 0=thermal, 1=synchrotron, 2=mixed
uniform bool uIsRelativistic;
uniform float uInnerEdgeRadius; // Inner edge in gravitational radii

// Unified Light Source structure
struct LightSource {
    vec3 position;
    vec3 color;
    float intensity;
};
uniform int uNumLights;
uniform LightSource uLightSources[MAX_LIGHTS];

// Shadow Caster structure (for moons)
struct ShadowCaster {
    vec3 position;
    float radius;
};
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];

#define PI 3.141592653589793
#define STEFAN_BOLTZMANN 5.670374419e-8
#define SOLAR_MASS_PER_YEAR 6.3e22 // kg/year

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vPosition; // World space position of the fragment

// Simplified noise function
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Function to calculate shadow from a single spherical occluder
float getShadow(vec3 fragPos, vec3 lightPos, vec3 casterPos, float casterRadius) {
    vec3 lightDir = normalize(lightPos - fragPos);
    vec3 oc = fragPos - casterPos;
    float b = dot(oc, lightDir);
    float c = dot(oc, oc) - (casterRadius * casterRadius);
    float discriminant = b * b - c;

    if (discriminant < 0.0) {
        return 1.0; // No intersection, fully lit
    }

    float t = -b - sqrt(discriminant);
    if (t > 0.001) { // Epsilon to avoid self-shadowing
        return 0.0; // In shadow
    }

    return 1.0; // Lit
}

// Calculate temperature-based emission color for accretion disks
vec3 calculateAccretionDiskEmission(float temperature, float distanceFromCenter) {
    if (!uIsAccretionDisk) {
        return color; // Use normal ring color
    }
    
    // Temperature decreases with distance from center (T ∝ r^(-3/4) for standard thin disk)
    float localTemperature = temperature * pow(distanceFromCenter, -0.75);
    
    // Planck's law approximation for blackbody radiation
    // Simplified color temperature to RGB conversion
    float temp = localTemperature / 1000.0; // Convert to thousands of Kelvin
    
    vec3 emissionColor;
    if (temp < 0.5) {
        // Very hot - blue-white
        emissionColor = vec3(0.8, 0.9, 1.0);
    } else if (temp < 1.0) {
        // Hot - white
        emissionColor = vec3(1.0, 1.0, 1.0);
    } else if (temp < 2.0) {
        // Warm - yellow-white
        emissionColor = vec3(1.0, 0.95, 0.8);
    } else if (temp < 5.0) {
        // Medium - orange
        emissionColor = vec3(1.0, 0.7, 0.3);
    } else {
        // Cool - red
        emissionColor = vec3(1.0, 0.3, 0.1);
    }
    
    // Add relativistic effects for black holes
    if (uIsRelativistic) {
        // Doppler and gravitational redshift effects
        float relativisticFactor = 1.0 + 0.3 * (1.0 - distanceFromCenter);
        emissionColor *= relativisticFactor;
    }
    
    return emissionColor;
}

// Calculate accretion disk luminosity based on physics
float calculateAccretionLuminosity(float distanceFromCenter) {
    if (!uIsAccretionDisk) {
        return 1.0; // Normal ring lighting
    }
    
    // Luminosity ∝ accretion rate * (1/r - 1/r_inner)
    float innerRadius = uInnerEdgeRadius > 0.0 ? uInnerEdgeRadius : 1.0;
    float luminosity = uAccretionRate * (1.0 / distanceFromCenter - 1.0 / innerRadius);
    
    // Add relativistic effects for black holes
    if (uIsRelativistic) {
        // Relativistic corrections
        float gamma = 1.0 / sqrt(1.0 - 0.1 / distanceFromCenter);
        luminosity *= gamma;
    }
    
    return max(0.1, luminosity);
}

void main() {
    vec3 totalLight = vec3(0.0);
    float ambientIntensity = uDynamicAmbientIntensity;

    // Calculate distance from center for accretion disk physics
    float distanceFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
    
    // For accretion disks, calculate emission based on physics
    vec3 diskColor = calculateAccretionDiskEmission(uTemperature, distanceFromCenter);
    float diskLuminosity = calculateAccretionLuminosity(distanceFromCenter);
    
    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uNumLights) break;

        LightSource light = uLightSources[i];
        if (light.intensity <= 0.0) continue;

        // Calculate Lighting
        vec3 lightDir = normalize(light.position - vPosition);
        vec3 faceNormal = gl_FrontFacing ? vWorldNormal : -vWorldNormal;

        // Lift the light direction slightly to illuminate both sides of the flat disk plane
        vec3 lightLift = vWorldNormal * 0.15;
        vec3 lightDirUp = normalize(lightDir + lightLift);
        vec3 lightDirDown = normalize(lightDir - lightLift);

        float diffuseUp = max(0.0, dot(faceNormal, lightDirUp));
        float diffuseDown = max(0.0, dot(faceNormal, lightDirDown));
        float diffuse = (diffuseUp + diffuseDown) * 1.5;

        // Calculate Shadows
        float shadow = 1.0;
        
        // Shadow from the parent body (black hole/star)
        shadow = min(shadow, getShadow(vPosition, light.position, uParentPosition, uParentRadius));

        // Shadows from other objects
        for (int j = 0; j < MAX_SHADOW_CASTERS; j++) {
            if (j >= uNumShadowCasters) break;
            shadow = min(shadow, getShadow(vPosition, light.position, uShadowCasters[j].position, uShadowCasters[j].radius));
        }

        // Combine lighting
        totalLight += light.color * diffuse * light.intensity * shadow;
    }

    // For accretion disks, add self-emission
    if (uIsAccretionDisk) {
        // Self-emission based on temperature and accretion rate
        vec3 selfEmission = diskColor * diskLuminosity * 0.5;
        totalLight += selfEmission;
        
        // Add turbulence and magnetic field effects
        vec2 noiseCoord = vUv * 50.0 + time * 0.02;
        float turbulence = noise(noiseCoord) * 0.3;
        totalLight += selfEmission * turbulence;
    }

    // Basic noise pattern for texture
    vec2 noiseCoord = vUv * 20.0 + time * 0.01;
    float noiseVal = noise(noiseCoord);
    
    // Create radial bands with simple noise
    float radialBands = 0.8 + 0.2 * sin(distanceFromCenter * 20.0);
    
    // Combine for final appearance
    float diskVariation = radialBands * (0.8 + 0.2 * noiseVal);

    // Final color calculation
    vec3 finalColor = uIsAccretionDisk ? diskColor : color;
    finalColor *= (totalLight + ambientIntensity) * diskVariation;

    // Apply gamma correction
    finalColor = pow(finalColor, vec3(1.0/2.2));

    gl_FragColor = vec4(finalColor, opacity);

    #include <logdepthbuf_fragment>
} 