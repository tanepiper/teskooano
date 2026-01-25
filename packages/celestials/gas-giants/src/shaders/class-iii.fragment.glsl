precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>

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
uniform int uNumLights;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
uniform int uNumShadowCasters;
uniform float time;
uniform vec3 uAmbientColor; // Dynamic ambient lighting color
uniform float uAmbientIntensity; // Dynamic ambient lighting intensity

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

    // Create atmospheric scattering effect for cloudless azure appearance
    float viewAngle = dot(viewDir, normal);
    float atmosphereIntensity = 1.0 - abs(viewAngle); // Stronger at edges
    
    // Create subtle atmospheric banding with better contrast
    float latitude = vUnitSamplePoint.y * 1.0 + time * 0.0005; // Very slow movement
    float longitude = atan(vUnitSamplePoint.z, vUnitSamplePoint.x) * 1.0;
    
    // Subtle atmospheric variations (much more subtle than previous)
    float bands = sin(latitude * 3.0 + longitude * 1.5) * 0.05 + 0.5; // Very subtle banding
    bands = smoothstep(0.45, 0.55, bands);
    
    // Subtle depth variations using the base color more conservatively
    vec3 atmosphereColor = baseColor * (0.95 + bands * 0.1); // Very subtle variation
    atmosphereColor = mix(baseColor, atmosphereColor, atmosphereIntensity * 0.2); // Much less mixing

    // Much darker ambient for proper night sides
    vec3 ambient = atmosphereColor * uAmbientColor * (uAmbientIntensity * 0.05); // Even darker ambient
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    for (int i = 0; i < uNumLights; i++) {
        if (uLightIntensities[i] <= 0.0) continue;
        
        // Calculate light direction from position
        vec3 lightDir = normalize(uLightPositions[i] - vPosition);
        
        // Create a much wider, smoother transition around the terminator
        float dotProduct = dot(diffuseNormal, lightDir);
        float terminatorTransition = smoothstep(-0.5, 0.5, dotProduct); // Wide 1.0 unit transition
        
        // Always calculate diffuse (no hard cutoff)
        float diffuse = max(dotProduct, 0.0);
        
        float shadow = getShadow(vPosition, lightDir);

        // Apply lighting with smooth terminator transition
        float lightContribution = terminatorTransition * shadow;
        totalDiffuse += atmosphereColor * diffuse * lightContribution * 0.25 * uLightColors[i] * uLightIntensities[i];

        // Specular component (basic Blinn-Phong) with smooth falloff
        vec3 halfAngle = normalize(viewDir + lightDir);
        float specComp = max(0.0, dot(normal, halfAngle));
        specComp = clamp01(specComp);
        specComp = pow(specComp, 40.0); // Sharper highlights for Class III
        
        // Apply specular with smoother falloff
        float specularFalloff = smoothstep(-0.2, 0.3, dotProduct); // Tighter falloff for specular
        totalSpecular += vec3(0.05) * specComp * lightContribution * specularFalloff * uLightColors[i] * uLightIntensities[i];
        
    }

    // Rim Lighting (Class III adjustments - potentially less pronounced)
    float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimIntensity = pow(rimDot, 2.0); // Softer falloff
    rimIntensity = clamp01(rimIntensity * 0.4); // Less intense rim
    vec3 rimColor = mix(baseColor, vec3(1.0), 0.10); // Blend even less white (was 0.15)
    vec3 rim = rimColor * rimIntensity;

    // Combine components
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

    // Clamp before gamma correction to prevent artifacts
    finalColor = clamp(finalColor, 0.0, 1.0);

    // Apply basic gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
} 
