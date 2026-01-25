#include <common>
#include <logdepthbuf_pars_fragment>

// Atmosphere properties
uniform vec3 glowColor;
uniform float intensity;
uniform float power;
uniform float atmosphereThickness;
uniform float planetRadius;
uniform float aberrationIntensity;
uniform float opacity; // New uniform for controlling overall opacity

// Light properties
uniform int uNumLights;
uniform vec3 uLightPositions[MAX_LIGHTS];
uniform vec3 uLightColors[MAX_LIGHTS];
uniform float uLightIntensities[MAX_LIGHTS];
uniform vec3 uPrimaryLightDirection; // Legacy support if needed

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
  vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
  vec3 normalizedPos = normalize(vWorldPosition - vPlanetCenter);

  // Handle double-sided rendering - flip normal for back faces
  vec3 effectiveNormal = gl_FrontFacing ? normalizedPos : -normalizedPos;
  
  // Density calculation based on view angle
  float viewAngle = abs(dot(viewDirection, effectiveNormal));
  float atmosphereDensity = pow(1.0 - viewAngle, power) * intensity;
  
  // Edge glow effect
  float edgeGlow = pow(1.0 - viewAngle, 2.0) * 1.5;

  // Initialize scatter variable
  vec3 scatter = vec3(0.0);

  // Rayleigh/Mie scattering for World-Space Light Sources
  for (int i = 0; i < 4; i++) {
    if (i >= uNumLights) break;

    vec3 lightPos = uLightPositions[i];
    vec3 lightColor = uLightColors[i];
    float lightIntensity = uLightIntensities[i];
    
    // Direction FROM fragment TO light source in World Space
    vec3 lightDir = normalize(lightPos - vWorldPosition);
    
    // Attenuation (consistent with planet surface)
    float dist = distance(lightPos, vWorldPosition);
    float attenuation = 1.0 / (1.0 + 0.0000001 * dist * dist);
    
    // Dot product with View Direction for scattering phase
    float scatterAngle = dot(viewDirection, lightDir) * 0.5 + 0.5;

    // Combine Rayleigh and Mie scattering
    vec3 lightScatter = lightColor * lightIntensity * attenuation * (
      rayleighPhase(scatterAngle) * vec3(0.3, 0.5, 1.0) + 
      miePhase(scatterAngle, 0.76) * vec3(1.0)
    );

    scatter += lightScatter;
  }

  // Combine base scatter and glow effects
  vec3 baseAtmosphereColor = glowColor * scatter;
  baseAtmosphereColor += glowColor * edgeGlow; // Add edge glow

  // Calculate alpha based on density and view depth, then apply opacity control
  float alpha = atmosphereDensity;
  // Add contribution from looking through atmosphere volume
  alpha = clamp(alpha + opticalDepth(vWorldPosition, viewDirection) * 0.2, 0.0, 1.0);

  // Add direct-look visibility boost
  // if (viewAngle < 0.3) {
  //   alpha += (1.0 - viewAngle / 0.3) * 0.3;
  // }
  alpha += 0.1;
  
  // Apply the opacity uniform to control overall transparency
  alpha *= opacity;
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
