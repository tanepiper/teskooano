uniform float time;
uniform vec3 planetColor;
uniform float roughness;
uniform sampler2D surfaceTexture;
uniform bool hasTexture;
uniform float uSurfaceVariation;
uniform vec3 uLightColor;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vPosition;
varying vec3 vWorldPosition;
varying vec3 vSunDirection;
varying vec3 vViewDirection;

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

float fbm(vec2 p, int octaves) {
  float sum = 0.0;
  float freq = 1.0;
  float amp = 0.5;
  for(int i = 0; i < octaves; i++) {
    sum += smoothNoise(p * freq) * amp;
    freq *= 2.0;
    amp *= 0.5;
  }
  return sum;
}

void main() {
  vec3 normal = normalize(vNormal);
  vec3 lightDir = normalize(vSunDirection);
  vec3 viewDir = normalize(vViewDirection);

  vec3 baseColor;
  if (hasTexture) {
    baseColor = texture2D(surfaceTexture, vUv).rgb;
  } else {
    vec2 baseCoord = vUv * 10.0;
    
    float baseNoise = fbm(baseCoord * 0.8 + time * 0.002, 4);
    vec3 color1 = planetColor * (0.9 + baseNoise * 0.2);
    
    float midNoise = fbm(baseCoord * 2.5 + time * 0.008, 5);
    vec3 color2 = planetColor * (1.0 + midNoise * 0.25);
    
    float fineNoise = fbm(baseCoord * 7.0 + time * 0.015, 6);
    vec3 color3 = planetColor * (0.95 + fineNoise * 0.15);

    float blend1 = smoothstep(0.4, 0.6, baseNoise);
    float blend2 = smoothstep(0.35, 0.65, midNoise + baseNoise * 0.15);

    baseColor = mix(color1, color2, blend1 * uSurfaceVariation);
    baseColor = mix(baseColor, color3, blend2 * uSurfaceVariation * 0.6);
    
    float gray = luminance(baseColor);
    baseColor = mix(baseColor, vec3(gray), uSurfaceVariation * 0.2);

    float craterNoise = fbm(baseCoord * 2.0 + 8.0, 4);
    float craterPattern = smoothstep(0.4, 0.55, craterNoise);
    baseColor = mix(baseColor, baseColor * 0.6, craterPattern * pow(roughness, 0.5) * uSurfaceVariation * 1.2);
  }
  
  float diff = max(dot(normal, lightDir), 0.0);
  vec3 diffuse = diff * uLightColor;
  
  float ambientStrength = 0.2;
  vec3 ambient = ambientStrength * uLightColor;
  
  float specularStrength = 0.2;
  vec3 halfVec = normalize(lightDir + viewDir);
  float shininess = pow(2.0, (1.0 - roughness) * 7.0);
  float spec = pow(max(dot(normal, halfVec), 0.0), shininess);
  vec3 specular = specularStrength * spec * uLightColor;
  
  vec3 litColor = ambient + diffuse + specular;
  
  vec3 finalColor = baseColor * litColor;
  
  gl_FragColor = vec4(clamp(finalColor, 0.0, 1.0), 1.0);
} 