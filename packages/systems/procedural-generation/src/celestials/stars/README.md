# Stellar Classification Functions

## Overview

This directory contains the **stellar classification functions** for the Teskooano engine. These functions implement the data-driven stellar classification system that was refactored from the original enum-heavy approach.

## Architecture

### Separation of Concerns

- **Types/Interfaces**: Located in `packages/data/types/src/celestials/common/stellar-classification.ts`
- **Functions**: Located in this package (`packages/systems/procedural-generation/src/generators/stars/stellar-classification-functions.ts`)

This separation ensures:

- **Types** remain in the data layer for broad consumption across the system
- **Functions** live in the procedural generation system where they're primarily used
- Clear dependency flow: functions import types, not vice versa

## Key Functions

### Classification Functions

- `determineLuminosityClass()` - Computes luminosity class from stellar physics and type
- `determineMainSequenceSpectralClass()` - Determines spectral class for main sequence stars
- `determineBrownDwarfSpectralClass()` - Classifies brown dwarf spectral types
- `determineBlackHoleCharacteristics()` - Classifies black hole mass and rotation types
- `determineWhiteDwarfType()` - Determines white dwarf atmospheric composition types

### Factory Functions

- `createMainSequenceStar()` - Creates a properly classified main sequence star
- `createStellarRemnant()` - Creates stellar remnants (white dwarfs, neutron stars, black holes)

## Usage Example

```typescript
import { createMainSequenceStar } from "./stellar-classification-functions";
import type {
  StellarPhysicsData,
  StellarRenderingData,
} from "@teskooano/data-types";

// Define the physics (what the simulation needs)
const sunPhysics: StellarPhysicsData = {
  mass: 1.0, // Solar masses
  radius: 1.0, // Solar radii
  temperature: 5778, // Kelvin
  luminosity: 1.0, // Solar luminosities
  metallicity: 0.0, // [Fe/H] ratio
  age: 4.6e9, // Years
  rotationPeriod: 609.12, // Hours
};

// Define the visuals (what the renderer needs)
const sunVisuals: StellarRenderingData = {
  color: { r: 1.0, g: 1.0, b: 0.8 },
  lightIntensity: 1.0,
  lightColor: { r: 1.0, g: 1.0, b: 0.9 },
};

// Create the star with computed classification
const sun = createMainSequenceStar(sunPhysics, sunVisuals);
// Result: G-type main sequence star with luminosity class V
```

## Data-Driven Philosophy

### Key Principles

1. **Physics Drives Classification**: All stellar classifications are computed from physical properties
2. **Separation of Simulation vs Rendering**: Physics data and visual data are completely separate
3. **Computed Properties**: No hardcoded classifications - everything calculated from data
4. **Factory Pattern**: Use typed factory functions instead of broad constructors

### Benefits

- **Accuracy**: Classifications based on real stellar physics
- **Flexibility**: Same physics can have different visual representations
- **Maintainability**: Changes to classification logic isolated to functions
- **Testability**: Easy to unit test classification algorithms

## Integration

These functions integrate with:

- **Existing Procedural Generation**: `star.ts` can use these for better classification
- **Manual Star Creation**: Tools can use factories for precise star creation
- **Data Import**: External stellar catalogs can be processed through these functions
- **Rendering System**: Renderer gets clean separation between physics and visual data

## Testing

Run tests with:

```bash
npm test -- stellar-classification-functions.spec.ts
```

Tests cover:

- Classification accuracy for different stellar types
- Data-driven computation validation
- Factory function behavior
- Separation of concerns verification

## Future Extensions

Easy to extend for:

- **New Stellar Types**: Add new `StellarType` enum values and corresponding functions
- **Advanced Physics**: Extend `StellarPhysicsData` with new properties
- **Enhanced Visuals**: Extend `StellarRenderingData` for new rendering features
- **Exotic Objects**: Add new classification functions for unusual stellar objects
