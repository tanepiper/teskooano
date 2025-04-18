uniform vec3 uSunPosition; // World space position of the sun

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition; // World space position of the fragment
varying vec3 vWorldSunPos; // Pass world sun position to fragment shader

void main() {
  vUv = uv;
  vNormal = normalize(normalMatrix * normal); // World space normal
  vPosition = (modelMatrix * vec4(position, 1.0)).xyz; // World space position
  vWorldSunPos = uSunPosition; // Pass world position directly

  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
} 