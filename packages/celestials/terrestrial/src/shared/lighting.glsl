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

// Simple lighting calculation (Blinn-Phongish)
vec3 calculateLighting(
    vec3 albedo, 
    vec3 normal, 
    vec3 viewDir, 
    float shadowFactor
) {
    vec3 finalColor = albedo * uAmbientLightColor * uAmbientLightIntensity;

    for (int i = 0; i < uNumLights; i++) {
        vec3 lightPos = uLights[i].position;
        vec3 lightColor = uLights[i].color;
        float lightIntensity = uLights[i].intensity;

        vec3 lightDir = normalize(lightPos - vWorldPosition);

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = lightColor * diff;

        // Specular (Blinn-Phong)
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
        vec3 specular = uSpecularStrength * spec * lightColor;

        finalColor += albedo * (diffuse + specular) * lightIntensity * shadowFactor;
    }
    
    return finalColor;
}

#endif