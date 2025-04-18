# Procedural Generation System (`systems/procedural-generation`)

## What is this?

This package is part of the Teskooano engine, responsible for procedurally generating complete star systems. Given a single string seed, it deterministically creates various celestial bodies—stars (including binary, trinary, and quaternary systems), planets, moons, asteroid belts, and planet rings—complete with physical properties, orbital parameters, and visually-relevant attributes.

## Features

| Feature | Description |
|---------|-------------|
| **Fully Deterministic** | The same seed always produces identical star systems, ensuring reproducibility. |
| **Binary+ Star Systems** | Support for multi-star systems with proper barycentric orbit calculations. |
| **Rich Planet Types** | Planets of various types (rocky, terrestrial, gas giant, etc.) with appropriate physical properties. |
| **Visual Properties** | Includes colors, atmosphere density, ring composition, and other visual characteristics. |
| **Physics Integration** | Automatically calculates initial positions and velocities for n-body simulation. |
| **Scientific Basis** | Models based on simplified astrophysics (Kepler's laws, spectral classification, etc.). |

## Why use it?

To create diverse and complex star systems on-the-fly without needing to manually define every single celestial body. It ensures that the same seed always produces the same system, allowing for reproducible and shareable game worlds.

## How to use it?

The primary entry point is the `generateSystem` function:

```typescript
import { generateSystem } from '@teskooano/systems-procedural-generation';
import type { CelestialObject } from '@teskooano/data-types';

async function createMySystem() {
  const seed = "Sol-42"; // Any string seed
  try {
    const systemObjects: CelestialObject[] = await generateSystem(seed);
    console.log(`Generated ${systemObjects.length} objects for system ${seed}`);
    
    // The objects include stars, planets, moons, and asteroid belts,
    // all with proper orbital parameters and physics states
    
    // Stars might be arranged in binary/multiple configurations
    const stars = systemObjects.filter(obj => obj.properties?.type === 'STAR');
    console.log(`System has ${stars.length} stars`);
    
    // Each object has a complete physical state ready for simulation
  } catch (error) {
    console.error(`Failed to generate system for seed ${seed}:`, error);
  }
}
```

### Generation Details

The system creates:

- **Stars**: 1-4 stars per system (10% single, 50% binary, 25% trinary, 15% quaternary)
- **Planets & Belts**: A total of 5-14 bodies placed at exponentially distributed distances
- **Moons**: 0-4 moons per planet
- **Planet Rings**: Some planets will have ring systems

The placement logic ensures appropriate minimum distances between bodies and produces more bodies closer to stars, following realistic distribution patterns.

## Components

| Component | Purpose |
|-----------|---------|
| `seeded-random.ts` | Creates a deterministic PRNG from a string seed using SHA-256 and a linear congruential generator. |
| `generator.ts` | Main orchestration function that places all celestial bodies. |
| `generators/*.ts` | Individual generators for stars, planets, moons, asteroid belts, and planet sub-components. |
| `constants.ts` | Physical constants, color palettes, and composition definitions. |
| `utils.ts` | Helper functions for orbital calculations, color manipulation, and classification. |

## Key Dependencies

-   `@teskooano/core-math`: For vector math operations
-   `@teskooano/core-physics`: For orbital calculations and physical state initialization
-   `@teskooano/data-types`: For typed interfaces and enums

## Example Generated System

| Object Type | Count | Properties |
|-------------|-------|------------|
| Stars | 1-4 | Spectral class, temperature, luminosity, radius, mass |
| Planets | Varies | Type (rocky, gas, etc.), atmosphere, composition, surface details |
| Moons | 0-4 per planet | Size, orbit, composition |
| Asteroid Belts | Varies | Density, average radius, width |
| Ring Systems | Some planets | Composition, colors, inner/outer radius |

## Structure

-   `src/generator.ts`: Contains the main `generateSystem` orchestration logic.
-   `src/generators/`: Holds individual generator functions for specific celestial types (`star.ts`, `planet.ts`, `moon.ts`, `asteroidBelt.ts`) and planet sub-components (`planet-orbit.ts`, `planet-properties.ts`, etc.).
-   `src/seeded-random.ts`: Implements the deterministic pseudo-random number generator.
-   `src/constants.ts` & `src/utils.ts`: Provide shared constants and helper functions.

## Development

(Add details about building, testing, and contributing to this package later) 