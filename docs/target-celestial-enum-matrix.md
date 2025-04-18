# Target Celestial Enum Combination Matrix

This document outlines the possible combinations of key enums based on the current procedural generation rules in `@teskooano/procedural-generation`.

*Note: This reflects the *generated* possibilities, not necessarily all theoretically valid combinations defined in `@teskooano/data-types`.*

## CelestialType & Primary Properties

| CelestialType    | Generated As         | Key Determining Factors                     | Associated Primary Types/Classes  | Notes                                         |
| ---------------- | -------------------- | ------------------------------------------- | --------------------------------- | --------------------------------------------- |
| `STAR`           | Primary or Companion | Random roll, weighted towards Main Sequence | `StellarType`, `SpectralClass`    | Main Sequence properties depend on mass.      |
| `PLANET`         | Body in Orbit        | Distance from star, random roll             | `PlanetType`                      | Type heavily influenced by distance zone.     |
| `DWARF_PLANET`   | _Not Generated_      | N/A                                         | N/A                               | Enum exists but not used by generator.        |
| `MOON`           | Body orbiting Planet | Generated for planets > 0.3 AU              | `PlanetType` (Rocky, Ice, Barren) | ~10% captured (Barren), else Rocky/Ice/Barren |
| `SPACE_ROCK`     | _Not Generated_      | N/A                                         | N/A                               | Enum exists but not used by generator.        |
| `ASTEROID_FIELD` | Body in Orbit        | ~15% chance instead of Planet               | `RockyType`                       | Type: Light/Dark Rock, Ice, Metallic.         |
| `GAS_GIANT`      | Body in Orbit        | Distance from star, random roll             | `GasGiantClass`                   | Generated in Inner, Mid, Outer zones.         |
| `COMET`          | _Not Generated_      | N/A                                         | N/A                               | Enum exists but not used by generator.        |
| `OORT_CLOUD`     | _Not Generated_      | N/A                                         | N/A                               | Enum exists but not used by generator.        |
| `OTHER`          | _Not Generated_      | N/A                                         | N/A                               | Enum exists but not used by generator.        |

## Star (`CelestialType.STAR`)

| StellarType       | SpectralClass (Typical)       | Notes                                                    |
| ----------------- | ----------------------------- | -------------------------------------------------------- |
| `MAIN_SEQUENCE`   | O, B, A, F, G, K, M           | Determined by mass. Radius validated/corrected by class. |
| `WHITE_DWARF`     | D (DA, DB etc. not specified) | Temperature 8k-58k K. Radius ~Earth size.                |
| `NEUTRON_STAR`    | P (Pulsar-like)               | Temperature 500k-1M K. Radius 10-20 km.                  |
| `WOLF_RAYET`      | _Not Generated_               | N/A                                                      |
| `BLACK_HOLE`      | _Not Generated_               | N/A                                                      |
| `KERR_BLACK_HOLE` | _Not Generated_               | N/A                                                      |

## Planet (`CelestialType.PLANET` / `CelestialType.MOON`)

| Zone / Context | PlanetType    | SurfaceType (Possible)                           | AtmosphereType (Possible) | Notes                                       |
| -------------- | ------------- | ------------------------------------------------ | ------------------------- | ------------------------------------------- |
| **Inner Zone** | `ROCKY`       | Cratered, Mountainous, Volcanic, Flat, Canyonous | None, Thin, Normal, Dense | ~60% chance of Atmosphere.                  |
| (< 2.5 AU)     | `TERRESTRIAL` | Cratered, Mountainous, Volcanic, Flat, Canyonous | None, Thin, Normal, Dense | "                                           |
|                | `DESERT`      | Cratered, Mountainous, Volcanic, Flat, Canyonous | None, Thin, Normal, Dense | "                                           |
|                | `LAVA`        | Cratered, Mountainous, Volcanic, Flat, Canyonous | None, Thin, Normal, Dense | "                                           |
|                | `BARREN`      | Cratered, Mountainous, Volcanic, Flat, Canyonous | None, Thin, Normal, Dense | "                                           |
| **Outer Zone** | `ICE`         | Cratered, Flat, Ice Flats                        | None, Thin                | ~10% chance of Thin Atmosphere.             |
| (>= 8 AU)      |               |                                                  |                           |                                             |
| **Moon**       | `ROCKY`       | Cratered, Flat, Mountainous                      | None                      | Generated for regular moons.                |
| (Regular)      | `ICE`         | Ice Flats                                        | None                      | Generated for regular moons.                |
|                | `BARREN`      | Cratered, Flat, Mountainous                      | None                      | Generated for regular moons.                |
| **Moon**       | `BARREN`      | Cratered, Flat, Mountainous                      | None                      | Generated for captured moons (~10% chance). |
| (Captured)     |               |                                                  |                           |                                             |

_Note: Specific `SurfacePropertiesUnion` subtypes (`DesertSurfaceProperties`, `IceSurfaceProperties`, etc.) are created based on the chosen `PlanetType`._

## Gas Giant (`CelestialType.GAS_GIANT`)

| Zone           | GasGiantClass (Possible)              | AtmosphereType (Generated) | Ring Chance | Ring Types (Possible)          | Notes                                 |
| -------------- | ------------------------------------- | -------------------------- | ----------- | ------------------------------ | ------------------------------------- |
| **Inner Zone** | Class V (Likely), Others Possible     | `VERY_DENSE`               | ~10%        | Metallic, Dark Rock, Dust      | `classifyGasGiantByTemperature` used. |
| (< 2.5 AU)     |                                       |                            |             |                                |                                       |
| **Mid Zone**   | Class I, II (Likely), Others Possible | `NORMAL`                   | ~50%        | Ice, Ice Dust, Light/Dark Rock | `classifyGasGiantByTemperature` used. |
| (2.5 - < 8 AU) |                                       |                            |             |                                |                                       |
| **Outer Zone** | Class III, Class IV                   | `THIN`                     | ~70%        | Ice, Ice Dust                  | Forced to Class III/IV.               |
| (>= 8 AU)      |                                       |                            |             |                                |                                       |

## Asteroid Field (`CelestialType.ASTEROID_FIELD`)

| RockyType    | Composition             | Color Source  |
| ------------ | ----------------------- | ------------- | ---------------------------------------------------------------- |
| `LIGHT_ROCK` | Silicates, Carbon       | `RING_COLORS` |
| `DARK_ROCK`  | Carbon, Silicates, Iron | `RING_COLORS` |
| `ICE`        | Water Ice, Ammonia Ice  | `RING_COLORS` |
| `METALLIC`   | Iron, Nickel            | `RING_COLORS` |
| `ICE_DUST`   | _Not Generated_         | N/A           | _Belt type generation picks from Light/Dark Rock, Ice, Metallic_ |
| `DUST`       | _Not Generated_         | N/A           | _Belt type generation picks from Light/Dark Rock, Ice, Metallic_ |

## Atmosphere Composition

| AtmosphereType | Possible Compositions (Chosen Randomly from Array)    | Notes                                                                  |
| -------------- | ----------------------------------------------------- | ---------------------------------------------------------------------- |
| `NONE`         | `[]`                                                  |                                                                        |
| `THIN`         | `["N2", "Ar"]`, `["CO2", "Ar"]`, `["CH4", "N2"]`      | Used for Outer Ice Giants, Outer Icy Planets (low chance), Inner Rocky |
| `NORMAL`       | `["N2", "O2"]`, `["N2", "O2", "Ar"]`, `["CO2", "N2"]` | Used for Mid Gas Giants, Inner Rocky                                   |
| `DENSE`        | `["CO2", "N2"]`, `["SO2", "CO2"]`, `["N2", "CH4"]`    | Used for Inner Rocky                                                   |
| `VERY_DENSE`   | `["CO2", "SO2"]`, `["N2"]`, `["H2S", "CO2"]`          | Used for Inner Gas Giants                                              |

#Spectral Class

| Spectral Class | Temperature (K)      | Colour       | Notes                                                |
| -------------- | -------------------- | ------------ | ---------------------------------------------------- |
| O              | > 30,000             | Blue         | Rare, massive, short-lived.                          |
| B              | 10,000 - 30,000      | Blue-white   | Luminous and hot, early stellar evolution.           |
| A              | 7,500 - 10,000       | White        | Hydrogen-dominant absorption lines.                  |
| F              | 6,000 - 7,500        | Yellow-white | Mid-tier main sequence stars.                        |
| G              | 5,200 - 6,000        | Yellow       | Includes Sol (our Sun).                              |
| K              | 3,700 - 5,200        | Orange       | Smaller, cooler than the Sun.                        |
| M              | < 3,700              | Red          | Most common stars, often red dwarfs.                 |
| D              | 8,000 - 58,000       | Blue-white   | White dwarfs. Dense remnants of main sequence stars. |
| P              | ~500,000 - 1,000,000 | N/A          | Pulsars / Neutron stars. Extremely compact & hot.    |
| X              | N/A                  | N/A          | Black holes                                          |

export enum SpectralClass {
O = "O", B = "B", A = "A", F = "F", G = "G", K = "K", M = "M",
DA = "DA", DB = "DB", DC = "DC", DO = "DO", DZ = "DZ", DQ = "DQ",
P = "P", // Pulsar
X = "X", // Exotic/Unknown
}
