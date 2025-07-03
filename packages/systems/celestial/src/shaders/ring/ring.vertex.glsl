uniform vec3 uParentPosition; // World position of the parent body
uniform float rotationAngle; // Current rotation angle of the ring

varying vec2 vUv;
varying vec3 vWorldNormal;
varying vec3 vPosition; // World space position of the fragment

// Simplified rotation matrix around Z axis
mat4 rotateZ(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat4(
    c, -s, 0.0, 0.0,
    s, c, 0.0, 0.0,
    0.0, 0.0, 1.0, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

void main() {
  vUv = uv;
  
  // Apply rotation to the position
  // The ring is already rotated to be in the XY plane (with Z as normal)
  // so we rotate around Z to spin the ring in its own plane
  vec4 rotatedPosition = rotateZ(rotationAngle) * vec4(position, 1.0);
  
  // Transform normal to world space
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  
  // Calculate world position with rotation applied
  vPosition = (modelMatrix * rotatedPosition).xyz;

  // Final position for rendering
  gl_Position = projectionMatrix * modelViewMatrix * rotatedPosition;
} 