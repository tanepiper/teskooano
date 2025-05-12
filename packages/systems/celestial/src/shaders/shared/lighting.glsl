#ifndef LIGHTING_GLSL
#define LIGHTING_GLSL

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
vec3 calculateLighting(vec3 baseColor, vec3 normal, vec3 viewDir) {
    // Start with ambient light
    vec3 totalLight = uAmbientLightColor * uAmbientLightIntensity;
    vec3 directionalLight = vec3(0.0);

    for(int i = 0; i < uNumLights; ++i) {
        if(i >= uNumLights)
            break; // Safety break
        vec3 lightDir = normalize(uLightPositions[i] - vWorldPosition);
        vec3 lightColor = uLightColors[i];
        float lightIntensity = uLightIntensities[i];

        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        vec3 diffuse = diff * lightColor * lightIntensity * 0.3; // Reduced to 30%

        // Specular (Blinn-Phong)
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
        vec3 specular = uSpecularStrength * spec * lightColor * lightIntensity * 0.2; // Reduced to 20%

        directionalLight += diffuse + specular;
    }

    // Balance ambient and directional lighting
    totalLight = mix(totalLight, totalLight + directionalLight, 0.4); // Only add 40% of directional light

    return baseColor * totalLight;
}

#endif