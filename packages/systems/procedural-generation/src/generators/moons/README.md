# Moon Generation System

This directory contains the modular moon generation system for the Teskooano procedural generation engine. The system has been refactored from a single large file into focused, single-responsibility modules.

## Architecture

The moon generation system is composed of the following modules:

### Core Files

- **`moon.ts`** - Main moon generator function that orchestrates the generation process
- **`moons.ts`** - Observable-based moon system generator for creating multiple moons per planet
- **`index.ts`** - Barrel export file for all moon generation modules

### Specialized Modules

- **`moon-formation.ts`** - Moon formation mechanism logic and stability calculations
- **`moon-physics.ts`** - Physical properties generation (mass, density, radius, rotation)
- **`moon-orbit.ts`** - Orbital mechanics and parameter generation
- **`moon-properties.ts`** - Surface properties and composition determination

## Module Responsibilities

### `moon-formation.ts`

Handles the determination of moon formation mechanisms and associated physical constraints:

- `determineMoonFormation()` - Determines formation mechanism based on planet mass
- `calculateHillRadius()` - Calculates Hill radius for orbital stability
- `calculateRocheLimit()` - Calculates Roche limit for moon stability

### `moon-physics.ts`

Generates realistic moon physical properties based on formation mechanisms:

- `generateRealisticMoonMass()` - Generates mass based on formation mechanism
- `generateMoonDensity()` - Generates density based on formation mechanism
- `calculateMoonRadius()` - Calculates radius from mass and density
- `generateMoonRotation()` - Generates rotation period (tidal locking)
- `generateMoonAxialTilt()` - Generates axial tilt for moons

### `moon-orbit.ts`

Handles orbital mechanics and parameter generation:

- `calculateNextMoonDistance()` - Calculates orbital distance with realistic spacing
- `calculateMoonOrbitalPeriod()` - Calculates orbital period
- `generateMoonOrbit()` - Generates complete orbital parameters

### `moon-properties.ts`

Determines surface properties and composition:

- `determineMoonType()` - Determines moon type based on formation and parent
- `determineMoonSurface()` - Determines surface type
- `determineMoonComposition()` - Determines composition
- `createMoonSurfaceProperties()` - Creates procedural surface properties
- `createMoonPlanetProperties()` - Creates complete planet properties object

### `moon.ts`

Main orchestrator that coordinates all aspects of moon generation:

- Validates orbital constraints (Hill sphere, Roche limit)
- Coordinates the generation pipeline
- Creates the final `CelestialObject` with all properties

### `moons.ts`

Observable-based system for generating multiple moons per planet:

- `generateMoonsObservable()` - Creates RxJS observable for moon generation
- `calculateRealisticMoonCount()` - Determines number of moons to generate
- `calculateInitialMoonDistance()` - Calculates starting orbital distance

## Usage

```typescript
import { generateMoon, generateMoonsObservable } from "./generators/moons";

// Generate a single moon
const { moonData, nextDistance } = generateMoon(
  random,
  parentPlanet,
  planetMass,
  planetRadius,
  lastMoonDistance,
  systemSeed,
);

// Generate multiple moons via observable
const moons$ = generateMoonsObservable(
  random,
  parentPlanet,
  planetMass,
  planetRadius,
  systemSeed,
);
```

## Formation Mechanisms

The system supports three realistic moon formation mechanisms:

1. **Co-accretion** - Moons formed from the same material as the parent planet
2. **Impact** - Moons formed from collision debris (like Earth's Moon)
3. **Capture** - Moons captured from passing objects

Each mechanism affects:

- Mass ratios and density
- Orbital parameters (eccentricity, inclination)
- Surface properties and composition
- Orbital spacing patterns

## Stability Constraints

The system enforces realistic astrophysical constraints:

- **Hill sphere limit** - Moons must orbit within 30% of the Hill radius
- **Roche limit** - Moons must be outside the fluid Roche limit with safety margin
- **Tidal locking** - Close moons are likely tidally locked
- **Orbital spacing** - Realistic spacing based on formation mechanism
