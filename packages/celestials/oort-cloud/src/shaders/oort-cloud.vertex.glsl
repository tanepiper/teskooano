attribute float size;
attribute float textureIndex;
attribute float initialRotation;

// Add instanced attributes
attribute mat4 instanceMatrix;
attribute vec3 instanceColor;

uniform float beltRotationAngle; // Use same uniform name as AsteroidFieldMaterial
uniform float renderScale;
uniform float time;
uniform float particleRotationSpeed;

varying vec3 vColor;
varying float vTextureIndex;
varying float vInitialRotation;
varying vec2 vUv; // Add vUv varying

void main() {
  // Transform position by instance matrix first
  // The 'position' here is the local position of the base geometry (e.g., a unit sphere)
  vec4 instancePosition = instanceMatrix * vec4(position, 1.0);
  
  vColor = instanceColor; // Use instance color
  vTextureIndex = textureIndex;
  vInitialRotation = initialRotation;
  vUv = uv; // Pass UVs for texture sampling
  
  // Apply cloud rotation to the instanced position
  // Note: beltRotationAngle is a uniform from the material
  float cosAngle = cos(beltRotationAngle);
  float sinAngle = sin(beltRotationAngle);
  
  // Rotate around Y-axis (vertical axis)
  vec3 rotatedPosition = vec3(
    instancePosition.x * cosAngle - instancePosition.z * sinAngle,
    instancePosition.y,
    instancePosition.x * sinAngle + instancePosition.z * cosAngle
  );

  // Combine model, view, and projection matrices
  // modelMatrix is now the matrix of the InstancedMesh itself
  vec4 mvPosition = modelViewMatrix * vec4(rotatedPosition, 1.0);

  gl_Position = projectionMatrix * mvPosition;
} 