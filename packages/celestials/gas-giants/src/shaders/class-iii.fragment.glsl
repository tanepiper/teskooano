precision highp float;

struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};

struct ShadowCaster {
    vec3 position;
    float radius;
};

// Varyings from vertex shader
varying vec3 vNormal;          // World space normal (for lighting)
varying vec3 vWorldPosition;     // World space position
varying vec3 vViewDirection;     // Direction from camera
// vUnitSamplePoint and vSphereNormalW are not strictly needed here, but keep for consistency
varying vec3 vUnitSamplePoint;
varying vec3 vSphereNormalW;
varying vec3 vPosition;
varying vec2 vUv;

// Uniforms
uniform vec3 baseColor;        // The primary azure/blue color
uniform sampler2D stormMap;    // Storm texture
uniform bool hasStormMap;      // Whether to apply storm texture
uniform Light uLights[MAX_LIGHTS];
uniform int uNumLights;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
uniform int uNumShadowCasters;
uniform float time;
uniform float uDynamicAmbientIntensity; // Dynamic ambient lighting

// --- Helper: clamp01 ---
float clamp01(float value) {
    if(value < 0.0) return 0.0;
    if(value > 1.0) return 1.0;
    return value;
}

// Ray-sphere intersection test for shadow casting
// Returns a value from 0.0 (full shadow) to 1.0 (fully lit)
float getShadow(vec3 fragPos, vec3 lightDir) {
    float finalShadow = 1.0;

    for (int i = 0; i < uNumShadowCasters; i++) {
        // This check is necessary because the array is padded with empty data
        if (uShadowCasters[i].radius <= 0.0) continue;

        vec3 oc = fragPos - uShadowCasters[i].position;
        float b = dot(oc, lightDir);
        float c = dot(oc, oc) - (uShadowCasters[i].radius * uShadowCasters[i].radius);
        float discriminant = b * b - c;

        // If the ray is potentially inside the shadow cone
        if (discriminant > 0.0) {
            float t = -b - sqrt(discriminant);
            // Check if the intersection is in front of the fragment
            if (t > 0.001) {
                // Penumbra width is proportional to the occluder's radius.
                // A larger multiplier makes the edge softer.
                float penumbra = uShadowCasters[i].radius * 0.8;
                float penumbraSq = penumbra * penumbra;
                
                // Calculate a smooth fade from lit to shadow based on how deep the ray is.
                // 1.0 = lit edge, 0.0 = deep shadow.
                float currentShadow = 1.0 - smoothstep(0.0, penumbraSq, discriminant);
                
                // The final shadow is the darkest of all potential shadows.
                finalShadow = min(finalShadow, currentShadow);
            }
        }
    }
    return finalShadow;
}

void main() {
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDirection);
    vec3 diffuseNormal = normalize(vSphereNormalW);

    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    for (int i = 0; i < uNumLights; i++) {
        if (uLights[i].intensity <= 0.0) continue;
        
        // Calculate light direction from position
        vec3 lightDir = normalize(uLights[i].position - vPosition);
        float diffuse = max(dot(diffuseNormal, lightDir), 0.0);
        
        float shadow = 1.0;
        if (diffuse > 0.0) {
            shadow = getShadow(vPosition, lightDir);
        }

        totalDiffuse += baseColor * diffuse * 0.85 * uLights[i].color * uLights[i].intensity * shadow;

        // Specular component (basic Blinn-Phong) - Keep it very low
        vec3 halfAngle = normalize(viewDir + lightDir);
        float specComp = max(0.0, dot(normal, halfAngle));
        specComp = clamp01(specComp);
        specComp = pow(specComp, 40.0); // Sharper highlights for Class III
        totalSpecular += vec3(0.08) * specComp * uLights[i].color * uLights[i].intensity * shadow;
    }

    // Rim Lighting (Class III adjustments - potentially less pronounced)
    float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimIntensity = pow(rimDot, 2.0); // Softer falloff
    rimIntensity = clamp01(rimIntensity * 0.4); // Less intense rim
    vec3 rimColor = mix(baseColor, vec3(1.0), 0.10); // Blend even less white (was 0.15)
    vec3 rim = rimColor * rimIntensity;

    // Combine components - minimal ambient for dark space
    vec3 ambient = baseColor * uDynamicAmbientIntensity; // Much reduced ambient for dark space
    vec3 finalColor = ambient + totalDiffuse + totalSpecular + rim;

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