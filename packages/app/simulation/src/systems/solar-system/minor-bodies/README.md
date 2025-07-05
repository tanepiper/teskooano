# Minor Bodies

This directory contains implementations of all minor bodies in the Solar System, including dwarf planets, asteroids, comets, and other small celestial objects.

## Organization

### Dwarf Planets

- **`ceres.ts`** - Largest asteroid belt object, first dwarf planet discovered
- **`pallas.ts`** - Third-largest asteroid with high orbital inclination (34.93°)
- **`vesta.ts`** - Second-largest asteroid with differentiated structure
- **`eris.ts`** - Most massive known dwarf planet with moon Dysnomia
- **`makemake.ts`** - High-albedo dwarf planet with moon MK2
- **`haumea.ts`** - Triaxial dwarf planet with ring system and two moons (Hi'iaka, Namaka)

### Small Body Collections

- **`asteroid-belt.ts`** - Main asteroid belt between Mars and Jupiter
- **`comets.ts`** - Various comet implementations (Halley's, Hale-Bopp, etc.)
- **`oort-cloud.ts`** - Outer system comet reservoir

## Usage

The main entry point is `index.ts`, which provides:

```typescript
import { initializeMinorBodies } from "./minor-bodies";

// Initialize all minor bodies
initializeMinorBodies(sunId);

// Or initialize individual bodies
import {
  initializeCeres,
  initializePallas,
  initializeHaumea,
} from "./minor-bodies";
```

## Data Sources

All implementations use accurate astronomical data from:

- NASA Planetary Fact Sheets
- JPL Horizons System
- IAU Minor Planet Center
- Peer-reviewed astronomical databases

## Features

- **Scientific Accuracy**: Real orbital elements and physical parameters
- **No Randomness**: Deterministic implementations using actual data
- **Comprehensive Coverage**: All major dwarf planets and significant asteroids
- **Modular Design**: Each body in its own focused file
- **Type Safety**: Full TypeScript support with proper interfaces

## File Naming Convention

- Kebab-case for multi-word files (`asteroid-belt.ts`, `oort-cloud.ts`)
- Single-word files use lowercase (`ceres.ts`, `eris.ts`, etc.)
- Consistent with planetary system naming patterns
