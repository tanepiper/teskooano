varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vSphereNormalW;

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal);
  vPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vSphereNormalW = normalize(mat3(modelMatrix) * normalize(position));
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
} 