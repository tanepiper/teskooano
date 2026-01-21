#include <common>
#include <logdepthbuf_pars_fragment>

uniform float uTime;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform float uSwirlSpeed;
uniform float uDensityMult;
uniform float uNoiseScale;
uniform float uScattering;
uniform float uBrightness;
uniform float uEdgeSoftness;
uniform float uEdgeNoise;
uniform vec3 uLightPos;
uniform float uRadius;

varying vec3 vWorldPosition;
varying vec3 vSphereCenter;

float hash(float n) { return fract(sin(n) * 753.5453123); }

float noise(vec3 x) {
    vec3 p = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n = p.x + p.y * 157.0 + 113.0 * p.z;
    return mix(mix(mix(hash(n + 0.0), hash(n + 1.0), f.x),
                   mix(hash(n + 157.0), hash(n + 158.0), f.x), f.y),
               mix(mix(hash(n + 113.0), hash(n + 114.0), f.x),
                   mix(hash(n + 270.0), hash(n + 271.0), f.x), f.y), f.z);
}

float fbmSwirl(vec3 p) {
    float n1 = noise(p);
    vec3 q = p + vec3(n1 * 1.5 + uTime * uSwirlSpeed * 0.2);
    float n2 = noise(q * 2.0);
    vec3 r = p + vec3(n2 * 2.0 - uTime * uSwirlSpeed * 0.1);
    return noise(r * 3.0) * 0.5 + n2 * 0.25 + n1 * 0.25;
}

float hg(float g, float dotVH) {
    return (1.0 - g * g) / (4.0 * 3.14159 * pow(1.0 + g * g - 2.0 * g * dotVH, 1.5));
}

vec2 raySphere(vec3 ro, vec3 rd, float rad) {
    float b = dot(ro, rd);
    float c = dot(ro, ro) - rad * rad;
    float h = b * b - c;
    if(h < 0.0) return vec2(-1.0);
    h = sqrt(h);
    return vec2(-b - h, -b + h);
}

void main() {
    #include <logdepthbuf_fragment>

    vec3 ro = cameraPosition - vSphereCenter;
    vec3 rd = normalize(vWorldPosition - cameraPosition);
    
    float sphereRadius = uRadius;
    float boundaryRadius = sphereRadius + uEdgeSoftness;
    
    vec2 tDist = raySphere(ro, rd, boundaryRadius);
    
    if (tDist.x < 0.0 && tDist.y < 0.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }
    
    float tNear = max(0.0, tDist.x);
    float tFar = tDist.y;
    float totalDensity = 0.0;
    float lightEnergy = 0.0;
    
    const int steps = 40;
    float stepSize = (tFar - tNear) / float(steps);
    // Normalize stepSize for density accumulation (make it scale-invariant)
    float normalizedStepSize = stepSize / sphereRadius;
    float t = tNear;
    
    float dither = fract(sin(gl_FragCoord.x * 12.9898 + gl_FragCoord.y * 78.233) * 43758.5453);
    t += dither * stepSize;
    
    vec3 lightDir = normalize(uLightPos);

    for(int i = 0; i < steps; i++) {
        if (t >= tFar) break;
        vec3 p = ro + rd * t;
        float distFromCenter = length(p);
        
        // Normalize position to unit sphere for noise sampling
        vec3 pNorm = p / sphereRadius;
        float normalizedDist = distFromCenter / sphereRadius;
        
        // Base density: keep the middle less hollow (scale-invariant)
        float baseDensity = max(0.0, 1.0 - normalizedDist * normalizedDist);
        
        // Add turbulence using normalized coordinates (higher frequency + more contrast)
        float turbulence = fbmSwirl(
            pNorm * uNoiseScale * 4.0 + vec3(0.0, -uTime * 0.08, 0.0)
        );
        turbulence = smoothstep(0.15, 0.85, turbulence);
        turbulence *= turbulence;
        
        // Edge warping using normalized coordinates
        float edgeWarp = (fbmSwirl(pNorm * uNoiseScale * 3.0 + vec3(uTime * 0.05)) - 0.5) * 2.0;
        float edgeOffset = edgeWarp * (uEdgeNoise / sphereRadius);
        float softEdge = smoothstep(1.0 + (uEdgeSoftness / sphereRadius), 0.8, normalizedDist + edgeOffset);
        
        // Combine densities
        float density = baseDensity * (0.25 + turbulence * 1.25) * softEdge * uDensityMult;
        
        float shadow = exp(-totalDensity * 0.3);
        totalDensity += density * normalizedStepSize;
        lightEnergy += density * normalizedStepSize * shadow;
        
        t += stepSize;
    }
    
    float fogAlpha = 1.0 - exp(-totalDensity * 3.0);
    fogAlpha = clamp(fogAlpha, 0.0, 1.0);
    
    if (fogAlpha < 0.01) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 0.0);
        return;
    }
    
    float sunScattering = hg(uScattering, dot(rd, lightDir));
    float colorMix = clamp(lightEnergy * 0.4 + sunScattering * 0.3 + 0.4, 0.0, 1.0);
    vec3 diffuse = mix(uColorB, uColorA, colorMix);
    vec3 finalColor = diffuse * uBrightness;
    
    gl_FragColor = vec4(finalColor, fogAlpha);
}
