# @teskooano/celestial-object

This package provides a foundational system for defining, managing, and rendering celestial objects within a 3D space, designed for the Teskooano N-Body simulation project. It emphasizes modularity, extensibility, and real-time observable state.

## What is this?

The `@teskooano/celestial-object` library offers a robust framework for:

- Defining core properties and physics states of celestial bodies (`CelestialObject`).
- Rendering these objects with support for Level of Detail (LOD) using a `BasicCelestialRenderer`.
- A highly configurable and extensible billboard system for distant object representation, featuring the `Billboard` interface, `DefaultBillboard` implementation, and various configuration options (`DefaultBillboardOptions`, `CelestialBillboardConfig`).
- Managing and observing the state of celestial objects in real-time using RxJS Observables (`state$`).

## Why use this?

This package is essential for:

- Creating diverse astronomical bodies (stars, planets, etc.) with consistent core behaviors.
- Optimizing rendering performance through LOD and efficient billboard generation.
- Allowing for easy extension to create unique celestial types with custom visual appearances and behaviors.
- Integrating seamlessly with a physics engine and UI components by providing observable state.

## Key Features

- **`CelestialObject`**: Abstract base class for all celestial bodies, managing core properties, physics state, and an observable state stream.
- **`CelestialRenderer` Interface**: Defines the contract for all renderers, ensuring consistent LOD management and update/dispose patterns.
- **`BasicCelestialRenderer`**: A ready-to-use renderer with a 4-tier LOD system (high, medium, low detail spheres, and a far-LOD billboard). It can be configured with custom LOD distances and billboard settings.
- **Extensible Billboard System**:
  - `Billboard` interface: Defines how billboard LODs are created.
  - `DefaultBillboard` class: A flexible, default implementation of `Billboard`.
  - `DefaultBillboardOptions`: Allows configuring the internal defaults of `DefaultBillboard` (e.g., default sprite size, opacity, light parameters).
  - `CelestialBillboardConfig`: Per-instance configuration for a billboard's visual appearance (size, color, opacity, texture) and associated point light (intensity, color, decay).
- **Observable State**: Each `CelestialObject` exposes a `state$: Observable<CelestialCoreProperties>` for easy integration and reactivity.
- **Type Safety**: Written in TypeScript with comprehensive type definitions.

## Installation / Usage in Monorepo

This package is part of the Teskooano monorepo. To use it in other packages within the monorepo (e.g., an application in the `apps/` directory), add it as a dependency in the `package.json` of the consuming package:

```json
{
  "dependencies": {
    "@teskooano/celestial-object": "file:../../packages/celestials/celestial-object"
  }
}
```

Then, you can import its components:

```typescript
import {
  CelestialObject,
  BasicCelestialRenderer,
  DefaultBillboard,
  // Types
  type CelestialObjectConstructorParams,
  type CelestialCoreProperties,
  type CelestialPhysicsState,
  type CelestialOrbitalProperties,
  type BasicRendererOptions,
  type CelestialBillboardConfig,
  type BillboardVisualOptions,
  type BillboardLightParameters,
  type DefaultBillboardOptions,
  type LODDistances,
} from "@teskooano/celestial-object";
import * as THREE from "three";
import { OSVector3 } from "@teskooano/core/math"; // Assuming a core math package
```

## Basic Usage Example

Here's how you might create a simple star-like object and render it with a custom billboard configuration:

```typescript
// Assuming you have a THREE.Scene instance: scene
// And an animation loop that calls an update() function

// 1. Define initial properties for our celestial object
const starId = "sol";
const starName = "Sol";
const starRadius = 695_500_000; // Real radius in meters (approx for Sun)
const starColor = 0xffddaa; // A warm yellow-orange

const initialPhysicsState: CelestialPhysicsState = {
  id: starId,
  mass_kg: 1.989e30,
  position_m: new OSVector3(0, 0, 0),
  velocity_mps: new OSVector3(0, 0, 0),
};

const orbitalProperties: CelestialOrbitalProperties = {
  semiMajorAxis_m: 0, // Center of the system
  eccentricity: 0,
  inclination: 0,
  longitudeOfAscendingNode: 0,
  argumentOfPeriapsis: 0,
  meanAnomaly: 0,
  period_s: 0,
};

const starParams: CelestialObjectConstructorParams = {
  id: starId,
  name: starName,
  status: "active", // Assuming CelestialStatus enum is available or use string
  orbit: orbitalProperties,
  physicsState: initialPhysicsState,
  // rendererInstance will be set by CelestialObject if not provided by a subclass
};

// 2. Create the CelestialObject instance
// (If CelestialObject is abstract, you might have a concrete subclass like `GenericStar`)
// For this example, let's assume CelestialObject can be instantiated or you have a simple concrete class.
class MyStar extends CelestialObject {
  constructor(params: CelestialObjectConstructorParams) {
    super(params);
    // In a real scenario, a Star class might provide its own StarRenderer here
    // For now, we'll let the default BasicCelestialRenderer be used or explicitly assign one.
  }
  // Implement abstract updatePhysics if necessary
  public updatePhysics(deltaTime: number): void {
    // Simple example: no movement
    if (!this.physicsState) return;
    // Potentially update physicsState based on deltaTime
    this._updateObservableState(); // Notify subscribers of changes
  }
}
const star = new MyStar(starParams);

// 3. Configure the DefaultBillboard (optional, to change its internal defaults)
const customBillboardDefaults: DefaultBillboardOptions = {
  defaultOpacity: 0.9,
  defaultLightIntensity: 7.0,
  minSpriteSize: 0.05, // Minimum screen-space size
  maxSpriteSize: 0.2, // Maximum screen-space size
};
const customDefaultBillboardGenerator = new DefaultBillboard(
  customBillboardDefaults,
);

// 4. Configure the BasicRendererOptions
const rendererOptions: BasicRendererOptions = {
  lodDistances: {
    medium: starRadius * 30,
    low: starRadius * 80,
    billboard: starRadius * 200, // When the billboard appears
  },
  // Use our custom-configured DefaultBillboard instance
  billboardGenerator: customDefaultBillboardGenerator,
  // Further customize this specific star's billboard appearance and light
  billboardConfig: {
    visuals: {
      color: 0xfff0cc, // Slightly different tint for the billboard sprite
      opacity: 0.95, // Override the default opacity from customBillboardDefaults
      // size: 0.1 // Optionally set a fixed screen-space size here
    },
    light: {
      intensity: 10.0, // Brighter light for this specific star's billboard
      decay: 1.8,
      // color: 0xffffff // Light color defaults to billboard color or base object color
    },
  },
};

// 5. Create the BasicCelestialRenderer instance
const starRenderer = new BasicCelestialRenderer(
  star,
  starRadius / 1e7, // Scale radius for scene units (example scaling)
  starColor,
  rendererOptions,
);
star.renderer = starRenderer; // Assign it to the celestial object

// 6. Add the renderer's LOD object to your scene
// scene.add(starRenderer.lod);

// 7. In your animation loop / update function:
function animate() {
  // requestAnimationFrame(animate);

  const deltaTime = 0.016; // Example delta time
  star.updatePhysics(deltaTime); // Update physics state
  star.updateRenderer(); // Update renderer (which calls renderer.update())

  // renderer.render(scene, camera); // Your Three.js render call
}

// Example of subscribing to state changes
star.state$.subscribe((newState) => {
  console.log(
    `Star ${newState.name} updated: Position X = ${newState.physicsState.position_m.x}`,
  );
});

// Don't forget to dispose when done
// star.dispose(); // This will also call starRenderer.dispose()
```

## API Highlights

- **`CelestialObject`**: Base class for all celestial bodies.
- **`CelestialRenderer`**: Interface for renderers.
- **`BasicCelestialRenderer`**: Default LOD renderer.
- **`BasicRendererOptions`**: Configuration for `BasicCelestialRenderer`, including `lodDistances`, `billboardConfig`, and `billboardGenerator`.
- **`Billboard`**: Interface for billboard generators.
- **`DefaultBillboard`**: Default billboard generator implementation.
- **`DefaultBillboardOptions`**: Configuration for `DefaultBillboard`'s internal defaults.
- **`CelestialBillboardConfig`**: Per-instance configuration for a billboard's visuals and light.
  - `BillboardVisualOptions`: Controls sprite appearance (size, color, opacity, texture).
  - `BillboardLightParameters`: Controls point light (intensity, color, decay).
- **Core Types** (from `./types`):
  - `CelestialCoreProperties`, `CelestialObjectConstructorParams`
  - `CelestialPhysicsState`, `CelestialOrbitalProperties`
  - `LODLevel`, `LODDistances`

## Extending the System

Developers can extend this system by:

1.  **Creating Specific Celestial Types**: Create a new class that extends `CelestialObject` (e.g., `class BlackHole extends CelestialObject { ... }`).
2.  **Providing Custom Renderers**: Implement the `CelestialRenderer` interface to create a renderer with unique shaders, effects, and LODs specific to the new celestial type (e.g., `BlackHoleRenderer`).
3.  **Implementing Custom Billboard Generators**: If the `DefaultBillboard` is not sufficient even with configuration, create a new class that implements the `Billboard` interface to generate entirely custom billboard visuals (e.g., a lensing effect for a black hole). This custom generator can then be passed to `BasicCelestialRenderer` or a custom renderer via `BasicRendererOptions`.

This package structure is designed to grow with the complexity of the simulation, allowing for detailed and performant representations of a vast universe.
