precision highp float;

// Varyings from vertex shader (matching our updated vertex shader)
varying vec3 vNormal;          // Vertex normal in world space (use this for specular)
varying vec3 vWorldPosition;     // Vertex position in world space
varying vec3 vSunDirection;      // Direction from vertex to sun
varying vec3 vViewDirection;     // Direction from camera to vertex
varying vec3 vUnitSamplePoint;   // Normalized local position (for noise sampling)
varying vec3 vSphereNormalW;     // Normalized world normal assuming perfect sphere (use this for diffuse)

// Uniforms from material (matching our updated material)
uniform vec3 mainColor1;       // Mapped from atmosphereColor
uniform vec3 mainColor2;       // Mapped from cloudColor
uniform vec3 darkColor;        // Derived dark color
uniform float uSeed;           // Seed, consistent name
uniform int uWarpOctaves;      // LOD-controlled octave count for warping noise
uniform int uColorOctaves;     // LOD-controlled octave count for color noise
uniform sampler2D stormMap;
uniform bool hasStormMap;

// --- Helper: lerp ---
vec3 lerp(vec3 v1, vec3 v2, float s) {
    // Note: The example lerp was backwards (s * v1 + (1.0 - s) * v2)
    // Using standard lerp: (1.0 - s) * v1 + s * v2
    return mix(v1, v2, s);
}

// --- Helper: clamp01 (Renamed from saturate) ---
// Use if statements instead of clamp for potentially better compiler compatibility
float clamp01(float value) { // Renamed function
    if(value < 0.0) return 0.0;
    if(value > 1.0) return 1.0;
    return value;
}

// --- Simplex Noise 4D (Adapted from example's noise.glsl) ---
// (Includes mod289, permute, taylorInvSqrt, grad4, snoise (vec4 version))
vec4 mod289(vec4 x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0; }

float mod289(float x) {
    return x - floor(x * (1.0 / 289.0)) * 289.0; }

vec4 permute(vec4 x) {
    // Slightly different permute factor from example for variety
    return mod289(((x*34.0)+1.0)*x);
}

float permute(float x) {
    return mod289(((x*34.0)+1.0)*x);
}

vec4 taylorInvSqrt(vec4 r)
{
    return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r)
{
    return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip)
{
    const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
    vec4 p,s;

    p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
    p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
    s = vec4(lessThan(p, vec4(0.0)));
    p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;

    return p;
}

#define F4 0.309016994374947451 // (sqrt(5) - 1)/4 = F4

float snoise(vec4 v)
{
    const vec4  C = vec4( 0.138196601125011,  // (5 - sqrt(5))/20  G4
    0.276393202250021,  // 2 * G4
    0.414589803375032,  // 3 * G4
    -0.447213595499958); // -1 + 4 * G4

    vec4 i  = floor(v + dot(v, vec4(F4)) );
    vec4 x0 = v -   i + dot(i, C.xxxx);

    vec4 i0;
    vec3 isX = step( x0.yzw, x0.xxx );
    vec3 isYZ = step( x0.zww, x0.yyz );
    i0.x = isX.x + isX.y + isX.z;
    i0.yzw = 1.0 - isX;
    i0.y += isYZ.x + isYZ.y;
    i0.zw += 1.0 - isYZ.xy;
    i0.z += isYZ.z;
    i0.w += 1.0 - isYZ.z;

    vec4 i3 = clamp( i0, 0.0, 1.0 );
    vec4 i2 = clamp( i0-1.0, 0.0, 1.0 );
    vec4 i1 = clamp( i0-2.0, 0.0, 1.0 );

    vec4 x1 = x0 - i1 + C.xxxx;
    vec4 x2 = x0 - i2 + C.yyyy;
    vec4 x3 = x0 - i3 + C.zzzz;
    vec4 x4 = x0 + C.wwww;

    i = mod289(i);
    float j0 = permute( permute( permute( permute(i.w) + i.z) + i.y) + i.x);
    vec4 j1 = permute( permute( permute( permute (
    i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
    + i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
    + i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
    + i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));

    vec4 ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;

    vec4 p0 = grad4(j0,   ip);
    vec4 p1 = grad4(j1.x, ip);
    vec4 p2 = grad4(j1.y, ip);
    vec4 p3 = grad4(j1.z, ip);
    vec4 p4 = grad4(j1.w, ip);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;
    p4 *= taylorInvSqrt(dot(p4,p4));

    vec3 m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
    vec2 m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
    m0 = m0 * m0;
    m1 = m1 * m1;
    // Return value in range [-1, 1]
    return 49.0 * ( dot(m0*m0, vec3( dot( p0, x0 ), dot( p1, x1 ), dot( p2, x2 ))) 
               + dot(m1*m1, vec2( dot( p3, x3 ), dot( p4, x4 ) ) ) ) ;
}

// --- Helper: Fractal Simplex Noise 4D ---
// Returns value in range [0, 1]
float fractalSimplex4(vec4 p, int nbOctaves, float decay, float lacunarity) {
    float totalAmplitude = 0.0;
    float value = 0.0;
    // Normalize noise output to [0, 1] inside the loop
    float noise_factor = 0.5; // Adjust this if snoise range is different
    for(int i = 0; i < nbOctaves; ++i) {
        float amplitude = 1.0 / pow(decay, float(i));
        totalAmplitude += amplitude;
        vec4 samplePoint = p * pow(lacunarity, float(i));
        // Map snoise from [-1, 1] to [0, 1] before adding
        value += (snoise(samplePoint) * noise_factor + 0.5) * amplitude;
    }
    // Normalize final value by total amplitude
    return value / totalAmplitude;
}

void main() {
    // Use actual vertex normal for lighting calculations
    vec3 normal = normalize(vNormal);
    vec3 viewDir = normalize(vViewDirection);
    vec3 lightDir = normalize(vSunDirection);

    // Calculate noise color first
    vec3 noiseColor = vec3(0.0);
    float seed = uSeed;

    // Noise Sample Point Setup (Class I parameters)
    vec4 seededSamplePoint = vec4(vUnitSamplePoint * 2.0, seed);
    seededSamplePoint.y *= 2.5;
    float latitude = seededSamplePoint.y;

    // Noise Warping (Class I parameters)
    float warpingStrength = 2.0;
    float warpDecay = 2.0;
    float warpLacunarity = 2.0;
    float warping = fractalSimplex4(seededSamplePoint, uWarpOctaves, warpDecay, warpLacunarity) * warpingStrength;

    // Color Decisions (Class I parameters)
    float colorDecay = 2.0;
    float colorLacunarity = 2.0;
    float colorDecision1 = fractalSimplex4(vec4(latitude + warping, seed, -seed, seed), uColorOctaves, colorDecay, colorLacunarity);
    float colorDecision2 = fractalSimplex4(vec4(latitude - warping, seed, -seed, seed), uColorOctaves, colorDecay, colorLacunarity);

    // Color Blending (Class I parameters)
    noiseColor = lerp(mainColor1, darkColor, smoothstep(0.4, 0.6, colorDecision1));
    noiseColor = lerp(noiseColor, mainColor2, smoothstep(0.2, 0.8, colorDecision2));

    // Now calculate lighting components using the noiseColor

    // Diffuse component
    float ndl = max(0.0, dot(normal, lightDir));
    ndl = clamp01(ndl);
    vec3 diffuse = noiseColor * ndl; // Correct: Multiply noiseColor by diffuse factor

    // Specular component
    vec3 halfAngle = normalize(viewDir + lightDir);
    float specComp = max(0.0, dot(normal, halfAngle));
    specComp = clamp01(specComp);
    specComp = pow(specComp, 80.0);
    vec3 specular = vec3(0.05) * specComp;

    // Rim Lighting
    float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
    float rimIntensity = pow(rimDot, 3.0);
    rimIntensity = clamp01(rimIntensity * 0.6);
    vec3 rimColor = mix(mainColor1, mainColor2, 0.5) * 1.2;
    vec3 rim = rimColor * rimIntensity; // Calculate final rim color contribution

    // Combine components
    vec3 ambient = noiseColor * 0.15; // Add a small ambient factor based on surface color
    vec3 finalColor = ambient + diffuse + specular + rim; // Correctly sum components, including ambient

    // Apply storm overlay if available
    if (hasStormMap) {
        // Calculate UV coordinates from the unit sample point
        vec2 stormUv = vec2(
            0.5 + atan(vUnitSamplePoint.z, vUnitSamplePoint.x) / (2.0 * 3.14159),
            0.5 - asin(vUnitSamplePoint.y) / 3.14159
        );
        
        vec4 stormColor = texture2D(stormMap, stormUv);
        // Blend the storm with the procedural texture
        finalColor = mix(finalColor, stormColor.rgb, stormColor.a * 0.8);
    }

    gl_FragColor = vec4(finalColor, 1.0);
} 