uniform vec3 color;
uniform float opacity;
uniform vec3 uSunPosition; // World space position of the sun
uniform vec3 uParentPosition; // World position of the parent body
uniform float uParentRadius; // Radius of the parent body
uniform float time; // Current time for potential animation effects

// Define PI constant for GLSL
#define PI 3.141592653589793

varying vec2 vUv;
varying vec3 vNormal; // World space normal
varying vec3 vPosition; // World space position of the fragment
varying vec3 vWorldSunPos; // World space position of the sun

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
    // Calculate direction FROM fragment TO sun in world space
    vec3 lightDirection = normalize(vWorldSunPos - vPosition); 

    // *** Shadow Calculation ***
    // Pass the calculated lightDirection to the shadow check
    float shadowFactor = checkShadow(vPosition, uParentPosition, lightDirection, uParentRadius);

    // *** Lighting Calculation ***
    // Use world space normal and the calculated lightDirection
    float ambientIntensity = 0.35;
    float diffuseFactor = max(0.0, dot(normalize(vNormal), lightDirection)); // USE CALCULATED lightDirection
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