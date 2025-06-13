# Architecture: Keplerian Orbit Visualization (`/keplerian`)

This directory contains the logic for calculating and rendering static, elliptical orbits based on classical Keplerian orbital elements.

## `OrbitCalculator.ts`

**Purpose**: A pure, static utility class for calculating the points of an elliptical orbit.

### Core Design

1.  **Physics Calculation**: This class takes `OrbitalParameters` and calculates a series of points that form an ellipse. All internal calculations are performed using the project's renderer-agnostic math library (`@teskooano/core-math`).
2.  **Output**: The `calculateOrbitPoints` method returns an array of `OSVector3[]`. This is a critical architectural decision that keeps this calculation logic decoupled from the `three.js` rendering engine.

## `KeplerianManager.ts`

**Purpose**: Manages the lifecycle of Keplerian orbit lines within the `three.js` scene. It handles their creation, updates, visibility, and highlighting.

### Core Design & Data Flow

1.  **Coordination**: This manager is the bridge between the calculated orbit points and the visual representation in the scene.
2.  **Data Flow & Type Conversion**: It follows the project's standard architectural pattern for physics-to-renderer data flow:
    - It calls `OrbitCalculator.calculateOrbitPoints()` to get the raw orbital path as `OSVector3[]`.
    - It then uses the `updateThreeVector3Array` utility to convert the `OSVector3[]` data into a `THREE.Vector3[]` array. This conversion is the final step before the data is passed to the rendering-specific `LineBuilder`.
    - It caches the resulting `THREE.Vector3[]` to avoid unnecessary conversions on every frame.
3.  **Scene Management**: It uses the `ObjectManager` to add and remove the final `THREE.Line` objects from the scene and manages their materials and positions.

This clear separation ensures that core orbital math is not tied to the rendering library, while the manager class handles all the `three.js`-specific implementation details.
