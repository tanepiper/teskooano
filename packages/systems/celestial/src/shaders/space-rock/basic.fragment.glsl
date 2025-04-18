uniform vec3 baseColor;
uniform vec3 sunPosition;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
  // Basic lighting
  vec3 lightDirection = normalize(sunPosition - vPosition);
  float lightIntensity = max(0.0, dot(vNormal, lightDirection)) * 0.7 + 0.3; // Diffuse + Ambient

  gl_FragColor = vec4(baseColor * lightIntensity, 1.0);
} 