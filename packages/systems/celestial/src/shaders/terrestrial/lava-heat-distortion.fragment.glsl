uniform float time;
uniform vec3 atmosphereColor;
uniform float atmosphereDensity;
uniform float atmosphereOpacity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vViewDirection;

void main() {
  vec3 viewDir = normalize(vViewDirection);
  vec3 normal = normalize(vNormal);
  
  // Fresnel effect for atmosphere
  float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
  fresnel = pow(fresnel, 3.0) * atmosphereDensity;
  
  // Adjust opacity based on fresnel
  float opacity = fresnel * atmosphereOpacity;
  opacity = min(opacity, atmosphereOpacity);
  
  // Add heat distortion
  float distortion = sin(time * 3.0 + vUv.x * 10.0 + vUv.y * 15.0) * 0.1;
  opacity *= (1.0 + distortion);
  
  // Final color
  vec3 color = atmosphereColor;
  
  gl_FragColor = vec4(color, opacity);
} 