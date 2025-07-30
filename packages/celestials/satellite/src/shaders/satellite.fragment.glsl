precision highp float;
#include <common>
#include <logdepthbuf_pars_fragment>

struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};

uniform vec3 baseColor;
uniform float metalness;
uniform float roughness;
uniform float maxEmissiveIntensity;
uniform float uDynamicAmbientIntensity;
uniform float uShadowFactor; // Precalculated shadow factor (0.0 = full shadow, 1.0 = fully lit)
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

uniform Light uLights[MAX_LIGHTS];
uniform int uNumLights;

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying vec2 vUv; // UV coordinates for texture mapping

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
  
  // Start with ambient lighting - also affected by shadow factor
  vec3 ambient = diffuseColor * uDynamicAmbientIntensity * uShadowFactor;
  
  // Calculate lighting from all light sources
  vec3 totalDiffuse = vec3(0.0);
  vec3 totalSpecular = vec3(0.0);
  
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uNumLights) break;
    
    Light light = uLights[i];
    if (light.intensity <= 0.0) continue;
    
    vec3 lightDir = normalize(light.position - vWorldPosition);
    
    // Apply shadow factor to light intensity
    float effectiveIntensity = light.intensity * uShadowFactor;
    
    // Diffuse lighting
    float diff = max(dot(normal, lightDir), 0.0);
    totalDiffuse += light.color * diff * effectiveIntensity;
    
    // Specular lighting (Blinn-Phong)
    vec3 halfwayDir = normalize(lightDir + viewDir);
    float spec = pow(max(dot(normal, halfwayDir), 0.0), 32.0);
    totalSpecular += light.color * spec * effectiveIntensity * 0.3;
  }
  
  // Combine lighting components
  vec3 diffuse = diffuseColor * totalDiffuse;
  vec3 specular = totalSpecular;
  
  // Add emissive lighting
  vec3 emissive = uEmissiveColor * uEmissiveIntensity;
  
  // Final color with environment map reflection
  vec3 finalColor = ambient + diffuse + specular + emissive + reflection;
  
  // Apply gamma correction
  finalColor = pow(finalColor, vec3(1.0 / 2.2));
  
  gl_FragColor = vec4(finalColor, 1.0);

  #include <logdepthbuf_fragment>
} 