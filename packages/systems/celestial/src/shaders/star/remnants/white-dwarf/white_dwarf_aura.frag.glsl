uniform float time;
uniform vec3 glowColor;
uniform float glowIntensity;

varying vec3 vNormal;
varying vec3 vWorldPosition; // Still available if needed for other effects

// Function for a smoother pulse, less dependent on specific world position
float smoothPulse(float t, float frequency, float amplitude, float offset) {
  return offset + sin(t * frequency) * amplitude;
}

// Smootherstep function for softer transitions
float smootherstep(float edge0, float edge1, float x) {
  x = clamp((x - edge0) / (edge1 - edge0), 0.0, 1.0);
  return x * x * x * (x * (x * 6.0 - 15.0) + 10.0);
}

void main() {
  // Softer rim lighting effect
  float rimDot = dot(vNormal, vec3(0.0, 0.0, 1.0));
  float intensity = smootherstep(0.1, 0.8, 1.0 - rimDot); // Adjust 0.1 and 0.8 to control softness and spread
  
  // Gentle global pulse, not tied to vWorldPosition.x to avoid jumpiness
  // Use a combination of frequencies for a more organic feel
  float pulse = smoothPulse(time, 1.5, 0.1, 0.7) + 
                smoothPulse(time, 2.7, 0.05, 0.0) + 
                smoothPulse(time, 0.8, 0.1, 0.0);
                
  gl_FragColor = vec4(glowColor, intensity * pulse * glowIntensity);
} 