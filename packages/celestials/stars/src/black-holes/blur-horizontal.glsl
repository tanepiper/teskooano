// Horizontal Gaussian blur
#include <common>
#include <logdepthbuf_pars_fragment>

uniform sampler2D tDiffuse;
uniform float blurSize;
varying vec2 vUv;

void main() {
  vec4 sum = vec4(0.0);
  sum += texture2D(tDiffuse, vUv + vec2(-4.0 * blurSize, 0.0)) * 0.05;
  sum += texture2D(tDiffuse, vUv + vec2(-3.0 * blurSize, 0.0)) * 0.09;
  sum += texture2D(tDiffuse, vUv + vec2(-2.0 * blurSize, 0.0)) * 0.12;
  sum += texture2D(tDiffuse, vUv + vec2(-1.0 * blurSize, 0.0)) * 0.15;
  sum += texture2D(tDiffuse, vUv) * 0.16;
  sum += texture2D(tDiffuse, vUv + vec2(1.0 * blurSize, 0.0)) * 0.15;
  sum += texture2D(tDiffuse, vUv + vec2(2.0 * blurSize, 0.0)) * 0.12;
  sum += texture2D(tDiffuse, vUv + vec2(3.0 * blurSize, 0.0)) * 0.09;
  sum += texture2D(tDiffuse, vUv + vec2(4.0 * blurSize, 0.0)) * 0.05;
  gl_FragColor = sum;

  #include <logdepthbuf_fragment>
} 