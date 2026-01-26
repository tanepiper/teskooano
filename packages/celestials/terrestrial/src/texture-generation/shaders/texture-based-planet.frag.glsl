/**
 * Texture-based planet fragment shader.
 * 
 * Uses pre-generated texture maps for rendering:
 * - Color map for albedo
 * - Normal map for surface detail
 * - Roughness map for material properties
 * 
 * Supports multi-light rendering with shadows.
 */

precision highp float;

#include <common>
#include <logdepthbuf_pars_fragment>

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

// Texture maps
uniform sampler2D uColorMap;
uniform sampler2D uNormalMap;
uniform sampler2D uRoughnessMap;
uniform sampler2D uHeightMap;

// Material properties
uniform float uMetalness;

// Lighting
#include <lights_pars_begin>
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;

// Shadow casters (reusing from original procedural shader)
struct ShadowCaster {
    vec3 position;
    float radius;
};

#ifndef MAX_SHADOW_CASTERS
#define MAX_SHADOW_CASTERS 4
#endif

uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];

/**
 * Unpack normal from normal map.
 */
vec3 unpackNormal(vec3 normalMapValue) {
    return normalize(normalMapValue * 2.0 - 1.0);
}

/**
 * Calculate tangent space basis from world normal.
 */
mat3 getTangentBasis(vec3 normal) {
    vec3 helper = abs(normal.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tangent = normalize(cross(helper, normal));
    vec3 bitangent = cross(normal, tangent);
    return mat3(tangent, bitangent, normal);
}

/**
 * Check if point is in shadow from a caster.
 */
float getShadow(vec3 fragPos, vec3 lightDir, ShadowCaster caster) {
    vec3 toFragment = fragPos - caster.position;
    float distToCenter = length(toFragment);
    
    // Calculate distance to line from fragment to light
    vec3 fragToLight = normalize(lightDir);
    float projection = dot(toFragment, fragToLight);
    
    if (projection > 0.0) {
        // Fragment is "behind" caster relative to light
        vec3 closestPointOnLine = caster.position + fragToLight * max(0.0, projection);
        float distToLine = length(fragPos - closestPointOnLine);
        
        // Soft shadow edge
        float shadowRadius = caster.radius * 1.1;
        float penumbraWidth = caster.radius * 0.3;
        
        if (distToLine < shadowRadius) {
            return smoothstep(shadowRadius - penumbraWidth, shadowRadius, distToLine);
        }
    }
    
    return 1.0;
}

/**
 * Calculate Blinn-Phong lighting.
 */
vec3 calculateLighting(
    vec3 albedo,
    vec3 normal,
    vec3 worldPos,
    vec3 viewDir,
    float roughness
) {
    vec3 result = albedo * uAmbientColor * uAmbientIntensity;
    
    // Convert roughness to shininess
    float shininess = mix(256.0, 8.0, roughness);
    float specularStrength = mix(0.5, 0.1, roughness);
    
    // Process each light
    #if NUM_DIR_LIGHTS > 0
    for (int i = 0; i < NUM_DIR_LIGHTS; i++) {
        vec3 lightDir = directionalLights[i].direction;
        vec3 lightColor = directionalLights[i].color;
        
        // Calculate shadow
        float shadow = 1.0;
        for (int j = 0; j < MAX_SHADOW_CASTERS; j++) {
            if (j >= uNumShadowCasters) break;
            shadow *= getShadow(worldPos, lightDir, uShadowCasters[j]);
        }
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular (Blinn-Phong)
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
        
        result += shadow * (albedo * lightColor * diff + lightColor * spec * specularStrength);
    }
    #endif
    
    #if NUM_POINT_LIGHTS > 0
    for (int i = 0; i < NUM_POINT_LIGHTS; i++) {
        vec3 lightDir = normalize(pointLights[i].position - worldPos);
        float dist = length(pointLights[i].position - worldPos);
        float attenuation = 1.0 / (1.0 + 0.01 * dist + 0.0001 * dist * dist);
        vec3 lightColor = pointLights[i].color * attenuation;
        
        // Calculate shadow
        float shadow = 1.0;
        for (int j = 0; j < MAX_SHADOW_CASTERS; j++) {
            if (j >= uNumShadowCasters) break;
            shadow *= getShadow(worldPos, lightDir, uShadowCasters[j]);
        }
        
        // Diffuse
        float diff = max(dot(normal, lightDir), 0.0);
        
        // Specular
        vec3 halfDir = normalize(lightDir + viewDir);
        float spec = pow(max(dot(normal, halfDir), 0.0), shininess);
        
        result += shadow * (albedo * lightColor * diff + lightColor * spec * specularStrength);
    }
    #endif
    
    return result;
}

void main() {
    // Sample textures
    vec3 albedo = texture2D(uColorMap, vUv).rgb;
    vec3 normalMapValue = texture2D(uNormalMap, vUv).rgb;
    float roughness = texture2D(uRoughnessMap, vUv).r;
    
    // Calculate world-space normal from normal map
    vec3 tangentNormal = unpackNormal(normalMapValue);
    mat3 tbn = getTangentBasis(normalize(vWorldNormal));
    vec3 worldNormal = normalize(tbn * tangentNormal);
    
    // View direction
    vec3 viewDir = normalize(cameraPosition - vWorldPosition);
    
    // Calculate lighting
    vec3 finalColor = calculateLighting(
        albedo,
        worldNormal,
        vWorldPosition,
        viewDir,
        roughness
    );
    
    // Clamp and gamma correct
    finalColor = clamp(finalColor, 0.0, 1.0);
    finalColor = pow(finalColor, vec3(1.0 / 2.2));
    
    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
}
