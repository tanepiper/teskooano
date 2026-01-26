/**
 * Crater generation fragment shader.
 * 
 * Applies SDF-based craters to an existing height map.
 * Craters have proper morphology: bowl, rim, and optional central peak.
 */

precision highp float;

varying vec2 vUv;

// Input height map from previous pass
uniform sampler2D uHeightMap;

// Maximum number of craters (must match TypeScript constant)
#define MAX_CRATERS 128

// Crater data: vec4(centerX, centerY, radius, depth)
uniform vec4 uCraterData[MAX_CRATERS];
// Additional crater data: vec4(rimHeight, hasCentralPeak, age, unused)
uniform vec4 uCraterExtra[MAX_CRATERS];
// Number of active craters
uniform int uCraterCount;

/**
 * SDF-based crater height modification.
 * 
 * Creates realistic crater morphology with:
 * - Bowl-shaped depression
 * - Raised rim
 * - Optional central peak for larger craters
 * - Age-based degradation
 */
float sdCrater(vec2 p, vec2 center, float radius, float depth, float rimHeight, bool hasCentralPeak, float age) {
    vec2 toCenter = p - center;
    
    // Handle wrapping for equirectangular projection
    if (toCenter.x > 0.5) toCenter.x -= 1.0;
    if (toCenter.x < -0.5) toCenter.x += 1.0;
    
    // Compensate for aspect ratio (equirectangular: 2:1)
    toCenter.x *= 2.0;
    
    float dist = length(toCenter);
    
    // Early exit if too far from crater
    if (dist > radius * 2.5) {
        return 0.0;
    }
    
    float heightMod = 0.0;
    
    // Normalized distance from crater center
    float normDist = dist / radius;
    
    // Bowl shape using smooth polynomial (parabolic profile)
    if (normDist < 1.0) {
        // Smooth bowl interior
        float bowl = normDist * normDist;
        float craterDepth = -depth * (1.0 - bowl);
        heightMod += craterDepth;
        
        // Central peak for larger, younger craters
        if (hasCentralPeak && normDist < 0.3) {
            float peakHeight = depth * 0.4 * (1.0 - normDist / 0.3);
            peakHeight *= (1.0 - age * 0.8); // Peaks erode with age
            heightMod += peakHeight;
        }
    }
    
    // Rim - raised ring around crater edge
    float rimInner = 0.85;
    float rimOuter = 1.3;
    if (normDist > rimInner && normDist < rimOuter) {
        float rimProfile = 1.0 - abs((normDist - 1.0) / (rimOuter - 1.0));
        rimProfile = rimProfile * rimProfile; // Sharpen
        float rim = rimHeight * rimProfile;
        rim *= (1.0 - age * 0.6); // Rims erode with age
        heightMod += rim;
    }
    
    // Ejecta blanket - subtle raised area beyond rim
    float ejectaOuter = 2.0;
    if (normDist > rimOuter && normDist < ejectaOuter) {
        float ejectaProfile = 1.0 - (normDist - rimOuter) / (ejectaOuter - rimOuter);
        ejectaProfile = ejectaProfile * ejectaProfile * ejectaProfile;
        float ejecta = rimHeight * 0.15 * ejectaProfile;
        ejecta *= (1.0 - age * 0.9); // Ejecta erodes quickly
        heightMod += ejecta;
    }
    
    // Age-based smoothing of crater features
    heightMod *= (1.0 - age * 0.3);
    
    return heightMod;
}

void main() {
    // Sample existing height
    float height = texture2D(uHeightMap, vUv).r;
    
    // Apply all craters
    for (int i = 0; i < MAX_CRATERS; i++) {
        if (i >= uCraterCount) break;
        
        vec4 data = uCraterData[i];
        vec4 extra = uCraterExtra[i];
        
        vec2 center = data.xy;
        float radius = data.z;
        float depth = data.w;
        float rimHeight = extra.x;
        bool hasCentralPeak = extra.y > 0.5;
        float age = extra.z;
        
        float craterHeight = sdCrater(vUv, center, radius, depth, rimHeight, hasCentralPeak, age);
        height += craterHeight;
    }
    
    // Clamp to valid range
    height = clamp(height, 0.0, 1.0);
    
    gl_FragColor = vec4(height, height, height, 1.0);
}
