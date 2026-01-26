/**
 * Normal map generation from height map using Sobel filter.
 * 
 * Computes surface normals from height differences and encodes
 * them in tangent space for use in lighting calculations.
 */

precision highp float;

varying vec2 vUv;

uniform sampler2D uHeightMap;
uniform vec2 uTexelSize;     // 1.0 / resolution
uniform float uNormalStrength; // Controls normal intensity

/**
 * Calculates the surface normal at a UV position using Sobel filter.
 * 
 * The Sobel operator provides better gradient estimation than
 * simple finite differences by considering diagonal neighbors.
 */
vec3 calculateNormal(vec2 uv, vec2 texelSize, float strength) {
    // Sample heights in a 3x3 grid
    float tl = texture2D(uHeightMap, uv + vec2(-texelSize.x, texelSize.y)).r;
    float t  = texture2D(uHeightMap, uv + vec2(0.0, texelSize.y)).r;
    float tr = texture2D(uHeightMap, uv + vec2(texelSize.x, texelSize.y)).r;
    float l  = texture2D(uHeightMap, uv + vec2(-texelSize.x, 0.0)).r;
    float r  = texture2D(uHeightMap, uv + vec2(texelSize.x, 0.0)).r;
    float bl = texture2D(uHeightMap, uv + vec2(-texelSize.x, -texelSize.y)).r;
    float b  = texture2D(uHeightMap, uv + vec2(0.0, -texelSize.y)).r;
    float br = texture2D(uHeightMap, uv + vec2(texelSize.x, -texelSize.y)).r;
    
    // Sobel operator for X gradient
    // [-1  0  1]
    // [-2  0  2]
    // [-1  0  1]
    float dX = (tr + 2.0 * r + br) - (tl + 2.0 * l + bl);
    
    // Sobel operator for Y gradient
    // [ 1  2  1]
    // [ 0  0  0]
    // [-1 -2 -1]
    float dY = (tl + 2.0 * t + tr) - (bl + 2.0 * b + br);
    
    // Scale gradients
    dX *= strength;
    dY *= strength;
    
    // Construct normal vector
    // Z component ensures proper normalization
    vec3 normal = normalize(vec3(-dX, -dY, 1.0));
    
    return normal;
}

void main() {
    vec3 normal = calculateNormal(vUv, uTexelSize, uNormalStrength);
    
    // Encode normal to [0, 1] range for texture storage
    // Standard tangent-space normal map encoding
    vec3 encoded = normal * 0.5 + 0.5;
    
    gl_FragColor = vec4(encoded, 1.0);
}
