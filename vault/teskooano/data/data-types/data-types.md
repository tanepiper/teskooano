---
aliases: [data-types]
tags: [data, types]
type: index
package: "@teskooano/data-types"
version: "0.4.0-dev.0"
dependencies: ["three", "@teskooano/data-values", "@teskooano/core-math"]
classes: []
status: active
---

# Data Types (`@teskooano/data-types`)

Central type definition package for the Open Space engine providing TypeScript interfaces and type definitions for all core data structures used throughout the application.

## Overview

The `@teskooano/data-types` library is the foundational type system for the Teskooano engine. It provides comprehensive TypeScript interfaces and type definitions for all core data structures, ensuring type safety, consistency, and serving as living documentation for the data model across the entire system.

## Key Features

### Comprehensive Type System

- **Celestial Object Types**: Complete type definitions for all celestial bodies
- **Physics Integration**: Real-world physics units and state management
- **Rendering Support**: Renderer-specific types and transformations
- **UI Framework**: Complete UI component type system
- **Event System**: Comprehensive event type definitions
- **Performance Types**: Performance optimization and device tier types

### Real-World Physics

- **SI Units**: All physical properties use real-world SI units (meters, kilograms, seconds)
- **Orbital Mechanics**: Complete Keplerian orbital element definitions
- **Physics State**: Real-world physics state management
- **Lagrange Points**: Advanced orbital mechanics support

### Stellar Classification

- **Spectral Classes**: Complete O-M spectral classification system
- **Stellar Evolution**: Support for all stellar evolutionary stages
- **Stellar Remnants**: Neutron stars, white dwarfs, black holes
- **Special Types**: Wolf-Rayet, hypergiants, protostars

### Planetary Systems

- **Planet Types**: Rocky, terrestrial, gas giants, ice worlds
- **Atmospheric Properties**: Complete atmospheric modeling
- **Ring Systems**: Advanced ring system configuration
- **Surface Properties**: Procedural surface generation types

## Architecture

### Core Types

#### [[CelestialObject]]

Base interface for all celestial bodies with real physical properties.

**Key Properties:**

- **Physical Properties**: `realRadius_m`, `realMass_kg`, `temperature`
- **Orbital Parameters**: Complete Keplerian orbital elements
- **Atmospheric Data**: Optional atmospheric properties
- **Type-Specific Properties**: Discriminated union for different celestial types

#### [[RenderableCelestialObject]]

Renderer-ready celestial object with scaled properties and rendering data.

**Key Properties:**

- **Scaled Properties**: Converted to renderer units
- **Rendering State**: Visibility and interaction flags
- **Shader Integration**: Uniform collections
- **Physics Linking**: Connection to real physics state

### Celestial Type System

#### [[CelestialType]]

Primary classification of celestial bodies.

**Types:**

- **Stars**: `STAR` - Central bodies of systems
- **Planets**: `PLANET`, `DWARF_PLANET` - Orbiting bodies
- **Moons**: `MOON` - Satellites of planets
- **Small Bodies**: `ASTEROID`, `COMET` - Individual space objects
- **Collections**: `ASTEROID_FIELD`, `OORT_CLOUD` - Groups of objects
- **Gas Giants**: `GAS_GIANT` - Large gaseous planets
- **Ring Systems**: `RING_SYSTEM` - Planetary rings
- **Artificial**: `SATELLITE` - Man-made objects
- **Special**: `BARYCENTER` - Center of mass points

#### [[StellarType]]

Classification based on stellar evolution and spectral characteristics.

**Main Sequence:**

- `MAIN_SEQUENCE` - Hydrogen burning stars
- `PROTOSTAR` - Forming stars
- `PRE_MAIN_SEQUENCE` - Young stars

**Post-Main Sequence:**

- `SUBGIANT` - Transitioning stars
- `RED_GIANT` - Large, cool stars
- `HORIZONTAL_BRANCH` - Helium burning stars
- `ASYMPTOTIC_GIANT_BRANCH` - Advanced evolution
- `POST_AGB` - Planetary nebula central stars
- `SUPERGIANT` - Massive evolved stars

**Special Types:**

- `WOLF_RAYET` - Mass-losing stars
- `HYPERGIANT` - Extremely massive stars

**Stellar Remnants:**

- `WHITE_DWARF` - Dense stellar remnants
- `NEUTRON_STAR` - Ultra-dense remnants
- `BLACK_HOLE` - Spacetime singularities

#### [[PlanetType]]

Classification of planets based on composition and surface characteristics.

**Types:**

- `BARREN` - Cratered, lifeless worlds
- `ROCKY` - Rock and metal composition
- `TERRESTRIAL` - Earth-like with potential for life
- `DESERT` - Arid, dry surfaces
- `ICE` - Ice-covered worlds
- `LAVA` - Molten surface worlds
- `OCEAN` - Water-covered worlds

#### [[GasGiantClass]]

Classification of gas giants based on atmospheric properties.

**Classes:**

- `CLASS_I` - Ammonia clouds (Jupiter-like)
- `CLASS_II` - Water clouds (Saturn-like)
- `CLASS_III` - Ice giants (Uranus/Neptune-like)
- `CLASS_IV` - Alkali metal clouds (hot)
- `CLASS_V` - Silicate clouds (very hot)

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[RenderableCelestialObject]] - Renderer-ready celestial object
- [[StarProperties]] - Star-specific properties
- [[PlanetProperties]] - Planet-specific properties
- [[GasGiantProperties]] - Gas giant-specific properties
- [[RingProperties]] - Ring system properties
- [[CometProperties]] - Comet-specific properties
- [[SatelliteProperties]] - Satellite-specific properties
- [[OrbitalParameters]] - Orbital mechanics definitions
- [[PhysicsStateReal]] - Real-world physics state
- [[UIComponentType]] - UI component types
- [[PerformanceConfig]] - Performance optimization types
- [[@teskooano/core-state]] - State management system
- [[@teskooano/core-physics]] - Physics simulation system
- [[@teskooano/renderer-threejs]] - 3D rendering system
