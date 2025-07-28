uniform vec3 uColor;
uniform float uLightIntensity;
uniform float uAmbientStrength;

varying float vAlpha;
varying float vDepth;

void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    // Soft particle edge
    float strength = 1.0 - smoothstep(0.4, 0.5, dist);
    if (strength < 0.01) discard;

    float finalAlpha = vAlpha * strength;

    // The tail is emissive, its brightness depends on its own properties and general
    // light intensity, not direction. Minimal ambient term to prevent pure black.
    vec3 finalColor = uColor * (uAmbientStrength + uLightIntensity);

    // Apply gamma correction
    finalColor = pow(finalColor, vec3(1.0/2.2));

    gl_FragColor = vec4(finalColor, finalAlpha);
} 