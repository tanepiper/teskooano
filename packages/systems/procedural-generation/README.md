# Procedural Generation System (`@teskooano/systems-procedural-generation`)

## What is this?

This package is part of the Teskooano engine, responsible for procedurally generating complete star systems. Given a single string seed, it deterministically creates various celestial bodies—stars (including binary, trinary, and quaternary systems), planets, moons, asteroid belts, and planet rings—complete with physical properties, orbital parameters, and visually-relevant attributes for rendering.

The system uses a reactive approach, returning an RxJS `Observable` that emits each generated celestial object as it's created.

## Features

| Feature                 | Description                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Fully Deterministic** | The same seed always produces an identical star system, ensuring reproducibility.                                                                                |
| **Reactive Generation** | Returns an RxJS `Observable` stream, allowing the application to process celestial objects as they are generated without blocking the main thread.               |
| **Multi-Star Systems**  | Supports multi-star systems with internal barycentric orbit calculations.                                                                                        |
| **Rich Planet Types**   | Generates a wide variety of planets (Rocky, Terrestrial, Gas Giant, etc.) with appropriate physical properties and detailed procedural surface data for shaders. |
| **Physics Integration** | Automatically calculates initial positions and velocities for the n-body simulation engine.                                                                      |
| **Scientific Basis**    | Models based on simplified astrophysics (Kepler's laws, spectral classification, etc.).                                                                          |

## Why use it?

To create diverse and complex star systems on-the-fly without needing to manually define every single celestial body. The deterministic nature allows for reproducible and shareable game worlds, while the reactive stream-based generation allows for efficient, non-blocking loading of large systems.

## How to use it?

The primary entry point is the `generateSystem` function, which returns a Promise resolving to an object containing the system name and an `Observable`.

```typescript
import { generateSystem } from "@teskooano/systems-procedural-generation";
import type { CelestialObject } from "@teskooano/data-types";
import { tap, finalize } from "rxjs/operators";

async function createMySystem() {
  const seed = "Sol-42"; // Any string seed
  try {
    const { systemName, objects$ } = await generateSystem(seed);

    console.log(`Generating system: ${systemName}`);

    objects$
      .pipe(
        tap((object) => {
          // Process each celestial object as it is emitted
          console.log(`Generated: ${object.name} (${object.type})`);
          // e.g., addObjectToState(object);
        }),
        finalize(() => {
          // This block runs when the stream is complete
          console.log("System generation complete.");
        }),
      )
      .subscribe();
  } catch (error) {
    console.error(`Failed to generate system for seed ${seed}:`, error);
  }
}
```

### Generation Details

The system creates:

- **Stars**: 1-4 stars per system (10% single, 50% binary, 25% trinary, 15% quaternary).
- **Planets & Belts**: 5-14 potential orbital slots, which can be filled with a planet or an asteroid belt.
- **Moons**: 0-4 moons per generated planet.
- **Planet Rings**: Gas giants and ice planets have a high probability of generating ring systems.

The placement logic uses an exponential distribution, resulting in more bodies being placed closer to their parent stars, which mimics observed distribution patterns.

## Components

| Component            | Purpose                                                                                                                                              |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Seeded PRNG**      | Creates a deterministic PRNG from a string seed using the Web Crypto API (SHA-256).                                                                  |
| **System Generator** | Main orchestration function (`generateSystem`) that sets up the star system and the reactive generation pipeline.                                    |
| **Generators**       | Individual, modular generators for each celestial type (stars, planets, moons, asteroid belts) and their sub-components (orbits, properties, rings). |
| **Constants**        | Physical constants, color palettes, and composition definitions.                                                                                     |
| **Utilities**        | Helper functions for orbital calculations, color manipulation, classification, and generating procedural surface properties for shaders.             |

## Key Dependencies

- `@teskooano/core-math`: For vector math operations (`OSVector3`).
- `@teskooano/core-physics`: For orbital calculations and initializing the physics state.
- `@teskooano/data-types`: For all shared types and enums (`CelestialObject`, `PlanetType`, etc.).
- `rxjs`: For the reactive, stream-based generation of celestial objects.

## Development

To test the package, run the following command from the monorepo root:

```bash
moon run systems-procedural-generation:test
```

## Example Generated System

| Object Type    | Count          | Properties                                                        |
| -------------- | -------------- | ----------------------------------------------------------------- |
| Stars          | 1-4            | Spectral class, temperature, luminosity, radius, mass             |
| Planets        | Varies         | Type (rocky, gas, etc.), atmosphere, composition, surface details |
| Moons          | 0-4 per planet | Size, orbit, composition                                          |
| Asteroid Belts | Varies         | Density, average radius, width                                    |
| Ring Systems   | Some planets   | Composition, colors, inner/outer radius                           |

## Structure

- `src/generator.ts`: Contains the main `generateSystem` orchestration logic.
- `src/generators/`: Holds individual generator functions for specific celestial types (`star.ts`, `planet.ts`, `moon.ts`, `asteroidBelt.ts`) and planet sub-components (`planet-orbit.ts`, `planet-properties.ts`, etc.).
- `src/seeded-random.ts`: Implements the deterministic pseudo-random number generator.
- `src/constants.ts` & `src/utils.ts`: Provide shared constants and helper functions.
