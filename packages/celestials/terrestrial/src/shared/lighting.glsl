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

        // Create a smooth transition around the terminator
        float dotProduct = dot(normal, lightDir);
        
        // Use a single, smooth transition zone to avoid banding
        // Wider transition zone: -0.3 to +0.3 (0.6 units wide)
        float terminatorTransition = smoothstep(-0.3, 0.3, dotProduct);
        
        // Calculate diffuse lighting using the raw dot product for accuracy
        float diff = max(dotProduct, 0.0);
        vec3 diffuse = lightColor * diff * lightIntensity;

        // Specular (Blinn-Phong) with smooth terminator falloff
        vec3 halfwayDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfwayDir), 0.0), uShininess);
        
        // Apply additional smooth falloff to specular near terminator to prevent seams
        float specularFalloff = smoothstep(-0.1, 0.2, dotProduct); // Tighter falloff for specular
        vec3 specular = uSpecularStrength * spec * lightColor * lightIntensity * specularFalloff;

        // Apply terminator transition to diffuse lighting
        vec3 diffuseLighting = albedo * diffuse * terminatorTransition;
        
        // Apply separate, smoother transition to specular to prevent seams
        vec3 specularLighting = specular * terminatorTransition;
        
        // Combine with shadow factor
        float shadowContribution = max(shadowFactor, 0.05);
        finalColor += (diffuseLighting + specularLighting) * shadowContribution;
        
        // Add subtle night side illumination with smoother falloff
        float nightLight = 0.01 * smoothstep(1.0, 0.0, terminatorTransition); // Smooth night falloff
        finalColor += albedo * lightColor * lightIntensity * nightLight;
    }
    
    return finalColor;
}

#endif