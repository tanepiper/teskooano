#ifndef TERRAIN_GLSL
#define TERRAIN_GLSL

#ifndef SIMPLEX_3D_GLSL 
    #include "simplex/3d"
#endif

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

    for(int i = 0; i < octaves; i++) {
        n += a * snoise(v / P);
        a *= persistence;
        max_amp += a;
        P /= lacunarity;
    }

    return n / max_amp;
}

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
    // Calculate undulation using multiple frequencies for more complex terrain variation
    float undulationFactor = (
        sin(v.x * 0.2) * cos(v.z * 0.2) * undulation * 0.5 +
        sin(v.x * 0.1) * cos(v.z * 0.1) * undulation * 0.3 +
        sin(v.x * 0.05) * cos(v.z * 0.05) * undulation * 0.2
    );

    if(type == 1) {
        h = amplitude * snoise(v / period);
    } else if(type == 2) {
        h = amplitude * fractal3(v, sharpness, period, persistence, lacunarity, octaves);
        h = amplitude * pow(max(0.0, (h + 1.0) / 2.0), sharpness);
    } else if(type == 3) {
        h = fractal3(v, sharpness, period, persistence, lacunarity, octaves);
        h = amplitude * pow(max(0.0, 1.0 - abs(h)), sharpness);
    }

    return max(0.0, h + offset + undulationFactor);
}

#endif
