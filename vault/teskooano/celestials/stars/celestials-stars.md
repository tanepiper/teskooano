---
aliases: [celestials-stars]
tags: [renderer, threejs, stars]
type: index
package: "@teskooano/celestials-stars"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-celestial",
    "@teskooano/renderer-threejs-lighting",
    "three",
  ]
classes:
  ["MainSequenceStarRenderer", "ClassGStarRenderer", "EnhancedStarMaterial"]
status: active
---

# Celestials: Stars

Comprehensive star rendering system with support for all stellar evolutionary stages, spectral classes, and stellar remnants with realistic plasma dynamics and spectral-accurate colors.

## Overview

The `@teskooano/celestials-stars` package provides a complete star rendering system based on stellar evolution theory. It supports main sequence stars (O, B, A, F, G, K, M classes), post-main sequence evolution (giants, supergiants), stellar remnants (white dwarfs, neutron stars), and black holes with gravitational lensing effects.

## Key Features

### Stellar Evolution Support

- **Main Sequence Stars**: O, B, A, F, G, K, M spectral classes with accurate physical properties
- **Post-Main Sequence**: Subgiants, red giants, horizontal branch, AGB, post-AGB stars
- **Supergiants**: Regular supergiants, hypergiants, Wolf-Rayet stars
- **Stellar Remnants**: White dwarfs, neutron stars (pulsars, magnetars), black holes

### Spectral-Accurate Rendering

- **B-V Color Index**: Accurate color conversion from stellar photometry data
- **Physical Properties**: Mass, radius, luminosity, temperature-based rendering
- **Spectral Subclasses**: Support for 0-9 subclasses within each spectral class
- **Color Palettes**: Hot, surface, and cool color variations for realistic plasma effects

### Advanced Plasma Dynamics

- **Procedural Plasma**: Noise-driven plasma effects with configurable turbulence
- **Stellar Phenomena**: Sunspots, coronal mass ejections, stellar flares
- **Animation**: Time-based plasma animation with realistic stellar activity
- **Corona Effects**: Atmospheric corona with pulsing and noise-based patterns

### LOD System

- **High Detail**: Full plasma effects with corona
- **Medium Detail**: Simplified geometry with basic effects
- **Billboard**: Distant viewing with maintained visibility
- **Performance**: Efficient LOD switching based on distance

### Special Effects

- **Gravitational Lensing**: Black hole effects with spacetime distortion
- **Pulsar Effects**: Rotating neutron star emission patterns
- **Magnetar Effects**: Strong magnetic field visualization
- **Corona Rendering**: Multi-layer atmospheric effects

## Architecture

### Base Classes

#### [[celestials/stars/BaseStarRenderer|Base Star Renderer]]

Abstract base class for all star renderers with common functionality.

**Key Features:**

- LOD management and billboard creation
- Corona effect generation
- Material management and uniform updates
- Lighting integration

#### [[celestials/stars/BaseStarMaterial|Base Star Material]]

Base material class for star rendering with plasma effects.

**Key Features:**

- Plasma noise parameters
- Color palette management
- Time-based animation
- Uniform lighting

#### [[celestials/stars/EnhancedStarMaterial|Enhanced Star Material]]

Advanced material with 3-color plasma system and spectral properties.

**Key Features:**

- Hot, surface, and cool color blending
- Configurable noise parameters
- Spectral property integration
- Dynamic color updates

### Main Sequence Stars

#### [[celestials/stars/MainSequenceStarRenderer|Main Sequence Star Renderer]]

Base renderer for main sequence stars with corona effects.

#### Spectral Class Renderers

- **[[celestials/stars/ClassOStarRenderer|Class O Star Renderer]]**: O-class stars (30,000-50,000K, blue-white)
- **[[celestials/stars/ClassBStarRenderer|Class B Star Renderer]]**: B-class stars (10,000-30,000K, blue-white)
- **[[celestials/stars/ClassAStarRenderer|Class A Star Renderer]]**: A-class stars (7,500-10,000K, white)
- **[[celestials/stars/ClassFStarRenderer|Class F Star Renderer]]**: F-class stars (6,000-7,500K, yellow-white)
- **[[celestials/stars/ClassGStarRenderer|Class G Star Renderer]]**: G-class stars (5,200-6,000K, yellow) - includes our Sun
- **[[celestials/stars/ClassKStarRenderer|Class K Star Renderer]]**: K-class stars (3,700-5,200K, orange)
- **[[celestials/stars/ClassMStarRenderer|Class M Star Renderer]]**: M-class stars (2,400-3,700K, red)

### Post-Main Sequence Stars

#### [[celestials/stars/SubgiantRenderer|Subgiant Renderer]]

Stars transitioning from main sequence to giant phase.

#### [[celestials/stars/RedGiantRenderer|Red Giant Renderer]]

Large, cool stars in the red giant phase.

#### [[celestials/stars/HorizontalBranchRenderer|Horizontal Branch Renderer]]

Stars in the horizontal branch phase of evolution.

#### [[celestials/stars/AGBRenderer|AGB Renderer]]

Asymptotic Giant Branch stars with complex evolution.

#### [[celestials/stars/PostAGBRenderer|Post-AGB Renderer]]

Post-AGB stars transitioning to planetary nebulae.

#### [[celestials/stars/SupergiantRenderer|Supergiant Renderer]]

Massive stars in the supergiant phase.

#### [[celestials/stars/HypergiantRenderer|Hypergiant Renderer]]

Extremely massive hypergiant stars.

#### [[celestials/stars/WolfRayetRenderer|Wolf-Rayet Renderer]]

Wolf-Rayet stars with strong stellar winds.

### Stellar Remnants

#### [[celestials/stars/NeutronStarRenderer|Neutron Star Renderer]]

Neutron star renderer with subtype support.

**Subtypes:**

- **Standard**: Basic neutron star
- **Pulsar**: Rotating neutron star with emission beams
- **Magnetar**: Neutron star with extremely strong magnetic fields

#### [[celestials/stars/WhiteDwarfRenderer|White Dwarf Renderer]]

White dwarf star renderer with cooling effects.

#### [[celestials/stars/SchwarzschildBlackHoleRenderer|Schwarzschild Black Hole Renderer]]

Non-rotating black hole with Schwarzschild geometry.

#### [[celestials/stars/KerrBlackHoleRenderer|Kerr Black Hole Renderer]]

Rotating black hole with Kerr geometry and frame dragging.

### Corona System

#### [[celestials/stars/CoronaMaterial|Corona Material]]

Material for atmospheric corona effects around stars.

**Features:**

- Pulsing animation
- Noise-based patterns
- Additive blending
- Configurable opacity and scale

## 🔗 Related

- [[celestials/stars/BaseStarRenderer|Base Star Renderer]] - Base renderer class
- [[celestials/stars/BaseStarMaterial|Base Star Material]] - Base material class
- [[celestials/stars/EnhancedStarMaterial|Enhanced Star Material]] - Advanced material with plasma effects
- [[celestials/stars/MainSequenceStarRenderer|Main Sequence Star Renderer]] - Main sequence star renderer
- [[celestials/stars/ClassGStarRenderer|Class G Star Renderer]] - G-class star renderer
- [[celestials/stars/ClassOStarRenderer|Class O Star Renderer]] - O-class star renderer
- [[celestials/stars/NeutronStarRenderer|Neutron Star Renderer]] - Neutron star renderer
- [[celestials/stars/CoronaMaterial|Corona Material]] - Corona effect material
- [[celestials/stars/createMesh|Create Mesh Factory]] - Factory function for mesh creation
- [[celestials/stars/enhanced-star.vertex.glsl|Enhanced Star Vertex Shader]] - Enhanced star vertex shader
- [[celestials/stars/enhanced-star.fragment.glsl|Enhanced Star Fragment Shader]] - Enhanced star fragment shader
- [[celestials/stars/corona.vertex.glsl|Corona Vertex Shader]] - Corona vertex shader
- [[celestials/stars/corona.fragment.glsl|Corona Fragment Shader]] - Corona fragment shader
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[renderer/threejs-lighting/threejs-lighting|Three.js Lighting System]] - Lighting system
- [[data/data-types/data-types|Data Types]] - Type definitions
