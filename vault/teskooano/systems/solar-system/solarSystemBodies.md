---
aliases: [solar-system-bodies, celestial-objects, solar-system-data]
tags: [systems, solar-system, data, astronomy, physics]
type: Data
package: "@teskooano/systems-solar-system"
dependencies:
  ["@teskooano/data-types", "@teskooano/core-math", "@teskooano/core-physics"]
classes: ["CelestialObject"]
functions: ["createOrbitalElements"]
constants:
  [
    "solarSystemBodies",
    "systemCelestials",
    "earthSystemBodies",
    "jupiterSystemBodies",
    "marsSystemBodies",
    "mercurySystemBodies",
    "neptuneSystemBodies",
    "plutoSystemBodies",
    "saturnSystemBodies",
    "uranusSystemBodies",
    "venusSystemBodies",
    "allSatellites",
    "allComets",
    "minorBodies",
    "interstellarObjects",
    "asteroids",
    "planetNineSystemBodies",
  ]
types:
  [
    "CelestialObject",
    "PlanetProperties",
    "GasGiantProperties",
    "StarProperties",
    "AsteroidProperties",
    "CometProperties",
    "SatelliteProperties",
  ]
status: active
---

# solarSystemBodies

The complete array of all celestial objects in the solar system, including the Sun, planets, moons, asteroids, comets, and artificial satellites.

## Definition

```typescript
export const solarSystemBodies: CelestialObject<any>[] = [
  // Sun and asteroid belt
  ...systemCelestials,

  // Earth system (Earth, Moon, satellites)
  ...earthSystemBodies,

  // All other planets and their systems
  ...mercury,
  ...venus,
  ...mars,
  ...jupiter,
  ...saturn,
  ...uranus,
  ...neptune,
  ...pluto,

  // Minor bodies
  ...asteroids,
  ...comets,
  ...interstellarObjects,

  // Artificial satellites
  ...artificialSatellites,
];
```

## Overview

The `solarSystemBodies` array contains the complete collection of celestial objects that make up our solar system. It includes everything from the central Sun to the smallest artificial satellites, providing a comprehensive dataset for solar system simulation and visualization.

## Composition

### Primary Bodies (9 objects)

- **Sun**: Central star with detailed stellar properties
- **8 Planets**: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune
- **Dwarf Planets**: Pluto and other Kuiper Belt objects

### Natural Satellites (200+ objects)

- **Earth's Moon**: Detailed lunar properties and orbital mechanics
- **Jupiter's Moons**: All 79+ known moons including Galilean moons
- **Saturn's Moons**: All 82+ known moons including Titan and Enceladus
- **Uranus' Moons**: Major moons including Miranda and Ariel
- **Neptune's Moons**: Including Triton and other satellites

### Minor Bodies (50+ objects)

- **Asteroids**: Major asteroids (Ceres, Vesta, Pallas, Eros, Apophis)
- **Comets**: Periodic and long-period comets (Halley, Hale-Bopp, Encke)
- **Interstellar Objects**: Oumuamua, Borisov, and other visitors

### Artificial Satellites (20+ objects)

- **Earth Satellites**: ISS, Hubble, JWST, NOAA-19, Terra
- **Deep Space Probes**: Voyager 1 & 2, other interplanetary missions
- **Communications Satellites**: Various orbital configurations

## Object Structure

Each celestial object in the array follows the `CelestialObject<T>` interface:

```typescript
interface CelestialObject<T> {
  id: string;
  name: string;
  type: CelestialObjectType;
  properties: T;
  orbit?: OrbitalElements;
  parentId?: string;
  children?: string[];
  // ... other properties
}
```

## Usage Examples

### Basic Access

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";

// Get total count
console.log("Total celestial objects:", solarSystemBodies.length);

// Find specific object
const earth = solarSystemBodies.find((obj) => obj.id === "earth");
const sun = solarSystemBodies.find((obj) => obj.id === "sun");
```

### Filtering by Type

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";

// Get all planets
const planets = solarSystemBodies.filter((obj) => obj.type === "planet");

// Get all moons
const moons = solarSystemBodies.filter((obj) => obj.type === "moon");

// Get all asteroids
const asteroids = solarSystemBodies.filter((obj) => obj.type === "asteroid");

// Get all comets
const comets = solarSystemBodies.filter((obj) => obj.type === "comet");
```

### Finding Parent-Child Relationships

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";

// Find Earth's children (Moon and satellites)
const earth = solarSystemBodies.find((obj) => obj.id === "earth");
const earthChildren = solarSystemBodies.filter(
  (obj) => obj.parentId === "earth",
);

// Find Jupiter's moons
const jupiterMoons = solarSystemBodies.filter(
  (obj) => obj.parentId === "jupiter",
);
```

### Processing All Objects

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";

// Process all objects
solarSystemBodies.forEach((obj) => {
  console.log(`${obj.name} (${obj.type})`);
  if (obj.orbit) {
    console.log(`  Epoch: ${obj.orbit.epoch}`);
    console.log(`  Semi-major axis: ${obj.orbit.semiMajorAxis} km`);
  }
});
```

## Object Categories

### Solar System Core

```typescript
// From systemCelestials
const coreObjects = [
  sun, // Central star
  asteroidBelt, // Main asteroid belt
];
```

### Planetary Systems

```typescript
// Each planet system includes the planet and its moons
const planetarySystems = [
  ...mercury, // Mercury (no moons)
  ...venus, // Venus (no moons)
  ...earth, // Earth + Moon + satellites
  ...mars, // Mars + Phobos + Deimos
  ...jupiter, // Jupiter + 79+ moons
  ...saturn, // Saturn + 82+ moons
  ...uranus, // Uranus + 27+ moons
  ...neptune, // Neptune + 14+ moons
  ...pluto, // Pluto + Charon
];
```

### Minor Bodies

```typescript
// Asteroids, comets, and interstellar objects
const minorBodies = [
  ...asteroids, // Major asteroids
  ...comets, // Periodic and long-period comets
  ...interstellarObjects, // Visitors from other star systems
];
```

### Artificial Objects

```typescript
// Human-made satellites and probes
const artificialObjects = [
  ...artificialSatellites, // Earth satellites and deep space probes
];
```

## Data Sources

### Astronomical Data

- **NASA JPL**: Planetary and lunar ephemerides
- **IAU**: International Astronomical Union standards
- **Minor Planet Center**: Asteroid and comet data
- **Space-Track**: Artificial satellite data

### Accuracy Levels

- **Planets**: High-precision orbital elements
- **Major Moons**: Accurate orbital parameters
- **Minor Moons**: Best available data
- **Asteroids**: Varying accuracy based on observation history
- **Comets**: Updated as new observations become available

## Performance Considerations

### Array Size

- **Total Objects**: ~300+ celestial objects
- **Memory Usage**: Moderate (objects are lightweight)
- **Processing Time**: Fast for most operations

### Optimization Tips

```typescript
// Use find() for single object lookup
const earth = solarSystemBodies.find((obj) => obj.id === "earth");

// Use filter() for multiple objects
const planets = solarSystemBodies.filter((obj) => obj.type === "planet");

// Use Map for frequent lookups
const objectMap = new Map(solarSystemBodies.map((obj) => [obj.id, obj]));
const earth = objectMap.get("earth");
```

## Integration with Other Systems

### Celestial Manager

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";
import { celestialManager } from "@teskooano/core-state";

// Add all objects to celestial manager
celestialManager.addObjects(solarSystemBodies);
```

### Physics System

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";
import { physicsEngine } from "@teskooano/core-physics";

// Initialize physics for all objects
solarSystemBodies.forEach((obj) => {
  physicsEngine.addBody(obj);
});
```

### Rendering System

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";
import { renderer } from "@teskooano/core-renderer";

// Create renderable objects
solarSystemBodies.forEach((obj) => {
  const renderable = createRenderableObject(obj);
  renderer.addObject(renderable);
});
```

## Customization

### Adding New Objects

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";

// Add new celestial object
const newAsteroid = {
  id: "new-asteroid",
  name: "New Asteroid",
  type: "asteroid" as const,
  properties: {
    // ... asteroid properties
  },
  orbit: {
    // ... orbital elements
  },
};

// Add to array
solarSystemBodies.push(newAsteroid);
```

### Filtering for Specific Missions

```typescript
import { solarSystemBodies } from "@teskooano/systems-solar-system";

// Get objects relevant to Mars mission
const marsMissionObjects = solarSystemBodies.filter(
  (obj) =>
    obj.id === "mars" ||
    obj.parentId === "mars" ||
    obj.id === "earth" ||
    obj.id === "sun",
);
```

## Best Practices

1. **Immutable Access**: Don't modify the original array
2. **Efficient Filtering**: Use appropriate methods for different use cases
3. **Error Handling**: Check for undefined results when using find()
4. **Performance**: Use Map for frequent lookups
5. **Documentation**: Document any custom modifications

## Related

- [[initializeSolarSystem]] - Uses solarSystemBodies for initialization
- [[fixEmptyEpochs]] - Standardizes epochs in solarSystemBodies
- [[processSolarSystemToCurrentTime]] - Processes solarSystemBodies to current time
- [[@teskooano/core-state]] - Manages celestial objects from solarSystemBodies
- [[@teskooano/core-physics]] - Provides physics for solarSystemBodies objects
