precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>

// Unified Light Source structure
struct LightSource {
  vec3 position;
  vec3 color;
  float intensity;
};

// Shadow Caster structure (for moons and other celestial bodies)
struct ShadowCaster {
  vec3 position;
  float radius;
};

uniform vec3 baseColor;
uniform float metalness;
uniform float roughness;
uniform float maxEmissiveIntensity;
uniform float uDynamicAmbientIntensity;
uniform float uEmissiveIntensity; // Calculated emissive intensity
uniform vec3 uEmissiveColor; // Emissive color

// Texture uniforms (from original material)
uniform sampler2D map; // Diffuse texture
uniform sampler2D normalMap; // Normal map
uniform sampler2D roughnessMap; // Roughness map
uniform sampler2D metalnessMap; // Metalness map
uniform bool hasMap; // Whether diffuse texture exists
uniform bool hasNormalMap; // Whether normal map exists
uniform bool hasRoughnessMap; // Whether roughness map exists
uniform bool hasMetalnessMap; // Whether metalness map exists

// Environment map uniforms
uniform samplerCube envMap; // Environment map for reflections
uniform bool hasEnvMap; // Whether environment map exists
uniform float envMapIntensity; // Environment map reflection intensity

// Dynamic lighting and shadow arrays
uniform int uNumLights;
uniform LightSource uLightSources[MAX_LIGHTS];
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying vec2 vUv; // UV coordinates for texture mapping

// Function to calculate shadow from a single spherical occluder
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
  vec3 normal = normalize(vWorldNormal);
  vec3 viewDir = normalize(vViewDirection);
  
  // Sample textures if available
  vec3 diffuseColor = baseColor;
  if (hasMap) {
    diffuseColor = texture2D(map, vUv).rgb * baseColor;
  }
  
  // Sample normal map if available
  if (hasNormalMap) {
    vec3 normalMap = texture2D(normalMap, vUv).rgb * 2.0 - 1.0;
    normal = normalize(normal + normalMap * 0.5); // Blend with original normal
  }
  
  // Sample material properties from maps if available
  float finalMetalness = metalness;
  float finalRoughness = roughness;
  
  if (hasMetalnessMap) {
    finalMetalness = texture2D(metalnessMap, vUv).r;
  }
  
  if (hasRoughnessMap) {
    finalRoughness = texture2D(roughnessMap, vUv).r;
  }
  
  // Calculate environment map reflection
  vec3 reflection = vec3(0.0);
  if (hasEnvMap) {
    vec3 reflectDir = reflect(-viewDir, normal);
    reflection = textureCube(envMap, reflectDir).rgb * envMapIntensity * finalMetalness;
  }
  
  // Start with very low ambient lighting for realistic space conditions
  vec3 ambient = diffuseColor * (uDynamicAmbientIntensity * 0.02);
  
  // Calculate lighting from all light sources with proper terminator handling
  vec3 totalDiffuse = vec3(0.0);
  vec3 totalSpecular = vec3(0.0);
  
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uNumLights) break;
    
    LightSource light = uLightSources[i];
    // Clamp light intensity extremely aggressively to prevent flashes
    float clampedIntensity = clamp(light.intensity, 0.0, 2.0);
    if (clampedIntensity <= 0.0) continue;
    
    vec3 lightDir = normalize(light.position - vWorldPosition);
    // Validate light direction to prevent NaN
    if (length(lightDir) < 0.1) continue;
    
    // Create a smooth transition around the terminator
    float dotProduct = dot(normal, lightDir);
    float terminatorTransition = smoothstep(-0.15, 0.15, dotProduct);
    
    // Calculate shadow factor for this light source (applies to both day and night side)
    float shadowFactor = getShadow(vWorldPosition, lightDir);
    
    if (dotProduct > 0.0) {
      // Apply shadow factor to light intensity with extreme clamping
      float effectiveIntensity = clamp(clampedIntensity * shadowFactor, 0.0, 1.0);
      
      // Diffuse lighting with reduced strength for better terminator definition
      float diff = max(dotProduct, 0.0);
      vec3 diffuseContrib = light.color * diff * effectiveIntensity * 0.2 * terminatorTransition; // Further reduced
      totalDiffuse += clamp(diffuseContrib, vec3(0.0), vec3(0.5)); // Even lower clamp
      
      // Specular lighting (Blinn-Phong)
      vec3 halfwayDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
      vec3 specularContrib = light.color * spec * effectiveIntensity * 0.1 * terminatorTransition; // Further reduced
      totalSpecular += clamp(specularContrib, vec3(0.0), vec3(0.2)); // Even lower clamp
    } else {
      // Night side - very low lighting with smooth transition, but also affected by shadows
      float nightLight = clamp(0.02 * (1.0 - terminatorTransition) * shadowFactor, 0.0, 0.05); // Reduced values
      totalDiffuse += light.color * nightLight;
    }
  }
  
  // Combine lighting components
  vec3 diffuse = diffuseColor * totalDiffuse;
  vec3 specular = totalSpecular;
  
  // Add emissive lighting
  vec3 emissive = uEmissiveColor * uEmissiveIntensity;
  
  // Final color with environment map reflection - clamp all components extremely aggressively
  vec3 finalColor = clamp(ambient, vec3(0.0), vec3(1.0)) + 
                   clamp(diffuse, vec3(0.0), vec3(1.0)) + 
                   clamp(specular, vec3(0.0), vec3(1.0)) + 
                   clamp(emissive, vec3(0.0), vec3(1.0)) + 
                   clamp(reflection, vec3(0.0), vec3(1.0));
  
  // Final safety clamp before gamma correction - extremely aggressive
  finalColor = clamp(finalColor, vec3(0.0), vec3(1.5));
  
  // Apply gamma correction
  finalColor = pow(finalColor, vec3(1.0 / 2.2));
  
  // Final output clamp to prevent any remaining wild values
  gl_FragColor = vec4(clamp(finalColor, vec3(0.0), vec3(1.0)), 1.0);

  #include <logdepthbuf_fragment>
} 