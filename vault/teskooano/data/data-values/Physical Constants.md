---
aliases: [Physical Constants]
tags: [data, values, physics, constants]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/physical.ts"
status: active
---

# Physical Constants

Fundamental physical constants in SI units based on CODATA recommended values.

## Overview

The physical constants module provides the most basic physical constants used throughout the simulation. These constants are based on the latest CODATA (Committee on Data for Science and Technology) recommended values and form the foundation for all physics calculations in the Teskooano engine.

## Constants

### GRAVITATIONAL_CONSTANT

```typescript
export const GRAVITATIONAL_CONSTANT = 6.6743e-11;
```

Newton's gravitational constant (G) in m³/(kg·s²).

**Description:**
The fundamental constant that determines the strength of gravitational attraction between masses. Used throughout the simulation for calculating gravitational forces, orbital mechanics, and determining the gravitational parameter (μ = GM) of celestial bodies.

**Units:** m³/(kg·s²)
**Value:** 6.6743×10⁻¹¹
**Source:** CODATA 2018

**Usage Examples:**

```typescript
// Calculate gravitational force between two bodies
const force = (GRAVITATIONAL_CONSTANT * mass1 * mass2) / Math.pow(distance, 2);

// Calculate gravitational parameter for a star
const gravitationalParameter = GRAVITATIONAL_CONSTANT * star.mass;

// Calculate escape velocity from a planet
const escapeVelocity = Math.sqrt(
  (2 * GRAVITATIONAL_CONSTANT * planet.mass) / planet.radius,
);
```

### SPEED_OF_LIGHT

```typescript
export const SPEED_OF_LIGHT = 2.99792458e8;
```

Speed of light in vacuum (c) in m/s.

**Description:**
The ultimate speed limit in the universe. Used in the simulation for relativistic calculations, determining the maximum possible velocity, and calculating relativistic effects like time dilation and gravitational lensing.

**Units:** m/s
**Value:** 2.99792458×10⁸
**Source:** Exact definition (SI)

**Usage Examples:**

```typescript
// Calculate relativistic time dilation
const timeDilation = 1 / Math.sqrt(1 - Math.pow(velocity / SPEED_OF_LIGHT, 2));

// Calculate Schwarzschild radius (event horizon) of a black hole
const schwarzschildRadius =
  (2 * GRAVITATIONAL_CONSTANT * mass) / Math.pow(SPEED_OF_LIGHT, 2);

// Check if velocity is relativistic
const isRelativistic = velocity > 0.1 * SPEED_OF_LIGHT;
```

### PLANCK_CONSTANT

```typescript
export const PLANCK_CONSTANT = 6.62607015e-34;
```

Planck's constant (h) in J·s.

**Description:**
Relates the energy of a photon to its frequency. Used in the simulation for quantum calculations, determining photon energies, and calculating the Wien displacement law for stellar radiation.

**Units:** J·s
**Value:** 6.62607015×10⁻³⁴
**Source:** Exact definition (SI)

**Usage Examples:**

```typescript
// Calculate photon energy from wavelength
const photonEnergy = (PLANCK_CONSTANT * SPEED_OF_LIGHT) / wavelength;

// Calculate Wien displacement law constant
const wienConstant =
  (PLANCK_CONSTANT * SPEED_OF_LIGHT) / (BOLTZMANN_CONSTANT * 2.897771955);

// Calculate peak wavelength of blackbody radiation
const peakWavelength = wienConstant / temperature;
```

### BOLTZMANN_CONSTANT

```typescript
export const BOLTZMANN_CONSTANT = 1.380649e-23;
```

Boltzmann's constant (k) in J/K.

**Description:**
Relates temperature to energy at the molecular level. Used in the simulation for thermal calculations, determining particle velocities, and calculating blackbody radiation properties.

**Units:** J/K
**Value:** 1.380649×10⁻²³
**Source:** Exact definition (SI)

**Usage Examples:**

```typescript
// Calculate thermal energy of particles
const thermalEnergy = 1.5 * BOLTZMANN_CONSTANT * temperature;

// Calculate root mean square velocity of gas molecules
const rmsVelocity = Math.sqrt(
  (3 * BOLTZMANN_CONSTANT * temperature) / molecularMass,
);

// Calculate atmospheric scale height
const scaleHeight =
  (BOLTZMANN_CONSTANT * temperature) / (molecularMass * surfaceGravity);
```

### STEFAN_BOLTZMANN_CONSTANT

```typescript
export const STEFAN_BOLTZMANN_CONSTANT = 5.670374419e-8;
```

Stefan-Boltzmann constant (σ) in W/(m²·K⁴).

**Description:**
Relates the total energy radiated by a blackbody to its temperature. Used in the simulation for calculating stellar luminosity, planetary thermal radiation, and blackbody emission.

**Units:** W/(m²·K⁴)
**Value:** 5.670374419×10⁻⁸
**Source:** CODATA 2018

**Usage Examples:**

```typescript
// Calculate stellar luminosity from temperature and radius
const luminosity =
  4 *
  Math.PI *
  Math.pow(radius, 2) *
  STEFAN_BOLTZMANN_CONSTANT *
  Math.pow(temperature, 4);

// Calculate planetary thermal emission
const thermalEmission = STEFAN_BOLTZMANN_CONSTANT * Math.pow(temperature, 4);

// Calculate effective temperature from luminosity
const effectiveTemp = Math.pow(
  luminosity / (4 * Math.PI * Math.pow(radius, 2) * STEFAN_BOLTZMANN_CONSTANT),
  0.25,
);
```

## Integration

### Physics Calculations

- Gravitational force calculations using G
- Relativistic effects using c
- Thermal radiation using σ
- Quantum effects using h and k

### Stellar Modeling

- Stellar luminosity calculations
- Blackbody radiation modeling
- Stellar evolution parameters
- Habitable zone calculations

### Planetary Physics

- Surface gravity calculations
- Atmospheric modeling
- Thermal balance calculations
- Escape velocity determinations

### Orbital Mechanics

- Gravitational parameter calculations
- Orbital energy determinations
- Velocity calculations
- Period determinations

## Accuracy and Precision

### CODATA 2018 Values

All constants are based on the latest CODATA recommended values:

- Exact definitions where applicable (c, h, k)
- Best measured values for others (G)
- Full precision maintained for accuracy

### Numerical Precision

- Double precision floating point (64-bit)
- Sufficient precision for astronomical calculations
- Maintains accuracy across wide range of scales

### Validation

```typescript
function validatePhysicalConstants(): boolean {
  // Check that constants are within expected ranges
  const isGValid =
    GRAVITATIONAL_CONSTANT > 6e-11 && GRAVITATIONAL_CONSTANT < 7e-11;
  const isCValid = SPEED_OF_LIGHT === 299792458;
  const isHValid = PLANCK_CONSTANT > 6e-34 && PLANCK_CONSTANT < 7e-34;
  const isKValid = BOLTZMANN_CONSTANT > 1e-23 && BOLTZMANN_CONSTANT < 2e-23;
  const isSigmaValid =
    STEFAN_BOLTZMANN_CONSTANT > 5e-8 && STEFAN_BOLTZMANN_CONSTANT < 6e-8;

  return isGValid && isCValid && isHValid && isKValid && isSigmaValid;
}
```

## 🔗 Related

- [[Astronomical Constants]] - Astronomical measurements using these constants
- [[Unit Conversions]] - Conversion functions using these constants
- [[@teskooano/core-physics]] - Physics engine using these constants
- [[@teskooano/systems-procedural-generation]] - Procedural generation using physics constants
