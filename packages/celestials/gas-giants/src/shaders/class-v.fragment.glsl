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
uniform vec3 cloudColor; // Color for silicate cloud formations
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

// Improved noise function (from star shaders)
float snoise(vec3 uv, float res) {
    const vec3 s = vec3(1e0, 1e2, 1e4);
    uv *= res;
    vec3 uv0 = floor(mod(uv, res))*s;
    vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;
    vec3 f = fract(uv); f = f*f*(3.0-2.0*f);
    vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
                   uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);
    vec4 r = fract(sin(v*1e-3)*1e5);
    float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
    r = fract(sin((v + uv1.z - uv0.z)*1e-3)*1e5);
    float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
    return mix(r0, r1, f.z)*2.-1.;
}

// Enhanced Fractal Brownian Motion for pronounced atmospheric patterns
float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i = 0; i < 4; i++) { // Increased octaves for more detail
        sum += snoise(p * freq, 8.0) * amp; // Higher resolution
        amp *= 0.6; // Less amplitude decay for more contrast
        freq *= 1.8; // Slightly less frequency doubling for smoother transitions
        p = p * 1.15 + vec3(0.7, 0.3, 0.9); // Different offset for more variation
    }
    return sum;
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

    // Create silicate cloud patterns with high reflectivity and thermal emission
    float viewAngle = dot(viewDir, normal);
    float atmosphereIntensity = 1.0 - abs(viewAngle);
    
    // Create dynamic silicate cloud formations with varied scales
    vec3 cloudCoord = vUnitSamplePoint * 2.0 + time * 0.002;
    vec3 bandCoord = vUnitSamplePoint * 1.2 + time * 0.001;
    vec3 thermalCoord = vUnitSamplePoint * 3.5 + time * 0.003;
    vec3 structureCoord = vUnitSamplePoint * 0.9 + time * 0.0015;
    
    // Natural atmospheric patterns using FBM noise with enhanced contrast
    float silicateClouds = fbm(cloudCoord);
    float ironBands = fbm(bandCoord);
    float thermalSpots = fbm(thermalCoord);
    float cloudStructure = fbm(structureCoord);
    
    // Enhance contrast and make patterns more pronounced
    silicateClouds = smoothstep(-0.2, 0.4, silicateClouds);
    ironBands = smoothstep(-0.1, 0.3, ironBands);
    thermalSpots = smoothstep(0.2, 0.6, thermalSpots);
    cloudStructure = smoothstep(-0.3, 0.5, cloudStructure);
    
    // More pronounced cloud mixing for visible atmospheric features
    vec3 finalCloudColor = mix(baseColor, cloudColor, silicateClouds * 0.8); // Mix base with cloud color
    finalCloudColor *= (0.6 + ironBands * 0.6); // More visible iron variations  
    finalCloudColor += vec3(0.3, 0.15, 0.08) * thermalSpots * 0.8; // Stronger thermal hot spots
    finalCloudColor *= (0.8 + cloudStructure * 0.4); // More visible cloud structure
    
    // Apply atmospheric effects with more contrast
    finalCloudColor = mix(baseColor, finalCloudColor, 0.5 + atmosphereIntensity * 0.5);

    // Much darker ambient for proper night sides
    vec3 ambient = finalCloudColor * (uDynamicAmbientIntensity * 0.05); // Even darker ambient
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
        totalDiffuse += finalCloudColor * ndl * lightContribution * 0.35 * uLights[i].color * uLights[i].intensity;

        // Specular component with smooth falloff
        vec3 halfAngle = normalize(viewDir + lightDir);
        float specComp = max(0.0, dot(normal, halfAngle));
        specComp = clamp01(specComp);
        specComp = pow(specComp, 24.0); // Moderate shininess
        
        // Apply specular with smoother falloff  
        float specularFalloff = smoothstep(-0.3, 0.4, dotProduct); // Gentle falloff for specular
        totalSpecular += vec3(0.015) * specComp * lightContribution * specularFalloff * uLights[i].color * uLights[i].intensity;
        
        // Add subtle night side illumination
        float nightContribution = (1.0 - terminatorTransition) * 0.03; // Slight night glow for bright planets
        totalDiffuse += finalCloudColor * nightContribution * uLights[i].color * uLights[i].intensity;
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

    // Clamp before gamma correction to prevent artifacts
    finalColor = clamp(finalColor, 0.0, 1.0);

    // Apply basic gamma correction
    finalColor = pow(finalColor, vec3(1.0 / 2.2));

    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
} 