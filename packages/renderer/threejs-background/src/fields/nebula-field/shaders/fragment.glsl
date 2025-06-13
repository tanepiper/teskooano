/**
 * @file fragment.glsl
 * @description
 * This shader generates a procedural nebula effect inspired by the appearance of
 * cosmic gas clouds and stellar nurseries (like the Carina or Orion nebulas).
 * It uses multiple layers of 3D Simplex noise (via Fractional Brownian Motion)
 * to create a sense of depth, structure, and detail.
 *
 * The process involves:
 * 1. Defining a base structure with low-frequency noise to create large "cliff" or "pillar" shapes.
 * 2. Layering high-frequency, distorted noise on top to simulate swirling gas and fine details.
 * 3. Using the noise values to blend between a palette of 6 colors, creating a rich, multi-hued appearance.
 * 4. Adding a bright "rim light" effect to the edges of the main structures.
 * 5. Calculating a final density value to control the transparency, making some areas opaque and others wispy.
 */

// An array of 6 colors that define the nebula's palette.
uniform vec3 uColors[6];
// A time uniform to drive subtle animation in the noise. Not currently used but available.
uniform float uTime;
// The overall alpha (transparency) of the nebula.
uniform float uAlpha;

// --- Noise Configuration ---
// The overall scale of the noise pattern.
uniform float uNoiseScale;
// The number of noise layers to combine for detail.
uniform int uNoiseOctaves;
// The rate at which the amplitude of noise octaves decreases.
uniform float uNoisePersistence;
// The rate at which the frequency of noise octaves increases.
uniform float uNoiseLacunarity;
// A seed value to create different random patterns.
uniform float uNoiseSeed;

// The world position of the fragment, passed from the vertex shader.
varying vec3 vWorldPosition;

// -----------------------------------------------------------------------------
// 3D Simplex Noise, by Stefan Gustavson
// Source: https://github.com/stegu/webgl-noise/blob/master/src/classicnoise3D.glsl
// (The snoise and fbm functions remain unchanged from the original source)
// -----------------------------------------------------------------------------

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

// Fractional Brownian Motion (fbm) sums multiple layers (octaves) of noise
// to create a more detailed and natural-looking pattern.
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

// -----------------------------------------------------------------------------
// Main Shader Logic
// -----------------------------------------------------------------------------

void main() {
    // Offset the position by the seed to vary the noise pattern instance.
    vec3 base_pos = vWorldPosition / uNoiseScale + uNoiseSeed;

    // STEP 1: Create the large, low-frequency structure of the nebula.
    // This forms the main "cliffs" or "pillars" that define the overall shape.
    float main_structure = fbm(base_pos * 0.1, 4, 0.5, 2.0);
    // Create a smooth mask from this structure. This will be used to blend
    // between empty space and the nebula clouds.
    float cliff_mask = smoothstep(0.1, 0.4, main_structure);

    // STEP 2: Create detailed, swirling noise to simulate turbulent gas.
    // This is done by displacing the texture coordinates with multiple layers of noise
    // (domain warping). This creates the characteristic "swirly" look.
    vec3 q = vec3(fbm(base_pos, uNoiseOctaves, uNoisePersistence, uNoiseLacunarity),
                  fbm(base_pos + vec3(5.2, 1.3, 8.4), uNoiseOctaves, uNoisePersistence, uNoiseLacunarity),
                  fbm(base_pos + vec3(9.1, 3.7, 2.5), uNoiseOctaves, uNoisePersistence, uNoiseLacunarity));

    vec3 r = vec3(fbm(base_pos + q * 0.5, uNoiseOctaves, uNoisePersistence, uNoiseLacunarity),
                  fbm(base_pos + q * 0.8 + vec3(1.7, 9.2, 6.3), uNoiseOctaves, uNoisePersistence, uNoiseLacunarity),
                  fbm(base_pos + q * 1.2 + vec3(8.3, 2.8, 4.2), uNoiseOctaves, uNoisePersistence, uNoiseLacunarity));

    float detail_noise = fbm(base_pos + r, uNoiseOctaves, uNoisePersistence, uNoiseLacunarity);

    // STEP 3: Define the color palette within the cliffs using the detail noise.
    // Blend from the dark base color (uColors[1]) to the main mid-tone (uColors[2]).
    vec3 cliff_color = mix(uColors[1], uColors[2], smoothstep(0.2, 0.6, detail_noise));
    // Blend in the brightest highlight color (uColors[3]).
    cliff_color = mix(cliff_color, uColors[3], smoothstep(0.5, 0.8, detail_noise));

    // STEP 4: Add a bright "rim light" to the edges of the main structure.
    // This is achieved by isolating a thin band of the `main_structure` noise.
    float edge = smoothstep(0.1, 0.11, main_structure) - smoothstep(0.11, 0.12, main_structure);
    // Add the rim light color (uColors[4]), making it quite bright.
    cliff_color += edge * uColors[4] * 2.0;

    // STEP 5: Blend between the deep space color and the detailed cliff color.
    // The `cliff_mask` created in Step 1 controls this blend.
    vec3 final_color = mix(uColors[0], cliff_color, cliff_mask);

    // STEP 6: Calculate the final density/alpha for the fragment.
    // The density is based on the cliff mask and the detail noise, making the
    // clouds feel voluminous.
    float density = cliff_mask * (detail_noise * 0.8 + 0.2);
    // Make the rim light area more opaque to make it glow.
    density += edge * 0.5;
    // Square the density to make the falloff sharper.
    density = pow(density, 2.0);

    // Set the final fragment color, applying the global alpha.
    gl_FragColor = vec4(final_color, density * uAlpha);
} 