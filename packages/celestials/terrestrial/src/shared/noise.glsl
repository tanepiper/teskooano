#ifndef NOISE_GLSL
#define NOISE_GLSL

#ifndef SIMPLEX_3D_GLSL
    #include "simplex/3d"
#endif

// Basic FBM for vec3 input using Simplex Noise
float fbm(vec3 p, int octaves_param, float persistence_param, float lacunarity_param) {
    float total = 0.0;
    float frequency = 1.0;
    float amplitude = 1.0;
    float maxValue = 0.0;  // Used for normalizing result to 0.0 - 1.0

    for(int i = 0; i < octaves_param; i++) {
        // Use snoise (from included file) which returns roughly -1.0 to 1.0
        total += snoise(p * frequency) * amplitude;

        maxValue += amplitude;
        amplitude *= persistence_param;
        frequency *= lacunarity_param;
    }

    // Normalize the result to be between 0.0 and 1.0
    // snoise range is approx -1 to 1, so total range is approx -maxValue to +maxValue
    // Shift and scale to [0, 1]
    return (total / maxValue) * 0.5 + 0.5;
}

/**
 * Multi-scale layered noise for realistic terrain generation.
 * Inspired by reference implementation: combines multiple frequency scales
 * with weighted influence to create natural-looking terrain.
 * 
 * Level 1: Large continental features (low frequency, high influence)
 * Level 2: Mountain ranges and basins (medium frequency)
 * Level 3: Local terrain detail (high frequency)
 * Level 4: Fine surface detail (very high frequency, subtle influence)
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
    // Level 1: Continental scale (large features like continents/oceans)
    float level1 = fbm(p * 0.5, 2, persistence, lacunarity);
    
    // Level 2: Mountain range scale  
    float level2 = fbm(p * 2.0, 3, persistence, lacunarity);
    
    // Level 3: Local terrain detail (hills, valleys)
    float level3 = fbm(p * 8.0, max(4, octaves), persistence, lacunarity);
    
    // Level 4: Fine detail (rocks, small features)
    float level4 = fbm(p * 32.0, max(2, octaves - 2), persistence, lacunarity);
    
    // Combine with multiplicative blending (like reference implementation)
    // Each level modulates the overall height
    float result = 0.5;
    
    // Continental influence: ±continentScale from base (default 37.5%)
    result *= (1.0 + (level1 * 2.0 - 1.0) * continentScale);
    
    // Mountain range influence: ±mountainScale (default 12.5%)
    result *= (1.0 + (level2 * 2.0 - 1.0) * mountainScale);
    
    // Local detail influence: ±detailScale (default 7.5%)  
    result *= (1.0 + (level3 * 2.0 - 1.0) * detailScale);
    
    // Fine detail influence: ±fineScale (default 4%)
    result *= (1.0 + (level4 * 2.0 - 1.0) * fineScale);
    
    return clamp(result, 0.0, 1.0);
}

/**
 * Constructs a tangent space basis from a normal vector.
 * Uses Gram-Schmidt orthonormalization to avoid singularities.
 * Returns tangent and bitangent vectors.
 */
void getTangentBasis(vec3 normal, out vec3 tangent, out vec3 bitangent) {
    // Choose a vector that's not parallel to normal
    vec3 helper = abs(normal.y) < 0.999 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    
    // Gram-Schmidt orthonormalization
    tangent = normalize(helper - normal * dot(helper, normal));
    bitangent = cross(normal, tangent);
}

/**
 * Perturbs the surface normal using procedural noise gradient.
 * Uses tangent-space construction to avoid singularities and circular artifacts.
 * Tuned for smooth rolling hills rather than harsh mountainous terrain.
 * 
 * @param baseNormal The original surface normal (world space)
 * @param worldPos The world position of the fragment
 * @param bumpScale Controls the intensity of the perturbation
 * @return The perturbed normal vector
 */
vec3 perturbNormal(vec3 baseNormal, vec3 worldPos, float bumpScale) {
    // Early out if no bump
    if (bumpScale < 0.001) {
        return baseNormal;
    }
    
    // Larger epsilon = smoother gradients = gentler rolling hills
    float epsilon = 0.05;

    // Use HIGHER frequency for bump mapping (4.0x instead of 1.0x)
    // This creates more detailed terrain features
    vec3 noiseCoord = (vObjectPosition + vec3(123.456, 789.012, 345.678)) * uSimplePeriod * 4.0;

    // Use MORE octaves (up to 6) for richer detail
    int bumpOctaves = min(6, uOctaves);
    
    // Sample noise at slightly offset positions to compute gradient
    float noiseX = fbm(noiseCoord + vec3(epsilon, 0.0, 0.0), bumpOctaves, persistence, lacunarity);
    float noiseY = fbm(noiseCoord + vec3(0.0, epsilon, 0.0), bumpOctaves, persistence, lacunarity);
    float noiseZ = fbm(noiseCoord + vec3(0.0, 0.0, epsilon), bumpOctaves, persistence, lacunarity);
    float noiseHere = fbm(noiseCoord, bumpOctaves, persistence, lacunarity);

    // Compute noise gradient (direction of steepest change)
    vec3 gradient = vec3(
        (noiseX - noiseHere) / epsilon,
        (noiseY - noiseHere) / epsilon,
        (noiseZ - noiseHere) / epsilon
    );
    
    // Build tangent space basis
    vec3 tangent, bitangent;
    getTangentBasis(baseNormal, tangent, bitangent);
    
    // Project gradient onto tangent plane and scale
    // Reduced smoothing factor to allow more dynamic detail
    float smoothing = 0.9;
    float gradT = dot(gradient, tangent) * bumpScale * smoothing;
    float gradB = dot(gradient, bitangent) * bumpScale * smoothing;
    
    // Perturb normal in tangent space, then transform back
    vec3 perturbedNormal = normalize(baseNormal - tangent * gradT - bitangent * gradB);
    
    return perturbedNormal;
}

#endif