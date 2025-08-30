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
float snoise(vec3 uv, float res, float time) {
    const vec3 s = vec3(1e0, 1e2, 1e4);
    uv *= res + (time / 40000.0) * 0.1; // Increase time component to the noise sampling significantly
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
float fbm(vec3 p, float time) { // Pass time to fbm
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i = 0; i < 3; i++) {  // Reduced from 4 to 3 octaves
        sum += snoise(p * freq, 8.0, time) * amp;  // Pass time to snoise
        amp *= 0.5;
        freq *= 2.0;
        p = p * 1.1 + vec3(0.5, 0.8, 0.3);
    }
    return sum;
}

void main() {
    float time = uTime / 40000.0 * 0.1; // Use uTime directly for continuous animation
    
    // Create animated coordinates for plasma noise
    vec3 animatedPosition = vPosition + vec3(time * 2.0, time * 3.0, time * 4.0); // Crank up multipliers
    vec3 plasmaCoord = animatedPosition * uNoiseScale;
    float plasmaNoise = fbm(plasmaCoord, time);
    
    // Create animated coordinates for turbulence with different time offset
    vec3 turbulenceCoord = animatedPosition * uNoiseScale * 1.5 + vec3(time * 4.0, time * 2.0, time * 6.0); // Crank up multipliers
    float turbulence = fbm(turbulenceCoord, time) * uPlasmaTurbulence * 0.5;
    
    // Combine noise effects with stronger blending
    float plasmaEffect = (plasmaNoise + turbulence) * uNoiseIntensity * 2.0; // Keep this strong
    
    // Create sharper plasma pattern
    float plasmaPattern = smoothstep(-0.6, 0.6, plasmaEffect); // Keep this for sharpness
    
    // Mix colors based on plasma intensity with more distinct transitions
    vec3 hotPlasma = mix(uSurfaceColor, uHotColor, plasmaPattern * 0.8); // Keep influence strong
    vec3 coolPlasma = mix(uSurfaceColor, uCoolColor, (1.0 - plasmaPattern) * 0.6); // Keep influence strong
    
    // Final color blend with more distinct mixing
    vec3 finalColor = mix(coolPlasma, hotPlasma, plasmaPattern);
    
    // Add subtle variation based on position using animated coordinates
    vec3 positionCoord = animatedPosition * 0.3 + vec3(time * 1.0, time * 1.5, time * 2.0); // Crank up multipliers
    float positionVariation = fbm(positionCoord, time);
    finalColor = mix(finalColor, finalColor * 1.1, positionVariation * 0.2);
    
    // Apply uniform lighting intensity (no camera dependency)
    finalColor *= uLightingIntensity;
    
    gl_FragColor = vec4(finalColor, 1.0);
    
    #include <logdepthbuf_fragment>
}