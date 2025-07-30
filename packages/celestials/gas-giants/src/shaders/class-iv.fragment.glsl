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
uniform vec3 baseColor; // A very dark base color (e.g., dark grey/brown/red)
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

    // Create alkali metal absorption patterns and hot atmospheric effects
    float viewAngle = dot(viewDir, normal);
    float atmosphereIntensity = 1.0 - abs(viewAngle);
    
    // Create hot atmospheric disturbances with alkali metal lines
    float latitude = vUnitSamplePoint.y * 1.2 + time * 0.001; 
    float longitude = atan(vUnitSamplePoint.z, vUnitSamplePoint.x) * 1.5 + time * 0.0008;
    
    // Alkali metal absorption bands (more subtle and detailed)
    float sodiumBands = sin(latitude * 3.5) * sin(longitude * 2.0) * 0.15 + 0.5;
    float potassiumBands = sin(longitude * 3.0 + latitude * 1.5) * 0.1 + 0.5;
    float hotSpots = sin(latitude * 5.0) * sin(longitude * 4.0) * 0.08 + 0.5;
    
    sodiumBands = smoothstep(0.4, 0.6, sodiumBands);
    potassiumBands = smoothstep(0.45, 0.55, potassiumBands);
    hotSpots = smoothstep(0.6, 0.8, hotSpots);
    
    // Very subtle alkali effects, preserving base color detail
    vec3 alkaliColor = baseColor;
    alkaliColor *= (0.3 + sodiumBands * 0.4); // Darken with sodium absorption
    alkaliColor *= (0.8 + potassiumBands * 0.2); // Slight potassium darkening
    alkaliColor += vec3(0.2, 0.1, 0.05) * hotSpots * 0.3; // Subtle hot spots
    
    // Apply atmospheric effects much more subtly
    alkaliColor = mix(baseColor * 0.5, alkaliColor, 0.8 + atmosphereIntensity * 0.2);

    // Much darker ambient for proper night sides
    vec3 ambient = alkaliColor * (uDynamicAmbientIntensity * 0.03); // Extremely dark ambient for Class IV
    vec3 totalDiffuse = vec3(0.0);
    vec3 totalSpecular = vec3(0.0);

    for (int i = 0; i < uNumLights; i++) {
        // Calculate light direction from position
        vec3 lightDir = normalize(uLights[i].position - vPosition);

        // Create a much wider, smoother transition around the terminator
        float dotProduct = dot(diffuseNormal, lightDir);
        float terminatorTransition = smoothstep(-0.5, 0.5, dotProduct); // Wide 1.0 unit transition
        
        // Always calculate diffuse (no hard cutoff)
        float ndl = max(dotProduct, 0.0);
        ndl = clamp01(ndl);
        
        float shadow = getShadow(vPosition, lightDir);

        // Apply lighting with smooth terminator transition
        float lightContribution = terminatorTransition * shadow;
        totalDiffuse += alkaliColor * ndl * lightContribution * 0.03 * uLights[i].color * uLights[i].intensity; // Very low diffuse

        // Specular component with smooth falloff
        vec3 halfAngle = normalize(viewDir + lightDir);
        float specComp = max(0.0, dot(normal, halfAngle));
        specComp = clamp01(specComp);
        specComp = pow(specComp, 100.0); // Very tight
        
        // Apply specular with smoother falloff
        float specularFalloff = smoothstep(-0.1, 0.2, dotProduct); // Very tight falloff for specular
        totalSpecular += vec3(0.08) * specComp * lightContribution * specularFalloff * uLights[i].color * uLights[i].intensity;
        
        // Add minimal night side illumination
        float nightContribution = (1.0 - terminatorTransition) * 0.01; // Minimal night glow for dark planets
        totalDiffuse += alkaliColor * nightContribution * uLights[i].color * uLights[i].intensity;
    }

    // Rim Lighting (Class IV adjustments - more intense)
    float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimIntensity = pow(rimDot, 4.0); // Sharper falloff
    rimIntensity = clamp01(rimIntensity * 0.8); // More intense rim
    vec3 rimColor = mix(baseColor, vec3(1.0), 0.3) * 1.3; // Brighter rim color
    vec3 rim = rimColor * rimIntensity;

    // Combine components
    vec3 finalColor = ambient + totalDiffuse + totalSpecular + rim;

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

    // Clamp before gamma correction to prevent artifacts
    finalColor = clamp(finalColor, 0.0, 1.0);

    // Apply basic gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
} 