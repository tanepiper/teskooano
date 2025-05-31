uniform float time;
uniform vec3 jetColor; // Color passed from the material
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    float intensity = 0.5 + 0.5 * sin(time * 2.0 + vUv.y * 10.0); // Pulsating effect along the jet
    float edgeFade = smoothstep(0.0, 0.5, vUv.x) * (1.0 - smoothstep(0.5, 1.0, vUv.x)); // Fade at horizontal edges
    edgeFade *= smoothstep(0.0, 0.2, vUv.y) * (1.0 - smoothstep(0.8, 1.0, vUv.y)); // Fade at vertical ends

    gl_FragColor = vec4(jetColor * intensity * edgeFade, intensity * edgeFade);
} 