# Solar System Package

A comprehensive, scientifically accurate implementation of the Solar System for the Teskooano N-body simulation engine. This package provides detailed astronomical data for all major celestial bodies in our Solar System, including the Sun, planets, moons, dwarf planets, asteroids, and comets.

## Purpose

The Solar System package serves as the definitive source of astronomical data for realistic space simulations. It provides:

- **Accurate Physical Data**: Mass, radius, temperature, albedo, and other physical properties sourced from NASA and astronomical databases
- **Precise Orbital Elements**: Semi-major axis, eccentricity, inclination, and other orbital parameters for realistic motion
- **Complete System Hierarchy**: Parent-child relationships between stars, planets, and moons
- **Procedural Surface Generation**: Detailed surface properties for realistic visual rendering
- **Atmospheric Effects**: Atmospheric composition and visual properties for planets with atmospheres

## Architecture

### Directory Structure

```
src/
├── index.ts                 # Main initialization function
├── sol/                     # Sun (G2V main sequence star)
├── mercury/                 # Innermost planet
├── venus/                   # Second planet
├── earth/                   # Third planet (includes Luna)
├── mars/                    # Fourth planet
├── jupiter/                 # Fifth planet (gas giant with moons)
├── saturn/                  # Sixth planet (gas giant with rings)
├── uranus/                  # Seventh planet (ice giant)
├── neptune/                 # Eighth planet (ice giant)
├── pluto/                   # Dwarf planet
└── minor-bodies/            # Asteroids, comets, dwarf planets
```

### Data Flow

1. **Initialization**: `initializeSolarSystem()` creates the Sun first, then all planets and minor bodies
2. **Hierarchy**: Each celestial body is created with a `parentId` reference to establish orbital relationships
3. **State Management**: All objects are registered with the core state system via `actions.addCelestial()`
4. **Physics Integration**: Orbital elements are converted to physics state for the simulation engine

### Key Components

- **Physical Constants**: Mass, radius, temperature, albedo from NASA Planetary Fact Sheet
- **Orbital Elements**: Semi-major axis, eccentricity, inclination, longitude of ascending node, argument of periapsis, mean anomaly
- **Surface Properties**: Procedural generation parameters for realistic terrain rendering
- **Atmospheric Data**: Composition, density, and visual properties for atmospheric effects

## Data Sources

### Primary Sources

- **NASA Planetary Fact Sheet**: Mass, radius, orbital elements, physical properties
- **JPL Horizons System**: Precise orbital calculations and ephemeris data
- **IAU Standards**: Official astronomical constants and definitions
- **Scientific Literature**: Peer-reviewed research for specialized properties

### Data Quality

- **Mass**: Accurate to 6+ significant figures for major bodies
- **Orbital Elements**: Current epoch values with proper uncertainty ranges
- **Physical Properties**: Temperature, albedo, and composition from multiple sources
- **Validation**: Cross-referenced against multiple astronomical databases

## Usage

### Basic Initialization

```typescript
import { initializeSolarSystem } from "@teskooano/systems-solar-system";

// Initialize the complete Solar System
initializeSolarSystem();
```

### Individual Body Initialization

```typescript
import { initializeSun } from "@teskooano/systems-solar-system/src/sol";
import { initializeEarth } from "@teskooano/systems-solar-system/src/earth";

// Create the Sun first
const sunId = initializeSun();

// Then create Earth (and its moon)
initializeEarth(sunId);
```

### Data Access

All celestial bodies are registered with the core state system and can be accessed via:

```typescript
import { getState } from "@teskooano/core-state";

const state = getState();
const earth = state.celestialObjects.find((obj) => obj.id === "earth");
```

## Features

### Complete Solar System

- **Sun**: G2V main sequence star with accurate mass and luminosity
- **Terrestrial Planets**: Mercury, Venus, Earth, Mars with detailed surface properties
- **Gas Giants**: Jupiter and Saturn with atmospheric effects and ring systems
- **Ice Giants**: Uranus and Neptune with unique atmospheric compositions
- **Dwarf Planets**: Pluto, Ceres, Eris, Haumea, Makemake with accurate orbital data
- **Minor Bodies**: Asteroid belt, comets, and Oort cloud objects

### Scientific Accuracy

- **Orbital Mechanics**: Precise Keplerian elements for realistic motion
- **Physical Properties**: Mass, radius, temperature, and composition data
- **Atmospheric Effects**: Realistic atmospheric composition and visual properties
- **Surface Generation**: Procedural terrain based on actual geological features

### Visual Realism

- **Procedural Surfaces**: Detailed terrain generation for terrestrial planets
- **Atmospheric Rendering**: Realistic atmospheric effects with proper scattering
- **Ring Systems**: Accurate ring properties for gas giants
- **Surface Features**: Cratering, terrain variation, and geological diversity

## Data Quality Standards

### Physical Properties

| Property         | Accuracy                | Source                    |
| ---------------- | ----------------------- | ------------------------- |
| Mass             | 6+ sig figs             | NASA Planetary Fact Sheet |
| Radius           | 4+ sig figs             | NASA Planetary Fact Sheet |
| Orbital Elements | Current epoch           | JPL Horizons              |
| Temperature      | Blackbody + atmospheric | Scientific literature     |

### Orbital Elements

All orbital elements are provided in the standard astronomical format:

- **Semi-major axis**: Distance in meters
- **Eccentricity**: Dimensionless (0-1)
- **Inclination**: Radians relative to ecliptic
- **Longitude of ascending node**: Radians
- **Argument of periapsis**: Radians
- **Mean anomaly**: Radians at epoch

## Development Guidelines

### Adding New Bodies

1. Create a new directory in `src/` for the celestial body
2. Define physical constants at the top of the file
3. Create an initialization function that calls `actions.addCelestial()`
4. Include proper orbital elements and physical properties
5. Add surface/atmospheric properties as appropriate
6. Update the main `index.ts` to include the new body

### Data Validation

- Cross-reference all values against NASA/JPL sources
- Verify orbital elements are current epoch
- Ensure mass and radius values are consistent
- Validate that parent-child relationships are correct

### Code Standards

- Use descriptive constant names (e.g., `EARTH_MASS_KG`)
- Include source comments for all astronomical data
- Follow the established pattern for orbital element calculations
- Maintain proper TypeScript typing throughout

## Dependencies

- `@teskooano/core-state`: State management and object registration
- `@teskooano/core-math`: Mathematical utilities and vector operations
- `@teskooano/core-physics`: Astronomical constants and physics calculations
- `@teskooano/data-types`: TypeScript interfaces and enums

## Contributing

When contributing to this package:

1. **Verify Data Sources**: Ensure all astronomical data comes from authoritative sources
2. **Maintain Accuracy**: Cross-reference values against multiple sources
3. **Document Sources**: Include comments indicating data provenance
4. **Test Integration**: Verify that new bodies work correctly with the simulation engine
5. **Update Documentation**: Keep README files current with new additions

## References

- [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/)
- [IAU Standards](https://www.iau.org/public/themes/measuring/)
- [Astronomical Almanac](https://www.iau.org/publications/astronomical-almanac/)

## License

This package is part of the Teskooano project and follows the same licensing terms as the main project.
