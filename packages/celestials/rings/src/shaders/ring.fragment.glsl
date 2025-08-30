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

// Smoothstep function for better transitions
float smootherstep(float edge0, float edge1, float x) {
    x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
    return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

// Improved hash function for better noise distribution
float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

// Improved noise function with better distribution and less banding
float noise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Smooth interpolation
    vec2 u = f * f * (3.0 - 2.0 * f);
    
    return mix(
        mix(hash(i + vec2(0.0, 0.0)), hash(i + vec2(1.0, 0.0)), u.x),
        mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
}

// Improved Fractional Brownian Motion with better octave blending
float fbm(vec2 st) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    float maxValue = 0.0;
    
    for (int i = 0; i < 6; i++) {
        value += amplitude * noise(st * frequency);
        maxValue += amplitude;
        amplitude *= 0.5;
        frequency *= 2.0;
        st += vec2(3.123, 2.456); // Offset to avoid correlation
    }
    
    return value / maxValue; // Normalize to 0-1 range
}

// Smooth noise function for better transitions
float smoothNoise(vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    
    // Quintic interpolation for smoother transitions
    vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
    
    return mix(
        mix(noise(i + vec2(0.0, 0.0)), noise(i + vec2(1.0, 0.0)), u.x),
        mix(noise(i + vec2(0.0, 1.0)), noise(i + vec2(1.0, 1.0)), u.x),
        u.y
    );
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

// Create concentric ring bands (like Saturn's rings)
float createRingSegments(vec2 uv, float distanceFromCenter) {
    // Convert to polar coordinates for ring segmentation
    vec2 centered = uv - vec2(0.5, 0.5);
    float angle = atan(centered.y, centered.x);
    float radius = length(centered) * 2.0;
    
    // Create concentric ring bands using radius instead of angle
    float ringDensity = uSegmentDensity * 5.0; // More rings for finer detail
    float ringWidth = uSegmentWidth; // Width of each ring gap
    
    // Primary concentric rings - use radius for radial banding (static)
    float primaryRings = sin(radius * ringDensity) * 0.5 + 0.5;
    primaryRings = smootherstep(1.0 - ringWidth, 1.0, primaryRings);
    
    // Secondary ring layer (different frequency) with reduced intensity
    float secondaryRings = sin(radius * ringDensity * 1.3) * 0.5 + 0.5;
    secondaryRings = smootherstep(1.0 - ringWidth * 0.7, 1.0, secondaryRings);
    
    // Tertiary ring layer (very fine detail) with much reduced intensity
    float tertiaryRings = sin(radius * ringDensity * 2.1) * 0.5 + 0.5;
    tertiaryRings = smootherstep(1.0 - ringWidth * 0.4, 1.0, tertiaryRings);
    
    // Combine all ring layers with better weighting
    float allRings = primaryRings * 0.7 + secondaryRings * 0.2 + tertiaryRings * 0.1;
    
    // Add subtle angular variation for natural appearance (static)
    float angularVariation = 1.0 + sin(angle * 8.0) * 0.05;
    
    return allRings * angularVariation;
}

// Create smoother density variations within ring bands
float createDensityVariations(vec2 uv, float distanceFromCenter) {
    vec2 centered = uv - vec2(0.5, 0.5);
    float angle = atan(centered.y, centered.x);
    float radius = length(centered) * 2.0;
    
    // Multiple layers of density noise - balance radial and angular patterns (static)
    float density1 = fbm(vec2(radius * 25.0, angle * 8.0));
    float density2 = fbm(vec2(radius * 50.0, angle * 16.0));
    float density3 = fbm(vec2(radius * 100.0, angle * 32.0));
    
    // Combine density layers with better weighting
    float totalDensity = density1 * 0.6 + density2 * 0.3 + density3 * 0.1;
    
    // Add smoother radial density falloff
    float radialFalloff = smoothstep(1.5, 0.5, radius);
    
    return totalDensity * radialFalloff * uDensityVariation;
}

// Create smoother particle-like detail within ring bands
float createParticleDetail(vec2 uv, float distanceFromCenter) {
    vec2 centered = uv - vec2(0.5, 0.5);
    float angle = atan(centered.y, centered.x);
    float radius = length(centered) * 2.0;
    
    // Create particle-like noise - balance radial and angular patterns (static)
    float particleNoise = fbm(vec2(radius * 60.0, angle * 20.0));
    
    // Create smoother individual particle spots within ring bands (static)
    float particles = 0.0;
    for (int i = 0; i < 6; i++) {
        float particleAngle = angle + float(i) * PI * 0.33;
        float particleRadius = radius + sin(float(i) * 1.5) * 0.01;
        float particle = sin(particleAngle * 40.0) * sin(particleRadius * 80.0);
        particles += smoothstep(0.7, 1.0, particle) * 0.1;
    }
    
    return (particleNoise * 0.9 + particles * 0.1) * uParticleDetail;
}

void main() {
    vec3 totalLight = vec3(0.0);
    float ambientIntensity = uDynamicAmbientIntensity * 0.1; // Much darker ambient

    for (int i = 0; i < MAX_LIGHTS; i++) {
        if (i >= uNumLights) break;

        LightSource light = uLightSources[i];
        if (light.intensity <= 0.0) continue;

        // *** 1. Calculate Lighting ***
        vec3 lightDir = normalize(light.position - vPosition);
        vec3 faceNormal = gl_FrontFacing ? vWorldNormal : -vWorldNormal;

        // Only calculate lighting if the ring surface is facing the light (day side)
        float dotProduct = dot(faceNormal, lightDir);
        if (dotProduct > 0.0) {
            // Lift the light direction slightly to illuminate both sides of the flat ring plane
            vec3 lightLift = vWorldNormal * 0.15;
            vec3 lightDirUp = normalize(lightDir + lightLift);
            vec3 lightDirDown = normalize(lightDir - lightLift);

            float diffuseUp = max(0.0, dot(faceNormal, lightDirUp));
            float diffuseDown = max(0.0, dot(faceNormal, lightDirDown));
            float diffuse = (diffuseUp + diffuseDown) * 1.2; // Reduced for sharper terminators

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
        // Night side gets no direct lighting, only the very low ambient
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
    
    // 4. Combine all detail layers with smoother blending
    float ringDetail = ringSegments * (0.7 + densityVariations * 0.3) * (0.9 + particleDetail * 0.1);
    
    // 5. Add smoother noise for texture (static)
    vec2 noiseCoord = vUv * 20.0;
    float noiseVal = fbm(noiseCoord);
    
    // 6. Create smoother radial falloff to fade rings at edges
    float radialFalloff = smoothstep(1.8, 0.2, distanceFromCenter);
    
    // 7. Combine everything for final ring variation with reduced banding
    float ringVariation = ringDetail * (0.95 + noiseVal * 0.05) * radialFalloff;

    // Combine all factors for final color
    vec3 finalColor = color * (totalLight + ambientIntensity) * ringVariation;

    // Apply gamma correction
    finalColor = pow(finalColor, vec3(1.0/2.2));

    gl_FragColor = vec4(finalColor, opacity);
    
    #include <logdepthbuf_fragment>
} 