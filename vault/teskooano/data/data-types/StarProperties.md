---
aliases: [StarProperties]
tags: [data, types, celestial, stars]
type: Interface
package: "@teskooano/data-types"
file: "src/celestial/properties.types.ts"
status: active
---

# StarProperties

Properties specific to stars with comprehensive stellar data including spectral classification, evolutionary stage, and visual effects configuration.

## Overview

The `StarProperties` interface defines all star-specific properties including spectral classification, stellar evolution stage, physical characteristics, and advanced visual effects. It extends `SpecificPropertiesBase` and provides comprehensive data for realistic star rendering and behavior.

## Interface Definition

```typescript
export interface StarProperties extends SpecificPropertiesBase {
  type: CelestialType.STAR;
  isMainStar: boolean;
  spectralClass: string;
  luminosity: number;
  color: string;
  hotColor?: string;
  surfaceColor?: string;
  coolColor?: string;
  stellarType?: StellarType;
  partnerStars?: string[];
  mainSpectralClass?: SpectralClass;
  specialSpectralClass?: SpecialSpectralClass;
  luminosityClass?: LuminosityClass;
  neutronStarSubtype?: NeutronStarSubtype;
  blackHoleSubtype?: BlackHoleSubtype;
  whiteDwarfSubtype?: WhiteDwarfSubtype;
  protostarSubtype?: ProtostarSubtype;
  systemLighting?: SystemLightingProperties;
  age_years?: number;
  metallicity?: number;
  materialParams?: StarMaterialParams;
  visualEffects?: StarVisualEffects;
}
```

## Core Properties

### Basic Classification

#### type

```typescript
type: CelestialType.STAR;
```

The fundamental type classification (always STAR).

#### isMainStar

```typescript
isMainStar: boolean;
```

Whether this is the main star in the system, used for camera focus on startup.

- **Type**: `boolean`
- **Required**: Yes
- **Usage**: System organization and initial camera positioning

#### spectralClass

```typescript
spectralClass: string;
```

The classification based on temperature and spectral lines (e.g., "G2V").

- **Type**: `string`
- **Required**: Yes
- **Format**: Spectral class + subclass + luminosity class (e.g., "G2V", "M5V", "O5I")
- **Usage**: Color calculation and physical property determination

#### luminosity

```typescript
luminosity: number;
```

The total energy output of the star, often relative to the Sun (L☉).

- **Type**: `number`
- **Required**: Yes
- **Units**: Solar luminosities (L☉)
- **Usage**: Brightness calculations and habitable zone determination

### Color Properties

#### color

```typescript
color: string;
```

The primary color tint of the star, usually represented as a hex string.

- **Type**: `string`
- **Required**: Yes
- **Format**: Hex color string (e.g., "#FFD700")
- **Usage**: Base star color for rendering

#### hotColor

```typescript
hotColor?: string
```

Hot zone color for plasma, flares, and convection centers.

- **Type**: `string`
- **Required**: No
- **Format**: Hex color string
- **Usage**: Hot plasma regions in star shaders

#### surfaceColor

```typescript
surfaceColor?: string
```

Normal surface color (fallback to main color if not specified).

- **Type**: `string`
- **Required**: No
- **Format**: Hex color string
- **Usage**: Normal surface areas in star rendering

#### coolColor

```typescript
coolColor?: string
```

Cool zone color for sunspots and darker regions.

- **Type**: `string`
- **Required**: No
- **Format**: Hex color string
- **Usage**: Cool regions and sunspots in star shaders

### Stellar Classification

#### stellarType

```typescript
stellarType?: StellarType
```

The primary stellar type based on evolutionary stage.

- **Type**: `StellarType`
- **Required**: No
- **Values**: `MAIN_SEQUENCE`, `RED_GIANT`, `WHITE_DWARF`, `NEUTRON_STAR`, `BLACK_HOLE`, etc.
- **Usage**: Determines renderer selection and physical behavior

#### mainSpectralClass

```typescript
mainSpectralClass?: SpectralClass
```

Main spectral class (O, B, A, F, G, K, M, etc.).

- **Type**: `SpectralClass`
- **Required**: No
- **Values**: `O`, `B`, `A`, `F`, `G`, `K`, `M`, `L`, `T`, `Y`
- **Usage**: Temperature and color determination

#### specialSpectralClass

```typescript
specialSpectralClass?: SpecialSpectralClass
```

Special spectral class for non-main sequence stars.

- **Type**: `SpecialSpectralClass`
- **Required**: No
- **Values**: `W` (Wolf-Rayet), `C` (Carbon), `D` (White dwarf), `P` (Pulsar), etc.
- **Usage**: Special stellar type identification

#### luminosityClass

```typescript
luminosityClass?: LuminosityClass
```

Luminosity class indicating the size/evolutionary state.

- **Type**: `LuminosityClass`
- **Required**: No
- **Values**: `I` (Supergiants), `II` (Bright giants), `III` (Giants), `IV` (Subgiants), `V` (Main sequence), etc.
- **Usage**: Size and evolutionary stage determination

### Stellar Remnant Subtypes

#### neutronStarSubtype

```typescript
neutronStarSubtype?: NeutronStarSubtype
```

Subtype for neutron stars.

- **Type**: `NeutronStarSubtype`
- **Required**: No
- **Values**: `STANDARD`, `PULSAR`, `MAGNETAR`
- **Usage**: Neutron star-specific rendering and behavior

#### blackHoleSubtype

```typescript
blackHoleSubtype?: BlackHoleSubtype
```

Subtype for black holes.

- **Type**: `BlackHoleSubtype`
- **Required**: No
- **Values**: `SCHWARZSCHILD`, `KERR`
- **Usage**: Black hole geometry and gravitational lensing

#### whiteDwarfSubtype

```typescript
whiteDwarfSubtype?: WhiteDwarfSubtype
```

Subtype for white dwarfs based on spectral features.

- **Type**: `WhiteDwarfSubtype`
- **Required**: No
- **Values**: `DA`, `DB`, `DC`, `DO`, `DZ`, `DQ`, `DX`
- **Usage**: White dwarf atmospheric composition

#### protostarSubtype

```typescript
protostarSubtype?: ProtostarSubtype
```

Subtype for pre-main-sequence stars.

- **Type**: `ProtostarSubtype`
- **Required**: No
- **Values**: `T_TAURI`, `HERBIG_AE_BE`
- **Usage**: Young star classification and behavior

### Multi-Star Systems

#### partnerStars

```typescript
partnerStars?: string[]
```

Optional array of partner star IDs, used for multi-star systems orbital calculations.

- **Type**: `string[]`
- **Required**: No
- **Usage**: Binary and multiple star system dynamics

### System Properties

#### systemLighting

```typescript
systemLighting?: SystemLightingProperties
```

Optional system-wide lighting properties, only present on the primary star.

- **Type**: `SystemLightingProperties`
- **Required**: No
- **Usage**: Global lighting configuration for the entire system

### Physical Properties

#### age_years

```typescript
age_years?: number
```

Stellar age in years - affects planet formation and atmospheric evolution.

- **Type**: `number`
- **Required**: No
- **Units**: Years
- **Usage**: Evolutionary stage and system age determination

#### metallicity

```typescript
metallicity?: number
```

Metallicity [Fe/H] - affects rocky planet formation probability.

- **Type**: `number`
- **Required**: No
- **Units**: [Fe/H] ratio
- **Usage**: Planet formation modeling and stellar evolution

### Material Parameters

#### materialParams

```typescript
materialParams?: StarMaterialParams
```

Material parameters for star rendering - can be modified by uniform editor.

```typescript
interface StarMaterialParams {
  noiseScale?: number;
  noiseIntensity?: number;
  plasmaTurbulence?: number;
  lightingIntensity?: number;
}
```

**Properties:**

- **noiseScale**: Scale of plasma noise patterns
- **noiseIntensity**: Intensity of plasma effects
- **plasmaTurbulence**: Turbulence level of plasma
- **lightingIntensity**: Overall lighting intensity

### Visual Effects

#### visualEffects

```typescript
visualEffects?: StarVisualEffects
```

Enhanced visual effects configuration.

```typescript
interface StarVisualEffects {
  // Dynamic surface features
  enableGranulation?: boolean;
  enableSunspots?: boolean;
  enableProminences?: boolean;
  enableSolarFlares?: boolean;
  enableCoronalMassEjections?: boolean;

  // Rotation and movement
  rotationPeriod?: number; // Hours
  differentialRotation?: boolean;
  poleEquatorRatio?: number;

  // Advanced effects
  stellarPulsation?: boolean;
  variableStarType?: "cepheid" | "rr_lyrae" | "delta_scuti" | "none";
  pulsationPeriod?: number; // Days
  pulsationAmplitude?: number;

  // Magnetic field visualization
  magneticFieldLines?: boolean;
  coronalHoles?: boolean;
  activeRegions?: boolean;
}
```

## Usage Examples

### Main Sequence Star (Sun-like)

```typescript
const sunProperties: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: true,
  spectralClass: "G2V",
  luminosity: 1.0,
  color: "#FFD700",
  hotColor: "#FFA500",
  surfaceColor: "#FFD700",
  coolColor: "#FF8C00",
  stellarType: StellarType.MAIN_SEQUENCE,
  mainSpectralClass: SpectralClass.G,
  luminosityClass: LuminosityClass.V,
  age_years: 4.6e9,
  metallicity: 0.0,
  systemLighting: {
    ambientLightColor: "#404040",
    ambientLightIntensity: 0.1,
    starLightIntensity: 1.0,
  },
  materialParams: {
    noiseScale: 0.03,
    noiseIntensity: 0.12,
    plasmaTurbulence: 0.6,
    lightingIntensity: 1.0,
  },
  visualEffects: {
    enableGranulation: true,
    enableSunspots: true,
    enableProminences: true,
    enableSolarFlares: false,
    rotationPeriod: 648, // 27 days in hours
    differentialRotation: true,
    poleEquatorRatio: 0.95,
  },
};
```

### Red Dwarf Star

```typescript
const redDwarfProperties: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: true,
  spectralClass: "M5V",
  luminosity: 0.04,
  color: "#FF6B6B",
  hotColor: "#FF4444",
  surfaceColor: "#FF6B6B",
  coolColor: "#CC3333",
  stellarType: StellarType.MAIN_SEQUENCE,
  mainSpectralClass: SpectralClass.M,
  luminosityClass: LuminosityClass.V,
  age_years: 8.0e9,
  metallicity: -0.2,
  materialParams: {
    noiseScale: 0.05,
    noiseIntensity: 0.08,
    plasmaTurbulence: 0.3,
    lightingIntensity: 0.8,
  },
  visualEffects: {
    enableGranulation: false,
    enableSunspots: true,
    enableSolarFlares: true,
    rotationPeriod: 1200, // 50 days
    variableStarType: "none",
    stellarPulsation: false,
  },
};
```

### Blue Giant Star

```typescript
const blueGiantProperties: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: true,
  spectralClass: "B2V",
  luminosity: 25000,
  color: "#87CEEB",
  hotColor: "#B0E0E6",
  surfaceColor: "#87CEEB",
  coolColor: "#4682B4",
  stellarType: StellarType.MAIN_SEQUENCE,
  mainSpectralClass: SpectralClass.B,
  luminosityClass: LuminosityClass.V,
  age_years: 1.0e8,
  metallicity: 0.1,
  materialParams: {
    noiseScale: 0.01,
    noiseIntensity: 0.15,
    plasmaTurbulence: 1.2,
    lightingIntensity: 2.0,
  },
  visualEffects: {
    enableGranulation: true,
    enableSunspots: false,
    enableProminences: true,
    enableSolarFlares: true,
    enableCoronalMassEjections: true,
    rotationPeriod: 24, // Fast rotation
    differentialRotation: false,
  },
};
```

### Neutron Star (Pulsar)

```typescript
const pulsarProperties: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: false,
  spectralClass: "P",
  luminosity: 0.001,
  color: "#FFFFFF",
  stellarType: StellarType.NEUTRON_STAR,
  neutronStarSubtype: NeutronStarSubtype.PULSAR,
  specialSpectralClass: SpecialSpectralClass.P,
  age_years: 1.0e9,
  materialParams: {
    noiseScale: 0.5,
    noiseIntensity: 0.3,
    plasmaTurbulence: 0.2,
    lightingIntensity: 1.0,
  },
  visualEffects: {
    stellarPulsation: true,
    pulsationPeriod: 0.00116, // 1.16ms in days
    pulsationAmplitude: 0.8,
    magneticFieldLines: true,
    activeRegions: true,
  },
};
```

### Binary Star System

```typescript
const primaryStarProperties: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: true,
  spectralClass: "G0V",
  luminosity: 1.2,
  color: "#FFF8DC",
  stellarType: StellarType.MAIN_SEQUENCE,
  partnerStars: ["binary-secondary-001"],
  age_years: 3.0e9,
  metallicity: 0.1,
  systemLighting: {
    ambientLightColor: "#404040",
    ambientLightIntensity: 0.1,
    starLightIntensity: 1.2,
  },
};

const secondaryStarProperties: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: false,
  spectralClass: "K5V",
  luminosity: 0.3,
  color: "#FFB347",
  stellarType: StellarType.MAIN_SEQUENCE,
  partnerStars: ["binary-primary-001"],
  age_years: 3.0e9,
  metallicity: 0.1,
};
```

### White Dwarf

```typescript
const whiteDwarfProperties: StarProperties = {
  type: CelestialType.STAR,
  isMainStar: false,
  spectralClass: "DA",
  luminosity: 0.0001,
  color: "#FFFFFF",
  stellarType: StellarType.WHITE_DWARF,
  whiteDwarfSubtype: WhiteDwarfSubtype.DA,
  specialSpectralClass: SpecialSpectralClass.D,
  luminosityClass: LuminosityClass.VII,
  age_years: 5.0e9,
  materialParams: {
    noiseScale: 0.1,
    noiseIntensity: 0.05,
    plasmaTurbulence: 0.1,
    lightingIntensity: 0.5,
  },
  visualEffects: {
    enableGranulation: false,
    enableSunspots: false,
    stellarPulsation: false,
  },
};
```

## Integration

### Renderer Selection

- `stellarType` determines which renderer to use
- `spectralClass` provides detailed renderer configuration
- Subtypes enable specialized rendering behavior

### Physics Calculations

- `luminosity` affects habitable zone calculations
- `age_years` influences planetary atmosphere evolution
- `metallicity` affects rocky planet formation probability

### Shader Configuration

- `materialParams` directly map to shader uniforms
- Color properties define plasma color palettes
- `visualEffects` enable/disable shader features

### System Organization

- `isMainStar` identifies the primary star for camera focus
- `partnerStars` enables binary/multiple star dynamics
- `systemLighting` provides global illumination settings

## 🔗 Related

- [[CelestialObject]] - Base celestial object interface
- [[StellarType]] - Stellar evolutionary stages
- [[SpectralClass]] - Main spectral classification
- [[SpecialSpectralClass]] - Special spectral types
- [[LuminosityClass]] - Luminosity classification
- [[NeutronStarSubtype]] - Neutron star subtypes
- [[BlackHoleSubtype]] - Black hole subtypes
- [[WhiteDwarfSubtype]] - White dwarf subtypes
- [[ProtostarSubtype]] - Protostar subtypes
- [[SystemLightingProperties]] - System lighting configuration
- [[@teskooano/celestials-stars]] - Star rendering system
