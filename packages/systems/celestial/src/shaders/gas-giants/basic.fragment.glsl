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

uniform vec3 baseColor;
uniform float time;
uniform int uNumLights;
uniform Light uLights[MAX_LIGHTS];
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
uniform int uNumShadowCasters;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vSphereNormalW;

// Function to calculate shadow from a single spherical occluder
float getShadow(vec3 fragPos, vec3 lightPos, vec3 casterPos, float casterRadius) {
  vec3 lightDir = normalize(lightPos - fragPos);
  vec3 oc = fragPos - casterPos;
  float b = dot(oc, lightDir);
  float c = dot(oc, oc) - (casterRadius * casterRadius);
  float discriminant = b * b - c;
  
  if (discriminant < 0.0) {
    return 1.0; // No intersection, fully lit
  }
  
  float t = -b - sqrt(discriminant);
  if (t > 0.001) { // Epsilon to avoid self-shadowing
    return 0.0; // In shadow
  }
  
  return 1.0; // Lit
}

void main() {
  vec3 normal = normalize(vNormal);
  
  // Ambient light
  vec3 ambient = baseColor * 0.1;
  
  // Diffuse lighting
  vec3 diffuse = vec3(0.0);
  
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uNumLights) break;
    
    // Calculate direction from fragment to light
    vec3 lightDir = normalize(uLights[i].position - vPosition);
    
    // Diffuse component
    float diff = max(dot(normal, lightDir), 0.0);
    
    // Shadow calculation
    float shadow = 1.0;
    for (int j = 0; j < MAX_SHADOW_CASTERS; j++) {
      if (j >= uNumShadowCasters) break;
      shadow = min(shadow, getShadow(vPosition, uLights[i].position, 
                                    uShadowCasters[j].position, 
                                    uShadowCasters[j].radius));
    }
    
    // Apply shadow to diffuse lighting
    diffuse += shadow * diff * uLights[i].color * uLights[i].intensity;
  }
  
  // Final color
  vec3 finalColor = ambient + diffuse * baseColor;
  
  // Gamma correction
  finalColor = pow(finalColor, vec3(1.0 / 2.2));
  
  gl_FragColor = vec4(finalColor, 1.0);
} 