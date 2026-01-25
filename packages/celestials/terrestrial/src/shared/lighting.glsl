#ifndef LIGHTING_FUNCTION_GLSL
#define LIGHTING_FUNCTION_GLSL

// Returns a value from 0.0 (full shadow) to 1.0 (fully lit)
float getShadow(vec3 fragPos, vec3 lightDir) {
    float finalShadow = 1.0;

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

// Explicit World-Space Lighting Uniforms
uniform int uNumLights;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];

// Updated lighting calculation using World-Space coordinates
vec3 calculateLighting(
    vec3 albedo, 
    vec3 worldNormal, 
    vec3 worldPos,
    vec3 viewDir // Still needed for specular (view space or world space?)
) {
    // Transform viewDir to World Space for consistent specular if needed, 
    // but for now we'll assume Blinn-Phong in World Space.
    // vec3 worldViewDir = normalize(cameraPosition - worldPos);
    vec3 worldViewDir = viewDir; // For simplicity, we'll keep it as passed

    // Start with a subtle ambient base for "just enough" shadow detail
    vec3 finalColor = albedo * uAmbientColor * uAmbientIntensity;

    for (int i = 0; i < 4; i++) {
        if (i >= uNumLights) break;

        vec3 lightPos = uLightPositions[i];
        vec3 lightColor = uLightColors[i];
        float intensity = uLightIntensities[i];

        // Correct Light Direction: FROM fragment TO light source
        vec3 lightDir = normalize(lightPos - worldPos);
        
        float dotProduct = dot(worldNormal, lightDir);
        float terminatorTransition = smoothstep(-0.1, 0.6, dotProduct);
        float diff = max(dotProduct, 0.0);
        
        // Attenuation for point lights
        float dist = distance(lightPos, worldPos);
        // Using a standard falloff for celestial distances
        float attenuation = 1.0 / (1.0 + 0.0000001 * dist * dist); 
        
        vec3 diffuse = lightColor * diff * intensity * attenuation;

        // Basic Blinn-Phong Specular in World Space
        vec3 halfwayDir = normalize(lightDir + worldViewDir);
        float spec = pow(max(dot(worldNormal, halfwayDir), 0.0), uShininess);
        float specularFalloff = smoothstep(0.0, 0.5, dotProduct);
        vec3 specular = uSpecularStrength * spec * lightColor * intensity * attenuation * specularFalloff;

        // Per-light shadowing
        float shadowFactor = getShadow(worldPos, lightDir);

        finalColor += (albedo * diffuse + specular) * terminatorTransition * max(shadowFactor, 0.05);
    }
    
    return finalColor;
}

#endif
