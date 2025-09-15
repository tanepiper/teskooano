---
aliases: [utils.ts]
tags: [renderer, threejs, rings, utils, physics]
type: utility
package: "@teskooano/celestials-rings"
file: "src/utils.ts"
status: active
---

# utils.ts

Utility functions for ring systems and accretion disks with physical calculations and property generation.

## Overview

The utils.ts file provides utility functions for calculating various physical properties related to ring systems and accretion disks. It includes functions for Keplerian rotation rates, Schwarzschild radius calculations, ISCO (Innermost Stable Circular Orbit) calculations, and accretion disk temperature and luminosity calculations.

## Utility Functions

### calculateKeplerianRotationRate

```typescript
export function calculateKeplerianRotationRate(
  centralMass: number,
  orbitalRadius: number,
  gravitationalConstant: number = 6.674e-11,
): number;
```

Calculates the Keplerian rotation rate for a ring system.

#### Parameters

- **centralMass**: Mass of the central object (kg)
- **orbitalRadius**: Orbital radius of the ring (m)
- **gravitationalConstant**: Gravitational constant (default: 6.674e-11 m³/kg/s²)

#### Returns

- **number**: Keplerian rotation rate (rad/s)

#### Formula

```
ω = √(GM/r³)
```

Where:

- G = gravitational constant
- M = central mass
- r = orbital radius

#### Usage

```typescript
const rotationRate = calculateKeplerianRotationRate(1.989e30, 1.5e11);
// Returns rotation rate for Earth's orbit around Sun
```

### calculateSchwarzschildRadius

```typescript
export function calculateSchwarzschildRadius(
  mass: number,
  speedOfLight: number = 2.998e8,
  gravitationalConstant: number = 6.674e-11,
): number;
```

Calculates the Schwarzschild radius (event horizon) for a given mass.

#### Parameters

- **mass**: Mass of the object (kg)
- **speedOfLight**: Speed of light (default: 2.998e8 m/s)
- **gravitationalConstant**: Gravitational constant (default: 6.674e-11 m³/kg/s²)

#### Returns

- **number**: Schwarzschild radius (m)

#### Formula

```
rs = 2GM/c²
```

Where:

- G = gravitational constant
- M = mass
- c = speed of light

#### Usage

```typescript
const schwarzschildRadius = calculateSchwarzschildRadius(1.989e30);
// Returns Schwarzschild radius for a solar mass black hole
```

### calculateISCO

```typescript
export function calculateISCO(
  mass: number,
  speedOfLight: number = 2.998e8,
  gravitationalConstant: number = 6.674e-11,
): number;
```

Calculates the Innermost Stable Circular Orbit (ISCO) for a Schwarzschild black hole.

#### Parameters

- **mass**: Mass of the black hole (kg)
- **speedOfLight**: Speed of light (default: 2.998e8 m/s)
- **gravitationalConstant**: Gravitational constant (default: 6.674e-11 m³/kg/s²)

#### Returns

- **number**: ISCO radius (m)

#### Formula

```
risco = 6GM/c² = 3rs
```

Where:

- G = gravitational constant
- M = mass
- c = speed of light
- rs = Schwarzschild radius

#### Usage

```typescript
const isco = calculateISCO(1.989e30);
// Returns ISCO for a solar mass black hole
```

### calculateAccretionDiskTemperature

```typescript
export function calculateAccretionDiskTemperature(
  centralMass: number,
  accretionRate: number,
  radius: number,
  efficiency: number = 0.1,
  gravitationalConstant: number = 6.674e-11,
  stefanBoltzmannConstant: number = 5.67e-8,
): number;
```

Calculates the temperature of an accretion disk at a given radius.

#### Parameters

- **centralMass**: Mass of the central object (kg)
- **accretionRate**: Mass accretion rate (kg/s)
- **radius**: Radius from center (m)
- **efficiency**: Accretion efficiency (default: 0.1)
- **gravitationalConstant**: Gravitational constant (default: 6.674e-11 m³/kg/s²)
- **stefanBoltzmannConstant**: Stefan-Boltzmann constant (default: 5.670e-8 W/m²/K⁴)

#### Returns

- **number**: Temperature (K)

#### Formula

```
T = (3GMṁ/(8πr³σ))^(1/4)
```

Where:

- G = gravitational constant
- M = central mass
- ṁ = accretion rate
- r = radius
- σ = Stefan-Boltzmann constant

#### Usage

```typescript
const temperature = calculateAccretionDiskTemperature(
  1.989e30, // Solar mass
  1e-6, // 1e-6 solar masses per year
  1e9, // 1 million km radius
);
```

### calculateAccretionDiskLuminosity

```typescript
export function calculateAccretionDiskLuminosity(
  centralMass: number,
  accretionRate: number,
  efficiency: number = 0.1,
  speedOfLight: number = 2.998e8,
  gravitationalConstant: number = 6.674e-11,
): number;
```

Calculates the total luminosity of an accretion disk.

#### Parameters

- **centralMass**: Mass of the central object (kg)
- **accretionRate**: Mass accretion rate (kg/s)
- **efficiency**: Accretion efficiency (default: 0.1)
- **speedOfLight**: Speed of light (default: 2.998e8 m/s)
- **gravitationalConstant**: Gravitational constant (default: 6.674e-11 m³/kg/s²)

#### Returns

- **number**: Luminosity (W)

#### Formula

```
L = ηṁc²
```

Where:

- η = efficiency
- ṁ = accretion rate
- c = speed of light

#### Usage

```typescript
const luminosity = calculateAccretionDiskLuminosity(
  1.989e30, // Solar mass
  1e-6, // 1e-6 solar masses per year
);
```

### generateAccretionDiskProperties

```typescript
export function generateAccretionDiskProperties(
  centralMass: number,
  options: {
    accretionRate?: number;
    efficiency?: number;
    innerRadius?: number;
    outerRadius?: number;
    temperature?: number;
    emissionType?: "thermal" | "synchrotron" | "bremsstrahlung";
    isRelativistic?: boolean;
  } = {},
): {
  accretionRate: number;
  efficiency: number;
  innerRadius: number;
  outerRadius: number;
  temperature: number;
  emissionType: number;
  isRelativistic: boolean;
  luminosity: number;
  isco: number;
  schwarzschildRadius: number;
};
```

Generates realistic accretion disk properties for a given central mass.

#### Parameters

- **centralMass**: Mass of the central object (kg)
- **options**: Optional configuration object

#### Options

- **accretionRate**: Mass accretion rate (kg/s, default: calculated)
- **efficiency**: Accretion efficiency (default: 0.1)
- **innerRadius**: Inner edge radius (m, default: ISCO)
- **outerRadius**: Outer edge radius (m, default: calculated)
- **temperature**: Base temperature (K, default: calculated)
- **emissionType**: Type of emission (default: 'thermal')
- **isRelativistic**: Whether to apply relativistic effects (default: true)

#### Returns

- **object**: Complete accretion disk properties

#### Properties

- **accretionRate**: Mass accretion rate (kg/s)
- **efficiency**: Accretion efficiency
- **innerRadius**: Inner edge radius (m)
- **outerRadius**: Outer edge radius (m)
- **temperature**: Base temperature (K)
- **emissionType**: Emission type (0=thermal, 1=synchrotron, 2=bremsstrahlung)
- **isRelativistic**: Whether relativistic effects are applied
- **luminosity**: Total luminosity (W)
- **isco**: ISCO radius (m)
- **schwarzschildRadius**: Schwarzschild radius (m)

#### Usage

```typescript
const properties = generateAccretionDiskProperties(1.989e30, {
  efficiency: 0.1,
  emissionType: "thermal",
  isRelativistic: true,
});
```

## Physical Constants

The utility functions use standard physical constants:

### Gravitational Constant

```typescript
const G = 6.674e-11; // m³/kg/s²
```

### Speed of Light

```typescript
const c = 2.998e8; // m/s
```

### Stefan-Boltzmann Constant

```typescript
const σ = 5.67e-8; // W/m²/K⁴
```

## Physical Models

### Keplerian Rotation

The Keplerian rotation model assumes:

- **Circular Orbits**: All particles orbit in circular paths
- **Central Force**: Only gravitational force from central object
- **No Interactions**: Particles don't interact with each other
- **Newtonian Gravity**: Uses Newton's law of universal gravitation

### Accretion Disk Physics

The accretion disk model includes:

- **Viscous Heating**: Energy dissipation through viscosity
- **Radiative Cooling**: Energy loss through radiation
- **Temperature Gradient**: Temperature decreases with radius
- **Emission Types**: Different emission mechanisms

### Relativistic Effects

When relativistic effects are enabled:

- **ISCO**: Innermost Stable Circular Orbit
- **Schwarzschild Radius**: Event horizon
- **Relativistic Boost**: Lorentz factor effects
- **Gravitational Redshift**: Energy loss due to gravity

## Error Handling

The utility functions include error handling for:

- **Invalid Mass**: Negative or zero mass values
- **Invalid Radius**: Negative or zero radius values
- **Invalid Accretion Rate**: Negative accretion rates
- **Division by Zero**: Prevents division by zero errors

## Performance Considerations

- **Efficient Calculations**: Optimized mathematical operations
- **Default Parameters**: Sensible defaults for physical constants
- **Minimal Dependencies**: No external dependencies
- **Type Safety**: Full TypeScript type safety

## Integration with Shaders

The utility functions provide data for shader uniforms:

- **Temperature**: Used in fragment shaders for emission calculations
- **Accretion Rate**: Used for visual effects
- **ISCO**: Used for inner edge radius
- **Luminosity**: Used for brightness calculations

## 🔗 Related

- [[AccretionDiskMaterial]] - Material that uses these calculations
- [[RingSystemRenderer]] - Renderer that uses these utilities
- [[accretion-disk.fragment.glsl]] - Fragment shader that uses these calculations
- [[ring.fragment.glsl]] - Fragment shader that may use these calculations
