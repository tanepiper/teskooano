uniform vec3 color;
uniform float opacity;
uniform vec3 uSunPosition; // World space position of the sun
uniform float uParentRadius; // Radius of the parent body
uniform float time; // Current time for potential animation effects
uniform vec3 uSunColor; // Color of the primary light source
uniform float uSunIntensity; // Attenuated intensity of the sun

#define MAX_SHADOW_CASTERS 4

// Shadow Caster Uniforms from Moons
struct ShadowCaster {
    vec3 position;
    float radius;
};
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];

// Define PI constant for GLSL
#define PI 3.141592653589793

varying vec2 vUv;
varying vec3 vWorldNormal; // World space normal
varying vec3 vPosition; // World space position of the fragment
varying vec3 vWorldSunPos; // World space position of the sun
varying vec3 vWorldParentPos; // World space position of the parent body

// Check for shadow cast by the parent planet in WORLD SPACE
// Returns 1.0 if lit, 0.0 if in shadow.
float checkShadow(vec3 fragWorldPos, vec3 parentWorldPos, vec3 lightDirWorld, float parentRadius) {
    vec3 rayDir = normalize(lightDirWorld);
    vec3 oc = fragWorldPos - parentWorldPos;
    float b = dot(oc, rayDir);
    float c = dot(oc, oc) - (parentRadius * parentRadius);
    float discriminant = b * b - c;

    // No intersection if discriminant is negative
    if (discriminant < 0.0) {
        return 1.0;
    }

    // Intersection occurred, now check if it's between the fragment and the light.
    // We are looking for the *closest* positive intersection time 't'.
    float t = (-b - sqrt(discriminant));

    // If t is positive, it means the intersection point is in the direction of the light ray,
    // which means the planet is blocking the light.
    if (t > 0.001) { // Use a small epsilon to avoid self-shadowing
        return 0.0; // Shadowed
    }

    return 1.0; // Lit
}

// Check for shadow cast by moons in WORLD SPACE
// Returns a value from 0.0 (full shadow) to 1.0 (fully lit)
float getMoonShadows(vec3 fragPos, vec3 lightDir) {
    float finalShadow = 1.0;
    if (uNumShadowCasters == 0) {
        return 1.0;
    }

    for (int i = 0; i < uNumShadowCasters; i++) {
        if (uShadowCasters[i].radius <= 0.0) continue;

        vec3 oc = fragPos - uShadowCasters[i].position;
        float b = dot(oc, lightDir);
        float c = dot(oc, oc) - (uShadowCasters[i].radius * uShadowCasters[i].radius);
        float discriminant = b * b - c;

        if (discriminant > 0.0) {
            float t = -b - sqrt(discriminant);
            if (t > 0.001) {
                float penumbra = uShadowCasters[i].radius * 0.8;
                float penumbraSq = penumbra * penumbra;
                float currentShadow = 1.0 - smoothstep(0.0, penumbraSq, discriminant);
                finalShadow = min(finalShadow, currentShadow);
            }
        }
    }
    return finalShadow;
}

void main() {
    // For lighting, use a single direction from parent to sun.
    // This treats light as a distant directional source.
    vec3 lightingDirection = normalize(vWorldSunPos - vWorldParentPos);

    // For shadowing, the ray must go from the specific fragment to the sun for accuracy.
    vec3 shadowRayDirection = normalize(vWorldSunPos - vPosition);

    // *** Normal Calculation for Two-Sided Lighting ***
    // The normal passed from the vertex shader is now in world space.
    // We use gl_FrontFacing to flip the normal for the back side of the ring.
    vec3 faceNormal = gl_FrontFacing ? vWorldNormal : -vWorldNormal;

    // *** Shadow Calculation ***
    float planetShadow = checkShadow(vPosition, vWorldParentPos, shadowRayDirection, uParentRadius);
    float moonShadows = getMoonShadows(vPosition, shadowRayDirection);
    float shadowFactor = min(planetShadow, moonShadows);

    // *** Lighting Calculation ***
    // For two-sided lighting, we calculate diffuse light from "above" and "below" the ring plane
    vec3 lightLift = vWorldNormal * 0.15; // Lift relative to the ring's own normal
    vec3 lightDirUp = normalize(lightingDirection + lightLift);
    vec3 lightDirDown = normalize(lightingDirection - lightLift);

    float diffuseUp = max(0.0, dot(faceNormal, lightDirUp));
    float diffuseDown = max(0.0, dot(faceNormal, lightDirDown));
    float totalDiffuse = (diffuseUp + diffuseDown) * 1.5; // Sum and boost diffuse light

    // The final light is the ambient component, plus the diffuse component (if not in shadow).
    // The diffuse component is scaled by the sun's attenuated intensity.
    float ambientIntensity = 0.35;
    float finalLightIntensity = ambientIntensity + (totalDiffuse * uSunIntensity * shadowFactor);

    // Simple ring variation (using vUv which is fine)
    float distanceFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
    float ringVariation = 1.0 - 0.1 * sin(distanceFromCenter * 25.0 + time * 0.08);

    // Combine all factors for final color
    vec3 finalColor = color * uSunColor * finalLightIntensity * ringVariation;

    // Use base opacity
    gl_FragColor = vec4(finalColor, opacity);
} 