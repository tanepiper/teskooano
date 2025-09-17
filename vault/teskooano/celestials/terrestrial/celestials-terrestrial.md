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

#### [[celestials/terrestrial/BaseTerrestrialRenderer|BaseTerrestrialRenderer]]

Main renderer class that orchestrates LOD creation, material management, and ring system composition.

**Key Responsibilities:**

- LOD level creation and management
- Material creation and registration
- Ring system composition
- Lighting and shadow updates
- Atmosphere mesh creation

#### [[celestials/terrestrial/ProceduralPlanetMaterial|ProceduralPlanetMaterial]]

Shader-based material for procedural surface generation with noise-driven terrain and height-based color blending.

**Key Features:**

- Simplex noise terrain generation
- 5-level color palette with height blending
- Multi-source lighting calculations
- Shadow casting with soft penumbra
- Configurable terrain parameters

#### [[celestials/terrestrial/AtmosphereMaterial|AtmosphereMaterial]]

Shader-based material for atmospheric scattering effects with multi-light support.

**Key Features:**

- Atmospheric glow effects
- Multi-light source support
- Configurable opacity and thickness
- Planet type-based color adjustment

#### [[celestials/terrestrial/PlanetMaterialService|PlanetMaterialService]]

Service for creating planet materials and determining base colors based on planet type.

**Key Features:**

- Planet type-based color palettes
- Material property configuration
- Base color determination
- Procedural parameter setup

#### [[celestials/terrestrial/AtmosphereService|AtmosphereService]]

Service for creating atmosphere meshes and materials.

**Key Features:**

- Atmosphere mesh creation
- Material configuration
- Planet type integration
- Geometry optimization

#### [[celestials/terrestrial/createMesh|createMesh]]

Factory function for creating terrestrial meshes with the unified API.

**Features:**

- Unified interface for mesh creation
- Renderer caching and management
- LOD object creation
- Ring system integration

## 🔗 Related

- [[celestials/terrestrial/BaseTerrestrialRenderer|BaseTerrestrialRenderer]] - Main renderer class
- [[celestials/terrestrial/ProceduralPlanetMaterial|ProceduralPlanetMaterial]] - Procedural surface material
- [[celestials/terrestrial/AtmosphereMaterial|AtmosphereMaterial]] - Atmospheric effects material
- [[celestials/terrestrial/PlanetMaterialService|PlanetMaterialService]] - Material creation service
- [[celestials/terrestrial/AtmosphereService|AtmosphereService]] - Atmosphere creation service
- [[celestials/terrestrial/createMesh|createMesh]] - Factory function for mesh creation
- [[renderer/threejs-celestial/threejs-celestial|Three.js Celestial Renderer]] - Base renderer system
- [[celestials/rings/celestials-rings|Celestials Rings]] - Ring system integration
- [[data/data-types/data-types|Data Types]] - Type definitions
