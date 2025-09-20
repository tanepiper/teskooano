# AGENTS.md

A guide for AI coding agents working on the Procedural Generation package for Teskooano.

## Package Overview

The **Procedural Generation package** (`@teskooano/systems-procedural-generation`) is a sophisticated, scientifically accurate system for generating deterministic star systems from seed strings. It creates realistic celestial bodies including stars, planets, moons, asteroid belts, and comets with proper orbital mechanics and physics-based properties.

## Key Features

- **Deterministic Generation**: Same seed always produces identical systems
- **Reactive Architecture**: Uses RxJS Observables for non-blocking generation
- **Scientific Accuracy**: Realistic orbital mechanics, temperature calculations, and celestial properties
- **Multi-Star Systems**: Support for binary, trinary, and quaternary star systems
- **Special Configurations**: Binary planets, trojan arrangements, co-orbital bodies, and rogue objects
- **Zone-Based Generation**: Temperature and gravitational zones for realistic planet placement
- **Enhanced Realism**: Proper physics constraints and astronomical data

## Setup Commands

### Prerequisites

- Node.js 24.2.0
- TypeScript 5.9.2
- Vitest for testing
- RxJS for reactive programming

### Development Commands

```bash
# Run tests
moon run procedural-generation:test

# Run tests with UI
moon run procedural-generation:test-ui

# Run tests with coverage
moon run procedural-generation:test-coverage

# Run tests in watch mode
moon run procedural-generation:test-watch

# Run browser tests
moon run procedural-generation:test-browser

# Build package
moon run procedural-generation:build

# Type checking
moon run procedural-generation:typecheck
```

## Package Architecture

### Directory Structure

```
src/
├── index.ts                    # Main entry point
├── generator.ts                # Core system generator
├── constants.ts                # Physical constants and compositions
├── utils-functions.ts          # Utility functions and calculations
├── generators/                 # Generation modules
│   ├── belts/                 # Asteroid belts and Oort clouds
│   ├── comets/                # Comet generation
│   ├── moons/                 # Moon generation and physics
│   ├── names/                 # Naming and descriptions
│   ├── planets/               # Planet generation and properties
│   └── stars/                 # Star generation
├── operators/                  # RxJS operators and pipelines
├── properties/                 # Procedural surface properties
├── utils/                      # Utility modules
└── zones/                      # Zone management system
```

### Data Flow

1. **Seed Input**: Deterministic seed string
2. **Star Generation**: Create primary and companion stars
3. **Zone Creation**: Physics-based temperature zones
4. **Body Placement**: Sophisticated orbital configurations
5. **Property Generation**: Realistic celestial properties
6. **Epoch Processing**: Update to current time
7. **Observable Output**: Stream of celestial objects

## Code Style & Conventions

### TypeScript Standards

- **Strict Mode**: Always use strict TypeScript configuration
- **Type Safety**: Use proper typing for all celestial object properties
- **Interfaces**: Use dedicated interfaces for configuration objects
- **JSDoc**: Include comprehensive documentation for all functions

### Naming Conventions

- **Files**: Use kebab-case for file names (e.g., `binary-orbit-setup.ts`)
- **Constants**: Use UPPER_CASE for physical constants
- **Functions**: Use camelCase for function names
- **Classes**: Use PascalCase for class names
- **Interfaces**: Use PascalCase with descriptive names

### Data Standards

- **Mass**: Accurate to 6+ significant figures for major bodies
- **Orbital Elements**: Current epoch values with proper uncertainty ranges
- **Physical Properties**: Temperature, albedo, composition from authoritative sources
- **Source Attribution**: Always include data source comments

## Key Components

### Core Generator

```typescript
export async function generateSystem(
  seed: string,
): Promise<{ systemName: string; objects$: Observable<CelestialObject> }> {
  // Main generation pipeline
}
```

### Zone System

```typescript
export class CelestialZoneManager {
  // Manages temperature zones and orbital configurations
  determineStellarConfiguration(): StellarSystemConfiguration;
  selectZonesForPlacement(
    stars: CelestialObject[],
    config: StellarSystemConfiguration,
  ): CelestialZone[];
}
```

### Body Placement

```typescript
export interface BodyPlacement {
  distanceAU: number;
  parentStar: CelestialObject;
  configuration: OrbitalConfiguration;
  zone: CelestialZone;
}
```

### Orbital Configurations

- **STANDARD**: Single body orbit
- **BINARY_PAIR**: Planets orbiting each other
- **TROJAN**: L4/L5 Lagrange point arrangements
- **CO_ORBITAL**: Bodies sharing same orbit
- **ROGUE**: Unbound interstellar objects
- **CIRCUMBINARY**: Planets orbiting both stars

## Testing Strategy

### Test Organization

- **File Convention**: Test files (`<filename>.spec.ts`) adjacent to source files
- **Test Types**: Unit tests for individual generators, integration tests for system generation
- **Test Data**: Use fixed random values for deterministic testing

### Test Commands

```bash
# Run all tests
moon run procedural-generation:test

# Run specific test file
moon run procedural-generation:test -- generator.spec.ts

# Run tests with coverage
moon run procedural-generation:test-coverage
```

### Test Patterns

- **Deterministic Testing**: Verify same seed produces identical results
- **Physics Validation**: Check orbital mechanics and physical properties
- **Boundary Testing**: Verify system distance constraints (10,000 AU)
- **Edge Case Handling**: Test with extreme values and invalid inputs

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
4. **Boundary Validation**: Verify all objects stay within 10,000 AU system boundary

## Development Guidelines

### Adding New Generators

1. **Create Module**: Add new file in appropriate `generators/` subdirectory
2. **Define Interface**: Create configuration interface for the generator
3. **Implement Logic**: Use seeded random for deterministic generation
4. **Add Tests**: Include comprehensive test coverage
5. **Document Sources**: Include data source comments

### Zone Management

- **Temperature Zones**: Use physics-based calculations for realistic boundaries
- **Stellar Scaling**: Scale zones based on star luminosity and type
- **Configuration Support**: Handle single, binary, and multiple star systems
- **Validation**: Ensure zones don't exceed system boundaries

### Orbital Mechanics

- **Coordinate System**: Right-handed, Y-up coordinate system
- **Units**: AU for planetary distances, meters for moon distances
- **Precision**: Use high-precision values for orbital calculations
- **Validation**: Check for physically impossible orbital parameters

## Common Patterns

### Generator Pattern

```typescript
export function generateObject(
  random: () => number,
  parentStar: CelestialObject,
  distanceAU: number,
  systemSeed: string,
): Observable<CelestialObject> {
  // Generation logic using seeded random
}
```

### Zone Pattern

```typescript
export class ZoneManager {
  constructor(random: () => number) {
    this.random = random;
  }

  createZones(star: CelestialObject): CelestialZone[] {
    // Zone creation logic
  }
}
```

### Testing Pattern

```typescript
describe("Generator", () => {
  it("should generate deterministic results", async () => {
    const random = await createSeededRandom("test-seed");
    const result = generateObject(random, parentStar, 1.0, "test-seed");
    // Verify deterministic properties
  });
});
```

## Performance Considerations

### Generation Performance

- **Reactive Streams**: Use RxJS for non-blocking generation
- **Batch Processing**: Generate objects in batches for efficiency
- **Memory Usage**: Minimize object creation during generation
- **Validation**: Minimal validation during generation, comprehensive in tests

### Data Access

- **Lazy Loading**: Generate objects on demand
- **Caching**: Cache expensive calculations
- **Indexing**: Fast lookup by object ID
- **Filtering**: Efficient filtering by object type

## Troubleshooting

### Common Issues

- **Seed Determinism**: Ensure all random calls use the seeded generator
- **Boundary Violations**: Check that objects stay within 10,000 AU
- **Orbital Validation**: Verify orbital elements are physically possible
- **Zone Conflicts**: Ensure zones don't overlap inappropriately

### Debug Tools

- **Epoch Processor**: Use `setSystemToCurrentEpoch` for epoch debugging
- **Validation Functions**: Use built-in validation for data checking
- **Test Coverage**: Run tests to identify generation inconsistencies
- **Source Verification**: Cross-reference against original sources

## Dependencies

### Core Dependencies

- `@teskooano/core-math`: Mathematical utilities and vector operations
- `@teskooano/core-physics`: Astronomical constants and physics calculations
- `@teskooano/data-types`: TypeScript interfaces and enums
- `@teskooano/data-values`: Physical constants and values
- `rxjs`: Reactive programming for generation streams

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

## Scientific References

- [NASA Planetary Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/)
- [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/)
- [IAU Standards](https://www.iau.org/public/themes/measuring/)
- [Astronomical Almanac](https://www.iau.org/publications/astronomical-almanac/)
- [Exoplanet Characterization](https://exoplanets.nasa.gov/)
- [Stellar Evolution Models](https://www.astro.princeton.edu/~burrows/)

## Architecture Documentation

For detailed technical documentation, see:

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Complete system architecture
- [README.md](./README.md) - Usage examples and overview
- [CHANGELOG.md](./CHANGELOG.md) - Version history and changes
- [TODO.md](./TODO.md) - Planned improvements and future work
