/**
 * Astronomical units and measurements
 *
 * Standard astronomical units and measurements used throughout the simulation.
 * These are based on IAU (International Astronomical Union) definitions.
 */

/**
 * Astronomical Unit in meters (average distance from Earth to Sun)
 *
 * The Astronomical Unit (AU) is the standard unit of distance in astronomy,
 * defined as the average distance between Earth and the Sun. It's used throughout
 * the simulation for orbital calculations, distance measurements, and scaling
 * celestial objects to appropriate sizes.
 *
 * @example
 * ```typescript
 * // Calculate distance from Earth to Mars (1.5 AU)
 * const earthToMars = 1.5 * AU_METERS; // 224,396,806,050 meters
 *
 * // Scale a planet's orbit to scene units
 * const orbitRadius = planet.orbitalParameters.semiMajorAxis * AU_METERS * renderScale;
 * ```
 */
export const AU_METERS = 149597870700;

/**
 * Light year in meters
 *
 * A light year is the distance that light travels in one Julian year (365.25 days)
 * in a vacuum. It's used for measuring interstellar and intergalactic distances
 * in the simulation, particularly for stars, nebulae, and other deep space objects.
 *
 * @example
 * ```typescript
 * // Calculate distance to Proxima Centauri (4.24 light years)
 * const proximaDistance = 4.24 * LIGHT_YEAR_METERS; // ~4.01e16 meters
 *
 * // Convert light years to scene units for rendering
 * const sceneDistance = star.distance * LIGHT_YEAR_METERS * renderScale;
 * ```
 */
export const LIGHT_YEAR_METERS = 9.4607304725808e15;

/**
 * Parsec in meters
 *
 * A parsec (parallax second) is the distance at which one astronomical unit
 * subtends an angle of one arcsecond. It's the preferred unit for stellar
 * distances in professional astronomy and is used in the simulation for
 * precise distance calculations and parallax measurements.
 *
 * @example
 * ```typescript
 * // Calculate distance using parallax (0.768 arcseconds = 1.3 parsecs)
 * const parallaxArcseconds = 0.768;
 * const distance = PARSEC_METERS / parallaxArcseconds; // ~4.02e16 meters
 *
 * // Convert parsecs to scene units for star positioning
 * const starDistance = star.parallax * PARSEC_METERS * renderScale;
 * ```
 */
export const PARSEC_METERS = 3.085677581491367e16;

/**
 * Solar mass in kilograms
 *
 * The mass of our Sun, used as the standard unit of mass in astronomy.
 * It's used throughout the simulation for calculating gravitational forces,
 * orbital dynamics, and scaling other stellar and planetary masses.
 *
 * @example
 * ```typescript
 * // Calculate gravitational force between two stars
 * const force = (GRAVITATIONAL_CONSTANT * 2 * SOLAR_MASS * 1.5 * SOLAR_MASS) /
 *               Math.pow(separationDistance, 2);
 *
 * // Convert stellar mass to kilograms for physics calculations
 * const starMassKg = star.mass * SOLAR_MASS; // star.mass is in solar masses
 * ```
 */
export const SOLAR_MASS = 1.989e30;

/**
 * Solar radius in meters
 *
 * The radius of our Sun, used as the standard unit of stellar size in astronomy.
 * It's used for scaling stellar objects in the simulation, calculating
 * stellar surface areas, and determining gravitational effects near stars.
 *
 * @example
 * ```typescript
 * // Calculate stellar surface area
 * const surfaceArea = 4 * Math.PI * Math.pow(star.radius * SOLAR_RADIUS, 2);
 *
 * // Scale star size for rendering
 * const renderRadius = star.radius * SOLAR_RADIUS * renderScale;
 *
 * // Calculate Roche limit for a planet orbiting a star
 * const rocheLimit = 2.44 * star.radius * SOLAR_RADIUS * Math.pow(planet.density / star.density, 1/3);
 * ```
 */
export const SOLAR_RADIUS = 6.957e8;

/**
 * Solar luminosity in watts
 *
 * The total power output of our Sun, used as the standard unit of stellar
 * brightness in astronomy. It's used for calculating stellar energy output,
 * determining habitable zones, and scaling lighting effects in the simulation.
 *
 * @example
 * ```typescript
 * // Calculate stellar energy output
 * const energyOutput = star.luminosity * SOLAR_LUMINOSITY; // watts
 *
 * // Calculate habitable zone distance
 * const habitableZone = Math.sqrt(star.luminosity * SOLAR_LUMINOSITY / SOLAR_LUMINOSITY) * AU_METERS;
 *
 * // Scale lighting intensity for rendering
 * const lightIntensity = star.luminosity * SOLAR_LUMINOSITY / (4 * Math.PI * distanceSquared);
 * ```
 */
export const SOLAR_LUMINOSITY = 3.828e26;

/**
 * Earth mass in kilograms
 *
 * The mass of Earth, used as a reference for terrestrial planets and moons
 * in the simulation. It's used for calculating gravitational forces on
 * planetary surfaces, orbital dynamics of moons, and scaling planetary masses.
 *
 * @example
 * ```typescript
 * // Calculate surface gravity of a planet
 * const surfaceGravity = (GRAVITATIONAL_CONSTANT * planet.mass * EARTH_MASS) /
 *                        Math.pow(planet.radius * EARTH_RADIUS, 2);
 *
 * // Calculate escape velocity from a planet
 * const escapeVelocity = Math.sqrt((2 * GRAVITATIONAL_CONSTANT * planet.mass * EARTH_MASS) /
 *                                  (planet.radius * EARTH_RADIUS));
 *
 * // Convert planetary mass to kilograms for physics
 * const planetMassKg = planet.mass * EARTH_MASS; // planet.mass is in Earth masses
 * ```
 */
export const EARTH_MASS = 5.972e24;

/**
 * Earth radius in meters
 *
 * The radius of Earth, used as a reference for terrestrial planets and moons
 * in the simulation. It's used for calculating planetary surface areas,
 * atmospheric effects, and scaling planetary sizes for rendering.
 *
 * @example
 * ```typescript
 * // Calculate planetary surface area
 * const surfaceArea = 4 * Math.PI * Math.pow(planet.radius * EARTH_RADIUS, 2);
 *
 * // Scale planet size for rendering
 * const renderRadius = planet.radius * EARTH_RADIUS * renderScale;
 *
 * // Calculate atmospheric scale height
 * const scaleHeight = (BOLTZMANN_CONSTANT * temperature) /
 *                     (molecularMass * surfaceGravity);
 * ```
 */
export const EARTH_RADIUS = 6.371e6;

/**
 * Earth's gravitational parameter (μ = GM) in m³/s²
 *
 * The product of Earth's mass and the gravitational constant, used for
 * orbital mechanics calculations involving Earth. This pre-calculated value
 * is more efficient than computing G * M_Earth repeatedly in orbital
 * calculations and satellite trajectory computations.
 *
 * @example
 * ```typescript
 * // Calculate orbital period around Earth
 * const orbitalPeriod = 2 * Math.PI * Math.sqrt(Math.pow(semiMajorAxis, 3) / EARTH_GRAVITATIONAL_PARAMETER);
 *
 * // Calculate orbital velocity at a given altitude
 * const orbitalVelocity = Math.sqrt(EARTH_GRAVITATIONAL_PARAMETER / (EARTH_RADIUS + altitude));
 *
 * // Calculate Hohmann transfer delta-v
 * const deltaV = Math.sqrt(EARTH_GRAVITATIONAL_PARAMETER / r1) * (Math.sqrt(2 * r2 / (r1 + r2)) - 1);
 * ```
 */
export const EARTH_GRAVITATIONAL_PARAMETER = 3.986e14;

/**
 * Earth orbital period in seconds (sidereal year)
 *
 * The time it takes Earth to complete one orbit around the Sun relative to
 * the fixed stars (sidereal year). This is used as a reference for
 * calculating orbital periods of other planets and for time-based
 * simulations and animations.
 *
 * @example
 * ```typescript
 * // Calculate orbital period ratio relative to Earth
 * const periodRatio = planet.orbitalPeriod / EARTH_ORBITAL_PERIOD;
 *
 * // Calculate synodic period between two planets
 * const synodicPeriod = 1 / (1/planet1Period - 1/planet2Period);
 *
 * // Convert orbital period to Earth years for display
 * const earthYears = planet.orbitalPeriod / EARTH_ORBITAL_PERIOD;
 * ```
 */
export const EARTH_ORBITAL_PERIOD = 365.256363004 * 24 * 60 * 60;

/**
 * Jupiter mass in kilograms
 *
 * The mass of Jupiter, used as a reference for gas giant planets in the
 * simulation. It's used for calculating gravitational effects of gas giants,
 * orbital dynamics in multi-planet systems, and scaling planetary masses
 * for physics calculations.
 *
 * @example
 * ```typescript
 * // Calculate gravitational influence of a gas giant
 * const jupiterInfluence = (GRAVITATIONAL_CONSTANT * gasGiant.mass * JUPITER_MASS) /
 *                          Math.pow(distance, 2);
 *
 * // Convert gas giant mass to kilograms
 * const gasGiantMassKg = gasGiant.mass * JUPITER_MASS; // gasGiant.mass is in Jupiter masses
 *
 * // Calculate Hill sphere radius for a moon
 * const hillSphere = semiMajorAxis * Math.pow(moonMass / (3 * gasGiant.mass * JUPITER_MASS), 1/3);
 * ```
 */
export const JUPITER_MASS = 1.898e27;

/**
 * Jupiter radius in meters
 *
 * The radius of Jupiter, used as a reference for gas giant planets in the
 * simulation. It's used for calculating planetary volumes, atmospheric
 * effects, ring system dimensions, and scaling gas giants for rendering.
 *
 * @example
 * ```typescript
 * // Calculate gas giant volume
 * const volume = (4/3) * Math.PI * Math.pow(gasGiant.radius * JUPITER_RADIUS, 3);
 *
 * // Scale gas giant size for rendering
 * const renderRadius = gasGiant.radius * JUPITER_RADIUS * renderScale;
 *
 * // Calculate ring system dimensions relative to planet
 * const ringInnerRadius = gasGiant.radius * JUPITER_RADIUS * 1.2; // 20% beyond surface
 * const ringOuterRadius = gasGiant.radius * JUPITER_RADIUS * 2.5;  // 2.5x planet radius
 * ```
 */
export const JUPITER_RADIUS = 6.9911e7;
