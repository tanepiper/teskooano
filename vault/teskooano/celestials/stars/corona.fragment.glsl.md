---
aliases: [corona.fragment.glsl]
tags: [renderer, threejs, stars, shader, fragment]
type: shader
package: "@teskooano/celestials-stars"
file: "src/shaders/corona.fragment.glsl"
status: active
---

# corona.fragment.glsl

Fragment shader for corona effects in star rendering.

## Overview

The corona fragment shader creates atmospheric corona effects around stars. It generates dynamic, noise-based patterns with pulsing animation and smooth edge fading to create realistic stellar corona effects.

## Shader Features

- **Atmospheric Corona**: Creates realistic stellar corona effects
- **Noise-Based Patterns**: Uses fractal Brownian motion for natural patterns
- **Pulsing Animation**: Time-based pulsing effects
- **Edge Fading**: Smooth edge transitions
- **Color Blending**: Inner and outer color blending
- **Alpha Transparency**: Proper alpha channel handling

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

### Color Uniform

```glsl
uniform vec3 uStarColor;
```

Base star color for corona effects.

### Opacity Uniform

```glsl
uniform float uOpacity;
```

Overall opacity of the corona.

### Animation Uniforms

```glsl
uniform float uPulseSpeed;
uniform float uNoiseScale;
```

- **uPulseSpeed**: Speed of pulsing animation
- **uNoiseScale**: Scale of noise patterns

## Varying Variables

### vUv

```glsl
varying vec2 vUv;
```

Texture coordinates from vertex shader.

### vNormal

```glsl
varying vec3 vNormal;
```

Transformed normal from vertex shader.

### vPosition

```glsl
varying vec3 vPosition;
```

Vertex position from vertex shader.

## Noise Functions

### Simple Noise

```glsl
float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}
```

**Purpose:**

- Generates simple pseudo-random noise
- Uses dot product for randomness
- Returns values between 0 and 1
- Fast and efficient

### Fractal Brownian Motion

```glsl
float fbm(vec2 p) {
    float sum = 0.0;
    float amp = 1.0;
    float freq = 1.0;
    for(int i = 0; i < 4; i++) {
        sum += noise(p * freq) * amp;
        amp *= 0.5;
        freq *= 2.0;
        p = p * 1.1 + vec2(0.5, 0.8);
    }
    return sum;
}
```

**Purpose:**

- Combines multiple noise octaves
- Creates complex, natural patterns
- 4 octaves for detail
- Amplitude and frequency scaling

## Main Function

```glsl
void main() {
    vec2 centeredUV = vUv * 2.0 - 1.0;
    float dist = length(centeredUV);

    float edgeFade = smoothstep(0.8, 1.05, dist);

    float basePattern = fbm((centeredUV * 0.5 + 0.5) * uNoiseScale + uTime * 0.03);
    float detailPattern = fbm((centeredUV * 1.2 + 0.5) * uNoiseScale * 2.0 + uTime * 0.05);
    float pattern = basePattern * 0.7 + detailPattern * 0.3;

    float pulse = 0.9 + sin(uTime * uPulseSpeed) * 0.1;

    float alpha = (1.0 - edgeFade) * uOpacity * pulse * 1.2;
    alpha *= (0.6 + pattern * 0.4);
    alpha = max(alpha, 0.05 * uOpacity * (1.0 - edgeFade));

    vec3 innerColor = mix(uStarColor * 1.3, vec3(1.0, 0.95, 0.8), 0.15);
    vec3 outerColor = mix(uStarColor * 0.9, vec3(1.0, 0.8, 0.5), 0.25);
    vec3 finalColor = mix(innerColor, outerColor, smoothstep(0.0, 0.75, dist));

    finalColor = mix(finalColor, finalColor * (1.0 + pattern * 0.3), 0.4);

    gl_FragColor = vec4(finalColor, alpha);

    #include <logdepthbuf_fragment>
}
```

## UV Processing

### Centered UV Coordinates

```glsl
vec2 centeredUV = vUv * 2.0 - 1.0;
```

**Process:**

- Converts UV from [0,1] to [-1,1]
- Centers coordinates around origin
- Used for distance calculations
- Enables radial effects

### Distance Calculation

```glsl
float dist = length(centeredUV);
```

**Process:**

- Calculates distance from center
- Used for radial effects
- Range from 0 to 1.414
- Enables edge fading

## Edge Fading

### Edge Fade Calculation

```glsl
float edgeFade = smoothstep(0.8, 1.05, dist);
```

**Process:**

- Creates smooth edge transition
- Fades from 0.8 to 1.05
- Uses smoothstep for smooth transition
- Creates corona edge effect

## Noise Pattern Generation

### Base Pattern

```glsl
float basePattern = fbm((centeredUV * 0.5 + 0.5) * uNoiseScale + uTime * 0.03);
```

**Process:**

- Creates base noise pattern
- Scales UV coordinates
- Adds time-based animation
- Uses noise scale uniform

### Detail Pattern

```glsl
float detailPattern = fbm((centeredUV * 1.2 + 0.5) * uNoiseScale * 2.0 + uTime * 0.05);
```

**Process:**

- Creates detailed noise pattern
- Different scale and time offset
- Higher frequency noise
- Adds fine details

### Pattern Combination

```glsl
float pattern = basePattern * 0.7 + detailPattern * 0.3;
```

**Process:**

- Combines base and detail patterns
- 70% base, 30% detail
- Creates complex pattern
- Balances detail and performance

## Pulsing Animation

### Pulse Calculation

```glsl
float pulse = 0.9 + sin(uTime * uPulseSpeed) * 0.1;
```

**Process:**

- Creates pulsing effect
- Range from 0.8 to 1.0
- Uses sine wave for smooth animation
- Configurable pulse speed

## Alpha Calculation

### Base Alpha

```glsl
float alpha = (1.0 - edgeFade) * uOpacity * pulse * 1.2;
```

**Process:**

- Combines edge fade, opacity, and pulse
- Multiplies by 1.2 for brightness
- Creates base alpha value
- Accounts for all effects

### Pattern Influence

```glsl
alpha *= (0.6 + pattern * 0.4);
```

**Process:**

- Modulates alpha by pattern
- Range from 0.6 to 1.0
- Adds variation to alpha
- Creates dynamic transparency

### Minimum Alpha

```glsl
alpha = max(alpha, 0.05 * uOpacity * (1.0 - edgeFade));
```

**Process:**

- Ensures minimum alpha
- Prevents complete transparency
- Maintains visibility
- Edge-aware minimum

## Color Generation

### Inner Color

```glsl
vec3 innerColor = mix(uStarColor * 1.3, vec3(1.0, 0.95, 0.8), 0.15);
```

**Process:**

- Creates inner corona color
- Brightens star color by 30%
- Mixes with warm white
- 15% warm white influence

### Outer Color

```glsl
vec3 outerColor = mix(uStarColor * 0.9, vec3(1.0, 0.8, 0.5), 0.25);
```

**Process:**

- Creates outer corona color
- Darkens star color by 10%
- Mixes with warm orange
- 25% warm orange influence

### Color Blending

```glsl
vec3 finalColor = mix(innerColor, outerColor, smoothstep(0.0, 0.75, dist));
```

**Process:**

- Blends inner and outer colors
- Uses distance for blend factor
- Smooth transition from 0 to 0.75
- Creates radial color gradient

## Pattern Enhancement

### Pattern Color Modulation

```glsl
finalColor = mix(finalColor, finalColor * (1.0 + pattern * 0.3), 0.4);
```

**Process:**

- Enhances color with pattern
- Brightens color by up to 30%
- 40% pattern influence
- Adds dynamic variation

## Output

### Final Color

```glsl
gl_FragColor = vec4(finalColor, alpha);
```

**Process:**

- Combines final color and alpha
- Creates RGBA output
- Proper transparency handling
- Ready for blending

## Performance Optimizations

### Efficient Noise

- **Simple Noise**: Fast pseudo-random noise
- **Limited Octaves**: 4 octaves for balance
- **Optimized Calculations**: Efficient math operations

### GPU Optimization

- **Vector Operations**: Uses vector operations
- **Built-in Functions**: Leverages built-in GLSL functions
- **Minimal Branches**: Reduces branching

## Visual Effects

### Corona Appearance

- **Atmospheric**: Realistic atmospheric corona
- **Dynamic**: Time-based animation
- **Natural**: Noise-based patterns
- **Smooth**: Smooth edge transitions

### Animation Effects

- **Pulsing**: Continuous pulsing
- **Noise Movement**: Animated noise patterns
- **Color Variation**: Dynamic color changes
- **Alpha Variation**: Dynamic transparency

## Compatibility

### Three.js Versions

- **Version**: Compatible with Three.js 0.179.1
- **Features**: Uses standard Three.js features
- **Extensions**: No custom extensions required

### GPU Compatibility

- **OpenGL ES**: Compatible with OpenGL ES 2.0+
- **WebGL**: Compatible with WebGL 1.0+
- **Mobile**: Optimized for mobile GPUs

## Error Handling

### Validation

- **Range Checking**: Validates all uniform values
- **Division by Zero**: Prevents division by zero errors
- **NaN Prevention**: Prevents NaN values

### Fallbacks

- **Default Values**: Provides default values for missing data
- **Error Recovery**: Recovers from calculation errors
- **Graceful Degradation**: Maintains functionality with errors

## 🔗 Related

- [[celestials/stars/corona.vertex.glsl|Corona Vertex Shader]] - Vertex shader that provides data for this fragment shader
- [[celestials/stars/CoronaMaterial|Corona Material]] - Material that uses this shader
- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Renderer that creates the geometry for this shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[data/data-types/data-types|Data Types]] - Type definitions
