uniform float time;
uniform vec3 atmosphereColor;
uniform float atmosphereDensity;
uniform float atmosphereOpacity;
uniform float cloudMovement;
uniform float hazeDensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDirection;

// Noise functions for atmospheric variation
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float smoothNoise(vec2 p) {
  vec2 lv = fract(p);
  vec2 id = floor(p);
  
  lv = lv * lv * (3.0 - 2.0 * lv);
  
  float bl = noise(id);
  float br = noise(id + vec2(1.0, 0.0));
  float tl = noise(id + vec2(0.0, 1.0));
  float tr = noise(id + vec2(1.0, 1.0));
  
  float b = mix(bl, br, lv.x);
  float t = mix(tl, tr, lv.x);
  
  return mix(b, t, lv.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float freq = 1.0;
  float amp = 0.5;
  for(int i = 0; i < 5; i++) {
    sum += smoothNoise(p * freq) * amp;
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec3 viewDir = normalize(vViewDirection);
  vec3 normal = normalize(vNormal);
  
  // Fresnel effect for atmosphere
  float fresnel = 1.0 - max(dot(viewDir, normal), 0.0);
  fresnel = pow(fresnel, 2.0) * atmosphereDensity;
  
  // Moving cloud patterns similar to Titan's haze
  float cloudSpeed = time * 0.05 * cloudMovement;
  vec2 cloudOffset = vec2(cloudSpeed, cloudSpeed * 0.7);
  
  // Multi-layered haze patterns
  float hazePattern1 = fbm(vUv * 2.0 + cloudOffset);
  float hazePattern2 = fbm(vUv * 4.0 - cloudOffset * 1.5);
  
  // Combine patterns for complex haze
  float hazePattern = mix(hazePattern1, hazePattern2, 0.5) * hazeDensity;
  
  // Adjust fresnel with haze pattern
  float atmosphereEffect = fresnel * (1.0 + hazePattern * 0.3);
  
  // Determine final opacity
  float opacity = atmosphereEffect * atmosphereOpacity;
  opacity = min(opacity, atmosphereOpacity);
  
  // Add subtle haze color variation
  vec3 color = atmosphereColor;
  color = mix(color, color * 1.1, hazePattern);
  
  // Vertical banding similar to Titan's atmospheric layers
  float bands = sin(vUv.y * 8.0) * 0.5 + 0.5;
  color = mix(color, color * 0.9, bands * 0.15);
  
  gl_FragColor = vec4(color, opacity);
} 