attribute float size;
attribute float alpha;
varying float vAlpha;
varying float vDepth;
varying vec3 vWorldPosition;

void main() {
    vAlpha = alpha;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vec4 mvPosition = viewMatrix * worldPosition;
    vDepth = -mvPosition.z;
    gl_PointSize = size * (300.0 / vDepth);
    // Clamp the max size to prevent them from being huge when the camera is very close.
    gl_PointSize = min(gl_PointSize, 20.0);
    gl_Position = projectionMatrix * mvPosition;
} 