uniform float time;
uniform vec3 starColor;
uniform float coronaIntensity;
uniform float pulseSpeed;
uniform float glowIntensity;
uniform float temperatureVariation;
uniform float metallicEffect;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float turbulence(vec2 p) {
    float t = 0.0;
    float f = 1.0;
    for(int i = 0; i < 4; i++) {
        t += abs(noise(p * f) / f);
        f *= 2.0;
        p = p * 1.4 + vec2(3.2, 1.7);
    }
    return t;
}

vec3 metallicFluid(vec2 uv, float time) {

    float flowSpeed = time * 0.1;

    vec2 flowUv = uv + vec2(sin(uv.y * 8.0 + flowSpeed) * 0.05 + cos(uv.x * 4.0 + flowSpeed * 0.7) * 0.03, cos(uv.x * 6.0 + flowSpeed * 0.8) * 0.05 + sin(uv.y * 5.0 + flowSpeed * 0.9) * 0.03);

    flowUv += vec2(sin(uv.y * 20.0 + flowSpeed * 1.2) * 0.02, cos(uv.x * 15.0 + flowSpeed * 1.1) * 0.02);

    float largeScaleTurbulence = turbulence(flowUv * 1.5 + vec2(0.0, flowSpeed * 0.5));
    float smallScaleTurbulence = turbulence(flowUv * 3.0 + vec2(flowSpeed * 0.3, 0.0));
    float microTurbulence = turbulence(flowUv * 6.0 - vec2(flowSpeed * 0.2, flowSpeed * 0.1));

    float combinedTurbulence = largeScaleTurbulence * 0.5 + smallScaleTurbulence * 0.3 + microTurbulence * 0.2;

    vec3 highlight = mix(starColor * 1.3, vec3(1.0, 1.0, 0.9), 0.35);
    vec3 midtone = mix(starColor * 1.1, vec3(1.0, 0.9, 0.5), 0.2);
    vec3 shadow = mix(starColor * 0.8, vec3(0.9, 0.7, 0.3), 0.15);

    float cellPattern = smoothstep(0.4, 0.6, combinedTurbulence);

    vec3 metalColor = mix(shadow, midtone, smoothstep(0.3, 0.5, combinedTurbulence));
    metalColor = mix(metalColor, highlight, smoothstep(0.6, 0.8, combinedTurbulence));

    return metalColor;
}

void main() {

    vec3 color = starColor;

    float dist = length(vPosition);

    float turb = turbulence(vUv * 3.0 + time * 0.1);

    float surfaceDetail = smoothstep(0.2, 0.7, turb);

    vec3 viewDir = normalize(cameraPosition - vPosition);
    float viewDot = dot(normalize(vNormal), viewDir);

    float limbFactor = 0.8 + 0.2 * viewDot;

    float corona = min(1.0, 1.3 - smoothstep(0.5, 1.0, dist));

    float pulse = sin(time * pulseSpeed) * 0.08 + 0.92;

    float tempVar = sin(time * 0.15 + turb * 3.0) * temperatureVariation * 1.2;
    vec3 finalColor = mix(color, color * (1.0 + tempVar), surfaceDetail);

    vec3 metalColor = metallicFluid(vUv, time);

    finalColor = mix(finalColor, metalColor, metallicEffect * 1.5 * surfaceDetail * pulse);

    finalColor = mix(finalColor * 0.9, finalColor * 1.2, limbFactor);

    finalColor = max(finalColor, color * 0.75);

    finalColor = mix(finalColor, vec3(1.0, 0.9, 0.7), corona * coronaIntensity * 0.8);

    float glow = 1.0 - smoothstep(0.4, 1.3, dist);
    glow = pow(glow, 1.2);
    finalColor += color * glow * glowIntensity * 1.0;

    gl_FragColor = vec4(finalColor, 1.0);
}