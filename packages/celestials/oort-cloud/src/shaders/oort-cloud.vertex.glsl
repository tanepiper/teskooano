attribute float size;
attribute float initialRotation;

uniform float cloudRotationAngleX;
uniform float cloudRotationAngleY;
uniform float cloudRotationAngleZ;

varying vec3 vColor;
varying float vInitialRotation;
uniform float pointSizeScale;

void main() {
    vColor = color;
    vInitialRotation = initialRotation;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    
    gl_PointSize = size * pointSizeScale;
} 