# Stellar Classification - Data-Driven Approach

## Overview

This refactored stellar classification system implements a **data-driven approach** that clearly separates simulation physics from rendering concerns, moving away from broad enumeration-heavy classifications toward computed properties based on real physical data.

## Philosophy

### State-Driven Engine

- **Simulation First**: Core physics properties drive all classification decisions
- **Computed Properties**: Classifications are calculated from data, not hardcoded
- **Separation of Concerns**: Physics simulation data is completely separate from visual/rendering data
- **Flexible Representation**: Same physics can generate different visual representations

### Factory/Generator Approach

Instead of broad "visual hints" enums, we use:

- **Typed Factory Functions**: `createMainSequenceStar()`, `createStellarRemnant()`
- **Data-Driven Classification**: Functions like `determineLuminosityClass()` compute classifications from physics
- **Modular Composition**: Combine `StellarPhysicsData` + `StellarRenderingData` as needed

## Core Components

### 1. StellarType Enum (Renderer Types)

```typescript
export enum StellarType {
  MAIN_SEQUENCE = "MAIN_SEQUENCE",
  RED_GIANT = "RED_GIANT",
  WHITE_DWARF = "WHITE_DWARF",
  NEUTRON_STAR = "NEUTRON_STAR",
  BLACK_HOLE = "BLACK_HOLE",
  // ... other types
}
```

**Purpose**: Primarily for renderer selection and basic physics categorization. Kept as-is per user feedback.

### 2. Data Interfaces

#### StellarPhysicsData

Contains **only** what the physics simulation needs:

```typescript
interface StellarPhysicsData {
  mass: number; // Solar masses
  radius: number; // Solar radii
  temperature: number; // Kelvin
  luminosity: number; // Solar luminosities
  metallicity: number; // [Fe/H] ratio
  age: number; // Years
  rotationPeriod: number; // Hours
  // ... evolution and remnant-specific properties
}
```

#### StellarRenderingData

Contains **only** what the renderer needs:

```typescript
interface StellarRenderingData {
  color: { r: number; g: number; b: number };
  lightIntensity: number;
  lightColor: { r: number; g: number; b: number };
  coronaSize?: number;
  surfaceActivity?: number;
  accretionDisk?: boolean;
  gravitationalLensing?: boolean;
}
```

### 3. Classification Functions

#### Data-Driven Spectral Classification

```typescript
// ONLY for main sequence stars
export function determineMainSequenceSpectralClass(
  temperature: number,
): MainSequenceSpectralClass | null;

// Separate classification for brown dwarfs
export function determineBrownDwarfSpectralClass(
  temperature: number,
): BrownDwarfSpectralClass | null;
```

#### Computed Luminosity Classification

```typescript
export function determineLuminosityClass(
  physicsData: StellarPhysicsData,
  stellarType: StellarType,
): string;
```

Calculates luminosity class from surface gravity and stellar type, rather than using hardcoded enums.

#### Remnant Characteristics

```typescript
export function determineBlackHoleCharacteristics(
  physicsData: StellarPhysicsData,
): {
  massCategory: "stellar" | "intermediate" | "supermassive" | "primordial";
  rotationType: "kerr" | "schwarzschild";
};

export function determineWhiteDwarfType(
  physicsData: StellarPhysicsData,
  composition?: CompositionData,
): string;
```

## Usage Examples

### Creating a Main Sequence Star

```typescript
const sunPhysics: StellarPhysicsData = {
  mass: 1.0,
  radius: 1.0,
  temperature: 5778,
  luminosity: 1.0,
  metallicity: 0.0,
  age: 4.6e9,
  rotationPeriod: 609.12,
};

const sunVisuals: StellarRenderingData = {
  color: { r: 1.0, g: 1.0, b: 0.8 },
  lightIntensity: 1.0,
  lightColor: { r: 1.0, g: 1.0, b: 0.9 },
};

const sun = createMainSequenceStar(sunPhysics, sunVisuals);
// Result: G-type main sequence star with luminosity class V
```

### Creating Stellar Remnants

```typescript
const whiteDwarfPhysics: StellarPhysicsData = {
  mass: 0.6,
  radius: 0.01,
  temperature: 15000,
  luminosity: 0.001,
  // ... other properties
};

const composition = { hydrogen: 0.8, helium: 0.2 };

const whiteDwarf = createStellarRemnant(
  StellarType.WHITE_DWARF,
  whiteDwarfPhysics,
  renderingData,
  { composition },
);
// Result: DA white dwarf (hydrogen atmosphere) with luminosity class VII
```

### Data-Driven Flexibility

```typescript
// Same physics, different visual representations
const star1 = createMainSequenceStar(sunPhysics, realisticVisuals);
const star2 = createMainSequenceStar(sunPhysics, stylizedVisuals);

// Both have identical physics and classification
assert(star1.spectralClass === star2.spectralClass); // Both G-type
assert(star1.luminosityClass === star2.luminosityClass); // Both class V

// But completely different visual representation
assert(star1.renderingData !== star2.renderingData);
```

## Key Improvements

### 1. Simplified Classification

- **Removed**: Broad enums like `SpecialSpectralClass`, `BlackHoleType`, `WhiteDwarfType`
- **Added**: Specific functions that compute classifications from physical properties
- **Result**: Less enum bloat, more accurate classifications

### 2. Clear Separation of Concerns

- **Physics**: Mass, temperature, age, evolution state
- **Rendering**: Colors, lighting, visual effects, materials
- **Classification**: Computed from physics, used by both simulation and renderer

### 3. Factory Pattern

- **Manual Creation**: Use factory functions for specific star types
- **Procedural Generation**: Factories work with procedural generation systems
- **Decision Trees**: Easy to implement classification decision trees

### 4. Extensibility

- **New Star Types**: Add new `StellarType` values and corresponding factory functions
- **New Properties**: Extend `StellarPhysicsData` or `StellarRenderingData` as needed
- **Custom Classification**: Add new determination functions for exotic objects

## Integration with Base System

This classification system integrates with the existing `CelestialBase` interface:

```typescript
interface CelestialBase {
  id: string;
  name: string;
  type: CelestialType.STAR; // High-level type

  physical: PhysicalProperties; // Core physical data
  orbit: OrbitalProperties; // Orbital mechanics
  physicsState: PhysicsStateReal; // Real-time state

  // Stellar-specific data would be stored in specialized interfaces
  stellarClassification?: {
    stellarType: StellarType;
    spectralClass?: string;
    luminosityClass: string;
    characteristics?: any;
  };
}
```

## Testing Philosophy

The test suite demonstrates:

- **Data-Driven Classifications**: All classifications computed from input data
- **Separation Validation**: Physics and rendering data remain independent
- **Factory Function Behavior**: Consistent classification from same inputs
- **Edge Case Handling**: Boundary conditions and missing data scenarios

## Migration Notes

When migrating from the old enum-heavy system:

1. **Replace Hardcoded Classifications**: Use determination functions instead
2. **Separate Data Concerns**: Split existing data into physics vs rendering
3. **Update Factory Usage**: Use new factory functions for star creation
4. **Validate Against Tests**: Run classification tests to ensure accuracy

This approach supports both manual celestial editing (precise control over physics) and procedural generation (algorithmic creation with decision trees), while maintaining a clean separation between what the physics engine needs and what the renderer displays.
