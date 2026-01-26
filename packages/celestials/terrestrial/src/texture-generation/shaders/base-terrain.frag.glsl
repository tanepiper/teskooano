/**
 * Base terrain generation fragment shader.
 * 
 * Generates a height map using FBM noise in equirectangular projection.
 * UV coordinates are converted to 3D sphere positions for seamless noise sampling.
 */

precision highp float;

varying vec2 vUv;

// Terrain generation uniforms
uniform float uTerrainAmplitude;
uniform float uTerrainSharpness;
uniform float uTerrainOffset;
uniform float uPersistence;
uniform float uLacunarity;
uniform float uSimplePeriod;
uniform int uOctaves;
uniform float uUndulation;
uniform int uTerrainType;

// Seed offset for deterministic generation
uniform vec3 uSeedOffset;

// ============================================================================
// Simplex Noise Implementation (inline for shader independence)
// ============================================================================

vec3 mod289_3(vec3 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289_4(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
    return mod289_4(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
    return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289_3(i);
    vec4 p = permute(permute(permute(
        i.z + vec4(0.0, i1.z, i2.z, 1.0))
        + i.y + vec4(0.0, i1.y, i2.y, 1.0))
        + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// ============================================================================
// FBM and Terrain Functions
// ============================================================================

/**
 * Basic FBM for vec3 input using Simplex Noise.
 * Returns value in range [0, 1].
 */
float fbm(vec3 p, int octaves_param, float persistence_param, float lacunarity_param) {
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;

    for (int i = 0; i < 16; i++) {
        if (i >= octaves_param) break;
        total += snoise(p * frequency) * amplitude;
        maxValue += amplitude;
        amplitude *= persistence_param;
        frequency *= lacunarity_param;
    }

    return (total / maxValue) * 0.5 + 0.5;
}

/**
 * Multi-scale layered noise for realistic terrain generation.
 */
float layeredNoise(
    vec3 p, 
    float persistence, 
    float lacunarity, 
    int octaves,
    float continentScale,
    float mountainScale,
    float detailScale,
    float fineScale
) {
    // Level 1: Continental scale
    float level1 = fbm(p * 0.5, 2, persistence, lacunarity);
    
    // Level 2: Mountain range scale  
    float level2 = fbm(p * 2.0, 3, persistence, lacunarity);
    
    // Level 3: Local terrain detail
    float level3 = fbm(p * 8.0, max(4, octaves), persistence, lacunarity);
    
    // Level 4: Fine detail
    float level4 = fbm(p * 32.0, max(2, octaves - 2), persistence, lacunarity);
    
    // Combine with multiplicative blending
    float result = 0.5;
    result *= (1.0 + (level1 * 2.0 - 1.0) * continentScale);
    result *= (1.0 + (level2 * 2.0 - 1.0) * mountainScale);
    result *= (1.0 + (level3 * 2.0 - 1.0) * detailScale);
    result *= (1.0 + (level4 * 2.0 - 1.0) * fineScale);
    
    return clamp(result, 0.0, 1.0);
}

/**
 * Fractal noise with sharpness control.
 */
float fractal3(
    vec3 v,
    float sharpness,
    float period,
    float persistence,
    float lacunarity,
    int octaves
) {
    float n = 0.0;
    float a = 1.0;
    float max_amp = 0.0;
    float P = period;

    for (int i = 0; i < 16; i++) {
        if (i >= octaves) break;
        n += a * snoise(v / P);
        a *= persistence;
        max_amp += a;
        P /= lacunarity;
    }

    return n / max_amp;
}

/**
 * Calculate terrain height based on type.
 */
float terrainHeight(
    int type,
    vec3 v,
    float amplitude,
    float sharpness,
    float offset,
    float period,
    float persistence,
    float lacunarity,
    int octaves,
    float undulation
) {
    float h = 0.0;
    
    // Calculate undulation
    float undulationFactor = (
        sin(v.x * 0.2) * cos(v.z * 0.2) * undulation * 0.5 +
        sin(v.x * 0.1) * cos(v.z * 0.1) * undulation * 0.3 +
        sin(v.x * 0.05) * cos(v.z * 0.05) * undulation * 0.2
    );

    if (type == 1) {
        // Simple noise
        h = amplitude * snoise(v / period);
    } else if (type == 2) {
        // Sharp peaks
        h = amplitude * fractal3(v, sharpness, period, persistence, lacunarity, octaves);
        h = amplitude * pow(max(0.0, (h + 1.0) / 2.0), sharpness);
    } else if (type == 3) {
        // Sharp valleys
        h = fractal3(v, sharpness, period, persistence, lacunarity, octaves);
        h = amplitude * pow(max(0.0, 1.0 - abs(h)), sharpness);
    } else if (type == 4) {
        // Multi-scale layered terrain
        float continentScale = 0.75 * amplitude;
        float mountainScale = 0.25 * amplitude;
        float detailScale = 0.075 * amplitude;
        float fineScale = 0.04 * amplitude;
        
        h = layeredNoise(
            v / period, 
            persistence, 
            lacunarity, 
            octaves,
            continentScale,
            mountainScale,
            detailScale,
            fineScale
        );
    }

    return max(0.0, h + offset + undulationFactor);
}

// ============================================================================
// Main
// ============================================================================

/**
 * Convert equirectangular UV to 3D sphere position.
 */
vec3 uvToSphere(vec2 uv) {
    float theta = uv.x * 2.0 * 3.14159265359;        // Longitude: 0 to 2π
    float phi = (1.0 - uv.y) * 3.14159265359;        // Latitude: π to 0 (top to bottom)
    
    return vec3(
        sin(phi) * cos(theta),
        cos(phi),
        sin(phi) * sin(theta)
    );
}

void main() {
    // Convert UV to 3D sphere position for seamless noise
    vec3 spherePos = uvToSphere(vUv);
    
    // Apply seed offset for deterministic variation
    vec3 noiseCoord = (spherePos + uSeedOffset) * uSimplePeriod;
    
    // Calculate terrain height
    float height = terrainHeight(
        uTerrainType,
        noiseCoord,
        uTerrainAmplitude,
        uTerrainSharpness,
        uTerrainOffset,
        uSimplePeriod,
        uPersistence,
        uLacunarity,
        uOctaves,
        uUndulation
    );
    
    // Normalize to [0, 1] range
    height = clamp(height, 0.0, 1.0);
    
    // Output height in all channels for compatibility
    gl_FragColor = vec4(height, height, height, 1.0);
}
