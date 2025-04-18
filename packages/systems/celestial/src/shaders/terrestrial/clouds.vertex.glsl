// Cloud layer vertex shader - Adapted for world-space raymarching

varying vec2 vUv; // Keep UVs if needed for texture mapping later
varying vec3 vWorldPosition;
varying vec3 vNormal;
varying vec3 vViewDirection;

void main() {
  vUv = uv;
  
  vec4 worldPos = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPos.xyz;

  vNormal = normalize(normalMatrix * normal);
  
  // Calculate view direction (vector from surface point to camera)
  vViewDirection = cameraPosition - worldPos.xyz;

  // Standard position calculation
  gl_Position = projectionMatrix * viewMatrix * worldPos;
} 