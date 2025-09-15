---
aliases: [celestials-terrestrial]
tags: [renderer, threejs, celestials]
type: index
package: "@teskooano/celestials-terrestrial"
version: "0.4.0-dev.0"
dependencies:
  [
    "@teskooano/data-types",
    "@teskooano/renderer-threejs-celestial",
    "@teskooano/celestials-rings",
    "three",
  ]
classes:
  [
    "BaseTerrestrialRenderer",
    "ProceduralPlanetMaterial",
    "AtmosphereMaterial",
    "PlanetMaterialService",
    "AtmosphereService",
  ]
status: active
---

# Celestials: Terrestrial

Renderers and materials for terrestrial planets and moons with procedural surfaces, atmospheric effects, and optional ring composition.

## Overview

The `@teskooano/celestials-terrestrial` package provides comprehensive rendering support for terrestrial planets and moons in the Teskooano space simulation engine. It features procedural surface generation with noise-driven terrain, atmospheric scattering effects, multi-source lighting with shadow casting, and optional ring system composition.

## Key Features

### Procedural Surface Generation

- **Noise-Driven Terrain**: Simplex noise-based terrain generation with configurable parameters
- **Height-Based Color Blending**: 5-level color palette with smooth height-based transitions
- **Terrain Types**: Multiple terrain generation algorithms (simple, sharp peaks, sharp valleys)
- **Dynamic Parameters**: Configurable persistence, lacunarity, octaves, and undulation

### Atmospheric Effects

- **Atmospheric Scattering**: Realistic atmospheric glow with configurable properties
- **Multi-Light Support**: Atmospheric effects respond to multiple light sources
- **Planet Type Integration**: Automatic atmospheric color adjustment based on planet type
- **Transparency Control**: Configurable opacity and thickness

### Advanced Lighting

- **Multi-Source Lighting**: Support for up to 4 dynamic light sources
- **Shadow Casting**: Soft shadows from celestial bodies with penumbra effects
- **Dynamic Ambient**: Adjustable ambient lighting based on nearby stars
- **PBR Materials**: Physically-based rendering with metallic and roughness properties

### LOD System

- **Three-Level LOD**: High detail (procedural), medium detail (simplified), billboard (sprite)
- **Ring Integration**: Optional ring system composition with shared LOD levels
- **Performance Optimization**: Efficient LOD switching based on distance
- **Atmosphere LOD**: Atmospheric effects only at high detail levels

### Ring System Composition

- **Optional Rings**: Lazy initialization of ring system renderer
- **LOD Integration**: Ring LODs combined with planet LODs
- **Shadow Integration**: Ring shadow casters registered with lighting system
- **Performance**: Rings only created when needed

## Architecture

### Core Components

#### [[BaseTerrestrialRenderer]]

Main renderer class that orchestrates LOD creation, material management, and ring system composition.

**Key Responsibilities:**

- LOD level creation and management
- Material creation and registration
- Ring system composition
- Lighting and shadow updates
- Atmosphere mesh creation

#### [[ProceduralPlanetMaterial]]

Shader-based material for procedural surface generation with noise-driven terrain and height-based color blending.

**Key Features:**

- Simplex noise terrain generation
- 5-level color palette with height blending
- Multi-source lighting calculations
- Shadow casting with soft penumbra
- Configurable terrain parameters

#### [[AtmosphereMaterial]]

Shader-based material for atmospheric scattering effects with multi-light support.

**Key Features:**

- Atmospheric glow effects
- Multi-light source support
- Configurable opacity and thickness
- Planet type-based color adjustment

#### [[PlanetMaterialService]]

Service for creating planet materials and determining base colors based on planet type.

**Key Features:**

- Planet type-based color palettes
- Material property configuration
- Base color determination
- Procedural parameter setup

#### [[AtmosphereService]]

Service for creating atmosphere meshes and materials.

**Key Features:**

- Atmosphere mesh creation
- Material configuration
- Planet type integration
- Geometry optimization

#### [[createMesh]]

Factory function for creating terrestrial meshes with the unified API.

**Features:**

- Unified interface for mesh creation
- Renderer caching and management
- LOD object creation
- Ring system integration

## 🔗 Related

- [[BaseTerrestrialRenderer]] - Main renderer class
- [[ProceduralPlanetMaterial]] - Procedural surface material
- [[AtmosphereMaterial]] - Atmospheric effects material
- [[PlanetMaterialService]] - Material creation service
- [[AtmosphereService]] - Atmosphere creation service
- [[createMesh]] - Factory function for mesh creation
- [[@teskooano/renderer-threejs-celestial]] - Base renderer system
- [[@teskooano/celestials-rings]] - Ring system integration
- [[@teskooano/data-types]] - Type definitions
