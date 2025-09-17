---
aliases: [Property Ranges]
tags: [data, values, ranges, validation]
type: Constants Module
package: "@teskooano/data-values"
file: "src/constants/ranges.ts"
status: active
---

# Property Ranges

Valid ranges for various physical properties used throughout the simulation.

## Overview

The property ranges module provides valid ranges for various physical properties used throughout the Teskooano simulation. These ranges help ensure realistic values, provide bounds for UI controls, and validate inputs to prevent unrealistic or physically impossible values.

## Temperature Ranges

### MIN_STELLAR_TEMPERATURE

```typescript
export const MIN_STELLAR_TEMPERATURE = 2000;
```

Minimum stellar temperature in Kelvin.

**Description:**
The minimum realistic surface temperature for stars in the simulation. This corresponds to the coolest M-type red dwarfs and brown dwarfs.

**Value:** 2,000 K

**Usage Examples:**

```typescript
// Validate stellar temperature input
const isValidTemperature =
  temperature >= MIN_STELLAR_TEMPERATURE &&
  temperature <= MAX_STELLAR_TEMPERATURE;

// Set UI slider range for stellar temperature
const temperatureSlider = createSlider(
  MIN_STELLAR_TEMPERATURE,
  MAX_STELLAR_TEMPERATURE,
  defaultTemp,
);

// Clamp temperature to valid range
const clampedTemp = Math.max(
  MIN_STELLAR_TEMPERATURE,
  Math.min(temperature, MAX_STELLAR_TEMPERATURE),
);

// Determine stellar type based on temperature
const stellarType = temperature < 3500 ? "M" : temperature < 5000 ? "K" : "G";
```

### MAX_STELLAR_TEMPERATURE

```typescript
export const MAX_STELLAR_TEMPERATURE = 50000;
```

Maximum stellar temperature in Kelvin.

**Description:**
The maximum realistic surface temperature for stars in the simulation. This corresponds to the hottest O-type stars and Wolf-Rayet stars.

**Value:** 50,000 K

**Usage Examples:**

```typescript
// Validate stellar temperature input
const isValidTemperature =
  temperature >= MIN_STELLAR_TEMPERATURE &&
  temperature <= MAX_STELLAR_TEMPERATURE;

// Calculate temperature as percentage of valid range
const tempPercentage =
  (temperature - MIN_STELLAR_TEMPERATURE) /
  (MAX_STELLAR_TEMPERATURE - MIN_STELLAR_TEMPERATURE);

// Determine stellar spectral class based on temperature
const spectralClass =
  temperature > 30000 ? "O" : temperature > 10000 ? "B" : "A";

// Calculate stellar color from temperature
const color = calculateStellarColor(
  temperature,
  MIN_STELLAR_TEMPERATURE,
  MAX_STELLAR_TEMPERATURE,
);
```

### MIN_PLANETARY_TEMPERATURE

```typescript
export const MIN_PLANETARY_TEMPERATURE = 50;
```

Minimum planetary temperature in Kelvin.

**Description:**
The minimum realistic surface temperature for planets in the simulation. This corresponds to the coldest ice worlds and outer solar system objects.

**Value:** 50 K

**Usage Examples:**

```typescript
// Validate planetary temperature input
const isValidTemperature =
  temperature >= MIN_PLANETARY_TEMPERATURE &&
  temperature <= MAX_PLANETARY_TEMPERATURE;

// Determine if planet can support liquid water
const canSupportWater = temperature >= 273 && temperature <= 373; // 0-100°C

// Calculate temperature in Celsius for display
const tempCelsius = temperature - 273.15;

// Determine planet type based on temperature
const planetType =
  temperature < 100 ? "ICE" : temperature < 200 ? "ROCKY" : "TERRESTRIAL";
```

### MAX_PLANETARY_TEMPERATURE

```typescript
export const MAX_PLANETARY_TEMPERATURE = 3000;
```

Maximum planetary temperature in Kelvin.

**Description:**
The maximum realistic surface temperature for planets in the simulation. This corresponds to the hottest lava worlds and planets very close to their stars.

**Value:** 3,000 K

**Usage Examples:**

```typescript
// Validate planetary temperature input
const isValidTemperature =
  temperature >= MIN_PLANETARY_TEMPERATURE &&
  temperature <= MAX_PLANETARY_TEMPERATURE;

// Determine planet type based on temperature
const planetType =
  temperature > 1000 ? "LAVA" : temperature > 500 ? "DESERT" : "ROCKY";

// Calculate thermal emission for rendering
const thermalEmission = STEFAN_BOLTZMANN_CONSTANT * Math.pow(temperature, 4);

// Determine atmospheric composition based on temperature
const hasAtmosphere = temperature < 2000; // Very hot planets lose atmosphere
```

## Albedo Ranges

### MIN_ALBEDO

```typescript
export const MIN_ALBEDO = 0.0;
```

Minimum albedo (reflectivity) value.

**Description:**
The minimum possible albedo value for celestial objects. A value of 0.0 represents a perfectly black object that absorbs all incident light.

**Value:** 0.0

**Usage Examples:**

```typescript
// Validate albedo input
const isValidAlbedo = albedo >= MIN_ALBEDO && albedo <= MAX_ALBEDO;

// Calculate reflected light intensity
const reflectedIntensity = incidentLight * albedo;

// Determine object brightness for rendering
const brightness = 1 - albedo; // Darker objects have lower albedo

// Calculate absorbed light
const absorbedIntensity = incidentLight * (1 - albedo);
```

### MAX_ALBEDO

```typescript
export const MAX_ALBEDO = 1.0;
```

Maximum albedo (reflectivity) value.

**Description:**
The maximum possible albedo value for celestial objects. A value of 1.0 represents a perfectly reflective object that reflects all incident light.

**Value:** 1.0

**Usage Examples:**

```typescript
// Validate albedo input
const isValidAlbedo = albedo >= MIN_ALBEDO && albedo <= MAX_ALBEDO;

// Calculate absorbed light intensity
const absorbedIntensity = incidentLight * (1 - albedo);

// Determine if object is highly reflective
const isHighlyReflective = albedo > 0.7;

// Calculate thermal balance
const thermalBalance = absorbedIntensity - thermalEmission;
```

## Orbital Parameter Ranges

### MIN_ECCENTRICITY

```typescript
export const MIN_ECCENTRICITY = 0.0;
```

Minimum orbital eccentricity value.

**Description:**
The minimum possible orbital eccentricity value. A value of 0.0 represents a perfectly circular orbit.

**Value:** 0.0

**Usage Examples:**

```typescript
// Validate eccentricity input
const isValidEccentricity =
  eccentricity >= MIN_ECCENTRICITY && eccentricity <= MAX_ECCENTRICITY;

// Determine orbit shape
const orbitShape =
  eccentricity === 0
    ? "circular"
    : eccentricity < 0.1
      ? "near-circular"
      : "elliptical";

// Calculate orbital stability
const isStable = eccentricity < 0.9; // Highly eccentric orbits may be unstable

// Calculate orbital energy
const orbitalEnergy = eccentricity < 1.0 ? "bound" : "unbound";
```

### MAX_ECCENTRICITY

```typescript
export const MAX_ECCENTRICITY = 2.0;
```

Maximum orbital eccentricity value (hyperbolic).

**Description:**
The maximum possible orbital eccentricity value. Values above 1.0 represent hyperbolic (unbound) orbits, while values between 0.0 and 1.0 represent elliptical (bound) orbits.

**Value:** 2.0

**Usage Examples:**

```typescript
// Validate eccentricity input
const isValidEccentricity =
  eccentricity >= MIN_ECCENTRICITY && eccentricity <= MAX_ECCENTRICITY;

// Determine if orbit is bound or unbound
const isBound = eccentricity < 1.0;
const isHyperbolic = eccentricity > 1.0;

// Calculate orbital energy
const orbitalEnergy = isBound ? "negative" : "positive";

// Determine orbit classification
const orbitType =
  eccentricity === 0
    ? "circular"
    : eccentricity < 1.0
      ? "elliptical"
      : "hyperbolic";
```

## Usage Patterns

### Property Validation

```typescript
function validatePhysicalProperties(
  properties: PhysicalProperties,
): ValidationResult {
  const errors: string[] = [];

  // Validate temperature
  if (
    properties.temperature < MIN_STELLAR_TEMPERATURE ||
    properties.temperature > MAX_STELLAR_TEMPERATURE
  ) {
    errors.push(
      `Temperature must be between ${MIN_STELLAR_TEMPERATURE}K and ${MAX_STELLAR_TEMPERATURE}K`,
    );
  }

  // Validate albedo
  if (properties.albedo < MIN_ALBEDO || properties.albedo > MAX_ALBEDO) {
    errors.push(`Albedo must be between ${MIN_ALBEDO} and ${MAX_ALBEDO}`);
  }

  // Validate eccentricity
  if (
    properties.eccentricity < MIN_ECCENTRICITY ||
    properties.eccentricity > MAX_ECCENTRICITY
  ) {
    errors.push(
      `Eccentricity must be between ${MIN_ECCENTRICITY} and ${MAX_ECCENTRICITY}`,
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
```

### UI Control Creation

```typescript
function createPropertyControls(): PropertyControls {
  return {
    temperature: createSlider(
      MIN_STELLAR_TEMPERATURE,
      MAX_STELLAR_TEMPERATURE,
      (MIN_STELLAR_TEMPERATURE + MAX_STELLAR_TEMPERATURE) / 2,
    ),

    albedo: createSlider(
      MIN_ALBEDO,
      MAX_ALBEDO,
      0.3, // Default albedo
    ),

    eccentricity: createSlider(
      MIN_ECCENTRICITY,
      MAX_ECCENTRICITY,
      0.0, // Default circular orbit
    ),
  };
}
```

### Property Clamping

```typescript
function clampToValidRanges(
  properties: Partial<PhysicalProperties>,
): PhysicalProperties {
  return {
    temperature: Math.max(
      MIN_STELLAR_TEMPERATURE,
      Math.min(properties.temperature || 5778, MAX_STELLAR_TEMPERATURE),
    ),

    albedo: Math.max(
      MIN_ALBEDO,
      Math.min(properties.albedo || 0.3, MAX_ALBEDO),
    ),

    eccentricity: Math.max(
      MIN_ECCENTRICITY,
      Math.min(properties.eccentricity || 0.0, MAX_ECCENTRICITY),
    ),
  };
}
```

### Range-Based Calculations

```typescript
function calculatePropertyPercentage(
  value: number,
  min: number,
  max: number,
): number {
  return (value - min) / (max - min);
}

function interpolateProperty(
  percentage: number,
  min: number,
  max: number,
): number {
  return min + percentage * (max - min);
}

// Example usage
const tempPercentage = calculatePropertyPercentage(
  temperature,
  MIN_STELLAR_TEMPERATURE,
  MAX_STELLAR_TEMPERATURE,
);
const interpolatedTemp = interpolateProperty(
  0.5,
  MIN_STELLAR_TEMPERATURE,
  MAX_STELLAR_TEMPERATURE,
); // Mid-range temperature
```

## Integration

### Input Validation

- UI form validation
- API parameter validation
- Configuration file validation

### Procedural Generation

- Realistic value generation within valid ranges
- Type-specific property ranges
- Constraint-based generation

### Physics Simulation

- Property bounds checking
- Realistic behavior enforcement
- Stability validation

### Rendering System

- Visual property mapping
- Color calculation from temperature
- Brightness calculation from albedo

## Performance Considerations

### Validation Efficiency

- Simple range checks are O(1) operations
- No complex calculations required
- Minimal performance impact

### Memory Usage

- Constants are compile-time values
- No runtime memory allocation
- Efficient for frequent validation

### Caching

- Range calculations can be cached
- Validation results can be memoized
- UI controls can cache range values

## 🔗 Related

- [[Physical Constants]] - Fundamental constants used with property calculations
- [[Astronomical Constants]] - Reference values for property scaling
- [[Simulation Limits]] - Numerical limits for simulation stability
- [[@teskooano/data-types]] - Type definitions that use these ranges
- [[@teskooano/systems-procedural-generation]] - Procedural generation using property ranges
