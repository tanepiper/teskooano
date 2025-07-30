#include <common>
#include <logdepthbuf_pars_vertex>

// Varyings to pass data to the fragment shader
varying vec2 vUv;          // Texture coordinates (keep for now, might not be used)
varying vec3 vNormal;      // Vertex normal in world space
varying vec3 vWorldPosition; // Vertex position in world space
varying vec3 vViewDirection; // Direction from camera to vertex
varying vec3 vUnitSamplePoint; // Normalized local position (for noise sampling)
varying vec3 vSphereNormalW; // Normalized world normal assuming perfect sphere
varying vec3 vPosition;

// Uniforms passed from the application
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

  // We'll use a fixed view direction from "above" the planet
  // This removes camera dependency for lighting calculations
  vViewDirection = vec3(0.0, 1.0, 0.0);

  vPosition = worldPosition4.xyz;

  // Calculate final vertex position in clip space
  gl_Position = projectionMatrix * modelViewMatrix * vec4(localPosition, 1.0);

  #include <logdepthbuf_vertex>
} 