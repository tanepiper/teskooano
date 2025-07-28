varying vec3 vWorldNormal;
varying vec3 vWorldPosition;
varying vec2 vUv;
varying vec3 vObjectPosition;

void main() {
    vUv = uv;
    vObjectPosition = normalize(position);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;

    // Pass the world-space normal to the fragment shader
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
} 