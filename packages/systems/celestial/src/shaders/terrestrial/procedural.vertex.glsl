varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vObjectPosition;

// Removed: vViewPosition, vHeight

void main() {
  vUv = uv;

  // --- Basic Transformations ONLY --- 
  vec3 objectSpacePosition = position;
  vec3 objectSpaceNormal = normalize(normal);
  vObjectPosition = normalize(objectSpacePosition);

  vWorldPosition = (modelMatrix * vec4(objectSpacePosition, 1.0)).xyz;
  vWorldNormal = normalize((modelMatrix * vec4(objectSpaceNormal, 0.0)).xyz);

  // Standard MVP transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(objectSpacePosition, 1.0);
} 