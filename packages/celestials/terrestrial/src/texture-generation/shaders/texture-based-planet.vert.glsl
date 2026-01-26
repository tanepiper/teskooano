/**
 * Texture-based planet vertex shader.
 * 
 * Applies displacement from height map and passes necessary
 * varyings to the fragment shader for lighting calculations.
 */

uniform sampler2D uHeightMap;
uniform float uDisplacementScale;

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewPosition;

void main() {
    vUv = uv;
    
    // Sample height for displacement
    float height = texture2D(uHeightMap, uv).r;
    
    // Displace vertex along normal
    vec3 displacedPosition = position + normal * height * uDisplacementScale;
    
    // Transform to world space
    vec4 worldPosition = modelMatrix * vec4(displacedPosition, 1.0);
    vWorldPosition = worldPosition.xyz;
    
    // Transform normal to world space
    vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
    
    // View space position
    vec4 viewPosition = viewMatrix * worldPosition;
    vViewPosition = viewPosition.xyz;
    
    // Final clip space position
    gl_Position = projectionMatrix * viewPosition;
}
