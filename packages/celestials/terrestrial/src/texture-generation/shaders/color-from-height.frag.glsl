/**
 * Color map generation from height map using 5-color palette.
 * 
 * Maps height values to colors using the existing Teskooano
 * height-based color gradient system with smooth transitions.
 */

precision highp float;

varying vec2 vUv;

uniform sampler2D uHeightMap;

// Color palette (5 colors)
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
uniform vec3 uColor4;
uniform vec3 uColor5;

// Height thresholds for color transitions
uniform float uHeight1;
uniform float uHeight2;
uniform float uHeight3;
uniform float uHeight4;
uniform float uHeight5;

// Optional slope-based color variation
uniform vec2 uTexelSize;
uniform float uSlopeColorInfluence; // How much slope affects color (0-1)
uniform vec3 uSlopeColor;           // Color to blend for steep areas

/**
 * Calculates slope magnitude for color variation.
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

void main() {
    float height = texture2D(uHeightMap, vUv).r;
    
    // Build color array
    vec3 colors[5];
    colors[0] = uColor1;
    colors[1] = uColor2;
    colors[2] = uColor3;
    colors[3] = uColor4;
    colors[4] = uColor5;
    
    float heights[5];
    heights[0] = uHeight1;
    heights[1] = uHeight2;
    heights[2] = uHeight3;
    heights[3] = uHeight4;
    heights[4] = uHeight5;
    
    // Start with lowest color
    vec3 color = colors[0];
    
    // Blend through height levels
    for (int i = 1; i < 5; i++) {
        float prevHeight = heights[i - 1];
        float currHeight = heights[i];
        float blendFactor = smoothstep(prevHeight, currHeight, height);
        color = mix(color, colors[i], blendFactor);
    }
    
    // Apply slope-based color variation (optional)
    if (uSlopeColorInfluence > 0.0) {
        float slope = calculateSlope(vUv, uTexelSize);
        float slopeFactor = smoothstep(0.0, 0.5, slope) * uSlopeColorInfluence;
        color = mix(color, uSlopeColor, slopeFactor);
    }
    
    gl_FragColor = vec4(color, 1.0);
}
