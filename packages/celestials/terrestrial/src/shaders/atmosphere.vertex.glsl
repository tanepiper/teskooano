varying vec3 vWorldPosition;
varying vec3 vPlanetCenter;

void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vPlanetCenter = (modelMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}