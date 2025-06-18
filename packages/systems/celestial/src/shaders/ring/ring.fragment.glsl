uniform vec3 color;
uniform float opacity;
uniform vec3 uSunPosition; // World space position of the sun
uniform float uParentRadius; // Radius of the parent body
uniform float time; // Current time for potential animation effects
uniform vec3 uSunColor; // Color of the primary light source

// Define PI constant for GLSL
#define PI 3.141592653589793

varying vec2 vUv;
varying vec3 vNormal; // World space normal
varying vec3 vPosition; // World space position of the fragment
varying vec3 vWorldSunPos; // World space position of the sun
varying vec3 vWorldParentPos; // World space position of the parent body

// Check for shadow cast by the parent planet in WORLD SPACE
float checkShadow(vec3 fragWorldPos, vec3 parentWorldPos, vec3 lightDirWorld, float parentRadius) {
    // Ray direction is already calculated towards the light source
    vec3 rayDir = normalize(lightDirWorld);

    // Vector from parent center to fragment position (world space)
    vec3 oc = fragWorldPos - parentWorldPos;

    // Ray-sphere intersection calculation in world space
    float a = 1.0; // Since rayDir is normalized
    float b = 2.0 * dot(oc, rayDir);
    float c = dot(oc, oc) - (parentRadius * parentRadius);
    float discriminant = (b * b) - (4.0 * a * c);

    if (discriminant < 0.0) {
        return 1.0; // No intersection, fully lit
    }

    // Calculate intersection points (t values along the ray towards the sun)
    float t1 = (-b - sqrt(discriminant)) / (2.0 * a);
    float t2 = (-b + sqrt(discriminant)) / (2.0 * a);

    // If either intersection point is *in front* of the fragment (t > epsilon),
    // it means the planet is between the fragment and the sun -> shadow.
    // Use a slightly larger epsilon to avoid self-shadowing artifacts
    if (t1 > 0.01 || t2 > 0.01) { 
        float shadowStrength = 0.85; 
        return 1.0 - shadowStrength; // Shadowed
    }

    return 1.0; // Lit
}

void main() {
    // For lighting, use a single direction from parent to sun.
    // This treats light as a distant directional source.
    vec3 lightingDirection = normalize(vWorldSunPos - vWorldParentPos);

    // For shadowing, the ray must go from the specific fragment to the sun for accuracy.
    vec3 shadowRayDirection = normalize(vWorldSunPos - vPosition);

    // *** Artificially "lift" the light for the lighting calculation ***
    // This is a common trick to prevent the light direction from being perfectly
    // coplanar with the ring surface, which would result in zero diffuse light.
    // The original, unmodified directions are still used for shadow casting.
    vec3 adjustedLightingDirection = normalize(lightingDirection + vec3(0.0, 0.15, 0.0));

    // *** Shadow Calculation ***
    // Use the UNMODIFIED shadow ray for accurate shadow casting.
    float shadowFactor = checkShadow(vPosition, vWorldParentPos, shadowRayDirection, uParentRadius);

    // *** Lighting Calculation ***
    // Use the adjusted lighting direction to get the diffuse component.
    float ambientIntensity = 0.35;
    float diffuseFactor = max(0.0, dot(normalize(vNormal), adjustedLightingDirection));
    float combinedLight = (diffuseFactor * 0.65) + ambientIntensity;

    // Apply shadow to lighting
    float finalLightIntensity = combinedLight * shadowFactor;

    // Simple ring variation (using vUv which is fine)
    float distanceFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
    float ringVariation = 1.0 - 0.1 * sin(distanceFromCenter * 25.0 + time * 0.08);

    // Combine all factors for final color
    vec3 finalColor = color * finalLightIntensity * ringVariation;

    // Use base opacity
    gl_FragColor = vec4(finalColor, opacity);
} 