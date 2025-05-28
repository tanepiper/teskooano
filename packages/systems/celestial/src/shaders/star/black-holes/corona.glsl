uniform float time;
uniform vec3 starColor;
uniform float opacity;
uniform float pulseSpeed;
uniform float noiseScale;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i = 0; i < 4; i++) {
        sum += noise(p * freq) * amp;
        amp *= 0.5;
        freq *= 2.0;
        p = p * 1.1 + vec2(0.5, 0.8);
    }
    return sum;
}

void main() {

    vec2 centeredUV = vUv * 2.0 - 1.0;
    float dist = length(centeredUV);

    float edgeFade = smoothstep(0.8, 1.05, dist);

    float basePattern = fbm((centeredUV * 0.5 + 0.5) * noiseScale + time * 0.03);
    float detailPattern = fbm((centeredUV * 1.2 + 0.5) * noiseScale * 2.0 + time * 0.05);
    float pattern = basePattern * 0.7 + detailPattern * 0.3;

    float pulse = 0.9 + sin(time * pulseSpeed) * 0.1;

    float alpha = (1.0 - edgeFade) * opacity * pulse * 1.2;

    alpha *= (0.6 + pattern * 0.4);

    alpha = max(alpha, 0.05 * opacity * (1.0 - edgeFade));

    vec3 innerColor = mix(starColor * 1.3, vec3(1.0, 0.95, 0.8), 0.15);
    vec3 outerColor = mix(starColor * 0.9, vec3(1.0, 0.8, 0.5), 0.25);
    vec3 finalColor = mix(innerColor, outerColor, smoothstep(0.0, 0.75, dist));

    finalColor = mix(finalColor, finalColor * (1.0 + pattern * 0.3), 0.4);

    gl_FragColor = vec4(finalColor, alpha);
}