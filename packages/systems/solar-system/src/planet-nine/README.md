# Planet Nine

This directory contains the implementation of the hypothetical "Planet Nine" based on the groundbreaking research by Konstantin Batygin and Michael E. Brown (2016).

## Scientific Background

Planet Nine is a theoretical trans-Neptunian planet whose existence was proposed to explain the unusual clustering of orbits observed in distant Kuiper Belt Objects (KBOs).

### Key Evidence from the Paper

The Batygin & Brown paper "Evidence for a Distant Giant Planet in the Solar System" (Astronomical Journal 151:22, 2016) presents compelling evidence:

1. **Orbital Clustering**: Six KBOs with semi-major axes > 250 AU show remarkable clustering in:
   - Argument of perihelion (ω ≈ 318° ± 8°)
   - Longitude of ascending node (Ω ≈ 113° ± 13°)
   - Physical alignment in 3D space (0.007% probability by chance)

2. **Dynamical Mechanism**: The clustering can be maintained by resonant coupling with a distant eccentric planet through:
   - High-order mean-motion resonances
   - Apsidal anti-alignment (Planet Nine's perihelion ~180° from KBO perihelia)
   - Secular perturbations maintaining orbital confinement

## Implementation Details

### Orbital Parameters (from Paper)

- **Mass**: ~10 Earth masses (6.0 × 10²⁵ kg)
- **Semi-major axis**: ~700 AU (range: 400-1500 AU)
- **Eccentricity**: ~0.6 (range: 0.4-0.8)  
- **Inclination**: ~30° (moderately inclined)
- **Argument of periapsis**: ~150° (anti-aligned with KBOs)
- **Longitude of ascending node**: ~113° (from KBO clustering)

### Physical Properties

- **Type**: Ice Giant (Class III Gas Giant, similar to Neptune)
- **Radius**: ~3.5 Earth radii (≈22,300 km)
- **Temperature**: ~45 K (very cold due to extreme distance)
- **Orbital Period**: ~18,500 years
- **Perihelion Distance**: ~280 AU
- **Aphelion Distance**: ~1120 AU

### Predictions Explained

The Planet Nine model successfully explains:

1. **Sedna-like Objects**: High-perihelion detached objects like Sedna and 2012VP113
2. **High-Inclination KBOs**: Objects with inclinations 60°-150° 
3. **Orbital Confinement**: Physical clustering of distant KBO orbits
4. **Missing Population**: Predicts a population of high-perihelion objects with anti-aligned orbits

## Observational Status

As of the implementation date, Planet Nine remains **hypothetical**. Detection efforts are ongoing using:

- Ground-based wide-field surveys
- Analysis of WISE infrared data
- Gravitational effects on known objects
- Machine learning approaches to search data

## References

- Batygin, K., & Brown, M. E. (2016). Evidence for a Distant Giant Planet in the Solar System. *The Astronomical Journal*, 151(22).
- Trujillo, C. A., & Sheppard, S. S. (2014). A Sedna-like body with a perihelion of 80 astronomical units. *Nature*, 507(7493), 471-474.

## Files

- `planet-nine.ts` - Main planet configuration with orbital and physical properties
- `index.ts` - Export module for solar system integration
- `README.md` - This documentation file