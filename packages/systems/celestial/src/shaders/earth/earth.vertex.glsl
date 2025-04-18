// uniform vec3 lightDirection; // We'll pass world light position instead

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition; // Still needed for specular
varying vec3 vViewNormal; // Still needed for specular maybe?

void main() {
  vUv = uv;
  
  // Calculate world-space position and normal
  vec4 worldPosition = modelMatrix * vec4(position, 1.0);
  vWorldPosition = worldPosition.xyz;
  // Calculate world normal (simple version, assumes no non-uniform scaling)
  vWorldNormal = normalize(mat3(modelMatrix[0].xyz, modelMatrix[1].xyz, modelMatrix[2].xyz) * normal);
  // More robust world normal calculation (handles scaling):
  // vWorldNormal = normalize(transpose(inverse(mat3(modelMatrix))) * normal);

  // Calculate view-space position and normal (for specular)
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz; // Vector from vertex to camera
  vViewNormal = normalize(normalMatrix * normal);
  
  // vViewLightDirection is no longer calculated here
  
  gl_Position = projectionMatrix * mvPosition;
}
