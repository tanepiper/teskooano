uniform float time;
uniform vec3 rockColor;
uniform vec3 lavaColor;
uniform float lavaActivity;
uniform float roughness;
uniform sampler2D surfaceTexture;
uniform bool hasTexture;
uniform vec3 uLightColor;
uniform float uSurfaceVariation;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying vec3 vViewDirection;

// Noise functions
float noise(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float smoothNoise(vec2 p) {
  vec2 lv = fract(p);
  vec2 id = floor(p);
  
  lv = lv * lv * (3.0 - 2.0 * lv);
  
  float bl = noise(id);
  float br = noise(id + vec2(1.0, 0.0));
  float tl = noise(id + vec2(0.0, 1.0));
  float tr = noise(id + vec2(1.0, 1.0));
  
  float b = mix(bl, br, lv.x);
  float t = mix(tl, tr, lv.x);
  
  return mix(b, t, lv.y);
}

float fbm(vec2 p) {
  float sum = 0.0;
  float freq = 1.0;
  float amp = 0.5;
  for(int i = 0; i < 5; i++) {
    sum += smoothNoise(p * freq) * amp;
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

// Special function for lava flow patterns
float lavaFlow(vec2 p, float t) {
  // Moving lava
  float flowSpeed = t * 0.1;
  vec2 flowDir = vec2(0.1, 0.3); // Flow direction
  vec2 flowOffset = flowDir * flowSpeed;
  
  // Multi-layered lava patterns with movement
  float largeLavaPattern = fbm((p + flowOffset) * 2.0);
  float smallLavaPattern = fbm((p - flowOffset * 0.5) * 6.0);
  
  // Combine patterns with time-based pulsing
  float pulse = sin(t * 0.3) * 0.5 + 0.5;
  return mix(largeLavaPattern, smallLavaPattern, 0.5 + 0.2 * pulse);
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(vSunDirection);
  vec3 viewDir = normalize(vViewDirection);

  // --- Base Color (Rock/Lava) --- 
  vec3 baseColor;
  float isLava = 0.0;
  if (hasTexture) {
    baseColor = texture2D(surfaceTexture, vUv).rgb;
    // Estimate isLava from texture color if possible, or default to mostly rock
    // This is complex, for now assume mostly rock for lighting if textured
  } else {
    vec2 noiseCoord = vUv * 8.0;
    float elevation = fbm(noiseCoord);
    float lavaAmount = lavaFlow(noiseCoord, time);
    lavaAmount = smoothstep(0.4, 0.6, lavaAmount) * lavaActivity;
    baseColor = mix(rockColor, lavaColor, lavaAmount);
    float crackPattern = fbm((noiseCoord + vec2(50.0, 30.0)) * 4.0);
    float cracks = smoothstep(0.5, 0.55, crackPattern) * lavaActivity;
    baseColor = mix(baseColor, lavaColor * 1.5, cracks * uSurfaceVariation);
    float rockPattern = fbm(noiseCoord * 15.0);
    baseColor = mix(baseColor, rockColor * 0.7, rockPattern * roughness * (1.0 - lavaAmount * 0.8) * uSurfaceVariation);
    float pulse = (sin(time * 0.5) * 0.5 + 0.5) * 0.2 * uSurfaceVariation;
    baseColor = mix(baseColor, lavaColor * 1.8, lavaAmount * pulse);
    
    // Calculate how much of the procedural surface is lava
    isLava = smoothstep(0.1, 0.6, lavaAmount + cracks * 0.5 + pulse * 0.2); 
  }

  // --- Phong Lighting (Applied mainly to rock) --- 
  // Ambient
  float ambientStrength = 0.1;
  vec3 ambient = ambientStrength * uLightColor;

  // Diffuse
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;

  // Specular (Mostly for rock, lava is emissive)
  float specularStrength = 0.4 * (1.0 - isLava); // Reduce specular on lava areas
  vec3 halfVec = normalize(lightDir + viewDir); // Blinn-Phong
  float shininess = pow(2.0, (1.0 - roughness) * 6.0); // Rock shininess
  float spec = pow(max(dot(normal, halfVec), 0.0), shininess);
  vec3 specular = specularStrength * spec * uLightColor;

  // Combine lighting components
  vec3 litColor = ambient + diffuse + specular;
  
  // Modulate base color by lighting, but preserve lava glow
  vec3 finalColor = mix(baseColor * litColor, baseColor, isLava * 0.8); // Blend based on lava amount

  // Add Emissive component for lava
  vec3 emissive = lavaColor * isLava * (0.5 + fbm(vUv*5.0 + time*0.1)*0.5); // Pulsing emissive lava
  finalColor += emissive;
  
  // Heat distortion effect (subtle color shift, could be done in separate pass too)
  float heat = sin(time * 2.0 + vUv.x * 20.0 + vUv.y * 20.0) * 0.03 * uSurfaceVariation;
  finalColor = mix(finalColor, finalColor * vec3(1.1, 1.0, 0.9), heat * isLava);

  gl_FragColor = vec4(clamp(finalColor, 0.0, 2.0), 1.0); // Allow brightness > 1 for lava glow
} 