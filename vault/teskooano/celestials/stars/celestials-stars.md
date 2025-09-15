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

#### [[BaseStarRenderer]]

Abstract base class for all star renderers with common functionality.

**Key Features:**

- LOD management and billboard creation
- Corona effect generation
- Material management and uniform updates
- Lighting integration

#### [[BaseStarMaterial]]

Base material class for star rendering with plasma effects.

**Key Features:**

- Plasma noise parameters
- Color palette management
- Time-based animation
- Uniform lighting

#### [[EnhancedStarMaterial]]

Advanced material with 3-color plasma system and spectral properties.

**Key Features:**

- Hot, surface, and cool color blending
- Configurable noise parameters
- Spectral property integration
- Dynamic color updates

### Main Sequence Stars

#### [[MainSequenceStarRenderer]]

Base renderer for main sequence stars with corona effects.

#### Spectral Class Renderers

- **[[ClassOStarRenderer]]**: O-class stars (30,000-50,000K, blue-white)
- **[[ClassBStarRenderer]]**: B-class stars (10,000-30,000K, blue-white)
- **[[ClassAStarRenderer]]**: A-class stars (7,500-10,000K, white)
- **[[ClassFStarRenderer]]**: F-class stars (6,000-7,500K, yellow-white)
- **[[ClassGStarRenderer]]**: G-class stars (5,200-6,000K, yellow) - includes our Sun
- **[[ClassKStarRenderer]]**: K-class stars (3,700-5,200K, orange)
- **[[ClassMStarRenderer]]**: M-class stars (2,400-3,700K, red)

### Post-Main Sequence Stars

#### [[SubgiantRenderer]]

Stars transitioning from main sequence to giant phase.

#### [[RedGiantRenderer]]

Large, cool stars in the red giant phase.

#### [[HorizontalBranchRenderer]]

Stars in the horizontal branch phase of evolution.

#### [[AGBRenderer]]

Asymptotic Giant Branch stars with complex evolution.

#### [[PostAGBRenderer]]

Post-AGB stars transitioning to planetary nebulae.

#### [[SupergiantRenderer]]

Massive stars in the supergiant phase.

#### [[HypergiantRenderer]]

Extremely massive hypergiant stars.

#### [[WolfRayetRenderer]]

Wolf-Rayet stars with strong stellar winds.

### Stellar Remnants

#### [[NeutronStarRenderer]]

Neutron star renderer with subtype support.

**Subtypes:**

- **Standard**: Basic neutron star
- **Pulsar**: Rotating neutron star with emission beams
- **Magnetar**: Neutron star with extremely strong magnetic fields

#### [[WhiteDwarfRenderer]]

White dwarf star renderer with cooling effects.

#### [[SchwarzschildBlackHoleRenderer]]

Non-rotating black hole with Schwarzschild geometry.

#### [[KerrBlackHoleRenderer]]

Rotating black hole with Kerr geometry and frame dragging.

### Corona System

#### [[CoronaMaterial]]

Material for atmospheric corona effects around stars.

**Features:**

- Pulsing animation
- Noise-based patterns
- Additive blending
- Configurable opacity and scale

## 🔗 Related

- [[BaseStarRenderer]] - Base renderer class
- [[BaseStarMaterial]] - Base material class
- [[EnhancedStarMaterial]] - Advanced material with plasma effects
- [[MainSequenceStarRenderer]] - Main sequence star renderer
- [[ClassGStarRenderer]] - G-class star renderer
- [[ClassOStarRenderer]] - O-class star renderer
- [[NeutronStarRenderer]] - Neutron star renderer
- [[CoronaMaterial]] - Corona effect material
- [[createMesh]] - Factory function for mesh creation
- [[enhanced-star.vertex.glsl]] - Enhanced star vertex shader
- [[enhanced-star.fragment.glsl]] - Enhanced star fragment shader
- [[corona.vertex.glsl]] - Corona vertex shader
- [[corona.fragment.glsl]] - Corona fragment shader
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/renderer-threejs-lighting]] - Lighting system
- [[@teskooano/data-types]] - Type definitions
