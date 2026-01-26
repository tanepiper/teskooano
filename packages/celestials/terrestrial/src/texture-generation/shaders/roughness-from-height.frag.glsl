/**
 * Roughness map generation from height map.
 * 
 * Derives roughness values from terrain slope and local variation.
 * Steep slopes and high-frequency detail produce higher roughness.
 */

precision highp float;

varying vec2 vUv;

uniform sampler2D uHeightMap;
uniform vec2 uTexelSize;
uniform float uBaseRoughness;     // Base roughness level (0-1)
uniform float uSlopeInfluence;    // How much slope affects roughness (0-1)
uniform float uVariationInfluence; // How much local variation affects roughness (0-1)

/**
 * Calculates the slope magnitude at a position.
 */
float calculateSlope(vec2 uv, vec2 texelSize) {
    float l = texture2D(uHeightMap, uv + vec2(-texelSize.x, 0.0)).r;
    float r = texture2D(uHeightMap, uv + vec2(texelSize.x, 0.0)).r;
    float t = texture2D(uHeightMap, uv + vec2(0.0, texelSize.y)).r;
    float b = texture2D(uHeightMap, uv + vec2(0.0, -texelSize.y)).r;
    
    float dX = (r - l) / (2.0 * texelSize.x);
    float dY = (t - b) / (2.0 * texelSize.y);
    
    return sqrt(dX * dX + dY * dY);
}

/**
 * Calculates local height variation (roughness indicator).
 */
float calculateVariation(vec2 uv, vec2 texelSize) {
    float center = texture2D(uHeightMap, uv).r;
    float variation = 0.0;
    
    // Sample in a 3x3 neighborhood
    for (float y = -1.0; y <= 1.0; y += 1.0) {
        for (float x = -1.0; x <= 1.0; x += 1.0) {
            if (x == 0.0 && y == 0.0) continue;
            float heightSample = texture2D(uHeightMap, uv + vec2(x, y) * texelSize).r;
            variation += abs(heightSample - center);
        }
    }
    
    return variation / 8.0; // Normalize by number of samples
}

void main() {
    float slope = calculateSlope(vUv, uTexelSize);
    float variation = calculateVariation(vUv, uTexelSize);
    
    // Combine factors
    // Steep slopes = higher roughness (more rocky/uneven)
    float slopeRoughness = smoothstep(0.0, 0.5, slope);
    
    // High local variation = higher roughness (more detail)
    float variationRoughness = smoothstep(0.0, 0.1, variation);
    
    // Combine with base roughness
    float roughness = uBaseRoughness;
    roughness += slopeRoughness * uSlopeInfluence;
    roughness += variationRoughness * uVariationInfluence;
    
    // Clamp to valid range
    roughness = clamp(roughness, 0.0, 1.0);
    
    gl_FragColor = vec4(roughness, roughness, roughness, 1.0);
}
