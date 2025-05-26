# Celestial Types

This directory contains the comprehensive, scientifically-accurate type system for celestial bodies in the Teskooano N-body space simulation engine.

## Philosophy

Our celestial classification follows modern astronomical taxonomy with a hierarchical approach:

- **Primary Classification**: Based on fundamental physics (stellar objects, planetary objects, small bodies, extended structures)
- **Scientific Accuracy**: Uses real astronomical classification systems (Morgan-Keenan, Sudarsky, etc.)
- **Modular Design**: Clean interfaces with proper type safety and no complex unions

## Structure Overview

```
Primary Types                    Secondary Types                 Specific Classifications
├── STAR                        ├── StellarType                ├── SpectralClass (O-B-A-F-G-K-M-L-T-Y)
│                               ├── LuminosityClass            └── SpecialSpectralClass (W, C, S, etc.)
├── STELLAR_REMNANT             ├── StellarRemnantType         ├── WhiteDwarfType (DA, DB, DC, etc.)
│                               └── BlackHoleType              └── Kerr vs Schwarzschild
├── PLANET                      ├── PlanetType                 ├── GasGiantClass (I-V)
│                               ├── PlanetSubtype              ├── MoonType
│                               └── MoonType                   └── AtmosphereType
├── SMALL_BODY                  ├── SmallBodyType              ├── AsteroidType
│                               ├── AsteroidType               └── Compositional classes
│                               └── DwarfPlanet types
└── EXTENDED_STRUCTURE          ├── ExtendedStructureType      ├── Ring systems
                                └── Asteroid belts             └── Oort clouds
```

## Core Files

### Classification & Physics

- **`common.ts`** - Comprehensive astronomical classification enums
- **`physics.ts`** - Universal physics properties (mass, orbit, rotation)
- **`base.ts`** - `CelestialBase` interface that every celestial body extends

### Component Properties

- **`components.ts`** - Reusable components (surfaces, atmospheres, rings, clouds)

### Celestial Object Types

- **`stars.ts`** - Main sequence stars and evolved stars
- **`planets.ts`** - Terrestrial planets and moons
- **`gas-giants.ts`** - Gas giants and ice giants
- **`comets.ts`** - Comets with activity and tail properties
- **`asteroids.ts`** - Asteroids, dwarf planets, and asteroid fields

### Exports

- **`index.ts`** - Clean exports and comprehensive union types

## Classification System

### Primary Celestial Types

```typescript
enum CelestialType {
  STAR, // Main sequence and evolved stars
  STELLAR_REMNANT, // White dwarfs, neutron stars, black holes
  PLANET, // Planets, moons, gas giants
  SMALL_BODY, // Asteroids, comets, dwarf planets
  EXTENDED_STRUCTURE, // Ring systems, asteroid belts, Oort clouds
}
```

### Stellar Classification (Morgan-Keenan System)

**Spectral Classes**: O (blue, hottest) → B → A → F → G (Sun) → K → M (red, coolest) → L → T → Y (brown dwarfs)

**Luminosity Classes**:

- I (Supergiants), II (Bright Giants), III (Giants)
- IV (Subgiants), V (Main Sequence), VI (Subdwarfs), VII (White Dwarfs)

**Stellar Evolution**:

```
Protostar → T Tauri → Main Sequence → Red Giant → White Dwarf
                                   ↘ Supergiant → Neutron Star/Black Hole
```

### Planetary Classification

**Planet Types**:

- **Terrestrial**: Rocky worlds (Earth-like, super-Earths)
- **Gas Giants**: Jupiter/Saturn-like (CLASS_I through CLASS_V via Sudarsky system)
- **Ice Giants**: Neptune/Uranus-like
- **Special**: Hot Jupiters, lava worlds, rogue planets, Chthonian planets

**Moon Types**: Regular, irregular, captured asteroids, trojans, moonlets

### Small Body Classification

**Asteroids**: Main belt, near-Earth, trojans (by orbit); C-type, S-type, M-type (by composition)

**Comets**: Short-period (<200yr), long-period (>200yr), Kuiper Belt vs Oort Cloud origin

**Dwarf Planets**: Plutoids (trans-Neptunian), asteroid belt (Ceres), scattered disc objects

## Universal Properties

Every celestial body inherits from `CelestialBase`:

```typescript
interface CelestialBase {
  // Core Identity
  id: string;
  name: string;
  type: CelestialType;
  status: CelestialStatus;

  // Hierarchical Relationships
  parentId?: string;
  currentParentId?: string;

  // Universal Physics (all bodies have these)
  physical: PhysicalProperties; // mass, radius, temperature, rotation
  orbit: OrbitalProperties; // Keplerian orbital elements
  physicsState: PhysicsStateReal; // real-time position, velocity

  // Optional Universal Features
  rings?: RingProperties[]; // ring systems (any body can have rings)
  seed?: string; // procedural generation seed
}
```

## Type-Specific Properties

### Stars & Stellar Remnants

```typescript
interface Star extends CelestialBase {
  stellarType: StellarType; // MAIN_SEQUENCE, RED_GIANT, etc.
  spectralClass?: SpectralClass; // O, B, A, F, G, K, M, L, T, Y
  luminosityClass?: LuminosityClass; // I, II, III, IV, V, VI, VII
  luminosity: number; // Solar luminosities
  // + variable star properties, companion stars, etc.
}

interface StellarRemnant extends CelestialBase {
  remnantType: StellarRemnantType; // WHITE_DWARF, NEUTRON_STAR, BLACK_HOLE
  // + type-specific properties (pulsar frequency, Hawking temperature, etc.)
}
```

### Planets & Gas Giants

```typescript
interface Planet extends CelestialBase {
  planetType: PlanetType; // TERRESTRIAL, ICE_WORLD, etc.
  surface?: SurfaceProperties; // Solid planets only
  atmosphere?: AtmosphereProperties; // If present
  clouds?: CloudProperties; // If present
  // + tidal locking, habitable zone, moons
}

interface GasGiant extends CelestialBase {
  planetType: PlanetType.GAS_GIANT;
  gasGiantClass: GasGiantClass; // CLASS_I through CLASS_V (Sudarsky)
  atmosphere: AtmosphereProperties; // Always present
  // + atmospheric colors, core composition, storm systems
}
```

## Component Properties

Reusable, scientifically-accurate component interfaces:

### Surface Properties

```typescript
interface SurfaceProperties {
  surfaceType: SurfaceType; // CRATERED, VOLCANIC, ICE_PLAINS, etc.
  composition: CompositionType[]; // SILICATE, WATER_ICE, IRON, etc.
  proceduralData?: ProceduralSurfaceData; // For procedural generation
}
```

### Atmospheric Properties

```typescript
interface AtmosphereProperties {
  type: AtmosphereType; // NONE, THIN, NORMAL, DENSE, CRUSHING
  composition: CompositionType[]; // HYDROGEN, METHANE, CO2_ICE, etc.
  pressure_pa: number; // Surface pressure
  // + visual properties for rendering
}
```

### Ring Properties

```typescript
interface RingProperties {
  type: RingType; // ICE, ROCK, DUST, ICE_DUST, METALLIC
  composition: CompositionType[]; // Detailed composition
  // + visual and physical properties
}
```

## Union Types

Comprehensive union types for different use cases:

```typescript
// All possible celestial bodies
type CelestialBody =
  | StellarObject
  | PlanetaryObject
  | SmallBodyObject
  | ExtendedStructureObject;

// Functional groupings
type SolidBodyObject = Planet | Moon | Asteroid | Comet | DwarfPlanet;
type AtmosphericBodyObject = Planet | Moon | GasGiant;
type LuminousObject = Star | StellarRemnant;
type RingedBodyObject = Planet | GasGiant;
```

## Usage Examples

### Type-Safe Stellar Classification

```typescript
const sunLikeStar: Star = {
  type: CelestialType.STAR,
  stellarType: StellarType.MAIN_SEQUENCE,
  spectralClass: SpectralClass.G, // G-type star
  luminosityClass: LuminosityClass.V, // Main sequence (dwarf)
  luminosity: 1.0, // 1 solar luminosity
  color: "#fffadc",
  // ...universal properties
};
```

### Comprehensive Planet Classification

```typescript
const earthLikePlanet: Planet = {
  type: CelestialType.PLANET,
  planetType: PlanetType.TERRESTRIAL,
  planetSubtype: PlanetSubtype.GREENHOUSE,
  surface: {
    surfaceType: SurfaceType.VARIED,
    composition: [CompositionType.SILICATE, CompositionType.WATER_ICE],
  },
  atmosphere: {
    type: AtmosphereType.NORMAL,
    composition: [CompositionType.HYDROGEN, CompositionType.METHANE],
  },
  habitableZone: true,
  // ...universal properties
};
```

### Gas Giant with Sudarsky Classification

```typescript
const hotJupiter: GasGiant = {
  type: CelestialType.PLANET,
  planetType: PlanetType.GAS_GIANT,
  gasGiantClass: GasGiantClass.CLASS_V, // Silicate clouds (>1200K) - hot Jupiter
  atmosphere: {
    type: AtmosphereType.DENSE,
    composition: [CompositionType.HYDROGEN, CompositionType.HELIUM],
  },
  // ...universal properties
};
```

## Benefits

✅ **Scientific Accuracy**: Based on real astronomical classification systems  
✅ **Comprehensive Coverage**: From protostars to quasars, asteroids to galaxy clusters  
✅ **Type Safety**: Full TypeScript type safety with intelligent autocompletion  
✅ **Modular Design**: Clean component-based architecture  
✅ **Extensible**: Easy to add new classifications as astronomy advances  
✅ **Simulation-Ready**: Universal physics properties for N-body calculations  
✅ **Renderer-Friendly**: Rich visual properties for 3D rendering  
✅ **Future-Proof**: Hierarchical design accommodates new discoveries
