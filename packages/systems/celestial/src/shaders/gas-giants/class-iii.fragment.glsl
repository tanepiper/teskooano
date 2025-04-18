precision highp float;

// Varyings from vertex shader
varying vec3 vNormal;          // World space normal (for lighting)
varying vec3 vWorldPosition;     // World space position
varying vec3 vSunDirection;      // Direction to sun
varying vec3 vViewDirection;     // Direction from camera
// vUnitSamplePoint and vSphereNormalW are not strictly needed here, but keep for consistency
varying vec3 vUnitSamplePoint;
varying vec3 vSphereNormalW;

// Uniforms
uniform vec3 baseColor;        // The primary azure/blue color
uniform vec3 sunPosition;      // Needed by vertex shader, potentially for specular
uniform sampler2D stormMap;    // Storm texture
uniform bool hasStormMap;      // Whether to apply storm texture
// No noise uniforms needed (uSeed, uWarpOctaves, uColorOctaves)

// --- Helper: clamp01 ---
float clamp01(float value) {
    if(value < 0.0) return 0.0;
    if(value > 1.0) return 1.0;
    return value;
}

void main() {
    // Use the actual surface normal for both diffuse and specular
    vec3 normal = normalize(vNormal);

    // Simple Lighting Model
    vec3 lightDir = normalize(vSunDirection);
    vec3 viewDir = normalize(vViewDirection);

    // Diffuse component (basic Lambertian)
    float ndl = max(0.0, dot(normal, lightDir));
    ndl = clamp01(ndl);
    // Reduce diffuse intensity further
    vec3 diffuse = baseColor * ndl * 0.85; // Reduced multiplier again (was 0.95)

    // Specular component (basic Blinn-Phong) - Keep it very low
    vec3 halfAngle = normalize(viewDir + lightDir);
    float specComp = max(0.0, dot(normal, halfAngle));
    specComp = clamp01(specComp);
    specComp = pow(specComp, 40.0); // Sharper highlights for Class III
    vec3 specular = vec3(0.08) * specComp; // Slightly brighter specular

    // Rim Lighting (Class III adjustments - potentially less pronounced)
    float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimIntensity = pow(rimDot, 2.0); // Softer falloff
    rimIntensity = clamp01(rimIntensity * 0.4); // Less intense rim
    vec3 rimColor = mix(baseColor, vec3(1.0), 0.10); // Blend even less white (was 0.15)
    vec3 rim = rimColor * rimIntensity;

    // Combine components
    vec3 ambient = baseColor * 0.15; // Ambient based on blended baseColor
    vec3 finalColor = ambient + diffuse + specular + rim;

    // Apply storm overlay if available
    if (hasStormMap) {
        // Calculate UV coordinates from the unit sample point
        vec2 stormUv = vec2(
            0.5 + atan(vUnitSamplePoint.z, vUnitSamplePoint.x) / (2.0 * 3.14159),
            0.5 - asin(vUnitSamplePoint.y) / 3.14159
        );
        
        vec4 stormColor = texture2D(stormMap, stormUv);
        // Blend the storm with the procedural texture
        finalColor = mix(finalColor, stormColor.rgb, stormColor.a * 0.8);
    }

    gl_FragColor = vec4(finalColor, 1.0);
} 