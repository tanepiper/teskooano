#ifndef LIGHTING_FUNCTION_GLSL
#define LIGHTING_FUNCTION_GLSL

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

// Simple lighting calculation (Blinn-Phongish) with proper terminator handling
vec3 calculateLighting(
    vec3 albedo, 
    vec3 normal, 
    vec3 viewDir, 
    float shadowFactor
) {
    // Start with very low ambient for dark night sides
    vec3 finalColor = albedo * uAmbientLightColor * (uAmbientLightIntensity * 0.1); // Much darker ambient

    for (int i = 0; i < uNumLights; i++) {
        vec3 lightPos = uLights[i].position;
        vec3 lightColor = uLights[i].color;
        float lightIntensity = uLights[i].intensity;

        vec3 lightDir = normalize(lightPos - vWorldPosition);

        // Only calculate lighting if the surface is facing the light (day side)
        float dotProduct = dot(normal, lightDir);
        if (dotProduct > 0.0) {
            // Diffuse with reduced strength for better terminator definition
            float diff = max(dotProduct, 0.0);
            vec3 diffuse = lightColor * diff * lightIntensity * 0.4; // Further reduced for sharper terminators

            // Specular (Blinn-Phong) - only on day side
            vec3 halfwayDir = normalize(lightDir + viewDir);
            float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
            vec3 specular = uSpecularStrength * spec * lightColor * lightIntensity;

            finalColor += (albedo * diffuse + specular) * shadowFactor;
        }
        // Night side gets no direct lighting, only the very low ambient
    }
    
    return finalColor;
}

#endif