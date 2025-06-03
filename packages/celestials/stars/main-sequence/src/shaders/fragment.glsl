#include "../common/star_noise.glsl" // Include FBM noise

uniform float uTime;
uniform vec3 uStarColor;
uniform float uCoronaIntensity;
uniform float uPulseSpeed;
uniform float uGlowIntensity;
uniform float uTemperatureVariation;
uniform float uMetallicEffect;
uniform float uNoiseEvolutionSpeed; // Added uniform
uniform float uTimeOffset;          // Added uniform

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

// complexNoise now takes spatial position and time value separately
// It combines them before calling fbm, e.g., by adding time to z-component
float complexNoise(vec3 spatial_pos, float time_val) {
    return fbm(spatial_pos + vec3(0.0, 0.0, time_val), 4, 0.5, 2.0);
}

// turbulence uses the modified complexNoise
float turbulence(vec3 pos, float time_val_for_evolution) {
    float t = 0.0;
    float f = 1.0;
    vec3 p_loop = pos;
    for(int i = 0; i < 4; i++) {
        t += abs(complexNoise(p_loop * f, time_val_for_evolution * f) / f);
        f *= 2.0;
        p_loop = p_loop * 1.4 + vec3(3.2, 1.7, 0.8);
    }
    return t;
}

// Updated metallicFluid to use 3D position-based turbulence
vec3 metallicFluid(vec3 pos, float current_time) {
    float flowSpeed = current_time * 0.1;
    float noise_time_component = (current_time + uTimeOffset) * uNoiseEvolutionSpeed;

    vec3 flowPos = pos + vec3(sin(pos.y * 8.0 + flowSpeed) * 0.05 + cos(pos.x * 4.0 + flowSpeed * 0.7) * 0.03,
                               cos(pos.x * 6.0 + flowSpeed * 0.8) * 0.05 + sin(pos.y * 5.0 + flowSpeed * 0.9) * 0.03,
                               sin(pos.z * 7.0 + flowSpeed * 0.6) * 0.04);

    flowPos += vec3(sin(pos.y * 20.0 + flowSpeed * 1.2) * 0.02, 
                    cos(pos.x * 15.0 + flowSpeed * 1.1) * 0.02,
                    sin(pos.z * 18.0 + flowSpeed * 1.0) * 0.015);

    float largeScaleTurbulence = turbulence(flowPos * 1.5 + vec3(0.0, flowSpeed * 0.5, 0.0), noise_time_component);
    float smallScaleTurbulence = turbulence(flowPos * 3.0 + vec3(flowSpeed * 0.3, 0.0, flowSpeed * 0.1), noise_time_component);
    float microTurbulence = turbulence(flowPos * 6.0 - vec3(flowSpeed * 0.2, flowSpeed * 0.1, 0.0), noise_time_component);

    float combinedTurbulence = largeScaleTurbulence * 0.5 + smallScaleTurbulence * 0.3 + microTurbulence * 0.2;

    vec3 highlight = mix(uStarColor * 1.3, vec3(1.0, 1.0, 0.9), 0.35);
    vec3 midtone = mix(uStarColor * 1.1, vec3(1.0, 0.9, 0.5), 0.2);
    vec3 shadow = mix(uStarColor * 0.8, vec3(0.9, 0.7, 0.3), 0.15);

    // float cellPattern = smoothstep(0.4, 0.6, combinedTurbulence); // This was unused in the original main sequence shader

    vec3 metalColor = mix(shadow, midtone, smoothstep(0.3, 0.5, combinedTurbulence));
    metalColor = mix(metalColor, highlight, smoothstep(0.6, 0.8, combinedTurbulence));

    return metalColor;
}

void main() {
    vec3 color = uStarColor;
    float dist = length(vPosition);

    // Use vPosition and new time component for turbulence
    float surface_noise_time_component = (uTime + uTimeOffset) * uNoiseEvolutionSpeed;
    float turb = turbulence(vPosition * 0.1, surface_noise_time_component); // Scale vPosition as needed

    float surfaceDetail = smoothstep(0.2, 0.7, turb);

    vec3 viewDir = normalize(cameraPosition - vPosition);
    float viewDot = dot(normalize(vNormal), viewDir);

    float limbFactor = 0.8 + 0.2 * viewDot;

    float corona_val = min(1.0, 1.3 - smoothstep(0.5, 1.0, dist)); // Renamed to avoid conflict if corona.glsl is included and defines 'corona'

    float pulse = sin(uTime * uPulseSpeed) * 0.08 + 0.92;

    float tempVar = sin(uTime * 0.15 + turb * 3.0) * uTemperatureVariation * 1.2;
    vec3 finalColor = mix(color, color * (1.0 + tempVar), surfaceDetail);

    // Pass vPosition (scaled) and time to metallicFluid
    vec3 metalColor = metallicFluid(vPosition * 0.1, uTime); // Scale vPosition as needed

    finalColor = mix(finalColor, metalColor, uMetallicEffect * 1.5 * surfaceDetail * pulse);

    finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), corona_val * uCoronaIntensity * 0.8);

    float glow = 1.0 - smoothstep(0.4, 1.3, dist);
    glow = pow(glow, 1.2);
    finalColor += color * glow * uGlowIntensity * 1.0;

    gl_FragColor = vec4(finalColor, 1.0);
} 