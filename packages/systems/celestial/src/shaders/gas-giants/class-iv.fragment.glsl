precision highp float;

// Varyings from vertex shader
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying vec3 vViewDirection;
// Keep unused varyings for consistency
varying vec3 vUnitSamplePoint;
varying vec3 vSphereNormalW;

// Uniforms
uniform vec3 baseColor; // A very dark base color (e.g., dark grey/brown/red)
uniform vec3 sunPosition;
uniform sampler2D stormMap;    // Storm texture
uniform bool hasStormMap;      // Whether to apply storm texture

// --- Helper: clamp01 ---
float clamp01(float value) {
    if(value < 0.0) return 0.0;
    if(value > 1.0) return 1.0;
    return value;
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 lightDir = normalize(vSunDirection);
    vec3 viewDir = normalize(vViewDirection);

    // Diffuse component - very low contribution
    float ndl = max(0.0, dot(normal, lightDir));
    ndl = clamp01(ndl);
    vec3 diffuse = baseColor * ndl * 0.1; // Extremely low diffuse reflection

    // Specular component - negligible
    vec3 halfAngle = normalize(viewDir + lightDir);
    float specComp = max(0.0, dot(normal, halfAngle));
    specComp = clamp01(specComp);
    specComp = pow(specComp, 100.0); // Very tight
    vec3 specular = vec3(0.1) * specComp; // More pronounced specular

    // Rim Lighting (Class IV adjustments - more intense)
    float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimIntensity = pow(rimDot, 4.0); // Sharper falloff
    rimIntensity = clamp01(rimIntensity * 0.8); // More intense rim
    vec3 rimColor = mix(baseColor, vec3(1.0), 0.3) * 1.3; // Brighter rim color
    vec3 rim = rimColor * rimIntensity;

    // Combine components
    vec3 ambient = baseColor * 0.15;
    vec3 finalColor = ambient + diffuse + specular + rim;

    // Optional: Add a very faint emissive component based on base color?
    // vec3 emission = baseColor * 0.05; // Example: Very faint glow
    // finalColor += emission;

    // Apply storm overlay if available
    if (hasStormMap) {
        // Calculate UV coordinates from the unit sample point
        vec2 stormUv = vec2(
            0.5 + atan(vUnitSamplePoint.z, vUnitSamplePoint.x) / (2.0 * 3.14159),
            0.5 - asin(vUnitSamplePoint.y) / 3.14159
        );
        
        vec4 stormColor = texture2D(stormMap, stormUv);
        // Blend the storm with the procedural texture, use lower alpha for dark planets
        finalColor = mix(finalColor, stormColor.rgb, stormColor.a * 0.5);
    }

    gl_FragColor = vec4(finalColor, 1.0);
} 