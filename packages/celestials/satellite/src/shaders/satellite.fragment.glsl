precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>

// Shadow Caster structure (for moons and other celestial bodies)
struct ShadowCaster {
  vec3 position;
  float radius;
};

uniform vec3 baseColor;
uniform float metalness;
uniform float roughness;
uniform float maxEmissiveIntensity;
uniform vec3 uAmbientColor;
uniform float uAmbientIntensity;
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
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform int uNumShadowCasters;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying vec2 vUv; // UV coordinates for texture mapping

// Function to calculate shadow from a single spherical occluder
// Returns a value from 0.0 (full shadow) to 1.0 (fully lit)
float getShadow(vec3 fragPos, vec3 lightDir) {
  // Early exit if no shadow casters
  if (uNumShadowCasters <= 0) return 1.0;
  
  float finalShadow = 1.0;

  for (int i = 0; i < uNumShadowCasters; i++) {
    // This check is necessary because the array is padded with empty data
    if (uShadowCasters[i].radius <= 0.0) continue;

    vec3 oc = fragPos - uShadowCasters[i].position;
    float b = dot(oc, lightDir);
    float c = dot(oc, oc) - (uShadowCasters[i].radius * uShadowCasters[i].radius);
    float discriminant = b * b - c;

    // If the ray intersects the shadow caster sphere
    if (discriminant >= 0.0) {
      float t1 = -b - sqrt(discriminant);
      float t2 = -b + sqrt(discriminant);
      
      // Check if the shadow caster is between the light and the fragment
      if (t1 > 0.001 || (t1 <= 0.001 && t2 > 0.001)) {
        // Calculate distance from ray to sphere center for penumbra
        float distToCenter = length(cross(oc, lightDir)) / length(lightDir);
        float radius = uShadowCasters[i].radius;
        
        // Simple soft shadow calculation
        if (distToCenter < radius) {
          // Inside umbra/penumbra
          float shadowStrength = 1.0 - smoothstep(radius * 0.8, radius * 1.2, distToCenter);
          shadowStrength = clamp(shadowStrength, 0.0, 1.0);
          float currentShadow = 1.0 - shadowStrength;
          finalShadow = min(finalShadow, currentShadow);
        }
      }
    }
  }
  return clamp(finalShadow, 0.0, 1.0);
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
  vec3 ambient = diffuseColor * uAmbientColor * (uAmbientIntensity * 0.02);
  
  // Calculate lighting from all light sources with proper terminator handling
  vec3 totalDiffuse = vec3(0.0);
  vec3 totalSpecular = vec3(0.0);
  
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uNumLights) break;
    
    vec3 lightPosition = uLightPositions[i];
    vec3 lightColor = uLightColors[i];
    // Clamp light intensity extremely aggressively to prevent flashes
    float clampedIntensity = clamp(uLightIntensities[i], 0.0, 2.0);
    if (clampedIntensity <= 0.0) continue;
    
    vec3 lightDir = normalize(lightPosition - vWorldPosition);
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
      vec3 diffuseContrib = lightColor * diff * effectiveIntensity * 0.2 * terminatorTransition; // Further reduced
      totalDiffuse += clamp(diffuseContrib, vec3(0.0), vec3(0.5)); // Even lower clamp
      
      // Specular lighting (Blinn-Phong)
      vec3 halfwayDir = normalize(lightDir + viewDir);
      float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
      vec3 specularContrib = lightColor * spec * effectiveIntensity * 0.1 * terminatorTransition; // Further reduced
      totalSpecular += clamp(specularContrib, vec3(0.0), vec3(0.2)); // Even lower clamp
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
