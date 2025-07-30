#include <common>
#include <logdepthbuf_pars_vertex>

varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vViewDirection;
varying vec2 vUv; // UV coordinates for texture mapping

void main() {
  vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  vWorldNormal = normalize((modelMatrix * vec4(normal, 0.0)).xyz);
  vViewDirection = normalize(cameraPosition - vWorldPosition);
  vUv = uv; // Pass UV coordinates to fragment shader
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

  #include <logdepthbuf_vertex>
} 