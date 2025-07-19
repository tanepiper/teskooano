# Star Generation Operators

This directory contains the modular components for generating sophisticated stellar systems with realistic orbital mechanics and hierarchical structures.

## Architecture Overview

The star generation system has been refactored from a monolithic 629-line file into focused, testable modules:

### Core Modules

- **`star-generator.ts`** - Main entry point that orchestrates the generation process
- **`star-system-generator.ts`** - Handles different stellar system configurations (single, binary, triple, etc.)
- **`binary-stability.ts`** - Validates binary star stability using astrophysical constraints
- **`binary-orbit-setup.ts`** - Sets up proper binary orbital mechanics with barycentric motion
- **`binary-systems.ts`** - Generates different types of binary systems (close, wide, contact)
- **`hierarchical-triple.ts`** - Creates hierarchical triple systems like Alpha Centauri
- **`star-properties.ts`** - Updates star properties for different system types

## Key Features

### Binary Stability Validation

The system validates binary star separations using astrophysical stability criteria:

- **Minimum Separation**: 3× combined stellar radii safety margin
- **Roche Limit**: Prevents mass transfer and instability
- **Conservative Stability**: Ensures stable n-body simulations
- **Physics Recommendations**: Suggests appropriate timesteps and algorithms

### Orbital Mechanics

- **Barycentric Motion**: Both stars orbit around their common center of mass
- **Stability Enhancements**: 180° phase separation, low eccentricity for close binaries
- **Hierarchical Systems**: Proper tertiary star orbits around binary barycenter
- **Physics Integration**: Calculates initial positions and velocities for simulation

### System Types Supported

1. **Single Star** - Standard single star system
2. **Close Binary** - 0.5-2.0 AU separation with circular orbits
3. **Wide Binary** - 2-100 AU separation with higher eccentricity
4. **Hierarchical Triple** - Close binary + distant tertiary star
5. **Complex Multiple** - 4+ star systems with increasing separations

## Usage

```typescript
import { generateStars } from "./operators";

const random = () => 0.5; // Seeded PRNG
const { stars, systemConfig } = generateStars(random);

// stars contains all generated stars with proper orbital parameters
// systemConfig contains the stellar system configuration
```

## Testing

Each module has comprehensive tests:

```bash
# Run all tests
moon run procedural-generation:test

# Run specific module tests
npx vitest run src/operators/binary-stability.spec.ts
npx vitest run src/operators/star-properties.spec.ts
```

## Benefits of Modular Architecture

1. **Reduced Cognitive Load**: Each file has a single responsibility
2. **Improved Testability**: Focused unit tests for each component
3. **Better Maintainability**: Changes isolated to specific modules
4. **Enhanced Reusability**: Components can be used independently
5. **Clearer Dependencies**: Explicit imports show relationships

## Migration from Monolithic File

The original `star-generator.ts` (629 lines) has been replaced with:

- **7 focused modules** (average ~50 lines each)
- **Comprehensive test coverage** for all components
- **Removed unused code** (like the unused `physicsConfig`)
- **Improved type safety** with proper imports
- **Better documentation** and clear interfaces

This refactor maintains all existing functionality while making the codebase much more maintainable and testable.
