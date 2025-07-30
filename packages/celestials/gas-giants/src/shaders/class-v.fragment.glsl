precision highp float;

#include <common>
#include <logdepthbuf_pars_fragment>

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
varying vec3 vNormal;
varying vec3 vWorldPosition;
varying vec3 vViewDirection;
// Keep unused varyings for consistency
varying vec3 vUnitSamplePoint;
varying vec3 vSphereNormalW;
varying vec3 vPosition;
varying vec2 vUv;

// Uniforms
uniform vec3 baseColor; // A bright, reflective color (off-white, pale yellow/grey)
uniform vec3 emissiveColor; // Color for the heat glow (e.g., dull red/orange)
uniform float emissiveIntensity; // How strong the glow is
uniform float time;
uniform sampler2D stormMap;    // Storm texture
uniform bool hasStormMap;      // Whether to apply storm texture
uniform Light uLights[MAX_LIGHTS];
uniform int uNumLights;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
uniform int uNumShadowCasters;
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

    // Much darker ambient for proper night sides
    vec3 ambient = baseColor * (uDynamicAmbientIntensity * 0.1); // Much darker ambient
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    for (int i = 0; i < uNumLights; i++) {
        // Calculate light direction from position
        vec3 lightDir = normalize(uLights[i].position - vPosition);

        // Only calculate lighting if the surface is facing the light (day side)
        float dotProduct = dot(diffuseNormal, lightDir);
        if (dotProduct > 0.0) {
            // Diffuse component - Strong reflection
            float ndl = max(dotProduct, 0.0);
            ndl = clamp01(ndl);

            float shadow = getShadow(vPosition, lightDir);

            // Reduced diffuse strength for sharper terminators
            totalDiffuse += baseColor * ndl * 0.4 * uLights[i].color * uLights[i].intensity * shadow; // Reduced diffuse based on bright base color

            // Specular component - Noticeable reflection
            vec3 halfAngle = normalize(viewDir + lightDir);
            float specComp = max(0.0, dot(normal, halfAngle));
            specComp = clamp01(specComp);
            specComp = pow(specComp, 24.0); // Moderate shininess
            totalSpecular += vec3(0.015) * specComp * uLights[i].color * uLights[i].intensity * shadow; // Low specular
        }
        // Night side gets no direct lighting, only the very low ambient
    }

    // Rim Lighting (Class V - subtle blue/white glow)
    float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimIntensity = pow(rimDot, 2.5); // Moderate falloff
    rimIntensity = clamp01(rimIntensity * 0.5); // Moderate intensity
    vec3 rimColor = mix(baseColor, vec3(1.0), 0.5) * 1.1; // Subtle blend
    vec3 rim = rimColor * rimIntensity;

    // Emissive component for heat glow
    vec3 emission = emissiveColor * emissiveIntensity;

    // Combine components
    vec3 finalColor = ambient + totalDiffuse + totalSpecular + rim + emission;

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

    // Apply gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
} 