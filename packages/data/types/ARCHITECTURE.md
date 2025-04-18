## Data Types Package Analysis (`data/types`)

**Purpose**: This foundational package defines the shared TypeScript interfaces, enums, constants, and utility functions used throughout the Open Space engine. It serves as the central dictionary for data structures, ensuring consistency across different modules (core logic, physics, rendering, UI).

**Key Components:**

1.  **`index.ts`**: Standard entry point that re-exports all definitions from the other modules within this package.

2.  **`celestial.ts`**: Defines the core data structures for celestial bodies and their properties.

    - **Enums**: Provides classifications for various celestial characteristics:
      - `CelestialType`: Primary classification (STAR, PLANET, MOON, ASTEROID_FIELD, etc.).
      - `GasGiantClass`: Sudarsky classification (CLASS_I to CLASS_V).
      - `PlanetType`: Composition/surface classification (ROCKY, TERRESTRIAL, ICE, LAVA, etc.).
      - `AtmosphereType`: General atmospheric density (NONE, THIN, NORMAL, DENSE).
      - `SurfaceType`: General topography/covering (CRATERED, MOUNTAINOUS, OCEAN, DUNES, etc.).
      - `RockyType`: Composition of asteroids/rings (ICE, METALLIC, LIGHT_ROCK, etc.).
      - `StellarType`: Evolutionary/spectral classification for stars (MAIN_SEQUENCE, NEUTRON_STAR, BLACK_HOLE, etc.).
    - **Interfaces**:
      - `OrbitalParameters`: Defines the Keplerian elements needed for orbital calculations (realSemiMajorAxis_m, eccentricity, inclination, etc., all in real-world units like meters and radians).
      - `SpecificPropertiesBase`: Base interface for type-specific properties, containing the `type: CelestialType` discriminator.
      - `StarProperties`, `PlanetProperties`, `GasGiantProperties`, `CometProperties`, `AsteroidFieldProperties`, `OortCloudProperties`: Interfaces extending `SpecificPropertiesBase` with fields unique to each `CelestialType`.
      - `SurfacePropertiesUnion`: A union type combining various specific surface property interfaces (e.g., `DesertSurfaceProperties`, `IceSurfaceProperties`, `LavaSurfaceProperties`, `ProceduralSurfaceProperties`).
      - `RingProperties`: Defines properties for planetary rings (inner/outer radius, density, color, texture).
      - `CelestialObject`: The main, comprehensive interface representing any object in the simulation. It includes:
        - Basic identifiers (`id`, `name`, `type`).
        - Visual/Scaled properties (`radius`, `mass`, `visualScaleRadius` - intended for rendering, potentially derived via scaling functions).
        - Real-world physical properties (`realRadius_m`, `realMass_kg`).
        - `orbit: OrbitalParameters`.
        - Other physical attributes (`temperature`, `albedo`, `siderealRotationPeriod_s`).
        - Optional `atmosphere` and `surface` properties.
        - `properties?: CelestialSpecificPropertiesUnion`: Holds the type-specific property object.
        - `physicsStateReal: PhysicsStateReal`: The object's state in real-world units for the physics engine.
        - State management fields (`parentId`, `currentParentId`).
        - Scaled state for rendering (`position: THREE.Vector3`, `rotation: THREE.Quaternion`, `physicsState: { ... }` - likely deprecated or needs review vs. `physicsStateReal`).
        - Other optional fields (`axialTilt`, `seed`, `primaryLightSourceId`, runtime flags like `isVisible`).

3.  **`physics.ts`**: Defines the core state representation for the physics engine.

    - **Interfaces**:
      - `PhysicsStateReal`: Represents an object's state using real-world units (id, `mass_kg`, `position_m: OSVector3`, `velocity_mps: OSVector3`).

4.  **`scaling.ts`**: Provides constants and utility functions for converting between real-world units and simulation/visualization units.

    - **Constants**: `GRAVITATIONAL_CONSTANT`, `AU_METERS`, `SCALE` (defining internal scaling factors like `MASS`, and the crucial `RENDER_SCALE_AU` which dictates scene units per AU), `METERS_TO_SCENE_UNITS` (derived).
    - **Functions**:
      - `scaleDistance`, `unscaleDistance`: Convert distances (meters <=> scene units), handling special case for moon visualization distance.
      - `scaleSize`, `unscaleSize`: Convert object radii (meters <=> scene units), handling type-specific visual multipliers (`SCALE.GAS_GIANT_SIZE`, etc.).
      - `scaleTime`, `unscaleTime`: Convert time (currently 1:1).
      - `scaledGravitationalConstant`: Calculates the value of G needed for physics calculations performed using scaled units (if any) to maintain consistency.
      - `velocityScaleFactor`: Calculates velocity scaling based on distance/time scales.
      - `scaleOrbitalParameters`: Adjusts orbital period based on scaled semi-major axis to ensure Kepler's Third Law holds visually if distances are scaled non-uniformly (like the moon distance boost).

5.  **`main.ts`**: Defines top-level simulation state and physics function types.

    - **Interfaces**:
      - `SimulationState`: Defines the structure of the main simulation state atom/map (time, timeScale, paused, selectedObject, focusedObjectId, camera state).
    - **Type Aliases**:
      - `PairForceCalculator`: Function signature for calculating force between two bodies.
      - `Integrator`: Function signature for physics integration steps.

6.  **`ui.ts`**: Defines a wide range of enums and interfaces potentially used for building a generic UI system.
    - **Enums**: `UIComponentType`, `UILayer`, `UISlotType`, `UIEventType`, `MouseEvents`, `KeyboardEvents`, `UIFocusMode`, `UIEvents`.
    - **Interfaces**: `UIThemeOptions`, `BaseUIComponent`, `BaseUIEvent`, `BaseUIDragEvent`, `BaseController`, `BaseUISlot`, various style interfaces (`BasePanelStyle`, `BaseButtonStyle`, etc.).

**Key Characteristics & Design:**

- **Centralized Definitions**: Provides a single source of truth for all data structures.
- **Strong Typing**: Leverages TypeScript for type safety across the engine.
- **Clear Separation**: Distinguishes between real-world physics properties (`_m`, `_kg`, `_s` suffixes, `PhysicsStateReal`) and potentially scaled visual properties.
- **Scaling Logic**: Explicitly defines scaling factors and provides functions to convert between domains (physics <-> visualization). This is crucial but complex.
- **Composition**: Uses discriminated unions (`CelestialSpecificPropertiesUnion`, `SurfacePropertiesUnion`) and optional properties within `CelestialObject` to represent diverse object types.
- **Comprehensive**: Covers celestial bodies, physics state, simulation control, scaling, and UI elements.

**Dependencies**: `three` (for Vector3/Quaternion in type definitions), `@teskooano/core-math` (for `OSVector3`).
