varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying vec3 vViewDirection;

// uniform mat4 modelMatrix; // Remove explicit declaration, Three.js provides this
uniform vec3 sunPosition;

void main() {
  vUv = uv;
  // vNormal = normalize(normalMatrix * normal); // This is view-space normal
  vNormal = normalize( mat3(modelMatrix) * normal ); // Calculate world-space normal
  vPosition = position;
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  vSunDirection = normalize(sunPosition - vWorldPosition);
  vViewDirection = normalize(cameraPosition - vWorldPosition);

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
} 