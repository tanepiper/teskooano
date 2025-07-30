// Enhanced Star Vertex Shader
// Supports dynamic plasma effects, sunspots, and stellar phenomena

#include <common>
#include <logdepthbuf_pars_vertex>

uniform float uTime;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    
    #include <logdepthbuf_vertex>
}