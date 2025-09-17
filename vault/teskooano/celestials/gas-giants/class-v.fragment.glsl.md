---
aliases: [class-v.fragment.glsl]
tags: [renderer, threejs, gas-giants, shader, fragment]
type: shader
package: "@teskooano/celestials-gas-giants"
file: "src/shaders/class-v.fragment.glsl"
status: active
---

# class-v.fragment.glsl

Fragment shader for Class V gas giants (Silicate Clouds) with enhanced fractal noise, silicate cloud formations, thermal emission, and emissive heat glow for extremely hot, silicate-rich atmospheres.

## Overview

The Class V fragment shader implements atmospheric rendering for Class V gas giants, featuring silicate dust clouds with enhanced fractal noise, thermal emission effects, and emissive heat glow. It creates extremely hot, silicate-rich atmospheric effects with pronounced cloud formations and thermal emission.

## Shader Features

- **Enhanced Fractal Noise**: Advanced fractal noise for silicate cloud formations
- **Silicate Cloud Simulation**: Realistic silicate dust cloud rendering
- **Thermal Emission**: Emissive heat glow for extremely hot atmospheres
- **Multi-Light Source Lighting**: Support for up to 4 light sources
- **Shadow Casting**: Real-time shadow calculations with penumbra effects
- **Storm Map Overlay**: Optional storm texture overlay
- **Smooth Terminator**: Wide transition around day/night boundary
- **Dusty Appearance**: Specialized rendering for silicate-rich atmospheres

## Varying Variables

### vNormal

```glsl
varying vec3 vNormal;
```

World space normal for lighting.

- **Usage**: Lighting calculations
- **Source**: Class V vertex shader

### vWorldPosition

```glsl
varying vec3 vWorldPosition;
```

World space position.

- **Usage**: Lighting calculations, distance-based effects
- **Source**: Class V vertex shader

### vViewDirection

```glsl
varying vec3 vViewDirection;
```

Direction from camera.

- **Usage**: View-dependent effects
- **Source**: Class V vertex shader

### vUnitSamplePoint

```glsl
varying vec3 vUnitSamplePoint;
```

Normalized local position for noise sampling.

- **Usage**: Silicate cloud pattern calculations
- **Source**: Class V vertex shader

### vSphereNormalW

```glsl
varying vec3 vSphereNormalW;
```

Normalized world normal assuming perfect sphere.

- **Usage**: Diffuse lighting calculations
- **Source**: Class V vertex shader

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in world space.

- **Usage**: Lighting and shadow calculations
- **Source**: Class V vertex shader

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates.

- **Usage**: Texture sampling
- **Source**: Class V vertex shader

## Uniform Variables

### Color Uniforms

```glsl
uniform vec3 baseColor; // A bright, reflective color (off-white, pale yellow/grey)
uniform vec3 cloudColor; // Color for silicate cloud formations
uniform vec3 emissiveColor; // Color for the heat glow (e.g., dull red/orange)
uniform float emissiveIntensity; // How strong the glow is
```

- **baseColor**: Bright, reflective color for silicate atmospheres
- **cloudColor**: Color for silicate cloud formations
- **emissiveColor**: Color for heat glow (typically dull red/orange)
- **emissiveIntensity**: Intensity of the emissive heat glow

### Lighting Uniforms

```glsl
uniform Light uLights[MAX_LIGHTS];
uniform int uNumLights;
uniform ShadowCaster uShadowCasters[MAX_SHADOW_CASTERS];
uniform int uNumShadowCasters;
uniform float uDynamicAmbientIntensity;
```

- **uLights**: Array of light sources (up to 4)
- **uNumLights**: Number of active light sources
- **uShadowCasters**: Array of shadow casters (up to 16)
- **uNumShadowCasters**: Number of active shadow casters
- **uDynamicAmbientIntensity**: Dynamic ambient lighting intensity

### Storm Map Uniforms

```glsl
uniform sampler2D stormMap;
uniform bool hasStormMap;
```

- **stormMap**: Optional storm texture overlay
- **hasStormMap**: Flag indicating if storm map is available

### Time Uniform

```glsl
uniform float time;
```

- **time**: Current simulation time for animation

## Data Structures

### Light Structure

```glsl
struct Light {
  vec3 position;
  vec3 color;
  float intensity;
};
```

### ShadowCaster Structure

```glsl
struct ShadowCaster {
  vec3 position;
  float radius;
};
```

## Noise Functions

### Improved Noise Function

```glsl
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
```

**Noise Function:**

- **Purpose**: Generates 3D noise for silicate cloud formations
- **Range**: -1.0 to 1.0
- **Resolution**: Configurable resolution parameter

### Enhanced Fractal Brownian Motion

```glsl
float fbm(vec3 p) {
  float sum = 0.0;
  float amp = 1.0;
  float freq = 1.0;
  for(int i = 0; i < 4; i++) { // Increased octaves for more detail
    sum += snoise(p * freq, 8.0) * amp; // Higher resolution
    amp *= 0.6; // Less amplitude decay for more contrast
    freq *= 1.8; // Slightly less frequency doubling for smoother transitions
    p = p * 1.15 + vec3(0.7, 0.3, 0.9); // Different offset for more variation
  }
  return sum;
}
```

**FBM Parameters:**

- **Octaves**: 4 octaves for detailed patterns
- **Resolution**: 8.0 for higher resolution
- **Amplitude Decay**: 0.6 for more contrast
- **Frequency Doubling**: 1.8 for smoother transitions
- **Offset**: (0.7, 0.3, 0.9) for variation

## Main Rendering Pipeline

### 1. Silicate Cloud Pattern Setup

```glsl
vec3 normal = normalize(vNormal);
vec3 viewDir = normalize(vViewDirection);
vec3 diffuseNormal = normalize(vSphereNormalW);

// Create silicate cloud patterns with high reflectivity and thermal emission
float viewAngle = dot(viewDir, normal);
float atmosphereIntensity = 1.0 - abs(viewAngle);
```

**Atmospheric Setup:**

- **View Angle**: Calculates angle between view direction and normal
- **Atmosphere Intensity**: Stronger effects at edges (limb darkening)

### 2. Silicate Cloud Formation

```glsl
// Create dynamic silicate cloud formations with varied scales
vec3 cloudCoord = vUnitSamplePoint * 2.0 + time * 0.002;
vec3 bandCoord = vUnitSamplePoint * 1.2 + time * 0.001;
vec3 thermalCoord = vUnitSamplePoint * 3.5 + time * 0.003;
vec3 structureCoord = vUnitSamplePoint * 0.9 + time * 0.0015;

// Natural atmospheric patterns using FBM noise with enhanced contrast
float silicateClouds = fbm(cloudCoord);
float ironBands = fbm(bandCoord);
float thermalSpots = fbm(thermalCoord);
float cloudStructure = fbm(structureCoord);
```

**Cloud Formation:**

- **Cloud Coordinates**: 2.0 scale with 0.002 time animation
- **Band Coordinates**: 1.2 scale with 0.001 time animation
- **Thermal Coordinates**: 3.5 scale with 0.003 time animation
- **Structure Coordinates**: 0.9 scale with 0.0015 time animation

### 3. Enhanced Contrast Patterns

```glsl
// Enhance contrast and make patterns more pronounced
silicateClouds = smoothstep(-0.2, 0.4, silicateClouds);
ironBands = smoothstep(-0.1, 0.3, ironBands);
thermalSpots = smoothstep(0.2, 0.6, thermalSpots);
cloudStructure = smoothstep(-0.3, 0.5, cloudStructure);
```

**Contrast Enhancement:**

- **Silicate Clouds**: -0.2 to 0.4 range for pronounced cloud formations
- **Iron Bands**: -0.1 to 0.3 range for visible iron variations
- **Thermal Spots**: 0.2 to 0.6 range for strong thermal hot spots
- **Cloud Structure**: -0.3 to 0.5 range for visible cloud structure

### 4. Silicate Cloud Color Calculation

```glsl
// More pronounced cloud mixing for visible atmospheric features
vec3 finalCloudColor = mix(baseColor, cloudColor, silicateClouds * 0.8); // Mix base with cloud color
finalCloudColor *= (0.6 + ironBands * 0.6); // More visible iron variations
finalCloudColor += vec3(0.3, 0.15, 0.08) * thermalSpots * 0.8; // Stronger thermal hot spots
finalCloudColor *= (0.8 + cloudStructure * 0.4); // More visible cloud structure

// Apply atmospheric effects with more contrast
finalCloudColor = mix(baseColor, finalCloudColor, 0.5 + atmosphereIntensity * 0.5);
```

**Color Calculation:**

- **Cloud Mixing**: 0.8 factor for pronounced cloud formations
- **Iron Variations**: 0.6 to 1.2 range for visible iron variations
- **Thermal Hot Spots**: Reddish-orange thermal spots (0.3, 0.15, 0.08)
- **Cloud Structure**: 0.8 to 1.2 range for visible cloud structure
- **Atmospheric Mixing**: 0.5 to 1.0 range for more contrast

### 5. Lighting Calculation

```glsl
// Much darker ambient for proper night sides
vec3 ambient = finalCloudColor * (uDynamicAmbientIntensity * 0.05);
vec3 totalDiffuse = vec3(0.0);
vec3 totalSpecular = vec3(0.0);

for (int i = 0; i < uNumLights; i++) {
  vec3 lightDir = normalize(uLights[i].position - vPosition);

  // Create a much wider, smoother transition around the terminator
  float dotProduct = dot(diffuseNormal, lightDir);
  float terminatorTransition = smoothstep(-0.5, 0.5, dotProduct);

  float ndl = max(dotProduct, 0.0);
  ndl = clamp01(ndl);

  float shadow = getShadow(vPosition, lightDir);

  // Apply lighting with smooth terminator transition
  float lightContribution = terminatorTransition * shadow;
  totalDiffuse += finalCloudColor * ndl * lightContribution * 0.35 * uLights[i].color * uLights[i].intensity;

  // Specular component with smooth falloff
  vec3 halfAngle = normalize(viewDir + lightDir);
  float specComp = max(0.0, dot(normal, halfAngle));
  specComp = clamp01(specComp);
  specComp = pow(specComp, 24.0); // Moderate shininess

  // Apply specular with smoother falloff
  float specularFalloff = smoothstep(-0.3, 0.4, dotProduct); // Gentle falloff for specular
  totalSpecular += vec3(0.015) * specComp * lightContribution * specularFalloff * uLights[i].color * uLights[i].intensity;

  // Add subtle night side illumination
  float nightContribution = (1.0 - terminatorTransition) * 0.03; // Slight night glow for bright planets
  totalDiffuse += finalCloudColor * nightContribution * uLights[i].color * uLights[i].intensity;
}
```

**Lighting Features:**

- **Moderate Diffuse**: 0.35 factor for moderate diffuse lighting
- **Moderate Specular**: Power 24.0 for moderate shininess
- **Gentle Specular Falloff**: -0.3 to 0.4 range for gentle specular control
- **Night Glow**: 0.03 factor for bright planets

### 6. Rim Lighting

```glsl
// Rim Lighting (Class V - subtle blue/white glow)
float rimDot = 1.0 - max(dot(viewDir, normal), 0.0);
float rimIntensity = pow(rimDot, 2.5); // Moderate falloff
rimIntensity = clamp01(rimIntensity * 0.5); // Moderate intensity
vec3 rimColor = mix(baseColor, vec3(1.0), 0.5) * 1.1; // Subtle blend
vec3 rim = rimColor * rimIntensity;
```

**Rim Lighting:**

- **Moderate Falloff**: Power 2.5 for moderate rim effect
- **Moderate Intensity**: 0.5 intensity factor
- **Subtle Blend**: 0.5 white blending with 1.1 brightness multiplier

### 7. Thermal Emission

```glsl
// Emissive component for heat glow
vec3 emission = emissiveColor * emissiveIntensity;
```

**Thermal Emission:**

- **Emissive Color**: Configurable emissive color (typically dull red/orange)
- **Emissive Intensity**: Configurable intensity for heat glow

### 8. Final Color Composition

```glsl
// Combine components
vec3 finalColor = ambient + totalDiffuse + totalSpecular + rim + emission;
```

### 9. Storm Map Overlay

```glsl
// Apply storm overlay if available
if (hasStormMap) {
  vec2 stormUv = vec2(
    0.5 + atan(vUnitSamplePoint.z, vUnitSamplePoint.x) / (2.0 * 3.14159),
    0.5 - asin(vUnitSamplePoint.y) / 3.14159
  );

  vec4 stormColor = texture2D(stormMap, stormUv);
  // Blend the storm with the procedural texture, use higher alpha for hot jupiters
  finalColor = mix(finalColor, stormColor.rgb, stormColor.a * 1.0);
}
```

**Storm Overlay:**

- **Higher Alpha**: 1.0 factor for hot jupiters (vs 0.5-0.8 for other classes)

### 10. Final Color Output

```glsl
// Clamp before gamma correction to prevent artifacts
finalColor = clamp(finalColor, 0.0, 1.0);

// Apply basic gamma correction
finalColor = pow(finalColor, vec3(1.0 / 2.2));

gl_FragColor = vec4(finalColor, 1.0);
```

## Shadow Casting System

### Ray-Sphere Intersection

```glsl
float getShadow(vec3 fragPos, vec3 lightDir) {
  float finalShadow = 1.0;

  for (int i = 0; i < uNumShadowCasters; i++) {
    if (uShadowCasters[i].radius <= 0.0) continue;

    vec3 oc = fragPos - uShadowCasters[i].position;
    float b = dot(oc, lightDir);
    float c = dot(oc, oc) - (uShadowCasters[i].radius * uShadowCasters[i].radius);
    float discriminant = b * b - c;

    if (discriminant > 0.0) {
      float t = -b - sqrt(discriminant);
      if (t > 0.001) {
        float penumbra = uShadowCasters[i].radius * 0.8;
        float penumbraSq = penumbra * penumbra;

        float currentShadow = 1.0 - smoothstep(0.0, penumbraSq, discriminant);
        finalShadow = min(finalShadow, currentShadow);
      }
    }
  }
  return finalShadow;
}
```

## Class V Specific Features

### Silicate Cloud Characteristics

- **Enhanced Fractal Noise**: Advanced fractal noise for detailed cloud formations
- **Silicate Dust Clouds**: Realistic silicate dust cloud rendering
- **Thermal Emission**: Emissive heat glow for extremely hot atmospheres
- **Dusty Appearance**: Specialized rendering for silicate-rich atmospheres

### Silicate Cloud Parameters

| Pattern             | Scale | Time Animation | Smoothstep Range | Effect                      |
| ------------------- | ----- | -------------- | ---------------- | --------------------------- |
| **Silicate Clouds** | 2.0   | 0.002          | -0.2 to 0.4      | Pronounced cloud formations |
| **Iron Bands**      | 1.2   | 0.001          | -0.1 to 0.3      | Visible iron variations     |
| **Thermal Spots**   | 3.5   | 0.003          | 0.2 to 0.6       | Strong thermal hot spots    |
| **Cloud Structure** | 0.9   | 0.0015         | -0.3 to 0.5      | Visible cloud structure     |

### Lighting Characteristics

| Component            | Class V Value | Purpose                              |
| -------------------- | ------------- | ------------------------------------ |
| **Diffuse Factor**   | 0.35          | Moderate diffuse lighting            |
| **Specular Power**   | 24.0          | Moderate shininess                   |
| **Specular Falloff** | -0.3 to 0.4   | Gentle specular control              |
| **Rim Intensity**    | 0.5           | Moderate rim lighting                |
| **Rim Falloff**      | 2.5           | Moderate rim falloff                 |
| **Rim Brightness**   | 1.1           | Subtle brightness increase           |
| **Night Glow**       | 0.03          | Slight night glow for bright planets |

### Visual Effects

- **Silicate Cloud Formations**: Realistic silicate dust cloud formations
- **Thermal Emission**: Emissive heat glow for extremely hot atmospheres
- **Enhanced Contrast**: Pronounced atmospheric features with enhanced contrast
- **Dusty Appearance**: Specialized rendering for silicate-rich atmospheres

## Performance Optimizations

### Enhanced Noise

- **FBM Noise**: 4-octave fractal noise for detailed patterns
- **High Resolution**: 8.0 resolution for detailed cloud formations
- **Efficient Calculations**: Optimized noise generation

### Lighting Optimization

- **Smooth Terminator**: Wide transition around day/night boundary
- **Efficient Shadow Calculations**: Optimized ray-sphere intersection tests
- **Penumbra Effects**: Soft shadow edges for realistic appearance

## Integration

The fragment shader works with:

- **Vertex Shader**: Class V vertex shader provides world position and normal data
- **Material**: [[celestials/gas-giants/GasGiantMaterials|Class V Material]] manages uniforms and updates
- **Renderer**: [[celestials/gas-giants/ClassVGasGiantRenderer|Class V Gas Giant Renderer]] creates geometry and manages updates

## Dependencies

- **Enhanced Fractal Noise**: Advanced noise generation for silicate clouds
- **Lighting System**: Multi-light source support
- **Shadow Casting**: Real-time shadow calculations
- **Storm Textures**: Optional storm map overlay
- **Thermal Emission**: Emissive heat glow system

## 🔗 Related

- [[celestials/gas-giants/class-v.vertex.glsl|Class V Vertex Shader]] - Vertex shader that provides input data
- [[celestials/gas-giants/GasGiantMaterials|Class V Material]] - Material that uses this shader
- [[celestials/gas-giants/ClassVGasGiantRenderer|Class V Gas Giant Renderer]] - Renderer that manages this shader
- [[celestials/gas-giants/class-i.fragment.glsl|Class I Fragment Shader]] - Class I fragment shader for comparison
- [[celestials/gas-giants/class-ii.fragment.glsl|Class II Fragment Shader]] - Class II fragment shader for comparison
- [[celestials/gas-giants/class-iii.fragment.glsl|Class III Fragment Shader]] - Class III fragment shader for comparison
- [[celestials/gas-giants/class-iv.fragment.glsl|Class IV Fragment Shader]] - Class IV fragment shader for comparison
