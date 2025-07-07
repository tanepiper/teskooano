uniform vec3 baseColor;
uniform vec3 sunPosition;
uniform float uDynamicAmbientIntensity; // Dynamic ambient lighting

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Basic lighting
  vec3 lightDirection = normalize(sunPosition - vPosition);
  float lightIntensity = max(0.0, dot(vNormal, lightDirection)) * 0.7 + uDynamicAmbientIntensity; // Dynamic ambient

  gl_FragColor = vec4(baseColor * lightIntensity, 1.0);
} 