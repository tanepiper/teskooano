
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

// ADDED: Function to perturb normal based on noise gradient
vec3 perturbNormal(vec3 baseNormal, vec3 worldPos, float bumpScale) {
    float epsilon = 0.01; // Small offset for sampling gradient

    // Calculate noise coordinate (same as in main)
    vec3 noiseCoord = vObjectPosition * uSimplePeriod;

    // Sample noise at slightly offset positions
    float noiseX = fbm(noiseCoord + vec3(epsilon, 0.0, 0.0), uOctaves, persistence, lacunarity);
    float noiseY = fbm(noiseCoord + vec3(0.0, epsilon, 0.0), uOctaves, persistence, lacunarity);
    float noiseZ = fbm(noiseCoord + vec3(0.0, 0.0, epsilon), uOctaves, persistence, lacunarity);
    float noiseHere = fbm(noiseCoord, uOctaves, persistence, lacunarity);

    // Approximate gradient (how noise changes in each direction)
    vec3 gradient = vec3((noiseX - noiseHere) / epsilon, (noiseY - noiseHere) / epsilon, (noiseZ - noiseHere) / epsilon);

    // Project gradient onto the tangent plane (remove component along the normal)
    gradient -= dot(gradient, baseNormal) * baseNormal;

    // Perturb the normal using the gradient and scale
    vec3 perturbedNormal = normalize(baseNormal + gradient * bumpScale);

    return perturbedNormal;
}

#endif