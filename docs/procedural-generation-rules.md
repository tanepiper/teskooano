# Procedural Generation Rules

This document outlines the rules used by the `@teskooano/procedural-generation` package to generate solar systems based on a seed string.

## 1. Initialization

- A seed string is provided to the main `generateSystem` function.
- This seed is used to initialize a seeded pseudo-random number generator (PRNG) using `createSeededRandom`. All subsequent random decisions use this PRNG instance, ensuring reproducibility for a given seed.

## 2. System Type & Star Generation (`generateStar`)

- **Number of Stars:** A random roll determines the number of stars:
    - ~15% chance: 4 stars
    - ~25% chance: 3 stars
    - ~50% chance: 2 stars (Binary)
    - ~10% chance: 1 star (Single)
- **Primary Star:**
    - A `stellarType` is chosen based on weighted chances (e.g., Main Sequence: 70, White Dwarf: 15, Neutron Star: 5, Black Hole: 5, Wolf Rayet: 5). Black Holes and Wolf-Rayet stars are now included possibilities.
    - **Mass:** Determined based on `stellarType`. Main Sequence mass is skewed towards lower-mass stars (M, K, G). Black holes typically 3-50 M☉. Wolf-Rayet 20+ M☉.
    - **Radius & Temperature:** Calculated based on mass using approximate relationships (e.g., `getMainSequenceProperties` for main sequence). Radius is validated against expected ranges for the resulting spectral class (e.g., B-type must be >= 3 R☉) and corrected upwards if necessary.
    - **Luminosity & Color:** Calculated based on radius and temperature using `calculateLuminosity` and `getStarColor`. Black Holes are black.
    - **Spectral Class:** Determined using `getSpectralClass` based on temperature. A string representation is created (e.g., "G2V", "DA", "P", "W", "X").
    - **Other Properties:** Name generated, `isMainStar` set to true. Default orbit (stationary).
- **Companion Stars (if any):**
    - Generated similarly to the primary star.
    - `parentId` set to the primary star's ID. `isMainStar` set to false. `partnerStars` property links companions.
    - **Orbit:** Assigned a wide, somewhat eccentric orbit around the primary star (relative distance 10-50 AU, eccentricity 0.1-0.5).
    - **Barycenter Calculation:** If companions exist, the primary star's orbit is recalculated to reflect its motion around the system's barycenter. Initial physics state (position, velocity) is calculated for *both* stars relative to the barycenter.
- **Visual Scaling:** All star visual radii (`radius` field) are calculated from their real radii (`realRadius_m`) but multiplied by `STAR_VISUAL_SCALE_MULTIPLIER` (currently 50.0) to make them more prominent visually.

## 3. Planet & Asteroid Belt Generation (`generateSystem` loop)

- A number of "bodies" (planets or belts) between 2 and 10 is determined randomly.
- The code iterates outwards from the star(s), placing bodies at increasing distances.
    - Initial distance starts at 0.3 AU.
    - Each subsequent body is placed further out, with the distance increment increasing proportionally to the previous distance (larger gaps further out).
    - Maximum placement distance is currently capped at 50 AU.
- **Parent Star:** For each potential body location, the closest star in the system is determined as the parent. The distance calculation (`distanceRelativeToParentAU`) uses this parent star.
- **Body Type Determination:** At each location:
    - ~15% chance: Generate an Asteroid Belt (`generateAsteroidBelt`).
    - ~85% chance: Generate a Planet (`generatePlanet`).

### 3.1 Asteroid Belt Generation (`generateAsteroidBelt`)

- **Type:** Randomly chosen from Light Rock, Dark Rock, Ice, or Metallic (`RockyType`).
- **Dimensions:** Inner/Outer radius calculated as `distanceRelativeToParentAU` +/- a random offset. Height is random (0.01-0.05 AU).
- **Properties:** Count (1000-5000), Color (from `RING_COLORS` based on `RockyType`), Composition (from `RING_COMPOSITION`).
- **Orbit:** Low eccentricity (0-0.05), low inclination orbit around the parent star at `distanceRelativeToParentAU`.
- **Mass/Radius:** Assumed negligible (`realMass_kg = 0`, `realRadius_m = 0`).

### 3.2 Planet Generation (`generatePlanet`)

- **Mass Multiplier:** A base multiplier (0.1-10) is determined randomly and increased proportionally with distance from the star (`massRangeMultiplier`).
- **Type Determination (Based on `bodyDistanceAU`):**
    - **Inner Zone (< 2.5 AU):**
        - ~25% chance: **Inner Gas Giant** (Hot Jupiter). Low density, high mass multiplier (15-50x base), likely Class V (`classifyGasGiantByTemperature`), low chance of rocky/dusty rings. Atmosphere is Very Dense.
        - ~75% chance: **Rocky Planet**. High density, base mass multiplier. `PlanetType` chosen from Rocky, Terrestrial, Desert, Lava, Barren. `SurfaceType` from Cratered, Mountainous, Volcanic, Flat, Canyonous. ~60% chance of atmosphere (Thin, Normal, or Dense).
    - **Mid Zone (2.5 AU to < 8 AU):**
        - Always generates a **Mid Gas Giant**. Low density, high mass multiplier (20-100x base). `GasGiantClass` determined by `classifyGasGiantByTemperature`. ~50% chance of icy/rocky rings. Atmosphere is Normal.
    - **Outer Zone (>= 8 AU):**
        - ~85% chance: **Ice Giant**. Medium density, medium mass multiplier (5-20x base). `GasGiantClass` forced to Class III (Ice Giant - Clear) or Class IV (Alkali Metal). ~70% chance of icy rings. Atmosphere is Thin.
        - ~15% chance: **Icy Planet**. Medium density, base mass multiplier. `PlanetType` forced to Ice. `SurfaceType` from Cratered, Flat, Ice Flats. ~10% chance of Thin atmosphere.
- **Mass & Radius:** Calculated based on the mass multiplier and target density for the determined type.
- **Temperature:** Estimated based on parent star's luminosity and planet's distance (`estimateTemperature`).
- **Orbit:** Low eccentricity (0.01-0.11), low inclination orbit around the parent star at `distanceRelativeToParentAU`.
- **Properties:**
    - **Composition:** Based on type (Rocky, Ice, Gas).
    - **Atmosphere:** Type, composition, pressure, color, density determined based on zone/type rules.
    - **Surface:** `PlanetType` and `SurfaceType` determined by rules. Detailed properties (`ProceduralSurfaceProperties`, `IceSurfaceProperties`, etc.) are generated using `createDetailedSurfaceProperties`.
    - **Rings:** Generated based on chance and allowed types for the zone/type (using `generateRings`).
    - **Rotation:** Period (5h - 2d), Axial Tilt (0-45 deg).
    - **Seed:** Generated specifically for the planet (`${systemSeed}-${planetId}`).
- **Initial State:** Absolute initial position and velocity are calculated based on the parent star's state and the planet's orbital parameters.
- **Visual Scaling:** Visual radius (`radius`) is calculated using `scaleSize` based on the `planetType` and `realRadius_m`.

## 4. Moon Generation (`generateMoon`)

- Moons are only generated for planets located > 0.3 AU from their parent star.
- Each planet has a chance to generate 0 to 4 moons.
- Moons are placed iteratively outwards from the parent planet.
    - Initial distance starts at 2.5x the parent planet's radius.
    - Each subsequent moon is placed further out (1.5-6.5 radii increments).
- **Generation Process:**
    - ~10% chance: **Captured Moon**. Higher eccentricity/inclination orbit. `PlanetType` is Barren. Density suggests rocky composition.
    - ~90% chance: **Regular Moon**. Lower eccentricity/inclination. `PlanetType` chosen from Rocky, Ice, Barren. Density suggests mixed composition.
    - **Mass & Radius:** Calculated based on parent planet's mass (small fraction) and density (based on captured/regular).
    - **Orbit:** Calculated relative to the parent planet based on distance. Periapsis checked against parent radius.
    - **Properties:** Similar to rocky planets but simpler. `SurfaceType` depends on `PlanetType` (Ice -> Ice Flats, else Cratered/Flat/Mountainous). No atmosphere is generated.
    - **Initial State:** Absolute initial position and velocity are calculated based on the parent *planet's* state and the moon's orbital parameters relative to the planet.
    - **Visual Scaling:** Visual radius (`radius`) is 0.5 times the value calculated by `scaleSize`.

## 5. Output

- The `generateSystem` function returns a Promise resolving to an array containing all generated `CelestialObject` data (stars, planets, belts, moons).
- Initial physics state (`physicsStateReal`) contains absolute positions/velocities in real-world units (meters, m/s).
- Scaled state (`position`, `rotation`, `physicsState`) is initialized but intended to be updated by the simulation using scaled units. 