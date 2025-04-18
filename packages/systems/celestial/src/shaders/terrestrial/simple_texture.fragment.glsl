// Fragment shader for rendering pre-baked texture maps

uniform sampler2D colorMap;
uniform sampler2D normalMap;

// Basic lighting uniforms (adjust as needed)
uniform float ambientIntensity;
uniform float diffuseIntensity;
uniform float specularIntensity;
uniform float shininess;
uniform vec3 lightDirection; // View-space direction
uniform vec3 lightColor;
uniform vec2 normalScale; // Control normal map intensity (default: vec2(1.0, 1.0))

varying vec2 vUv;
varying vec3 vNormalView; // Original sphere normal (view space) 
varying vec3 vViewPosition; // Position in view space
varying mat3 vTBN; // TBN matrix from vertex shader

// Function to decode normal from map (range 0-1 to -1 to 1)
vec3 decodeNormal(vec4 normalSample) {
  vec3 normal = normalSample.xyz * 2.0 - 1.0;
  // Ensure Z is always positive to avoid inverted normals
  normal.z = abs(normal.z);
  normal.xy *= normalScale; // Apply normal scale to XY components only
  return normalize(normal);
}


void main() {
  // Calculate derivatives for blending
  vec2 dx = dFdx(vUv);
  vec2 dy = dFdy(vUv);
  // Use a slightly more robust delta calculation (average of squared lengths)
  float delta = sqrt(dot(dx, dx) + dot(dy, dy)) * 0.707; // Approx pixel size

  // Blend factor calculation - increased width and slightly adjusted smoothstep
  float blendWidth = 0.03; // Increased from 0.01 for a wider, smoother blend
  float adjustedBlendWidth = blendWidth * (1.0 + delta * 10.0); // Make width proportional to pixel size
  
  // Blend smoothly across the seam (0.0 to 1.0 in U)
  float blendFactor = smoothstep(0.0, adjustedBlendWidth, vUv.x) * 
                      (1.0 - smoothstep(1.0 - adjustedBlendWidth, 1.0, vUv.x));
  blendFactor = clamp(blendFactor, 0.0, 1.0);

  // Sample textures - primary sample
  vec4 colorSample = texture2D(colorMap, vUv);
  vec3 tangentNormal = decodeNormal(texture2D(normalMap, vUv));

  // Sample textures - wrapped sample (offset by 0.5 horizontally)
  vec2 wrappedUv = fract(vUv + vec2(0.5, 0.0)); // Sample from the opposite side
  vec4 wrappedColorSample = texture2D(colorMap, wrappedUv);
  vec3 wrappedTangentNormal = decodeNormal(texture2D(normalMap, wrappedUv));

  // Blend the samples using the inverse factor for the wrapped sample
  colorSample = mix(wrappedColorSample, colorSample, blendFactor);
  tangentNormal = mix(wrappedTangentNormal, tangentNormal, blendFactor);

  // --- Normal Calculation --- 
  // Transform the tangent-space normal from the map to view-space using the TBN matrix
  vec3 finalNormal = normalize(vNormalView); // Default to interpolated vertex normal
  
  // Improved normal map detection - always use normal map if available
  bool hasNormalMap = length(tangentNormal.xy) > 0.001; // Very low threshold to catch subtle details
  
  if (hasNormalMap) {
      // Ensure normal has positive Z before transformation
      if (tangentNormal.z < 0.1) tangentNormal.z = 0.1;
      tangentNormal = normalize(tangentNormal);
      
      // Apply TBN transformation
      finalNormal = normalize(vTBN * tangentNormal);
  }

  // Apply enhanced lighting calculation
  vec3 lightDir = normalize(lightDirection);
  vec3 viewDir = normalize(-vViewPosition);

  // Improved ambient light - bring out details on darker planets
  float colorBrightness = max(max(colorSample.r, colorSample.g), colorSample.b);
  float ambientBoost = 1.0 + (1.0 - colorBrightness) * 0.5; // Boost ambient for darker textures
  float ao = hasNormalMap ? mix(0.85, 1.0, length(tangentNormal.xy)) : 1.0; // Less extreme AO
  vec3 ambient = ambientIntensity * lightColor * ao * ambientBoost;

  // Enhanced diffuse lighting with softer terminator
  float wrap = 0.15; // Increased wrap factor for better back-lighting
  float normalBoost = hasNormalMap ? 1.1 : 1.0; // Slightly reduced boost
  float diff = max(0.0, (dot(finalNormal, lightDir) + wrap) / (1.0 + wrap));
  diff = pow(diff, 0.85) * normalBoost; // Softer power curve
  vec3 diffuse = diffuseIntensity * lightColor * diff;

  // Enhanced specular light with Blinn-Phong
  vec3 halfDir = normalize(lightDir + viewDir);
  float spec = pow(max(dot(finalNormal, halfDir), 0.0), shininess);
  
  // Modulate specular based on normal map intensity and texture brightness
  if (hasNormalMap) {
      float normalStrength = length(tangentNormal.xy);
      // Higher specular for areas with more normal detail, boost for darker colors
      spec *= (0.6 + normalStrength) * (1.0 + (1.0 - colorBrightness));
  } else {
      spec *= 0.7;
  }
  
  vec3 specular = specularIntensity * spec * lightColor;

  // Combine lighting components with texture color
  vec3 finalColor = (ambient + diffuse) * colorSample.rgb + specular;

  // Enhanced rim lighting for more visible edges on dark planets
  float rimFactor = 1.0 - max(0.0, dot(finalNormal, viewDir));
  rimFactor = pow(rimFactor, 3.0) * 0.35; // Stronger rim effect with wider falloff
  vec3 rimColor = mix(lightColor, colorSample.rgb, 0.3); // Blend rim with surface color
  finalColor += rimFactor * rimColor * (0.3 + (1.0 - colorBrightness) * 0.7); // Stronger on darker planets

  gl_FragColor = vec4(finalColor, colorSample.a);
} 