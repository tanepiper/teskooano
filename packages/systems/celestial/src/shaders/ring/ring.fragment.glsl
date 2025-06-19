uniform vec3 color;
uniform float opacity;
uniform vec3 uParentPosition;
uniform float uParentRadius;
uniform float time;

#define MAX_LIGHTS 4
#define MAX_SHADOW_CASTERS 4

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

void main() {
    vec3 totalLight = vec3(0.0);
    float ambientIntensity = 0.1; // Reduced ambient light

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

    // Simple ring variation for texture
    float distanceFromCenter = length(vUv - vec2(0.5, 0.5)) * 2.0;
    float ringVariation = 1.0 - 0.1 * sin(distanceFromCenter * 25.0 + time * 0.08);

    // Combine all factors for final color
    vec3 finalColor = color * (totalLight + ambientIntensity) * ringVariation;

    gl_FragColor = vec4(finalColor, opacity);
} 