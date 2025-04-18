# @teskooano/data-types

## What is it?

The `@teskooano/data-types` library is the central type definition package for the Open Space engine. It provides TypeScript interfaces and type definitions for all core data structures used throughout the application. This ensures type safety, consistency, and serves as living documentation for the data model across the entire system.

It also defines core scaling constants and functions used to bridge the gap between real-world physics units and visual rendering units.

## Where is it?

**Physical Location:** `/packages/data/types`

**System Context:** The types package exists as a foundational dependency for almost all other packages in the system, providing shared type definitions and scaling information:

```mermaid
graph TD
    Types[data-types]
    State[core-state]
    Physics[core-physics]
    Celestial[systems-celestial]
    Renderer[renderer-threejs*] // Includes visualization, core, effects, etc.
    Simulation[app-simulation]

    Types --> State
    Types --> Physics
    Types --> Celestial
    Types --> Renderer
    Types --> Simulation
```

## When is it used?

The types package is used:

- During development for type checking and auto-completion
- At compile time to ensure type safety across the application
- As a reference for the data model structure during system design
- When implementing new features that need to interact with existing data structures
- For validation of external data (like JSON system files) against expected structures
- By the rendering system to correctly scale physical sizes and positions for visualization.

## How does it work?

The types package provides:

### Celestial Object Types (`celestial.ts`)

- `CelestialObject`: Base interface for all celestial bodies (containing real physical properties like `realRadius_m`, `realMass_kg`, and linking to `physicsStateReal`).
- Type definitions for various celestial object specific properties:
  - `StarProperties`
  - `PlanetProperties` (uses discriminated union for `SurfacePropertiesUnion`)
  - `GasGiantProperties`
  - `RingProperties`
  - `CometProperties`, `AsteroidFieldProperties`, `OortCloudProperties`
- Enumerations for classifications: `CelestialType`, `PlanetType`, `GasGiantClass`, `StellarType`, etc.
- `OrbitalParameters`: Defines Keplerian orbital elements (using real SI units like `realSemiMajorAxis_m`, `period_s`).

### Scaling Constants and Functions (`scaling.ts`)

Defines the constants and functions for converting between real-world units (used by the physics engine) and visual/rendering units.

- `SCALE`: An object containing various scaling factors:
  - `RENDER_SCALE_AU`: The primary factor defining how many Three.js scene units correspond to 1 Astronomical Unit (AU). Used by renderers for positioning.
  - `SIZE`, `DISTANCE`: Additional scaling factors (currently `0.05`) applied _after_ the base `RENDER_SCALE_AU`. Primarily used for _visual adjustments_ to object radii (`scaleSize`) or orbital line distances (`scaleDistance`), not for core positioning.
  - `MOON_DISTANCE`: A multiplier applied to moon orbital distances for better visual separation.
  - `MASS`, `TIME`: Factors for scaling mass and time (currently `1.0e-20` and `1.0`). Mass scaling is used to prevent numerical issues in physics calculations involving large astronomical masses if scaled units were used (currently physics uses real units).
- `scaleSize(realSize_m, type)`: Converts a real radius (meters) to a visual size, applying `SCALE.SIZE` and type-specific factors. Used by renderers when creating geometry.
- `scaleDistance(realDistance_m, isMoon)`: Converts a real distance (meters) to a visual distance, applying `SCALE.DISTANCE` and `SCALE.MOON_DISTANCE`. Used by orbit renderers.
- `scaledGravitationalConstant()`: Calculates the value G should have _if_ physics calculations were performed using scaled mass, distance, and time units (currently physics uses real G and real units).

### System Configuration Types

- Types for system configuration, serialization (status TBD).
- Physical constants like `GRAVITATIONAL_CONSTANT`, `AU_METERS`.

## Strengths

- Comprehensive type definitions for all celestial objects.
- Clear separation between real physical properties and visual scaling concerns.
- Centralized scaling logic.
- Well-documented interfaces with JSDoc comments.

## Weaknesses

- The purpose/necessity of the small `SCALE.SIZE` and `SCALE.DISTANCE` factors (0.05) could be clearer or potentially simplified.
- Some interfaces are quite large and could benefit from further modularization (though planet surface properties are now improved).
- Limited validation logic for values (relies on TypeScript's structural typing).

## Opportunities

- Expanding to support the new system loader feature with schema validation.
- Adding types for UI window configuration for the upcoming UI manager.
- Supporting ship navigation and warping capabilities.

## Future Considerations

For upcoming features:

- Adding JSON schema validation types that align with the TypeScript interfaces to validate system files
- Creating types for the UI window system, including window configuration options and state
- Defining types for player ships with navigation, warp capabilities, and interaction with celestial objects
- Adding serialization/deserialization utility types for system loading and saving
