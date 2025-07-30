// Enhanced Star Fragment Shader
// Dynamic plasma, sunspots, coronal mass ejections, and stellar phenomena

#include <common>
#include <logdepthbuf_pars_fragment>

uniform float uTime;
uniform vec3 uStarColor;
uniform vec3 uHotColor;
uniform vec3 uSurfaceColor;
uniform vec3 uCoolColor;

// Procedural noise for plasma effects
uniform float uNoiseScale;
uniform float uNoiseIntensity;
uniform float uPlasmaSpeed;
uniform float uPlasmaTurbulence;

// Uniform lighting
uniform float uLightingIntensity;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;



// Improved noise function based on Shadertoy example
float snoise(vec3 uv, float res) {
    const vec3 s = vec3(1e0, 1e2, 1e4);
    uv *= res;
    vec3 uv0 = floor(mod(uv, res))*s;
    vec3 uv1 = floor(mod(uv+vec3(1.), res))*s;
    vec3 f = fract(uv); f = f*f*(3.0-2.0*f);
    vec4 v = vec4(uv0.x+uv0.y+uv0.z, uv1.x+uv0.y+uv0.z,
                   uv0.x+uv1.y+uv0.z, uv1.x+uv1.y+uv0.z);
    vec4 r = fract(sin(v*1e-3)*1e5);
    float r0 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
    r = fract(sin((v + uv1.z - uv0.z)*1e-3)*1e5);
    float r1 = mix(mix(r.x, r.y, f.x), mix(r.z, r.w, f.x), f.y);
    return mix(r0, r1, f.z)*2.-1.;
}

// Fractal Brownian Motion for plasma - reduced complexity
float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i = 0; i < 3; i++) {  // Reduced from 4 to 3 octaves
        sum += snoise(p * freq, 8.0) * amp;  // Reduced resolution from 15.0 to 8.0
        amp *= 0.5;
        freq *= 2.0;
        p = p * 1.1 + vec3(0.5, 0.8, 0.3);
    }
    return sum;
}

void main() {
    // Calculate plasma noise with much smaller time scale
    float astronomicalTime = uTime * 0.1; // Much smaller scale for visible animation
    float lerpValue = mod(astronomicalTime, 1.0); // Cycle between 0 and 1
    
    // Lerp between two small values for main sequence stars
    float baseValue = mix(0.400, 0.700, lerpValue);
    
    vec3 plasmaCoord = vPosition * uNoiseScale + baseValue;
    float plasmaNoise = fbm(plasmaCoord);
    
    // Add turbulence with the same time approach
    float turbulenceValue = mix(0.300, 0.600, lerpValue);
    vec3 turbulenceCoord = vPosition * uNoiseScale * 1.5 + turbulenceValue;
    float turbulence = fbm(turbulenceCoord) * uPlasmaTurbulence * 0.5;
    
    // Combine noise effects with smoother blending
    float plasmaEffect = (plasmaNoise + turbulence) * uNoiseIntensity;
    
    // Create smoother plasma pattern
    float plasmaPattern = smoothstep(-0.3, 0.3, plasmaEffect);
    
    // Mix colors based on plasma intensity with gentler transitions
    vec3 hotPlasma = mix(uSurfaceColor, uHotColor, plasmaPattern * 0.6);
    vec3 coolPlasma = mix(uSurfaceColor, uCoolColor, (1.0 - plasmaPattern) * 0.4);
    
    // Final color blend with smoother mixing
    vec3 finalColor = mix(coolPlasma, hotPlasma, plasmaPattern);
    
    // Add subtle variation based on position using the same time approach
    float positionValue = mix(0.200, 0.500, lerpValue);
    float positionVariation = fbm(vPosition * 0.3 + positionValue);
    finalColor = mix(finalColor, finalColor * 1.1, positionVariation * 0.2);
    
    // Apply uniform lighting intensity (no camera dependency)
    finalColor *= uLightingIntensity;
    
    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
}