# Venus

Venus is the second planet from the Sun and Earth's closest planetary neighbor. Often called Earth's "sister planet" due to similar size, Venus has a dramatically different environment with extreme atmospheric conditions and a runaway greenhouse effect.

## Astronomical Data

### Physical Properties

| Property                     | Value         | Unit    | Source                      |
| ---------------------------- | ------------- | ------- | --------------------------- |
| **Mass**                     | 4.8675 × 10²⁴ | kg      | NASA Planetary Fact Sheet   |
| **Radius**                   | 6,051,800     | m       | NASA Planetary Fact Sheet   |
| **Surface Temperature**      | 737           | K       | Average surface temperature |
| **Albedo**                   | 0.77          | -       | Geometric albedo            |
| **Surface Gravity**          | 8.87          | m/s²    | Calculated                  |
| **Escape Velocity**          | 10.36         | km/s    | Calculated                  |
| **Axial Tilt**               | 177.4         | degrees | Retrograde rotation         |
| **Sidereal Rotation Period** | -20,832,000   | s       | -243.025 days (retrograde)  |

### Orbital Properties

| Property                        | Value      | Unit    | Source                    |
| ------------------------------- | ---------- | ------- | ------------------------- |
| **Semi-major Axis**             | 0.723332   | AU      | NASA Planetary Fact Sheet |
| **Eccentricity**                | 0.0068     | -       | Current epoch             |
| **Inclination**                 | 3.394      | degrees | To ecliptic               |
| **Longitude of Ascending Node** | 76.680     | degrees | Current epoch             |
| **Argument of Periapsis**       | 131.533    | degrees | Current epoch             |
| **Mean Anomaly**                | 181.979    | degrees | Current epoch             |
| **Orbital Period**              | 19,440,000 | s       | 224.701 days              |

### Atmospheric Properties

| Property             | Value              | Unit | Notes                |
| -------------------- | ------------------ | ---- | -------------------- |
| **Surface Pressure** | 92                 | bar  | 90x Earth's pressure |
| **Composition**      | 96.5% CO₂, 3.5% N₂ | -    | Dense carbon dioxide |
| **Cloud Layers**     | 3 main layers      | -    | Sulfuric acid clouds |
| **Wind Speeds**      | 1-3                | m/s  | Surface winds        |
| **Upper Winds**      | 300-400            | km/h | Cloud top winds      |

## Scientific Context

### Extreme Environment

- **Hottest Planet**: Surface temperature hotter than Mercury
- **Runaway Greenhouse**: Extreme greenhouse effect
- **Dense Atmosphere**: 90 times Earth's atmospheric pressure
- **Retrograde Rotation**: Spins backwards relative to other planets
- **Slow Rotation**: 243 Earth days per rotation

### Atmospheric Composition

- **Primary**: Carbon dioxide (96.5%)
- **Secondary**: Nitrogen (3.5%)
- **Trace Gases**: Sulfur dioxide, argon, water vapor
- **Clouds**: Sulfuric acid droplets
- **Greenhouse Effect**: Traps heat effectively

### Surface Characteristics

- **Volcanic**: Extensive volcanic plains and features
- **Young Surface**: ~300-600 million years old
- **No Plate Tectonics**: Single lithospheric plate
- **Impact Craters**: Few due to atmospheric protection
- **Highlands**: Ishtar Terra, Aphrodite Terra

## Implementation Details

### Data Sources

- **NASA Planetary Fact Sheet**: Primary source for mass, radius, orbital elements
- **JPL Horizons System**: Precise orbital calculations and ephemeris
- **Magellan Mission**: Detailed surface mapping and radar data
- **Venus Express**: Atmospheric and surface composition data

### Physical Constants

```typescript
const VENUS_MASS_KG = 4.8675e24;
const VENUS_RADIUS_M = 6051800;
const VENUS_TEMP_K = 737;
const VENUS_ALBEDO = 0.77;
const VENUS_SMA_AU = 0.723332;
const VENUS_ECC = 0.0068;
const VENUS_INC_DEG = 3.394;
const VENUS_LAN_DEG = 76.68;
const VENUS_AOP_DEG = 131.533;
const VENUS_MA_DEG = 181.979;
const VENUS_ORBITAL_PERIOD_S = 1.944e7;
const VENUS_ROTATION_PERIOD_S = -2.0832e7; // Negative for retrograde
const VENUS_AXIAL_TILT_DEG = 177.4;
```

### Celestial Object Properties

- **Type**: `CelestialType.PLANET`
- **Planet Type**: `PlanetType.TERRESTRIAL`
- **Composition**: Silicate crust, mantle, iron core, dense atmosphere
- **Atmosphere**: Carbon dioxide with sulfuric acid clouds

### Surface Properties

- **Type**: `SurfaceType.VOLCANIC`
- **Color Palette**: Browns, oranges, reds (Venus-like)
- **Terrain**: Volcanic plains, highlands, impact craters
- **Atmospheric Effects**: Dense cloud cover, greenhouse heating
- **Procedural Parameters**: Realistic volcanic terrain generation

## Technical Notes

### Coordinate System

Venus orbits the Sun at 0.72 AU with very low eccentricity, making it nearly circular. Its retrograde rotation (spinning backwards) is unique among the major planets.

### Physics Integration

- **Mass**: Used for gravitational calculations in N-body simulations
- **Radius**: Determines collision detection and visual scaling
- **Atmosphere**: Dense atmosphere affects lighting and visual rendering
- **Retrograde Rotation**: Unique rotation direction affects surface heating

### Simulation Considerations

- **Extreme Temperatures**: Uniform high temperature due to greenhouse effect
- **Dense Atmosphere**: 90x Earth's pressure affects any landing
- **Cloud Cover**: Permanent sulfuric acid cloud layer
- **Volcanic Activity**: Recent volcanic activity possible

## Exploration History

### Early Exploration

- **Mariner 2**: First successful flyby (1962)
- **Venera Program**: Soviet landers (1961-1984)
- **Pioneer Venus**: Orbiter and probes (1978)
- **Magellan**: Radar mapping (1990-1994)

### Modern Exploration

- **Venus Express**: ESA orbiter (2006-2014)
- **Akatsuki**: JAXA orbiter (2015-present)
- **Radar Mapping**: Complete surface coverage
- **Atmospheric Studies**: Composition and dynamics

### Future Missions

- **VERITAS**: NASA radar orbiter (2028)
- **EnVision**: ESA orbiter (2031)
- **DAVINCI+**: NASA atmospheric probe (2029)
- **Venus Flagship**: Proposed comprehensive mission

## Scientific Significance

### Formation Theories

- **Similar to Earth**: Formed from similar materials
- **Atmospheric Evolution**: Early water loss and CO₂ buildup
- **Volcanic Resurfacing**: Global volcanic events
- **Greenhouse Effect**: Runaway warming process

### Comparative Planetology

- **Earth's Twin**: Similar size and mass
- **Different Evolution**: Divergent atmospheric history
- **Climate Lessons**: Example of extreme greenhouse effect
- **Volcanic Activity**: Recent geological activity

## References

- [NASA Planetary Fact Sheet - Venus](https://nssdc.gsfc.nasa.gov/planetary/factsheet/venusfact.html)
- [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/)
- [Magellan Mission Results](https://solarsystem.nasa.gov/missions/magellan/overview/)
- [Venus Express Mission](https://www.esa.int/Science_Exploration/Space_Science/Venus_Express)

## Related Bodies

### Venus System

- **Parent**: Sun (G2V main sequence star)
- **Satellites**: None (no moons)

### Solar System Context

- **Second Planet**: Second from the Sun
- **Terrestrial Planet**: Rocky composition with atmosphere
- **Earth's Twin**: Similar size to Earth
- **Extreme Environment**: Harshest atmospheric conditions
