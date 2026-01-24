#include <common>
#include <logdepthbuf_pars_vertex>

varying vec2 vUv;
varying vec3 vWorldPosition;
varying vec3 vWorldNormal;
varying vec3 vObjectPosition;
varying vec3 vViewPosition;
varying vec3 vViewNormal;

void main() {
  vUv = uv;

  // --- Basic Transformations ONLY --- 
  vec3 objectSpacePosition = position;
  vec3 objectSpaceNormal = normalize(normal);
  vObjectPosition = normalize(objectSpacePosition);

  vWorldPosition = (modelMatrix * vec4(objectSpacePosition, 1.0)).xyz;
  vWorldNormal = normalize((modelMatrix * vec4(objectSpaceNormal, 0.0)).xyz);
  
  vViewPosition = (modelViewMatrix * vec4(objectSpacePosition, 1.0)).xyz;
  vViewNormal = normalize(normalMatrix * objectSpaceNormal);

  // Standard MVP transformation
  gl_Position = projectionMatrix * modelViewMatrix * vec4(objectSpacePosition, 1.0);
  
  #include <logdepthbuf_vertex>
}