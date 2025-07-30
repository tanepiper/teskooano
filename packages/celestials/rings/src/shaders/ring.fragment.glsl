#include <common>
#include <logdepthbuf_pars_fragment>

uniform vec3 color;
uniform float opacity;
uniform vec3 uParentPosition; // World position of the parent body
uniform float uParentRadius;  // Radius of the parent body (used for shadow calculation)
uniform float uDynamicAmbientIntensity; // Dynamic ambient lighting
uniform float time;

// Ring Segmentation Controls
uniform float uSegmentDensity; // Number of segments per ring
uniform float uSegmentWidth; // Width of each segment (0.0-1.0)
uniform float uParticleDetail; // Intensity of particle detail
uniform float uDensityVariation; // Intensity of density variations

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

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vPosition; // World space position of the fragment

// Enhanced noise function with better distribution
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

// Fractional Brownian Motion for more complex noise
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
        value += amplitude * noise(st * frequency);
        amplitude *= 0.5;
        frequency *= 2.0;
        st += vec2(3.123, 2.456); // Offset to avoid correlation
    }
    
    return value;
}

// Function to calculate shadow from a single spherical occluder
// Returns 1.0 if lit, 0.0 if in full shadow (umbra), or a value in between for penumbra.
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
        // Simple hard shadow for now, can be improved with penumbra calculation
        return 0.0; // In shadow
    }

    return 1.0; // Lit
}

// Create individual ring segments
float createRingSegments(vec2 uv, float distanceFromCenter) {
    // Convert to polar coordinates for ring segmentation
    vec2 centered = uv - vec2(0.5, 0.5);
    float angle = atan(centered.y, centered.x);
    float radius = length(centered) * 2.0;
    
    // Create multiple ring segment layers
    float segmentDensity = uSegmentDensity; // Number of segments per ring
    float segmentWidth = uSegmentWidth; // Width of each segment (0.0-1.0)
    
    // Primary ring segments
    float primarySegments = sin(angle * segmentDensity + time * 0.1) * 0.5 + 0.5;
    primarySegments = smoothstep(1.0 - segmentWidth, 1.0, primarySegments);
    
    // Secondary ring segments (different frequency)
    float secondarySegments = sin(angle * segmentDensity * 1.7 + time * 0.15) * 0.5 + 0.5;
    secondarySegments = smoothstep(1.0 - segmentWidth * 0.6, 1.0, secondarySegments);
    
    // Tertiary ring segments (very fine detail)
    float tertiarySegments = sin(angle * segmentDensity * 3.2 + time * 0.05) * 0.5 + 0.5;
    tertiarySegments = smoothstep(1.0 - segmentWidth * 0.3, 1.0, tertiarySegments);
    
    // Combine all segment layers
    float allSegments = primarySegments * 0.6 + secondarySegments * 0.3 + tertiarySegments * 0.1;
    
    // Add radial variation to segment intensity
    float radialVariation = sin(radius * 30.0 + time * 0.02) * 0.3 + 0.7;
    
    return allSegments * radialVariation;
}

// Create density variations within ring segments
float createDensityVariations(vec2 uv, float distanceFromCenter) {
    vec2 centered = uv - vec2(0.5, 0.5);
    float angle = atan(centered.y, centered.x);
    float radius = length(centered) * 2.0;
    
    // Multiple layers of density noise
    float density1 = fbm(vec2(angle * 20.0, radius * 10.0) + time * 0.01);
    float density2 = fbm(vec2(angle * 40.0, radius * 20.0) + time * 0.02);
    float density3 = fbm(vec2(angle * 80.0, radius * 40.0) + time * 0.005);
    
    // Combine density layers
    float totalDensity = density1 * 0.5 + density2 * 0.3 + density3 * 0.2;
    
    // Add radial density falloff
    float radialFalloff = smoothstep(1.5, 0.5, radius);
    
    return totalDensity * radialFalloff * uDensityVariation;
}

// Create particle-like detail within segments
float createParticleDetail(vec2 uv, float distanceFromCenter) {
    vec2 centered = uv - vec2(0.5, 0.5);
    float angle = atan(centered.y, centered.x);
    float radius = length(centered) * 2.0;
    
    // Create particle-like noise
    float particleNoise = fbm(vec2(angle * 100.0, radius * 50.0) + time * 0.03);
    
    // Create individual particle spots
    float particles = 0.0;
    for (int i = 0; i < 8; i++) {
        float particleAngle = angle + float(i) * PI * 0.25 + time * 0.01;
        float particleRadius = radius + sin(float(i) * 2.0 + time * 0.02) * 0.1;
        float particle = sin(particleAngle * 60.0) * sin(particleRadius * 40.0);
        particles += smoothstep(0.8, 1.0, particle) * 0.3;
    }
    
    return (particleNoise * 0.7 + particles * 0.3) * uParticleDetail;
}

void main() {
    vec3 totalLight = vec3(0.0);
    float ambientIntensity = uDynamicAmbientIntensity; // Use dynamic ambient

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uNumLights) break;

        LightSource light = uLightSources[i];
        if (light.intensity <= 0.0) continue;

        // *** 1. Calculate Lighting ***
        vec3 lightDir = normalize(light.position - vPosition);
        vec3 faceNormal = gl_FrontFacing ? vWorldNormal : -vWorldNormal;

        // Lift the light direction slightly to illuminate both sides of the flat ring plane
        vec3 lightLift = vWorldNormal * 0.15;
        vec3 lightDirUp = normalize(lightDir + lightLift);
        vec3 lightDirDown = normalize(lightDir - lightLift);

        float diffuseUp = max(0.0, dot(faceNormal, lightDirUp));
        float diffuseDown = max(0.0, dot(faceNormal, lightDirDown));
        float diffuse = (diffuseUp + diffuseDown) * 1.5;

        // *** 2. Calculate Shadows ***
        float shadow = 1.0;
        
        // Shadow from the parent planet
        shadow = min(shadow, getShadow(vPosition, light.position, uParentPosition, uParentRadius));

        // Shadows from moons
        for (int j = 0; j < MAX_SHADOW_CASTERS; j++) {
            if (j >= uNumShadowCasters) break;
            shadow = min(shadow, getShadow(vPosition, light.position, uShadowCasters[j].position, uShadowCasters[j].radius));
        }

        // *** 3. Combine and Add to Total ***
        totalLight += light.color * diffuse * light.intensity * shadow;
    }

    // Calculate distance from center for radial patterns
    float distanceFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
    
    // *** Enhanced Ring Detail Generation ***
    
    // 1. Create individual ring segments
    float ringSegments = createRingSegments(vUv, distanceFromCenter);
    
    // 2. Create density variations within segments
    float densityVariations = createDensityVariations(vUv, distanceFromCenter);
    
    // 3. Create particle-like detail
    float particleDetail = createParticleDetail(vUv, distanceFromCenter);
    
    // 4. Combine all detail layers
    float ringDetail = ringSegments * (0.6 + densityVariations) * (0.8 + particleDetail);
    
    // 5. Add some basic noise for texture
    vec2 noiseCoord = vUv * 30.0 + time * 0.01;
    float noiseVal = fbm(noiseCoord);
    
    // 6. Create radial falloff to fade rings at edges
    float radialFalloff = smoothstep(1.8, 0.2, distanceFromCenter);
    
    // 7. Combine everything for final ring variation
    float ringVariation = ringDetail * (0.9 + noiseVal * 0.1) * radialFalloff;

    // Combine all factors for final color
    vec3 finalColor = color * (totalLight + ambientIntensity) * ringVariation;

    // Apply gamma correction
    finalColor = pow(finalColor, vec3(1.0/2.2));

    gl_FragColor = vec4(finalColor, opacity);
    
    #include <logdepthbuf_fragment>
} 