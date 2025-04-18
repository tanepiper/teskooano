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
uniform vec3 baseColor; // A bright, reflective color (off-white, pale yellow/grey)
uniform vec3 emissiveColor; // Color for the heat glow (e.g., dull red/orange)
uniform float emissiveIntensity; // How strong the glow is
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

    // Diffuse component - Strong reflection
    float ndl = max(0.0, dot(normal, lightDir));
    ndl = clamp01(ndl);
    vec3 diffuse = baseColor * ndl; // Strong diffuse based on bright base color

    // Specular component - Noticeable reflection
    vec3 halfAngle = normalize(viewDir + lightDir);
    float specComp = max(0.0, dot(normal, halfAngle));
    specComp = clamp01(specComp);
    specComp = pow(specComp, 24.0); // Moderate shininess
    vec3 specular = vec3(0.03) * specComp; // Low specular

    // Rim Lighting (Class V - subtle blue/white glow)
    float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimIntensity = pow(rimDot, 2.5); // Moderate falloff
    rimIntensity = clamp01(rimIntensity * 0.5); // Moderate intensity
    vec3 rimColor = mix(baseColor, vec3(1.0), 0.5) * 1.1; // Subtle blend
    vec3 rim = rimColor * rimIntensity;

    // Emissive component for heat glow
    vec3 emission = emissiveColor * emissiveIntensity;

    // Combine components
    vec3 ambient = baseColor * 0.15;
    vec3 finalColor = ambient + diffuse + specular + rim + emission;

    // Apply storm overlay if available
    if (hasStormMap) {
        // Calculate UV coordinates from the unit sample point
        vec2 stormUv = vec2(
            0.5 + atan(vUnitSamplePoint.z, vUnitSamplePoint.x) / (2.0 * 3.14159),
            0.5 - asin(vUnitSamplePoint.y) / 3.14159
        );
        
        vec4 stormColor = texture2D(stormMap, stormUv);
        // Blend the storm with the procedural texture, use higher alpha for hot jupiters
        finalColor = mix(finalColor, stormColor.rgb, stormColor.a * 1.0);
    }

    gl_FragColor = vec4(finalColor, 1.0);
} 