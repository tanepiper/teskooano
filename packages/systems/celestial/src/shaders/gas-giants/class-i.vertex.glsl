// Varyings to pass data to the fragment shader
varying vec2 vUv;          // Texture coordinates (keep for now, might not be used)
varying vec3 vNormal;      // Vertex normal in world space
varying vec3 vPosition;     // Vertex position in world space
varying vec3 vViewDirection; // Direction from camera to vertex
varying vec3 vSphereNormalW; // Normalized world normal assuming perfect sphere
varying vec3 vUnitSamplePoint;

// Uniforms passed from the application
// cameraPosition is already provided by Three.js as a built-in uniform
uniform float time;       // Time for potential animation

void main() {
  // Pass texture coordinates to fragment shader
  vUv = uv;

  // Calculate the world position and pass it to the fragment shader
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vPosition = worldPosition.xyz;

  // Local position and normal
  vec3 localPosition = position;
  vec3 localNormal = normal;

  // World position and normal
  vec4 worldPosition4 = modelMatrix * vec4(localPosition, 1.0);
  vec3 worldNormal = normalize( mat3(modelMatrix) * localNormal );

  // Normalized local position (used as base for noise sampling)
  vec3 unitSamplePoint = normalize(localPosition);

  // Calculate world normal assuming a perfect sphere at origin, transformed
  // This is used for the base diffuse lighting calculation in the example
  vSphereNormalW = normalize( mat3(modelMatrix) * unitSamplePoint );

  // Calculate direction from camera to vertex in world space
  vec3 viewDirection = normalize(cameraPosition - worldPosition.xyz);

  // Calculate final vertex position in clip space
  gl_Position = projectionMatrix * modelViewMatrix * vec4(localPosition, 1.0);

  vNormal = normalize(normalMatrix * normal);
  vUnitSamplePoint = normalize(position);
} 