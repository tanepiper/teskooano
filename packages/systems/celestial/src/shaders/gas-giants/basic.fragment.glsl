#define MAX_LIGHTS 4

struct Light {
  vec3 direction;
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
uniform ShadowCaster uShadowCasters[8]; // MAX_SHADOW_CASTERS
uniform int uNumShadowCasters;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vSphereNormalW;

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
  vec3 totalLighting = vec3(0.0);
  vec3 diffuseNormal = normalize(vSphereNormalW);

  for (int i = 0; i < uNumLights; i++) {
    // This check is necessary because the uLights array is padded
    if (uLights[i].intensity <= 0.0) continue;
    
    vec3 lightDirection = uLights[i].direction;
    float lightIntensity = max(0.0, dot(diffuseNormal, lightDirection));
    
    float shadow = 1.0;
    // Only calculate shadow if the surface is facing the light
    if (lightIntensity > 0.0) {
        shadow = getShadow(vPosition, lightDirection);
    }

    totalLighting += uLights[i].color * uLights[i].intensity * lightIntensity * shadow;
  }

  // Add a small ambient term
  vec3 ambient = vec3(0.1);
  vec3 finalColor = baseColor * (totalLighting + ambient);

  gl_FragColor = vec4(finalColor, 1.0);
} 