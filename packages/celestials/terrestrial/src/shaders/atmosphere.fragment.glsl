#include <common>
#include <logdepthbuf_pars_fragment>

uniform vec3 glowColor;
uniform float intensity;
uniform float power;
uniform float atmosphereThickness;
uniform float planetRadius;
uniform float aberrationIntensity;

// Light properties
uniform int uNumLights;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform vec3 uCameraPosition;

varying vec3 vWorldPosition;
varying vec3 vPlanetCenter;

// Rayleigh scattering function
float rayleighPhase(float cosTheta) {
  return 0.75 * (1.0 + cosTheta * cosTheta);
}

// Mie scattering approximation
float miePhase(float cosTheta, float g) {
  float g2 = g * g;
  return (1.0 - g2) / pow(1.0 + g2 - 2.0 * g * cosTheta, 1.5);
}

// Calculate optical depth through atmosphere (using example factors)
float opticalDepth(vec3 position, vec3 direction) {
  float outerRadius = planetRadius * (1.0 + atmosphereThickness);
  float innerRadius = planetRadius;

  vec3 rayStart = position;
  float a = dot(direction, direction);
  float b = 2.0 * dot(rayStart, direction);
  float c = dot(rayStart, rayStart) - innerRadius * innerRadius;
  float discriminant = b * b - 4.0 * a * c;

  if (discriminant > 0.0) {
    float t = (-b - sqrt(discriminant)) / (2.0 * a);
    if (t > 0.0) {
      // Use factor from example
      return 1.0 - exp(-t * 0.5); 
    }
  }

  float t = (-b + sqrt(b * b - 4.0 * a * (c - (outerRadius * outerRadius - innerRadius * innerRadius)))) / (2.0 * a);
  // Use factor from example
  return 1.0 - exp(-t * 0.1);
}

void main() {
  vec3 viewDirection = normalize(uCameraPosition - vWorldPosition);
  vec3 normalizedPos = normalize(vWorldPosition - vPlanetCenter);

  // Density calculation based on view angle
  float viewAngle = abs(dot(viewDirection, normalizedPos));
  float atmosphereDensity = pow(1.0 - viewAngle, power) * intensity;
  
  // Edge glow effect
  float edgeGlow = pow(1.0 - viewAngle, 2.0) * 1.5;

  // Scattering calculations using example's Rayleigh/Mie combination
  vec3 scatter = vec3(0.0);

  for (int i = 0; i < uNumLights; i++) {
    vec3 lightDir = normalize(uLightPositions[i] - vWorldPosition);
    float scatterAngle = dot(viewDirection, lightDir) * 0.5 + 0.5;

    // Only calculate scattering if the atmosphere is facing the light (day side)
    // For atmospheres, we use a more lenient threshold since they're always visible
    float dotProduct = dot(normalizedPos, lightDir);
    if (dotProduct > -0.3) { // Allow some scattering on the night side for visibility
      // Calculate optical depth for this light (used potentially for alpha, not direct attenuation)
      float depth = opticalDepth(vWorldPosition, lightDir);

      // Combine Rayleigh and Mie scattering using example's formula
      vec3 lightScatter = uLightColors[i] * uLightIntensities[i] * (
        rayleighPhase(scatterAngle) * vec3(0.3, 0.5, 1.0) + 
        miePhase(scatterAngle, 0.76) * vec3(1.0)
      );

      // Use smooth transition consistent with surface lighting
      float atmosphereTransition = smoothstep(-0.3, 0.3, dotProduct);
      scatter += lightScatter * max(atmosphereTransition, 0.2); // Consistent with surface terminator
    }
  }

  // Combine base scatter and glow effects
  vec3 baseAtmosphereColor = glowColor * scatter;
  baseAtmosphereColor += glowColor * edgeGlow; // Add edge glow

  // Calculate alpha based on density and view depth
  float alpha = atmosphereDensity;
  // Add contribution from looking through atmosphere volume
  alpha = clamp(alpha + opticalDepth(vWorldPosition, viewDirection) * 0.2, 0.0, 1.0);

  // Add direct-look visibility boost
  if (viewAngle < 0.3) {
    alpha += (1.0 - viewAngle / 0.3) * 0.3;
  }
  alpha = clamp(alpha, 0.0, 1.0); // Clamp final alpha

  // --- Chromatic Aberration --- 
  float aberrationStrength = pow(1.0 - viewAngle, 4.0) * aberrationIntensity;
  vec3 finalColor;
  finalColor.r = baseAtmosphereColor.r + aberrationStrength;
  finalColor.g = baseAtmosphereColor.g;
  finalColor.b = baseAtmosphereColor.b - aberrationStrength;
  finalColor = clamp(finalColor, 0.0, 1.0);

  gl_FragColor = vec4(finalColor, alpha);

  #include <logdepthbuf_fragment>
}

