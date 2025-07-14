# Stellar Type System - Clean Architecture

## Overview

The stellar type system has been completely reorganized to be astrophysically accurate and eliminate confusion between renderer types and actual stellar types.

## Problems with the Old System

1. **`StellarType` was misused** - Mixed renderer types with actual stellar types
2. **Black holes were split** - `BLACK_HOLE` vs `KERR_BLACK_HOLE` when they should be subtypes
3. **Missing important types** - No hypergiants, protostars, etc.
4. **Confusing hierarchy** - Pulsars and magnetars are neutron star subtypes, not separate types
5. **`ExoticStellarType` duplicated** - Overlapped with `StellarType` and created confusion

## New Clean Organization

### Primary Stellar Types (`StellarType`)

These represent the actual astrophysical type of the star:

```typescript
export enum StellarType {
  MAIN_SEQUENCE = "MAIN_SEQUENCE", // Stars fusing hydrogen (like the Sun)
  PROTOSTAR = "PROTOSTAR", // Young stars still accreting (not optically visible)
  PRE_MAIN_SEQUENCE = "PRE_MAIN_SEQUENCE", // Pre-main sequence stars (optically visible)
  WOLF_RAYET = "WOLF_RAYET", // Massive, hot stars losing mass
  HYPERGIANT = "HYPERGIANT", // Very large, luminous evolved stars
  WHITE_DWARF = "WHITE_DWARF", // Dense remnant of low-medium mass stars
  NEUTRON_STAR = "NEUTRON_STAR", // Extremely dense remnant of supernovae
  BLACK_HOLE = "BLACK_HOLE", // Region where gravity prevents escape
}
```

````

### Subtype Enums

These provide additional classification for specific stellar types:

#### Neutron Star Subtypes (`NeutronStarSubtype`)
```typescript
export enum NeutronStarSubtype {
  STANDARD = "STANDARD",    // Regular neutron star
  PULSAR = "PULSAR",        // With radio pulses
  MAGNETAR = "MAGNETAR",    // With extremely strong magnetic field
}
````

#### Black Hole Subtypes (`BlackHoleSubtype`)

```typescript
export enum BlackHoleSubtype {
  SCHWARZSCHILD = "SCHWARZSCHILD", // Non-rotating black hole
  KERR = "KERR", // Rotating black hole
}
```

#### Protostar Subtypes (`ProtostarSubtype`)

```typescript
export enum ProtostarSubtype {
  T_TAURI = "T_TAURI", // Pre-main sequence stars < 2 solar masses
  HERBIG_AE_BE = "HERBIG_AE_BE", // Pre-main sequence stars 2-8 solar masses
}
```

#### White Dwarf Subtypes (`WhiteDwarfSubtype`)

```typescript
export enum WhiteDwarfSubtype {
  DA = "DA", // Hydrogen-dominated atmosphere
  DB = "DB", // Helium-dominated atmosphere
  DC = "DC", // Featureless spectrum
  DO = "DO", // Helium-rich with ionized helium lines
  DZ = "DZ", // Metal-rich atmosphere
  DQ = "DQ", // Carbon-rich atmosphere
  DX = "DX", // Unclassified
}
```

## Updated StarProperties Interface

The `StarProperties` interface now uses the new system:

```typescript
export interface StarProperties extends SpecificPropertiesBase {
  type: CelestialType.STAR;
  isMainStar: boolean;
  spectralClass: string;
  luminosity: number;
  color: string;

  // Primary stellar type
  stellarType?: StellarType;

  // Subtypes for specific stellar types
  neutronStarSubtype?: NeutronStarSubtype;
  blackHoleSubtype?: BlackHoleSubtype;
  whiteDwarfSubtype?: WhiteDwarfSubtype;
  protostarSubtype?: ProtostarSubtype;

  // Spectral classification
  mainSpectralClass?: SpectralClass;
  specialSpectralClass?: SpecialSpectralClass;
  luminosityClass?: LuminosityClass;

  // Multi-star systems
  partnerStars?: string[];

  // System lighting
  systemLighting?: SystemLightingProperties;
}
```

## Renderer Factory Updates

The star renderer factory now properly handles subtypes:

```typescript
function createStarRenderer(
  spectralClass?: string,
  stellarType?: StellarType,
  neutronStarSubtype?: NeutronStarSubtype,
  blackHoleSubtype?: BlackHoleSubtype,
  lightingManager?: LightingManager,
): BaseStarRenderer {
  // ... logic to create appropriate renderer based on type and subtype
}
```

## Procedural Generation Updates

The star generator now creates realistic distributions:

```typescript
const STELLAR_TYPE_WEIGHTS = [
  { type: StellarType.MAIN_SEQUENCE, weight: 85 }, // 85% main sequence
  { type: StellarType.WHITE_DWARF, weight: 10 }, // 10% white dwarfs
  { type: StellarType.NEUTRON_STAR, weight: 2 }, // 2% neutron stars
  { type: StellarType.BLACK_HOLE, weight: 1 }, // 1% black holes
  { type: StellarType.WOLF_RAYET, weight: 1 }, // 1% Wolf-Rayet
  { type: StellarType.HYPERGIANT, weight: 0.5 }, // 0.5% hypergiants
  { type: StellarType.PROTOSTAR, weight: 0.3 }, // 0.3% protostars
  { type: StellarType.T_TAURI, weight: 0.1 }, // 0.1% T Tauri
  { type: StellarType.HERBIG_AE_BE, weight: 0.1 }, // 0.1% Herbig Ae/Be
];
```

## Migration Guide

### For Star Properties

- Replace `classType: StellarType` with `stellarType: StellarType`
- Replace `exoticType: ExoticStellarType` with appropriate subtype
- Add subtype properties as needed

### For Renderer Selection

- Use `stellarType` to determine primary renderer
- Use subtype to determine specific renderer variant
- Black holes: Use `blackHoleSubtype` to choose between Schwarzschild/Kerr renderers
- Neutron stars: Use `neutronStarSubtype` for pulsar/magnetar effects

### For Procedural Generation

- Update star generators to use new `StellarType` values
- Add subtype generation logic for neutron stars, black holes, white dwarfs
- Remove references to `KERR_BLACK_HOLE` (now handled via subtype)

## Benefits

1. **Astrophysically Accurate** - Types reflect real stellar classifications
2. **Clear Hierarchy** - Subtypes properly represent variations within types
3. **No Duplication** - Eliminates `ExoticStellarType` confusion
4. **Extensible** - Easy to add new subtypes without changing primary types
5. **Renderer Agnostic** - Stellar types are data, not renderer types

## Future Enhancements

- Add more white dwarf subtypes (DQ, DZ, etc.)
- Add hypergiant subtypes (luminous blue variables, etc.)
- Add protostar subtypes (Class 0, Class I, etc.)
- Add main sequence subtypes for different evolutionary stages
