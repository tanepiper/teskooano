// Basic pass-through vertex shader for atmosphere

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDirection;

void main() {
  // Pass vertex normal to fragment shader
  vNormal = normalize(normalMatrix * normal);
  
  // Transform position to view space
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vPosition = worldPosition.xyz;
  
  // Calculate and pass view direction
  vViewDirection = normalize(worldPosition.xyz - cameraPosition);
  
  // Standard vertex transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
} 