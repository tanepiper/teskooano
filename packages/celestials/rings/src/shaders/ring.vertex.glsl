#include <common>
#include <logdepthbuf_pars_vertex>

uniform vec3 uParentPosition; // World position of the parent body
uniform float rotationAngle; // Current rotation angle of the ring

// Enhanced Axial Inclination Controls
uniform float uAxialInclination; // Ring system axial inclination
uniform float uRingTilt; // Individual ring tilt
uniform bool uInheritParentTilt; // Whether to inherit parent's axial tilt
uniform vec3 uParentAxialTilt; // Parent's axial tilt vector
uniform float uPrecessionAngle; // Precession angle
uniform float uPrecessionRate; // Precession rate

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

// Rotation matrix around X axis
mat4 rotateX(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat4(
    1.0, 0.0, 0.0, 0.0,
    0.0, c, -s, 0.0,
    0.0, s, c, 0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

// Rotation matrix around arbitrary axis
mat4 rotateAxis(vec3 axis, float angle) {
  float c = cos(angle);
  float s = sin(angle);
  float omc = 1.0 - c;
  
  return mat4(
    axis.x * axis.x * omc + c,
    axis.x * axis.y * omc - axis.z * s,
    axis.x * axis.z * omc + axis.y * s,
    0.0,
    axis.y * axis.x * omc + axis.z * s,
    axis.y * axis.y * omc + c,
    axis.y * axis.z * omc - axis.x * s,
    0.0,
    axis.z * axis.x * omc - axis.y * s,
    axis.z * axis.y * omc + axis.x * s,
    axis.z * axis.z * omc + c,
    0.0,
    0.0, 0.0, 0.0, 1.0
  );
}

void main() {
  vUv = uv;
  
  // Start with the base position
  vec4 finalPosition = vec4(position, 1.0);
  
  // Apply ring rotation (spinning in its own plane)
  finalPosition = rotateZ(rotationAngle) * finalPosition;
  
  // Apply individual ring tilt
  if (uRingTilt != 0.0) {
    finalPosition = rotateX(uRingTilt) * finalPosition;
  }
  
  // Apply ring system axial inclination
  if (uAxialInclination != 0.0) {
    finalPosition = rotateX(uAxialInclination) * finalPosition;
  }
  
  // Apply parent axial tilt inheritance if enabled
  if (uInheritParentTilt) {
    // Create rotation matrix from parent's axial tilt vector
    vec3 parentAxis = normalize(uParentAxialTilt);
    if (length(parentAxis) > 0.0) {
      // Calculate the angle from the default Y-axis to the parent's tilt axis
      vec3 defaultAxis = vec3(0.0, 1.0, 0.0);
      float dotProduct = dot(defaultAxis, parentAxis);
      float angle = acos(clamp(dotProduct, -1.0, 1.0));
      
      if (angle > 0.001) { // Only apply if there's a significant tilt
        vec3 rotationAxis = normalize(cross(defaultAxis, parentAxis));
        finalPosition = rotateAxis(rotationAxis, angle) * finalPosition;
      }
    }
  }
  
  // Apply precession if enabled
  if (uPrecessionRate > 0.0) {
    finalPosition = rotateZ(uPrecessionAngle) * finalPosition;
  }
  
  // Transform normal to world space
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  
  // Calculate world position with all transformations applied
  vPosition = (modelMatrix * finalPosition).xyz;

  // Final position for rendering
  gl_Position = projectionMatrix * modelViewMatrix * finalPosition;
  
  #include <logdepthbuf_vertex>
} 