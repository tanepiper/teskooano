attribute float size;
attribute float textureIndex;
attribute float initialRotation;

uniform float beltRotationAngle;
uniform float renderScale;

varying vec3 vColor;
varying float vTextureIndex;
varying float vInitialRotation;

void main() {
  vColor = color;
  vTextureIndex = textureIndex;
  vInitialRotation = initialRotation;
  
  // Apply belt rotation
  float cosAngle = cos(beltRotationAngle);
  float sinAngle = sin(beltRotationAngle);
  vec3 rotatedPosition = vec3(
    position.x * cosAngle - position.z * sinAngle,
    position.y,
    position.x * sinAngle + position.z * cosAngle
  );
  
  vec4 worldPosition = modelMatrix * vec4(rotatedPosition, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;

  gl_Position = projectionMatrix * mvPosition;
  
  // Simplified size calculation - make them much larger for debugging
  float distance = length(mvPosition.xyz);
  gl_PointSize = size * 100.0 / distance; // Reduced from 100.0 to 10.0 for realistic size
} 