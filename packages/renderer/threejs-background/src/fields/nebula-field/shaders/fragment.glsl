uniform vec3 uColors[6];
uniform float uTime;
uniform float uAlpha;

uniform float uNoiseScale;
uniform int uNoiseOctaves;
uniform float uNoisePersistence;
uniform float uNoiseLacunarity;
uniform float uNoiseSeed;

varying vec3 vWorldPosition;

// 3D Simplex Noise, by Stefan Gustavson
// https://github.com/stegu/webgl-noise/blob/master/src/classicnoise3D.glsl

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  // Permutations
  i = mod289(i);
  vec4 p = permute(permute(permute(
             i.z + vec4(0.0, i1.z, i2.z, 1.0))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0))
           + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}

// Fractional Brownian Motion
float fbm(vec3 p, int octaves, float persistence, float lacunarity) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    for (int i = 0; i < octaves; i++) {
        value += amplitude * abs(snoise(p * frequency));
        frequency *= lacunarity;
        amplitude *= persistence;
    }
    return value;
}

void main() {
    vec3 base_pos = vWorldPosition / uNoiseScale + uNoiseSeed;

    // 1. Create the main cliff structure with low-frequency noise
    float main_structure = fbm(base_pos * 0.1, 4, 0.5, 2.0);
    float cliff_mask = smoothstep(0.1, 0.4, main_structure);

    // 2. Create detailed, swirling noise for the gas clouds
    vec3 q = vec3(fbm(base_pos, uNoiseOctaves, uNoisePersistence, uNoiseLacunarity),
                  fbm(base_pos + vec3(5.2, 1.3, 8.4), uNoiseOctaves, uNoisePersistence, uNoiseLacunarity),
                  fbm(base_pos + vec3(9.1, 3.7, 2.5), uNoiseOctaves, uNoisePersistence, uNoiseLacunarity));

    vec3 r = vec3(fbm(base_pos + q * 0.5, uNoiseOctaves, uNoisePersistence, uNoiseLacunarity),
                  fbm(base_pos + q * 0.8 + vec3(1.7, 9.2, 6.3), uNoiseOctaves, uNoisePersistence, uNoiseLacunarity),
                  fbm(base_pos + q * 1.2 + vec3(8.3, 2.8, 4.2), uNoiseOctaves, uNoisePersistence, uNoiseLacunarity));

    float detail_noise = fbm(base_pos + r, uNoiseOctaves, uNoisePersistence, uNoiseLacunarity);

    // 3. Define the color palette within the cliffs
    vec3 cliff_color = mix(uColors[1], uColors[2], smoothstep(0.2, 0.6, detail_noise)); // Brown to Orange
    cliff_color = mix(cliff_color, uColors[3], smoothstep(0.5, 0.8, detail_noise)); // Orange to Yellow

    // 4. Add rim lighting on the edge of the cliffs
    float edge = smoothstep(0.1, 0.11, main_structure) - smoothstep(0.11, 0.12, main_structure);
    cliff_color += edge * uColors[4] * 2.0; // Bright highlight color

    // 5. Blend between deep space blue and the detailed cliff color
    vec3 final_color = mix(uColors[0], cliff_color, cliff_mask);

    // 6. Calculate density
    float density = cliff_mask * (detail_noise * 0.8 + 0.2);
    density += edge * 0.5; // Make the edge glow
    density = pow(density, 2.0);

    gl_FragColor = vec4(final_color, density * uAlpha);
} 