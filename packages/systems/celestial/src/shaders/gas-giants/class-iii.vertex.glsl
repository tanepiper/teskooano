// Varyings to pass data to the fragment shader
varying vec2 vUv;          // Texture coordinates (keep for now, might not be used)
varying vec3 vNormal;      // Vertex normal in world space
varying vec3 vWorldPosition; // Vertex position in world space
varying vec3 vSunDirection; // Direction from vertex to sun
varying vec3 vViewDirection; // Direction from camera to vertex
varying vec3 vUnitSamplePoint; // Normalized local position (for noise sampling)
varying vec3 vSphereNormalW; // Normalized world normal assuming perfect sphere

// Uniforms passed from the application
uniform vec3 sunPosition; // Position of the sun (light source) in world space
// cameraPosition is already provided by Three.js as a built-in uniform
uniform float time;       // Time for potential animation

void main() {
  // Pass texture coordinates to fragment shader
  vUv = uv;

  // Local position and normal
  vec3 localPosition = position;
  vec3 localNormal = normal;

  // World position and normal
  vec4 worldPosition4 = modelMatrix * vec4(localPosition, 1.0);
  vWorldPosition = worldPosition4.xyz;
  vNormal = normalize( mat3(modelMatrix) * localNormal );

  // Normalized local position (used as base for noise sampling)
  vUnitSamplePoint = normalize(localPosition);

  // Calculate world normal assuming a perfect sphere at origin, transformed
  // This is used for the base diffuse lighting calculation in the example
  vSphereNormalW = normalize( mat3(modelMatrix) * vUnitSamplePoint );

  // Calculate direction from camera to vertex in world space
  vViewDirection = normalize(cameraPosition - vWorldPosition);

  // Calculate direction from vertex to sun in world space
  vSunDirection = normalize(sunPosition - vWorldPosition);

  // Calculate final vertex position in clip space
  gl_Position = projectionMatrix * modelViewMatrix * vec4(localPosition, 1.0);
} 