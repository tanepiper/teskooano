uniform float uTime;
uniform vec2 uResolution;
uniform sampler2D uNoise;
varying vec2 vUv; // Added varying from vertex shader

#define MAX_STEPS 100

float sdSphere(vec3 p, float radius) {
  return length(p) - radius;
}

float noise( in vec3 x ) {
  vec3 p = floor(x);
  vec3 f = fract(x);
  f = f*f*(3.0-2.0*f);

  vec2 uv = (p.xy+vec2(37.0,239.0)*p.z) + f.xy;
  vec2 tex = textureLod(uNoise,(uv+0.5)/256.0,0.0).yx;

  return mix(tex.x, tex.y, f.z) * 2.0 - 1.0;
}

float fbm(vec3 p) {
  vec3 q = p + uTime * 0.5 * vec3(1.0, -0.2, -1.0);
  float g = noise(q); // Note: g is calculated but not used, might be a leftover?

  float f = 0.0;
  float scale = 0.5;
  float factor = 2.02;

  for (int i = 0; i < 6; i++) {
      f += scale * noise(q);
      q *= factor;
      factor += 0.21; // This changing factor seems odd, usually it's constant
      scale *= 0.5;
  }

  return f;
}

float scene(vec3 p) {
  float distance = sdSphere(p, 1.0);

  float f = fbm(p);

  // Combine distance and noise - negative distance means inside sphere
  return -distance + f;
}

const vec3 SUN_POSITION = vec3(1.0, 0.0, 0.0); // This should probably be a uniform
const float MARCH_SIZE = 0.08;

vec4 raymarch(vec3 rayOrigin, vec3 rayDirection) {
  float depth = 0.0;
  vec3 p = rayOrigin + depth * rayDirection;
  vec3 sunDirection = normalize(SUN_POSITION);

  vec4 res = vec4(0.0);

  for (int i = 0; i < MAX_STEPS; i++) {
    float density = scene(p);

    // We only draw the density if it's greater than 0
    if (density > 0.0) {
      // Directional derivative for fast diffuse lighting
      float diffuse = clamp((scene(p) - scene(p + 0.3 * sunDirection)) / 0.3, 0.0, 1.0 );
      vec3 lin = vec3(0.60,0.60,0.75) * 1.1 + 0.8 * vec3(1.0,0.6,0.3) * diffuse;
      vec4 color = vec4(mix(vec3(1.0, 1.0, 1.0), vec3(0.0, 0.0, 0.0), density), density );
      color.rgb *= lin;
      color.rgb *= color.a;
      // Alpha blending
      res += color * (1.0 - res.a);
    }

    // Step along the ray
    depth += MARCH_SIZE;
    p = rayOrigin + depth * rayDirection;

    // Early exit if alpha is close to 1 or depth is too large
    if (res.a > 0.99 || depth > 6.0) break; // Added safety break
  }

  return clamp(res, 0.0, 1.0); // Clamp result
}

void main() {
  // Using vUv passed from vertex shader instead of gl_FragCoord
  vec2 uv = vUv;
  uv -= 0.5;
  // Aspect correction - assuming uResolution holds canvas size
  uv.x *= uResolution.x / uResolution.y;

  // Ray Origin - camera (hardcoded, might need adjustment)
  vec3 ro = vec3(0.0, 0.0, 5.0);
  // Ray Direction based on UV
  vec3 rd = normalize(vec3(uv, -1.0));

  // --- Background Sky --- //
  vec3 color = vec3(0.0);
  vec3 sunDirection = normalize(SUN_POSITION); // Use same sun position
  float sun = clamp(dot(sunDirection, rd), 0.0, 1.0 );
  // Base sky color
  color = vec3(0.7,0.7,0.90);
  // Add vertical gradient
  color -= 0.8 * vec3(0.90,0.75,0.90) * rd.y;
  // Add sun color to sky
  color += 0.5 * vec3(1.0,0.5,0.3) * pow(sun, 10.0);
  // --- End Background Sky --- //

  // --- Cloud Raymarching --- //
  vec4 cloudColor = raymarch(ro, rd);

  // Combine sky and cloud
  color = mix(color, cloudColor.rgb, cloudColor.a);

  gl_FragColor = vec4(color, 1.0);
} 