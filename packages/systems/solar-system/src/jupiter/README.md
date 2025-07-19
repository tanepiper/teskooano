# Jupiter System

Jupiter is the largest planet in our Solar System, a gas giant with a complex system of moons, rings, and atmospheric features. This implementation includes Jupiter and its major moons with accurate physical and orbital properties.

## Astronomical Data

### Jupiter Physical Properties

| Property                     | Value          | Unit    | Source                    |
| ---------------------------- | -------------- | ------- | ------------------------- |
| **Mass**                     | 1.89819 × 10²⁷ | kg      | NASA Planetary Fact Sheet |
| **Radius**                   | 69,911,000     | m       | NASA Planetary Fact Sheet |
| **Surface Temperature**      | 165            | K       | Cloud top temperature     |
| **Albedo**                   | 0.538          | -       | Geometric albedo          |
| **Surface Gravity**          | 24.79          | m/s²    | Calculated                |
| **Escape Velocity**          | 59.5           | km/s    | Calculated                |
| **Axial Tilt**               | 3.13           | degrees | To ecliptic               |
| **Sidereal Rotation Period** | 35,730         | s       | 9h 55m 30s                |

### Jupiter Orbital Properties

| Property                        | Value       | Unit    | Source                    |
| ------------------------------- | ----------- | ------- | ------------------------- |
| **Semi-major Axis**             | 5.2044      | AU      | NASA Planetary Fact Sheet |
| **Eccentricity**                | 0.0489      | -       | Current epoch             |
| **Inclination**                 | 1.305       | degrees | To ecliptic               |
| **Longitude of Ascending Node** | 100.464     | degrees | Current epoch             |
| **Argument of Periapsis**       | 14.331      | degrees | Current epoch             |
| **Mean Anomaly**                | 34.351      | degrees | Current epoch             |
| **Orbital Period**              | 374,336,000 | s       | 11.86 years               |

### Galilean Moons

#### Io Physical Properties

| Property                | Value        | Unit | Source                      |
| ----------------------- | ------------ | ---- | --------------------------- |
| **Mass**                | 8.932 × 10²² | kg   | NASA Planetary Fact Sheet   |
| **Radius**              | 1,821,600    | m    | NASA Planetary Fact Sheet   |
| **Surface Temperature** | 130          | K    | Average surface temperature |
| **Albedo**              | 0.63         | -    | Geometric albedo            |
| **Orbital Period**      | 152,853      | s    | 1.769 days                  |

#### Europa Physical Properties

| Property                | Value        | Unit | Source                      |
| ----------------------- | ------------ | ---- | --------------------------- |
| **Mass**                | 4.800 × 10²² | kg   | NASA Planetary Fact Sheet   |
| **Radius**              | 1,560,800    | m    | NASA Planetary Fact Sheet   |
| **Surface Temperature** | 102          | K    | Average surface temperature |
| **Albedo**              | 0.67         | -    | Geometric albedo            |
| **Orbital Period**      | 306,690      | s    | 3.551 days                  |

#### Ganymede Physical Properties

| Property                | Value        | Unit | Source                      |
| ----------------------- | ------------ | ---- | --------------------------- |
| **Mass**                | 1.482 × 10²³ | kg   | NASA Planetary Fact Sheet   |
| **Radius**              | 2,631,200    | m    | NASA Planetary Fact Sheet   |
| **Surface Temperature** | 110          | K    | Average surface temperature |
| **Albedo**              | 0.43         | -    | Geometric albedo            |
| **Orbital Period**      | 618,360      | s    | 7.155 days                  |

#### Callisto Physical Properties

| Property                | Value        | Unit | Source                      |
| ----------------------- | ------------ | ---- | --------------------------- |
| **Mass**                | 1.076 × 10²³ | kg   | NASA Planetary Fact Sheet   |
| **Radius**              | 2,410,300    | m    | NASA Planetary Fact Sheet   |
| **Surface Temperature** | 134          | K    | Average surface temperature |
| **Albedo**              | 0.22         | -    | Geometric albedo            |
| **Orbital Period**      | 1,442,400    | s    | 16.689 days                 |

### Ring System

Jupiter has a faint ring system consisting of four main components:

| Ring Component        | Inner Radius | Outer Radius | Density | Opacity | Color   |
| --------------------- | ------------ | ------------ | ------- | ------- | ------- |
| **Main Ring**         | 1.72 R_J     | 1.8 R_J      | 0.05    | 0.2     | #b86139 |
| **Halo Ring**         | 1.4 R_J      | 1.72 R_J     | 0.01    | 0.2     | #904826 |
| **Amalthea Gossamer** | 1.8 R_J      | 2.54 R_J     | 0.002   | 0.01    | #8B4513 |
| **Thebe Gossamer**    | 2.54 R_J     | 3.1 R_J      | 0.001   | 0.005   | #8B4513 |

## Scientific Context

### Jupiter's Characteristics

- **Gas Giant**: Primarily hydrogen and helium composition
- **Atmospheric Bands**: Distinct cloud bands and zones
- **Great Red Spot**: Persistent anticyclonic storm
- **Magnetic Field**: Strongest planetary magnetic field in Solar System
- **Internal Heat**: Radiates more energy than received from Sun

### Atmospheric Composition

- **Primary**: Hydrogen (89.8%), Helium (10.2%)
- **Trace Gases**: Methane, ammonia, water vapor, phosphine
- **Cloud Layers**: Ammonia, ammonium hydrosulfide, water ice
- **Wind Speeds**: Up to 400 km/h in jet streams

### Galilean Moons

#### Io

- **Volcanic Activity**: Most volcanically active body in Solar System
- **Surface**: Sulfur and sulfur dioxide deposits
- **Tidal Heating**: Intense heating from Jupiter's gravity
- **No Atmosphere**: Thin SO₂ atmosphere

#### Europa

- **Ice Shell**: Thick water ice crust
- **Subsurface Ocean**: Liquid water beneath ice
- **Potential Life**: Considered candidate for extraterrestrial life
- **Surface**: Smooth, young ice with few craters

#### Ganymede

- **Largest Moon**: Largest satellite in Solar System
- **Magnetic Field**: Only moon with intrinsic magnetic field
- **Surface**: Mix of old, dark terrain and young, bright regions
- **Subsurface Ocean**: Liquid water beneath ice

#### Callisto

- **Heavily Cratered**: Most cratered surface in Solar System
- **Ancient Surface**: 4 billion years old
- **Subsurface Ocean**: Possible liquid water layer
- **Dark Surface**: Carbonaceous material

## Implementation Details

### Data Sources

- **NASA Planetary Fact Sheet**: Primary source for mass, radius, orbital elements
- **JPL Horizons System**: Precise orbital calculations and ephemeris
- **Galileo Mission**: Detailed moon and atmospheric data
- **Juno Mission**: Current atmospheric and magnetic field data

### Physical Constants

```typescript
// Jupiter constants
const JUPITER_REAL_MASS_KG = 1.89819e27;
const JUPITER_REAL_RADIUS_KM = 69911;
const JUPITER_TEMP_K = 165;
const JUPITER_ALBEDO = 0.538;

// Galilean moon constants
const IO_MASS_KG = 8.932e22;
const IO_RADIUS_KM = 1821.6;
const IO_ORBITAL_PERIOD_S = 152853;

const EUROPA_MASS_KG = 4.8e22;
const EUROPA_RADIUS_KM = 1560.8;
const EUROPA_ORBITAL_PERIOD_S = 306690;

const GANYMEDE_MASS_KG = 1.482e23;
const GANYMEDE_RADIUS_KM = 2634.1;
const GANYMEDE_ORBITAL_PERIOD_S = 618360;

const CALLISTO_MASS_KG = 1.076e23;
const CALLISTO_RADIUS_KM = 2410.3;
const CALLISTO_ORBITAL_PERIOD_S = 1442400;
```

### Orbital Parameters

The Jupiter system now uses the enhanced orbital parameters system with automatic calculation of aphelion, perihelion, and orbital speed:

```typescript
// Jupiter orbital elements
const jupiterOrbit = createOrbitalElements({
  semiMajorAxisAU: 5.202887, // Jupiter's semi-major axis
  eccentricity: 0.048498,
  inclinationDeg: 1.3053,
  longitudeOfAscendingNodeDeg: 100.55615,
  argumentOfPeriapsisDeg: 275.066,
  meanAnomalyDeg: 34.404,
  period_s: 3.743e8, // 11.86 Earth years
  siderealRotationPeriod_s: 3.573e4, // 9.925 hours
  axialTiltDeg: 3.13,
});

// Galilean moon examples
const ioOrbit = createOrbitalElements({
  semiMajorAxisAU: 421800 / 149597870.7, // 421,800 km converted to AU
  eccentricity: 0.0041,
  inclinationDeg: 0.05, // To Jupiter's equator
  longitudeOfAscendingNodeDeg: 43.977,
  argumentOfPeriapsisDeg: 84.129,
  meanAnomalyDeg: 342.021,
  period_s: 1.769137786 * 24 * 3600, // 1.769137786 days (synchronous)
  siderealRotationPeriod_s: 1.769137786 * 24 * 3600, // Synchronous rotation
  axialTiltDeg: 0, // Moons don't have meaningful axial tilt
});

const europaOrbit = createOrbitalElements({
  semiMajorAxisAU: 670900 / 149597870.7, // 670,900 km converted to AU
  eccentricity: 0.009,
  inclinationDeg: 0.47, // To Jupiter's equator
  longitudeOfAscendingNodeDeg: 219.106,
  argumentOfPeriapsisDeg: 88.97,
  meanAnomalyDeg: 171.016,
  period_s: 3.551181 * 24 * 3600, // 3.551181 days (synchronous)
  siderealRotationPeriod_s: 3.551181 * 24 * 3600, // Synchronous rotation
  axialTiltDeg: 0, // Moons don't have meaningful axial tilt
});
```

### Celestial Object Properties

#### Jupiter

- **Type**: `CelestialType.GAS_GIANT`
- **Gas Giant Class**: `GasGiantClass.CLASS_I`
- **Atmosphere**: Hydrogen-helium with cloud bands
- **Ring System**: Four-component ring system
- **Magnetic Field**: Strongest planetary field

#### Galilean Moons

- **Io**: `CelestialType.MOON`, volcanic surface
- **Europa**: `CelestialType.MOON`, icy surface with subsurface ocean
- **Ganymede**: `CelestialType.MOON`, largest moon with magnetic field
- **Callisto**: `CelestialType.MOON`, heavily cratered ancient surface

### Atmospheric Properties

- **Atmosphere Color**: #D2B48C (Tan)
- **Cloud Color**: #FFFFFF (White)
- **Cloud Speed**: 120 (arbitrary units)
- **Storm Speed**: 80 (arbitrary units)
- **Emissive Color**: #D2B48C1A (Tan with alpha)
- **Emissive Intensity**: 0.1

### Ring Properties

Each ring component includes:

- **Inner/Outer Radius**: In Jupiter radii
- **Density**: Particle density factor
- **Opacity**: Visual opacity
- **Color**: Ring color
- **Rotation Rate**: Orbital velocity
- **Composition**: Dust and particle types

## Technical Notes

### Coordinate System

Jupiter orbits the Sun at 5.2 AU with moderate eccentricity. The Galilean moons orbit Jupiter in nearly circular orbits, with orbital periods ranging from 1.8 to 16.7 days.

### Physics Integration

- **Mass**: Used for gravitational calculations in N-body simulations
- **Radius**: Determines collision detection and visual scaling
- **Atmosphere**: Affects lighting and visual rendering
- **Magnetic Field**: Influences charged particle behavior

### Simulation Considerations

- **Gas Giant Physics**: No solid surface, atmospheric dynamics
- **Tidal Effects**: Jupiter's gravity affects all moons
- **Ring Dynamics**: Particle interactions in ring system
- **Magnetic Interactions**: Jupiter's field affects nearby bodies

## Exploration History

### Jupiter Exploration

- **Pioneer 10/11**: First flybys (1973-1974)
- **Voyager 1/2**: Detailed imaging (1979)
- **Galileo**: Orbiter mission (1995-2003)
- **Juno**: Current orbiter (2016-present)
- **Future**: Europa Clipper, JUICE missions

### Galilean Moon Exploration

- **Galileo**: Detailed mapping and analysis
- **Europa**: Focus on subsurface ocean potential
- **Io**: Volcanic activity monitoring
- **Ganymede**: Magnetic field and surface studies
- **Callisto**: Ancient surface preservation

## References

- [NASA Planetary Fact Sheet - Jupiter](https://nssdc.gsfc.nasa.gov/planetary/factsheet/jupiterfact.html)
- [NASA Planetary Fact Sheet - Galilean Moons](https://nssdc.gsfc.nasa.gov/planetary/factsheet/joviansatfact.html)
- [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/)
- [Galileo Mission Results](https://solarsystem.nasa.gov/missions/galileo/overview/)

## Related Bodies

### Jupiter System

- **Parent**: Sun (G2V main sequence star)
- **Major Moons**: Io, Europa, Ganymede, Callisto
- **Minor Moons**: Metis, Adrastea, Amalthea, Thebe, Himalia
- **Ring System**: Four-component dust ring system

### Solar System Context

- **Fifth Planet**: Fifth from the Sun
- **Gas Giant**: Largest planet in Solar System
- **Jovian System**: Prototype for gas giant planets
- **Gravitational Influence**: Protects inner planets from impacts
