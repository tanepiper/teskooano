# Mercury

Mercury is the innermost and smallest planet in our Solar System, orbiting closest to the Sun. This implementation provides accurate physical and orbital properties for realistic modeling of this extreme terrestrial world.

## Astronomical Data

### Physical Properties

| Property                     | Value         | Unit    | Source                    |
| ---------------------------- | ------------- | ------- | ------------------------- |
| **Mass**                     | 3.3011 × 10²³ | kg      | NASA Planetary Fact Sheet |
| **Radius**                   | 2,439,700     | m       | NASA Planetary Fact Sheet |
| **Surface Temperature**      | 437           | K       | Blackbody temperature     |
| **Albedo**                   | 0.142         | -       | Geometric albedo          |
| **Surface Gravity**          | 3.7           | m/s²    | Calculated                |
| **Escape Velocity**          | 4.25          | km/s    | Calculated                |
| **Axial Tilt**               | 0.034         | degrees | To ecliptic               |
| **Sidereal Rotation Period** | 5,067,014     | s       | 58.646 Earth days         |

### Orbital Properties

| Property                        | Value     | Unit    | Source                    |
| ------------------------------- | --------- | ------- | ------------------------- |
| **Semi-major Axis**             | 0.387098  | AU      | NASA Planetary Fact Sheet |
| **Eccentricity**                | 0.20563   | -       | Current epoch             |
| **Inclination**                 | 7.005     | degrees | To ecliptic               |
| **Longitude of Ascending Node** | 48.331    | degrees | Current epoch             |
| **Argument of Periapsis**       | 29.124    | degrees | Current epoch             |
| **Mean Anomaly**                | 174.796   | degrees | Current epoch             |
| **Orbital Period**              | 7,599,154 | s       | 87.9691 days              |

### Surface Characteristics

| Property           | Value                      | Notes                    |
| ------------------ | -------------------------- | ------------------------ |
| **Surface Type**   | CRATERED                   | Heavily cratered terrain |
| **Base Color**     | #8C7853                    | Brownish-gray            |
| **Terrain**        | Highlands, plains, craters | Ancient surface          |
| **Atmosphere**     | None                       | Direct space exposure    |
| **Magnetic Field** | Weak                       | ~1% of Earth's field     |

## Scientific Context

### Extreme Environment

- **Closest to Sun**: Innermost planet in Solar System
- **Temperature Extremes**: 700 K (day) to 100 K (night)
- **No Atmosphere**: Direct exposure to solar radiation
- **3:2 Spin-Orbit Resonance**: Unique rotation pattern
- **Heavily Cratered**: Ancient surface with minimal erosion

### Geological Composition

- **Core**: Large iron core (~60% of volume)
- **Mantle**: Thin silicate mantle
- **Crust**: Thin crust with extensive cratering
- **Surface**: Regolith and impact debris
- **Volcanism**: Ancient volcanic plains

### Unique Characteristics

- **3:2 Resonance**: Rotates 3 times for every 2 orbits
- **Large Core**: Unusually large iron core
- **Ancient Surface**: 4 billion years old
- **No Moons**: No natural satellites
- **Weak Magnetosphere**: Small magnetic field

## Implementation Details

### Data Sources

- **NASA Planetary Fact Sheet**: Primary source for mass, radius, orbital elements
- **JPL Horizons System**: Precise orbital calculations and ephemeris
- **MESSENGER Mission**: Detailed surface and composition data
- **Mariner 10**: Historical flyby data

### Physical Constants

```typescript
const MERCURY_MASS_KG = 3.3011e23;
const MERCURY_RADIUS_KM = 2439.7;
const MERCURY_TEMP_K = 437;
const MERCURY_ALBEDO = 0.142;
```

### Orbital Parameters

Mercury now uses the enhanced orbital parameters system with automatic calculation of aphelion, perihelion, and orbital speed:

```typescript
const mercuryOrbit = createOrbitalElements({
  semiMajorAxisAU: 0.387098, // Mercury's semi-major axis
  eccentricity: 0.20563,
  inclinationDeg: 7.00487,
  longitudeOfAscendingNodeDeg: 48.33167,
  argumentOfPeriapsisDeg: 29.12478,
  meanAnomalyDeg: 174.79577,
  period_s: 7.60052e6, // 87.969 Earth days
  siderealRotationPeriod_s: 5.067e6, // 58.646 Earth days
  axialTiltDeg: 0.034,
});
```

### Celestial Object Properties

- **Type**: `CelestialType.PLANET`
- **Planet Type**: `PlanetType.BARREN`
- **Composition**: Iron core, silicate mantle, thin exosphere
- **Surface**: Heavily cratered, ancient terrain

### Surface Properties

- **Type**: `SurfaceType.CRATERED`
- **Color Palette**: Grays and browns (Mercury-like)
- **Terrain**: Highlands, plains, extensive cratering
- **No Atmosphere**: Direct space exposure
- **Procedural Parameters**: Realistic cratered terrain generation

## Technical Notes

### Coordinate System

Mercury orbits the Sun at 0.39 AU with the highest eccentricity of any planet. Its unique 3:2 spin-orbit resonance means it rotates 3 times for every 2 orbits around the Sun.

### Physics Integration

- **Mass**: Used for gravitational calculations in N-body simulations
- **Radius**: Determines collision detection and visual scaling
- **No Atmosphere**: Direct exposure to solar radiation
- **Magnetic Field**: Weak but present magnetosphere

### Simulation Considerations

- **Extreme Temperatures**: Large day-night temperature variations
- **Solar Proximity**: Intense solar radiation and solar wind
- **3:2 Resonance**: Unique rotation pattern affects surface heating
- **Ancient Surface**: Minimal geological activity

## Exploration History

### Early Exploration

- **Mariner 10**: First flyby (1974-1975)
- **Limited Coverage**: Only 45% of surface imaged
- **Historical Data**: Basic orbital and physical properties

### Modern Exploration

- **MESSENGER**: Orbiter mission (2011-2015)
- **Complete Mapping**: 100% surface coverage
- **Composition Data**: Detailed surface and interior analysis
- **Magnetic Field**: Confirmed weak magnetosphere

### Future Missions

- **BepiColombo**: ESA/JAXA mission (2018-2025)
- **Enhanced Coverage**: Improved imaging and spectroscopy
- **Magnetic Studies**: Detailed magnetosphere analysis

## Scientific Significance

### Formation Theories

- **Giant Impact**: Possible collision removed outer layers
- **Solar Proximity**: Intense solar heating affected composition
- **Core Formation**: Unusually large iron core
- **Surface Evolution**: Ancient cratering preserved

### Comparative Planetology

- **Terrestrial Planet**: Rocky composition like Earth
- **Extreme Environment**: Harshest conditions in Solar System
- **Magnetic Field**: Only terrestrial planet with weak field
- **No Moons**: Unique among terrestrial planets

## References

- [NASA Planetary Fact Sheet - Mercury](https://nssdc.gsfc.nasa.gov/planetary/factsheet/mercuryfact.html)
- [JPL Horizons System](https://ssd.jpl.nasa.gov/horizons/)
- [MESSENGER Mission Results](https://solarsystem.nasa.gov/missions/messenger/overview/)
- [BepiColombo Mission](https://www.esa.int/Science_Exploration/Space_Science/BepiColombo)

## Related Bodies

### Mercury System

- **Parent**: Sun (G2V main sequence star)
- **Satellites**: None (no moons)

### Solar System Context

- **Innermost Planet**: Closest to the Sun
- **Terrestrial Planet**: Rocky composition
- **Extreme Environment**: Harshest conditions
- **Unique Rotation**: 3:2 spin-orbit resonance
