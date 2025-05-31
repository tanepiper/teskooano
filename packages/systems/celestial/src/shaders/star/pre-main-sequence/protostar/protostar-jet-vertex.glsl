uniform float time;
varying vec3 vNormal;
varying vec2 vUv;

void main() {
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vec3 pos = position;
    // Example: Make jets slightly expand/contract over time
    pos.xz *= (1.0 + sin(time * 0.5) * 0.1);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
} 