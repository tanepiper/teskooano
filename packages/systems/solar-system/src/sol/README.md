# Sun (Sol)

The Sun is a G2V main sequence star that serves as the gravitational center of our Solar System. This implementation provides accurate physical and spectral properties for realistic stellar modeling in the Teskooano simulation.

## Astronomical Data

### Physical Properties

| Property                | Value         | Unit  | Source                    |
| ----------------------- | ------------- | ----- | ------------------------- |
| **Mass**                | 1.9885 × 10³⁰ | kg    | NASA Planetary Fact Sheet |
| **Radius**              | 696,340,000   | m     | NASA Planetary Fact Sheet |
| **Surface Temperature** | 5,778         | K     | NASA Planetary Fact Sheet |
| **Luminosity**          | 1.0           | L☉    | Standard solar luminosity |
| **Spectral Class**      | G2V           | -     | IAU classification        |
| **Stellar Type**        | Main Sequence | -     | Harvard classification    |
| **Age**                 | 4.6 × 10⁹     | years | Radiometric dating        |
| **Surface Gravity**     | 274.0         | m/s²  | Calculated                |
| **Escape Velocity**     | 617.7         | km/s  | Calculated                |

### Orbital Properties

| Property            | Value | Unit | Notes                    |
| ------------------- | ----- | ---- | ------------------------ |
| **Semi-major Axis** | 0     | m    | Solar System barycenter  |
| **Eccentricity**    | 0     | -    | Circular orbit           |
| **Inclination**     | 0     | rad  | Reference frame          |
| **Period**          | 0     | s    | Stationary in barycenter |

### Spectral Characteristics

| Property                  | Value   | Notes                      |
| ------------------------- | ------- | -------------------------- |
| **Spectral Type**         | G2V     | Yellow dwarf main sequence |
| **Effective Temperature** | 5,778 K | Blackbody temperature      |
| **Color Index (B-V)**     | 0.656   | Yellow-white color         |
| **Absolute Magnitude**    | 4.83    | Visual magnitude           |
| **Apparent Magnitude**    | -26.74  | As seen from Earth         |
| **Color**                 | #FFFFE0 | Light yellow               |

## Scientific Context

### Stellar Evolution

The Sun is currently in the main sequence phase of its stellar evolution, fusing hydrogen into helium in its core through the proton-proton chain reaction. This phase will continue for approximately 5 billion more years before the Sun begins to expand into a red giant.

### Solar Structure

- **Core**: Central fusion region (0-0.25 R☉)
- **Radiative Zone**: Energy transport by radiation (0.25-0.7 R☉)
- **Convective Zone**: Energy transport by convection (0.7-1.0 R☉)
- **Photosphere**: Visible surface layer
- **Chromosphere**: Lower atmosphere
- **Corona**: Upper atmosphere

### Solar Activity

- **Sunspots**: Cooler regions on photosphere
- **Solar Flares**: Magnetic energy releases
- **Coronal Mass Ejections**: Plasma ejections
- **Solar Wind**: Continuous particle stream

## Implementation Details

### Data Sources

- **NASA Planetary Fact Sheet**: Primary source for mass, radius, and temperature
- **IAU Standards**: Spectral classification and stellar type definitions
- **Astronomical Almanac**: Standard solar constants

### Physical Constants

```typescript
const SUN_MASS_KG = 1.9885e30;
const SUN_RADIUS_M = 696340000;
const SUN_TEMP_K = 5778;
const SUN_LUMINOSITY = 1.0;
```

### Celestial Object Properties

- **Type**: `CelestialType.STAR`
- **Stellar Type**: `StellarType.MAIN_SEQUENCE`
- **Spectral Class**: "G2V"
- **Status**: `CelestialStatus.ACTIVE`
- **Is Main Star**: `true`

### Rendering Properties

- **Color**: Light yellow (#FFFFE0)
- **Luminosity**: 1.0 (standard solar luminosity)
- **Albedo**: 0.3 (photospheric reflectivity)

## Technical Notes

### Coordinate System

The Sun is positioned at the origin (0, 0, 0) of the Solar System coordinate system, serving as the gravitational center around which all other bodies orbit.

### Physics Integration

- **Mass**: Used for gravitational calculations in N-body simulations
- **Radius**: Determines collision detection and visual scaling
- **Temperature**: Affects lighting calculations for nearby bodies

### Simulation Considerations

- **Gravitational Dominance**: The Sun's mass dominates the Solar System
- **Light Source**: Primary illumination source for all bodies
- **Tidal Effects**: Gravitational influence on all orbiting bodies

## References

- [NASA Planetary Fact Sheet - Sun](https://nssdc.gsfc.nasa.gov/planetary/factsheet/sunfact.html)
- [IAU Standards for Stellar Classification](https://www.iau.org/public/themes/measuring/)
- [Solar System Barycenter](https://ssd.jpl.nasa.gov/?barycenter)
- [Stellar Evolution Models](https://www.iau.org/publications/astronomical-almanac/)

## Related Bodies

The Sun serves as the parent body for all planets and minor bodies in the Solar System:

- **Terrestrial Planets**: Mercury, Venus, Earth, Mars
- **Gas Giants**: Jupiter, Saturn
- **Ice Giants**: Uranus, Neptune
- **Dwarf Planets**: Pluto, Ceres, Eris, Haumea, Makemake
- **Minor Bodies**: Asteroid belt, comets, Oort cloud objects
