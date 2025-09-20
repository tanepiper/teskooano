# AGENTS.md

A guide for AI coding agents working on the Solar System package for Teskooano.

## Package Overview

The **Solar System package** (`@teskooano/systems-solar-system`) provides a comprehensive, scientifically accurate implementation of our Solar System for the Teskooano N-body simulation engine. It includes detailed astronomical data for all major celestial bodies including the Sun, planets, moons, dwarf planets, asteroids, comets, and artificial satellites.

## Key Features

- **Scientifically Accurate Data**: Mass, radius, temperature, albedo, and orbital elements sourced from NASA and JPL
- **Complete System Hierarchy**: Parent-child relationships between stars, planets, and moons
- **Dynamic Epoch Processing**: Objects are processed to current time positions from their historical epochs
- **Comprehensive Coverage**: Sun, 8 planets, 200+ moons, dwarf planets, asteroids, comets, and satellites
- **Modular Architecture**: Each celestial body is defined in its own file for maintainability

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Vitest for testing

### Development Commands

```bash
# Run tests
moon run solar-system:test

# Run tests with UI
moon run solar-system:test-ui

# Run tests with coverage
moon run solar-system:test-coverage

# Run tests in watch mode
moon run solar-system:test-watch

# Run browser tests
moon run solar-system:test-browser
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                    # Main initialization function
├── sol/                        # Sun and system-wide objects
│   ├── star.ts                # G2V main sequence star
│   ├── asteroid-belt.ts       # Main asteroid belt
│   └── oort-cloud.ts          # Oort cloud
├── mercury/                    # Innermost planet
├── venus/                      # Second planet
├── earth/                      # Third planet (includes Luna)
│   ├── moons/moon.ts          # Earth's moon
│   └── satellites/            # Artificial satellites
├── mars/                       # Fourth planet
├── jupiter/                    # Fifth planet (gas giant)
├── saturn/                     # Sixth planet (gas giant with rings)
├── uranus/                     # Seventh planet (ice giant)
├── neptune/                    # Eighth planet (ice giant)
├── pluto/                      # Dwarf planet
├── planet-nine/                # Hypothetical Planet Nine
├── minor-bodies/               # Dwarf planets and KBOs
├── asteroids/                  # Notable asteroids
├── comets/                     # Periodic and long-period comets
├── intersteller/               # Interstellar objects
├── satellites/                 # Artificial satellites
└── utils/                      # Utility functions
```

### Data Flow

1. **Initialization**: `initializeSolarSystem()` creates all objects
2. **Epoch Processing**: Objects are processed to current time positions
3. **State Management**: All objects registered with core state system
4. **Physics Integration**: Orbital elements converted to physics state

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all celestial object properties
- **Interfaces**: Use `CelestialObject<T>` generic interface
- **JSDoc**: Include comprehensive documentation for all astronomical data

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `99942-apophis.ts`)
- **Constants**: Use UPPER_CASE for physical constants
- **Objects**: Use camelCase for object properties
- **IDs**: Use kebab-case for celestial object IDs

### Data Standards

- **Mass**: Accurate to 6+ significant figures for major bodies
- **Orbital Elements**: Current epoch values with proper uncertainty ranges
- **Physical Properties**: Temperature, albedo, composition from authoritative sources
- **Source Attribution**: Always include data source comments

## Key Components

### Celestial Object Structure

```typescript
export const exampleObject: CelestialObject<PlanetProperties> = {
  id: "object-id",
  name: "Object Name",
  seed: "unique-seed",
  type: CelestialType.PLANET,
  status: CelestialStatus.ACTIVE,
  parentId: "parent-id",
  realMass_kg: 1.0e24,
  realRadius_m: 1000000,
  temperature: 288,
  albedo: 0.3,
  orbit: createOrbitalElements({
    semiMajorAxisAU: 1.0,
    eccentricity: 0.0167,
    inclinationDeg: 0.0,
    // ... other orbital elements
  }),
  properties: {
    // Type-specific properties
  },
};
```

### Orbital Elements

All objects use the `createOrbitalElements` function with:

- **Semi-major axis**: In AU for planets, meters for moons
- **Eccentricity**: Dimensionless (0-1 for elliptical orbits)
- **Inclination**: Degrees relative to reference plane
- **Epoch**: Standard astronomical epoch (J2000 for historical data)

### Physical Properties

- **Mass**: In kilograms, sourced from NASA Planetary Fact Sheet
- **Radius**: In meters, using `kmToM()` conversion function
- **Temperature**: In Kelvin, effective temperature
- **Albedo**: Geometric albedo (0-1)

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for individual objects, integration tests for system initialization
- **Test Data**: Use exact values from source data for validation

### Test Commands

```bash
# Run all tests
moon run solar-system:test

# Run specific test file
moon run solar-system:test -- earth.spec.ts

# Run tests with coverage
moon run solar-system:test-coverage
```

### Test Patterns

- **Object Validation**: Verify all required properties are present
- **Data Accuracy**: Check physical properties against source data
- **Hierarchy Validation**: Ensure parent-child relationships are correct
- **Orbital Validation**: Verify orbital elements are within valid ranges

## Data Sources & Validation

### Primary Sources

- **NASA Planetary Fact Sheet**: Mass, radius, orbital elements
- **JPL Horizons System**: Precise orbital calculations
- **IAU Standards**: Astronomical constants and definitions
- **Scientific Literature**: Specialized properties and compositions

### Data Quality Standards

| Property         | Accuracy                | Source                    |
| ---------------- | ----------------------- | ------------------------- |
| Mass             | 6+ sig figs             | NASA Planetary Fact Sheet |
| Radius           | 4+ sig figs             | NASA Planetary Fact Sheet |
| Orbital Elements | Current epoch           | JPL Horizons              |
| Temperature      | Blackbody + atmospheric | Scientific literature     |

### Validation Process

1. **Cross-reference**: Verify values against multiple sources
2. **Range Checking**: Ensure values are within physically reasonable ranges
3. **Consistency**: Check that related values are consistent
4. **Epoch Validation**: Verify orbital elements are current epoch

## Development Guidelines

### Adding New Bodies

1. **Create File**: Add new file in appropriate directory
2. **Define Constants**: Add physical constants at top of file
3. **Create Object**: Use `CelestialObject<T>` interface
4. **Add to Index**: Include in appropriate system bodies array
5. **Write Tests**: Add comprehensive test coverage
6. **Document Sources**: Include data source comments

### Epoch Handling

- **Historical Data**: Use J2000 epoch for hand-crafted objects
- **Current Data**: Use current epoch for real-time objects
- **Processing**: All objects processed to current time during initialization
- **Validation**: Ensure epoch processing doesn't introduce errors

### Orbital Mechanics

- **Coordinate System**: Right-handed, Y-up coordinate system
- **Units**: AU for planetary distances, meters for moon distances
- **Precision**: Use high-precision values for orbital calculations
- **Validation**: Check for physically impossible orbital parameters

## Common Patterns

### Object Creation Pattern

```typescript
// 1. Define physical constants
const OBJECT_MASS_KG = 1.0e24;
const OBJECT_RADIUS_KM = 1000;

// 2. Create orbital elements
const orbit = createOrbitalElements({
  semiMajorAxisAU: 1.0,
  eccentricity: 0.0167,
  // ... other elements
});

// 3. Create celestial object
export const object: CelestialObject<PlanetProperties> = {
  id: "object-id",
  name: "Object Name",
  // ... properties
};
```

### System Bodies Pattern

```typescript
// Export individual objects
export const object1 = {
  /* ... */
};
export const object2 = {
  /* ... */
};

// Export system bodies array
export const systemBodies = [object1, object2];
```

### Testing Pattern

```typescript
describe("Object System", () => {
  it("should have correct properties", () => {
    expect(object.realMass_kg).toBe(OBJECT_MASS_KG);
    expect(object.realRadius_m).toBe(kmToM(OBJECT_RADIUS_KM));
    // ... other validations
  });
});
```

## Performance Considerations

### Initialization Performance

- **Batch Processing**: All objects processed in single batch
- **Epoch Processing**: Efficient epoch-to-current-time conversion
- **Memory Usage**: Objects created once and reused
- **Validation**: Minimal validation during initialization

### Data Access

- **Lazy Loading**: Objects created on demand
- **Caching**: Processed objects cached for reuse
- **Indexing**: Fast lookup by object ID
- **Filtering**: Efficient filtering by object type

## Troubleshooting

### Common Issues

- **Epoch Mismatches**: Ensure all objects use consistent epochs
- **Parent References**: Verify parentId references exist
- **Orbital Validation**: Check for impossible orbital parameters
- **Data Sources**: Verify data comes from authoritative sources

### Debug Tools

- **Epoch Processor**: Use `DynamicEpochProcessor` for epoch debugging
- **Validation Functions**: Use built-in validation for data checking
- **Test Coverage**: Run tests to identify data inconsistencies
- **Source Verification**: Cross-reference against original sources

## Dependencies

### Core Dependencies

- `@teskooano/core-state`: State management and object registration
- `@teskooano/core-math`: Mathematical utilities and vector operations
- `@teskooano/core-physics`: Astronomical constants and physics calculations
- `@teskooano/data-types`: TypeScript interfaces and enums

### Development Dependencies

- `vitest`: Testing framework
- `typescript`: Type checking
- `@playwright/test`: Browser testing

## Contributing Guidelines

### Data Accuracy

1. **Verify Sources**: Ensure all data comes from authoritative sources
2. **Cross-reference**: Check values against multiple sources
3. **Document Sources**: Include source comments for all data
4. **Validate Ranges**: Ensure values are physically reasonable

### Code Quality

1. **Follow Patterns**: Use established patterns for consistency
2. **Write Tests**: Add comprehensive test coverage
3. **Document Changes**: Update documentation for new additions
4. **Validate Integration**: Test with simulation engine

### Review Process

1. **Data Review**: Verify astronomical data accuracy
2. **Code Review**: Check for proper patterns and conventions
3. **Test Review**: Ensure adequate test coverage
4. **Integration Review**: Test with full simulation system

## References

- [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/)
- [IAU Standards](https://www.iau.org/public/themes/measuring/)
- [Astronomical Almanac](https://www.iau.org/publications/astronomical-almanac/)
