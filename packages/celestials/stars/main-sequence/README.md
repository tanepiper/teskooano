# Main Sequence Star Module

This module provides a comprehensive implementation of main sequence stars for the Open Space simulation. It includes base classes, renderers, materials, and spectral type-specific implementations.

## Architecture

The module follows a hierarchical structure:

- `MainSequenceStarCelestial`: Base class for all main sequence stars
- `ClassGCelestial`, etc.: Specific implementations for different spectral types
- `MainSequenceStarRenderer`: Base renderer for main sequence stars
- `ClassGRenderer`, etc.: Specialized renderers for specific spectral types
- `MainSequenceStarMaterial`: Material factory for creating star materials
- `CelestialCoronaMaterial`: Specialized material for star coronas

## Key Features

- Physically accurate star properties based on spectral classification
- Realistic rendering with custom shaders for surface and corona effects
- Observable state for integration with UI components
- Habitable zone calculations
- Level of Detail (LOD) management for performance optimization

## Usage

```typescript
import { ClassGCelestial } from "@teskooano/celestials-stars-main-sequence";

// Create a G-type star (like our Sun)
const sol = new ClassGCelestial({
  id: "sol",
  name: "Sol",
  physicalProperties: {
    spectralClass: "G2V",
    radius: 6.957e8, // meters
    mass: 1.989e30, // kg
    luminosity_Watts: 3.828e26,
    stellarMass_kg: 1.989e30,
    temperature_k: 5778,
    habitableZoneMin_AU: 0.75,
    habitableZoneMax_AU: 1.8,
  },
});

// The star will automatically set up an appropriate renderer
scene.add(sol.renderer.object3D);

// Subscribe to state changes
sol.state$.subscribe((state) => {
  console.log("Star state updated:", state);
});

// Subscribe to spectral class changes
sol.spectralClass$.subscribe((spectralClass) => {
  console.log("Spectral class changed:", spectralClass);
});

// Get habitable zone information
const habitableZone = sol.getHabitableZoneInfo();
console.log("Habitable zone:", habitableZone);
```

## Extending the Module

To add support for new spectral types:

1. Create a new directory for the spectral class (e.g., `src/class-k/`)
2. Implement a celestial class extending `MainSequenceStarCelestial`
3. Implement a renderer class extending `MainSequenceStarRenderer`
4. Export the new classes from the spectral class directory's index.ts
5. Add exports to the main index.ts file

## Implementation Details

Each main sequence star has:

- Surface rendering with custom shaders for realistic appearance
- Corona rendering with customizable layers
- Physical properties specific to its spectral type
- Habitable zone calculations based on luminosity
- Appropriate color based on temperature and spectral class

The implementation uses THREE.js for rendering and RxJS for state management.
