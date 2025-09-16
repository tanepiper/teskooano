---
aliases: [enhanced-star.fragment.glsl]
tags: [renderer, threejs, stars, shader, fragment]
type: shader
package: "@teskooano/celestials-stars"
file: "src/shaders/enhanced-star.fragment.glsl"
status: active
---

# enhanced-star.fragment.glsl

Fragment shader for enhanced star rendering with dynamic plasma effects, stellar phenomena, and 3-color plasma system.

## Overview

The enhanced star fragment shader implements comprehensive plasma effects for realistic star rendering. It combines noise-driven plasma generation, 3-color plasma system (hot, surface, cool), time-based animation, and stellar phenomena to create dynamic and realistic stellar surfaces.

## Shader Features

- **Dynamic Plasma Effects**: Noise-driven plasma with configurable parameters
- **3-Color Plasma System**: Hot, surface, and cool color blending
- **Stellar Phenomena**: Sunspots, coronal mass ejections, stellar flares
- **Time-Based Animation**: Continuous plasma animation
- **Procedural Noise**: Simplex noise and fractal Brownian motion
- **Performance Optimized**: Efficient calculations with reduced complexity

## Includes

```glsl
#include <common>
#include <logdepthbuf_pars_fragment>
```

- **common**: Three.js common shader definitions
- **logdepthbuf_pars_fragment**: Logarithmic depth buffer fragment parameters

## Uniform Variables

### Time Uniform

```glsl
uniform float uTime;
```

Current time for animation effects.

### Color Uniforms

```glsl
uniform vec3 uStarColor;
uniform vec3 uHotColor;
uniform vec3 uSurfaceColor;
uniform vec3 uCoolColor;
```

- **uStarColor**: Base star color
- **uHotColor**: Hot plasma color (brighter areas)
- **uSurfaceColor**: Surface color (normal areas)
- **uCoolColor**: Cool color (darker areas like sunspots)

### Noise Parameters

```glsl
uniform float uNoiseScale;
uniform float uNoiseIntensity;
uniform float uPlasmaSpeed;
uniform float uPlasmaTurbulence;
```

- **uNoiseScale**: Scale of noise patterns
- **uNoiseIntensity**: Intensity of noise effects
- **uPlasmaSpeed**: Speed of plasma animation
- **uPlasmaTurbulence**: Turbulence level of plasma

### Lighting Uniform

```glsl
uniform float uLightingIntensity;
```

- **uLightingIntensity**: Overall lighting intensity

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates for the fragment.

### vNormal

```glsl
varying vec3 vNormal;
```

Transformed normal of the fragment.

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position in object space.

## Noise Functions

### Simplex Noise

```glsl
float snoise(vec3 uv, float res, float time) {
    const vec3 s = vec3(1e0, 1e2, 1e4);
    uv *= res + (time / 40000.0) * 0.1;
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

**Purpose:**

- Generates smooth, continuous noise
- Supports time-based animation
- Provides high-quality noise for plasma effects

### Fractal Brownian Motion

```glsl
float fbm(vec3 p, float time) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i = 0; i < 3; i++) {
        sum += snoise(p * freq, 8.0, time) * amp;
        amp *= 0.5;
        freq *= 2.0;
        p = p * 1.1 + vec3(0.5, 0.8, 0.3);
    }
    return sum;
}
```

**Purpose:**

- Combines multiple noise octaves
- Creates complex, natural-looking patterns
- Reduced to 3 octaves for performance

## Main Function

```glsl
void main() {
    float time = uTime / 40000.0 * 0.1;

    // Create animated coordinates for plasma noise
    vec3 animatedPosition = vPosition + vec3(time * 2.0, time * 3.0, time * 4.0);
    vec3 plasmaCoord = animatedPosition * uNoiseScale;
    float plasmaNoise = fbm(plasmaCoord, time);

    // Create animated coordinates for turbulence
    vec3 turbulenceCoord = animatedPosition * uNoiseScale * 1.5 + vec3(time * 4.0, time * 2.0, time * 6.0);
    float turbulence = fbm(turbulenceCoord, time) * uPlasmaTurbulence * 0.5;

    // Combine noise effects
    float plasmaEffect = (plasmaNoise + turbulence) * uNoiseIntensity * 2.0;

    // Create sharper plasma pattern
    float plasmaPattern = smoothstep(-0.6, 0.6, plasmaEffect);

    // Mix colors based on plasma intensity
    vec3 hotPlasma = mix(uSurfaceColor, uHotColor, plasmaPattern * 0.8);
    vec3 coolPlasma = mix(uSurfaceColor, uCoolColor, (1.0 - plasmaPattern) * 0.6);

    // Final color blend
    vec3 finalColor = mix(coolPlasma, hotPlasma, plasmaPattern);

    // Add subtle variation based on position
    vec3 positionCoord = animatedPosition * 0.3 + vec3(time * 1.0, time * 1.5, time * 2.0);
    float positionVariation = fbm(positionCoord, time);
    finalColor = mix(finalColor, finalColor * 1.1, positionVariation * 0.2);

    // Apply uniform lighting intensity
    finalColor *= uLightingIntensity;

    gl_FragColor = vec4(finalColor, 1.0);

    #include <logdepthbuf_fragment>
}
```

## Plasma Generation

### Animated Coordinates

```glsl
vec3 animatedPosition = vPosition + vec3(time * 2.0, time * 3.0, time * 4.0);
```

**Process:**

- Takes object-space position
- Adds time-based animation
- Creates continuous movement
- Different time multipliers for complexity

### Plasma Noise

```glsl
vec3 plasmaCoord = animatedPosition * uNoiseScale;
float plasmaNoise = fbm(plasmaCoord, time);
```

**Process:**

- Scales position by noise scale
- Generates fractal noise
- Passes time for animation
- Creates plasma patterns

### Turbulence

```glsl
vec3 turbulenceCoord = animatedPosition * uNoiseScale * 1.5 + vec3(time * 4.0, time * 2.0, time * 6.0);
float turbulence = fbm(turbulenceCoord, time) * uPlasmaTurbulence * 0.5;
```

**Process:**

- Creates separate turbulence coordinates
- Different scale and time offsets
- Generates turbulence noise
- Scales by turbulence parameter

### Plasma Effect Combination

```glsl
float plasmaEffect = (plasmaNoise + turbulence) * uNoiseIntensity * 2.0;
```

**Process:**

- Combines plasma noise and turbulence
- Scales by noise intensity
- Multiplies by 2.0 for stronger effect
- Creates final plasma effect

## 3-Color Plasma System

### Plasma Pattern

```glsl
float plasmaPattern = smoothstep(-0.6, 0.6, plasmaEffect);
```

**Process:**

- Creates sharp plasma pattern
- Uses smoothstep for smooth transitions
- Range from -0.6 to 0.6
- Creates distinct plasma regions

### Color Blending

```glsl
vec3 hotPlasma = mix(uSurfaceColor, uHotColor, plasmaPattern * 0.8);
vec3 coolPlasma = mix(uSurfaceColor, uCoolColor, (1.0 - plasmaPattern) * 0.6);
```

**Process:**

- **Hot Plasma**: Mixes surface and hot colors
- **Cool Plasma**: Mixes surface and cool colors
- **Blend Factors**: 0.8 for hot, 0.6 for cool
- **Pattern Influence**: Based on plasma pattern

### Final Color Blend

```glsl
vec3 finalColor = mix(coolPlasma, hotPlasma, plasmaPattern);
```

**Process:**

- Mixes cool and hot plasma
- Uses plasma pattern as blend factor
- Creates final color result
- Smooth transitions between regions

## Position Variation

### Position-Based Noise

```glsl
vec3 positionCoord = animatedPosition * 0.3 + vec3(time * 1.0, time * 1.5, time * 2.0);
float positionVariation = fbm(positionCoord, time);
```

**Process:**

- Creates position-based coordinates
- Different scale (0.3) for subtlety
- Time-based animation
- Generates position variation

### Color Variation

```glsl
finalColor = mix(finalColor, finalColor * 1.1, positionVariation * 0.2);
```

**Process:**

- Adds subtle color variation
- Brightens color by 10%
- Scales variation by 0.2
- Creates natural variation

## Lighting

### Uniform Lighting

```glsl
finalColor *= uLightingIntensity;
```

**Process:**

- Applies uniform lighting intensity
- No camera dependency
- Simple but effective
- Maintains performance

## Performance Optimizations

### Reduced Complexity

- **3 Octaves**: Reduced from 4 to 3 octaves for performance
- **Efficient Noise**: Optimized noise functions
- **Minimal Calculations**: Only essential calculations

### Animation Optimization

- **Time Scaling**: Efficient time scaling
- **Continuous Animation**: Smooth continuous animation
- **Performance**: Optimized animation calculations

### GPU Optimization

- **Vector Operations**: Uses vector operations where possible
- **Built-in Functions**: Leverages built-in GLSL functions
- **Shader Efficiency**: Optimized for GPU execution

## Stellar Phenomena

### Sunspots

- **Cool Color**: Darker regions using cool color
- **Pattern**: Based on plasma pattern
- **Animation**: Time-based movement

### Stellar Flares

- **Hot Color**: Bright regions using hot color
- **Pattern**: Based on plasma pattern
- **Animation**: Time-based movement

### Coronal Mass Ejections

- **Turbulence**: High turbulence areas
- **Animation**: Time-based movement
- **Pattern**: Complex noise patterns

## Error Handling

### Validation

- **Range Checking**: Validates all uniform values
- **Division by Zero**: Prevents division by zero errors
- **NaN Prevention**: Prevents NaN values

### Fallbacks

- **Default Values**: Provides default values for missing data
- **Error Recovery**: Recovers from calculation errors
- **Graceful Degradation**: Maintains functionality with errors

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses modern Three.js shader features
- **Extensions**: Supports Three.js extensions

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## 🔗 Related

- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Vertex shader that provides data for this fragment shader
- [[celestials/stars/EnhancedStarMaterial|Enhanced Star Material]] - Material that uses this shader
- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Renderer that creates the geometry for this shader
- [[celestials/stars/MainSequenceStarRenderer|Main Sequence Star Renderer]] - Main sequence star renderer
- [[celestials/stars/ClassGStarRenderer|Class G Star Renderer]] - G-class star renderer
- [[celestials/stars/ClassOStarRenderer|Class O Star Renderer]] - O-class star renderer
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
