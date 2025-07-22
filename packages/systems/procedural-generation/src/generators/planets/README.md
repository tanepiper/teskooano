# Planet Generation System

The planet generation system has been refactored into a clean, class-based architecture that encapsulates all aspects of planet generation including type determination, property generation, ring systems, and orbital calculations.

## Architecture Overview

The system uses a **Template Method pattern** with a base class and specialized subclasses:

- **`BasePlanetGenerator`**: Abstract base class with shared generation logic
- **`PlanetGenerator`**: Generates planets orbiting stars with normal orbits
- **`RoguePlanetGenerator`**: Generates planets with highly eccentric orbits (eccentricity > 1)

## Class Structure

### BasePlanetGenerator (Abstract Base Class)

The `BasePlanetGenerator` provides the core generation algorithm using the Template Method pattern:

```typescript
abstract class BasePlanetGenerator {
  constructor(config: BasePlanetConfig, idPrefix: string);
  generate(): Observable<CelestialObject>;

  // Abstract methods that subclasses must implement
  protected abstract getParentStar(): CelestialObject;
  protected abstract getMassMultiplier(): number;
  protected abstract getDistanceForProperties(): number;
  protected abstract calculateTemperature(): number;
  protected abstract getPlanetName(): string;
  protected abstract getParentId(): string | undefined;
  protected abstract createOrbit(
    rotationPeriod_s: number,
    tilt_deg: number,
  ): any;
}
```

**Base Configuration Interface:**

```typescript
interface BasePlanetConfig {
  random: () => number;
  systemSeed: string;
  zone: CelestialZone;
}
```

**Generation Process (Template Method):**

1. **`determineBaseProperties()`**: Determines planet type and base characteristics
2. **`calculatePhysicalProperties()`**: Calculates mass and radius using `getMassMultiplier()`
3. **`generateSpecificProperties()`**: Generates atmosphere, surface, and other properties
4. **`generateRingSystem()`**: Creates ring system if applicable
5. **`buildPlanetObject()`**: Assembles the final planet object using abstract methods

### PlanetGenerator

The `PlanetGenerator` class handles regular planets orbiting stars with normal orbits:

```typescript
class PlanetGenerator extends BasePlanetGenerator {
  constructor(config: PlanetGeneratorConfig);
}
```

**Configuration Interface:**

```typescript
interface PlanetGeneratorConfig extends BasePlanetConfig {
  parentStar: CelestialObject;
  bodyDistanceAU: number;
}
```

**Key Implementations:**

- `getParentStar()`: Returns the actual parent star
- `getMassMultiplier()`: Distance-based mass calculation
- `calculateTemperature()`: Uses stellar luminosity and distance
- `createOrbit()`: Calculates proper orbital parameters with normal eccentricity

### RoguePlanetGenerator

The `RoguePlanetGenerator` class handles planets with highly eccentric orbits (eccentricity > 1):

```typescript
class RoguePlanetGenerator extends BasePlanetGenerator {
  constructor(config: RoguePlanetGeneratorConfig);
}
```

**Configuration Interface:**

```typescript
interface RoguePlanetGeneratorConfig extends BasePlanetConfig {
  parentStar: CelestialObject;
  bodyDistanceAU: number;
  slotIndex: number;
}
```

**Key Implementations:**

- `getParentStar()`: Returns the parent star (rogue planets are still gravitationally bound)
- `getMassMultiplier()`: Similar to regular planets but can be more massive
- `calculateTemperature()`: Uses stellar luminosity and distance (cold due to distance)
- `createOrbit()`: Creates highly eccentric orbits (eccentricity 1.1-2.0) for escape trajectories

## Usage Examples

### Using the Classes Directly

```typescript
import { PlanetGenerator, RoguePlanetGenerator } from "./planet-generator";

// Generate a regular planet
const planetGenerator = new PlanetGenerator({
  random: myRandomFunction,
  parentStar: starObject,
  bodyDistanceAU: 1.5,
  systemSeed: "my-system-seed",
  zone: celestialZone,
});

planetGenerator.generate().subscribe((planet) => {
  console.log("Generated planet:", planet);
});

// Generate a rogue planet (highly eccentric orbit)
const rogueGenerator = new RoguePlanetGenerator({
  random: myRandomFunction,
  parentStar: starObject, // Still needs a parent star reference
  bodyDistanceAU: 50.0,
  systemSeed: "my-system-seed",
  slotIndex: 1,
  zone: celestialZone,
});

rogueGenerator.generate().subscribe((roguePlanet) => {
  console.log("Generated rogue planet:", roguePlanet);
});
```

### Using the Legacy Functions (Backward Compatibility)

```typescript
import { generatePlanet, generateRoguePlanet } from "./planet";

// These functions now use the new classes internally
generatePlanet(random, parentStar, bodyDistanceAU, systemSeed, zone).subscribe(
  (planet) => {
    console.log("Generated planet:", planet);
  },
);

generateRoguePlanet(
  random,
  parentStar,
  bodyDistanceAU,
  systemSeed,
  slotIndex,
  zone,
).subscribe((roguePlanet) => {
  console.log("Generated rogue planet:", roguePlanet);
});
```

## Benefits of the Simplified Architecture

1. **Template Method Pattern**: Shared logic in base class, specialized behavior in subclasses
2. **Reduced Code Duplication**: Common generation steps are implemented once
3. **Clear Separation of Concerns**: Each subclass handles only its unique requirements
4. **Easy Extension**: New planet types can extend the base class
5. **Simplified Testing**: Test the base logic once, test only unique behavior in subclasses
6. **Type Safety**: Strong typing with TypeScript interfaces
7. **Backward Compatibility**: Existing code continues to work unchanged

## Key Simplifications Made

### Before (Complex)

- Two separate classes with nearly identical code
- Multiple atmosphere configuration methods
- Duplicated property generation logic
- Complex orbit calculation handling
- Rogue planets treated as completely separate objects

### After (Simplified)

- Single base class with Template Method pattern
- Consolidated atmosphere configuration
- Shared property generation logic
- Abstract methods for specialized behavior
- Rogue planets are just planets with highly eccentric orbits

## Rogue Planets Explained

Rogue planets are **not** completely separate objects floating in space. Instead, they are:

1. **Hyperbolic Orbits**: They have eccentricity > 1 (hyperbolic trajectories)
2. **Interstellar Origin**: They come from outside the system, approach the star, and leave
3. **Capture Trajectories**: They may be captured by the star's gravity during their passage
4. **Cold**: Due to their distance from the star, they're very cold
5. **Massive**: Often more massive than regular planets due to their formation history

This approach is more scientifically accurate and creates realistic interstellar rogue planet scenarios.

## File Structure

```
planets/
├── README.md                 # This documentation
├── planet.ts                 # Legacy function exports (uses new classes)
├── planet-generator.ts       # Simplified class-based implementation
├── planet-type.ts            # Planet type determination logic
├── planet-properties.ts      # Specific property generation
├── planet-orbit.ts           # Orbital parameter calculations
├── planet-rings.ts           # Ring system generation
└── *.spec.ts                 # Test files
```

## Migration Guide

The new architecture is fully backward compatible. Existing code using `generatePlanet()` and `generateRoguePlanet()` functions will continue to work without changes.

To take advantage of the simplified class-based approach:

1. **For new code**: Use the classes directly for better encapsulation
2. **For existing code**: Continue using the functions - they now use the classes internally
3. **For testing**: Test the base class logic once, then only unique behavior in subclasses
4. **For extensions**: Extend `BasePlanetGenerator` for new planet types

## Future Enhancements

The simplified architecture makes it easy to add new features:

- **New Planet Types**: Extend `BasePlanetGenerator` for specialized planets
- **Generation Hooks**: Add lifecycle hooks in the base class
- **Validation**: Add validation methods to the base class
- **Caching**: Implement caching for expensive calculations
- **Parallel Generation**: Generate multiple planets in parallel using the classes
