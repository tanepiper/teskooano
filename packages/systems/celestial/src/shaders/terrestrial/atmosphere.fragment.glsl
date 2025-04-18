// Atmospheric scattering shader adapted from GLtracy's implementation
// Enhanced with cloud-like patterns and atmospheric detail

uniform vec3 atmosphereColor;
uniform float atmosphereOpacity;
uniform float time;
// cameraPosition is a built-in THREE.js uniform, no need to declare it
uniform vec3 sunPosition;

varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vViewDirection;

// Constants for the atmospheric scattering
const float PI = 3.14159265359;
const float MAX = 10000.0;

// Planet radius and atmosphere thickness
const float R_INNER = 1.0;     // Planet radius (normalized)
const float R = R_INNER + 0.45; // Atmosphere shell thickness

// Scattering sample counts - can be adjusted for performance
const int NUM_OUT_SCATTER = 8;
const int NUM_IN_SCATTER = 40;

// Simplex 3D Noise function
// Credit: Ian McEwan, Ashima Arts
vec4 permute(vec4 x) { return mod(((x*34.0)+1.0)*x, 289.0); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) { 
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + 1.0 * C.xxx;
  vec3 x2 = x0 - i2 + 2.0 * C.xxx;
  vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

  // Permutations
  i = mod(i, 289.0); 
  vec4 p = permute(permute(permute( 
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
          + i.y + vec4(0.0, i1.y, i2.y, 1.0)) 
          + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  // Gradients
  float n_ = 1.0/7.0; // N=7
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z *ns.z);  //  mod(p,N*N)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  // Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Ray vs sphere intersection calculation
vec2 ray_vs_sphere(vec3 p, vec3 dir, float r) {
    float b = dot(p, dir);
    float c = dot(p, p) - r * r;
    
    float d = b * b - c;
    if (d < 0.0) {
        return vec2(MAX, -MAX);
    }
    d = sqrt(d);
    
    return vec2(-b - d, -b + d);
}

// Mie scattering phase function
float phase_mie(float g, float c, float cc) {
    float gg = g * g;
    
    float a = (1.0 - gg) * (1.0 + cc);
    float b = 1.0 + gg - 2.0 * g * c;
    b *= sqrt(b);
    b *= 2.0 + gg;    
    
    return (3.0 / 8.0 / PI) * a / b;
}

// Rayleigh scattering phase function
float phase_ray(float cc) {
    return (3.0 / 16.0 / PI) * (1.0 + cc);
}

// Density calculation for altitude with cloud-like detail
float density(vec3 p, float ph) {
    float len = length(p);
    float baseHeight = len - R_INNER;
    float height01 = baseHeight / (R - R_INNER); // normalized 0-1 height in atmosphere
    
    // Base exponential atmosphere density falloff
    float baseDensity = exp(-max(len - R_INNER, 0.0) / ph);
    
    // Add cloud-like patterns using noise
    // Scale adjusted for atmosphere size
    float scale1 = 2.0;
    float scale2 = 8.0;
    float cloudPattern = 0.0;
    
    // Only apply noise to certain height bands for cloud-like layers
    if (height01 > 0.2 && height01 < 0.8) {
        // Rotate noise over time for subtle movement
        float timeScale = time * 0.05;
        mat3 rotMat = mat3(
            cos(timeScale), 0.0, sin(timeScale),
            0.0, 1.0, 0.0,
            -sin(timeScale), 0.0, cos(timeScale)
        );
        
        vec3 rotatedPos = rotMat * p;
        
        // Layer multiple noise frequencies
        cloudPattern = snoise(rotatedPos * scale1 + vec3(0.0, 0.0, timeScale)) * 0.5 + 0.5;
        cloudPattern += snoise(rotatedPos * scale2 + vec3(timeScale, 0.0, 0.0)) * 0.25 + 0.25;
        
        // Create more defined bands/layers
        float bandPattern = sin(height01 * 6.0 * PI) * 0.5 + 0.5;
        cloudPattern *= bandPattern;
        
        // Add variation near poles for more realistic atmospheric bands
        float latitudeBands = sin(acos(p.y / len) * 4.0) * 0.5 + 0.5;
        cloudPattern *= mix(0.7, 1.0, latitudeBands);
        
        // Only add variations to density, don't entirely remove atmosphere
        cloudPattern = mix(0.7, 1.0, cloudPattern);
    }
    
    return baseDensity * cloudPattern;
}

// Optical depth calculation 
float optic(vec3 p, vec3 q, float ph) {
    vec3 s = (q - p) / float(NUM_OUT_SCATTER);
    vec3 v = p + s * 0.5;
    
    float sum = 0.0;
    for (int i = 0; i < NUM_OUT_SCATTER; i++) {
        sum += density(v, ph);
        v += s;
    }
    sum *= length(s);
    
    return sum;
}

// Main in-scattering calculation
vec3 in_scatter(vec3 o, vec3 dir, vec2 e, vec3 l) {
    // Scattering coefficients - increased for more visibility
    const float ph_ray = 0.09; // Increased from 0.07
    const float ph_mie = 0.05; // Increased from 0.035
    
    // Color coefficients - increased for stronger effect
    const vec3 k_ray = vec3(5.0, 15.0, 40.0); // Increased for stronger blue
    const vec3 k_mie = vec3(25.0); // Increased for stronger scattering
    const float k_mie_ex = 1.1; // Mie extinction factor
    
    vec3 sum_ray = vec3(0.0);
    vec3 sum_mie = vec3(0.0);
    
    float n_ray0 = 0.0;
    float n_mie0 = 0.0;
    
    float len = (e.y - e.x) / float(NUM_IN_SCATTER);
    vec3 s = dir * len;
    vec3 v = o + dir * (e.x + len * 0.5);
    
    for (int i = 0; i < NUM_IN_SCATTER; i++, v += s) {   
        float d_ray = density(v, ph_ray) * len;
        float d_mie = density(v, ph_mie) * len;
        
        n_ray0 += d_ray;
        n_mie0 += d_mie;
        
        // Skip occluded samples
        vec2 f = ray_vs_sphere(v, l, R);
        vec3 u = v + l * f.y;
        
        float n_ray1 = optic(v, u, ph_ray);
        float n_mie1 = optic(v, u, ph_mie);
        
        vec3 att = exp(-(n_ray0 + n_ray1) * k_ray - (n_mie0 + n_mie1) * k_mie * k_mie_ex);
        
        sum_ray += d_ray * att;
        sum_mie += d_mie * att;
    }
    
    float c = dot(dir, -l);
    float cc = c * c;
    vec3 scatter =
        sum_ray * k_ray * phase_ray(cc) +
        sum_mie * k_mie * phase_mie(-0.75, c, cc);
    
    return 16.0 * scatter; // Increased from 12.0 for brighter effect
}

// Fresnel rim calculation for edge glow
float fresnel(vec3 normal, vec3 viewDir, float power) {
    float fresnelFactor = abs(dot(normal, viewDir));
    float inverseFresnelFactor = 1.0 - fresnelFactor;
    return pow(inverseFresnelFactor, power);
}

void main() {
    // Normalized view direction
    vec3 viewDir = normalize(vViewDirection);
    
    // Sun direction from camera (in view direction terms)
    vec3 sunDir = normalize(sunPosition - vec3(0.0, 0.0, 0.0));
    
    // Our position in the atmosphere model
    vec3 eye = vec3(0.0, 0.0, 3.0); // Outside the atmosphere
    
    // Calculate ray intersections with atmosphere
    vec2 e = ray_vs_sphere(eye, viewDir, R);
    
    // If ray doesn't hit atmosphere, discard the fragment
    if (e.x > e.y) {
        discard;
        return;
    }
    
    // Handle intersection with the planet
    vec2 f = ray_vs_sphere(eye, viewDir, R_INNER);
    e.y = min(e.y, f.x);
    
    // Calculate in-scattering
    vec3 I = in_scatter(eye, viewDir, e, sunDir);
    
    // Apply gamma correction
    I = pow(I, vec3(1.0 / 2.2)); 
    
    // Add some atmospheric shimmer/glow effect
    float glowStrength = 0.1;
    float glowSpeed = 3.0;
    float glowPattern = snoise(vec3(vNormal.xy * 10.0, time * glowSpeed)) * glowStrength;
    I *= (1.0 + glowPattern);
    
    // Calculate fresnel for edge glow effect
    float fresnelPower = 1.5; // Power for edge glow (lower = wider rim)
    float rim = fresnel(normalize(vNormal), viewDir, fresnelPower);
    
    // Add a bright rim at the edges of the atmosphere
    vec3 rimColor = atmosphereColor * 1.5; // Brighter rim color
    I = mix(I, rimColor, rim * 0.5); // Add rim effect
    
    // Mix with the provided atmosphere color for customization
    // Increased custom color influence
    I = mix(I, atmosphereColor, 0.3); // Increased from 0.2
    
    // Apply opacity control with increased minimum opacity for better visibility
    // Also factor in rim to make edges more visible
    float finalOpacity = atmosphereOpacity * min(0.95, max(0.4, I.r + I.g + I.b) + rim * 0.5);
    
    gl_FragColor = vec4(I, finalOpacity);
} 