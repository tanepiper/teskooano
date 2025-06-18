#define MAX_LIGHTS 4

struct Light {
  vec3 direction;
  vec3 color;
  float intensity;
};

uniform vec3 baseColor;
uniform int uNumLights;
uniform Light uLights[MAX_LIGHTS];

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vSphereNormalW;

void main() {
  vec3 totalLighting = vec3(0.0);
  vec3 diffuseNormal = normalize(vSphereNormalW);

  for (int i = 0; i < uNumLights; i++) {
    vec3 lightDirection = uLights[i].direction;
    float lightIntensity = max(0.0, dot(diffuseNormal, lightDirection));
    totalLighting += uLights[i].color * uLights[i].intensity * lightIntensity;
  }

  // Add a small ambient term
  vec3 ambient = vec3(0.1);
  vec3 finalColor = baseColor * (totalLighting + ambient);

  gl_FragColor = vec4(finalColor, 1.0);
} 