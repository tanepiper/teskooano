/**
 * Fundamental physical constants in SI units
 *
 * These are the most basic physical constants used throughout the simulation
 * and are based on the latest CODATA recommended values.
 */

/**
 * Gravitational constant in m³/(kg·s²)
 *
 * Newton's gravitational constant (G) is the fundamental constant that determines
 * the strength of gravitational attraction between masses. It's used throughout
 * the simulation for calculating gravitational forces, orbital mechanics, and
 * determining the gravitational parameter (μ = GM) of celestial bodies.
 *
 * @example
 * ```typescript
 * // Calculate gravitational force between two bodies
 * const force = (GRAVITATIONAL_CONSTANT * mass1 * mass2) / Math.pow(distance, 2);
 *
 * // Calculate gravitational parameter for a star
 * const gravitationalParameter = GRAVITATIONAL_CONSTANT * star.mass;
 *
 * // Calculate escape velocity from a planet
 * const escapeVelocity = Math.sqrt((2 * GRAVITATIONAL_CONSTANT * planet.mass) / planet.radius);
 * ```
 */
export const GRAVITATIONAL_CONSTANT = 6.6743e-11;

/**
 * Speed of light in m/s
 *
 * The speed of light in vacuum (c) is the ultimate speed limit in the universe.
 * It's used in the simulation for relativistic calculations, determining
 * the maximum possible velocity, and calculating relativistic effects like
 * time dilation and gravitational lensing.
 *
 * @example
 * ```typescript
 * // Calculate relativistic time dilation
 * const timeDilation = 1 / Math.sqrt(1 - Math.pow(velocity / SPEED_OF_LIGHT, 2));
 *
 * // Calculate Schwarzschild radius (event horizon) of a black hole
 * const schwarzschildRadius = (2 * GRAVITATIONAL_CONSTANT * mass) / Math.pow(SPEED_OF_LIGHT, 2);
 *
 * // Check if velocity is relativistic
 * const isRelativistic = velocity > 0.1 * SPEED_OF_LIGHT;
 * ```
 */
export const SPEED_OF_LIGHT = 2.99792458e8;

/**
 * Planck constant in J·s
 *
 * Planck's constant (h) relates the energy of a photon to its frequency.
 * It's used in the simulation for quantum calculations, determining photon
 * energies, and calculating the Wien displacement law for stellar radiation.
 *
 * @example
 * ```typescript
 * // Calculate photon energy from wavelength
 * const photonEnergy = (PLANCK_CONSTANT * SPEED_OF_LIGHT) / wavelength;
 *
 * // Calculate Wien displacement law constant
 * const wienConstant = (PLANCK_CONSTANT * SPEED_OF_LIGHT) / (BOLTZMANN_CONSTANT * 2.897771955);
 *
 * // Calculate peak wavelength of blackbody radiation
 * const peakWavelength = wienConstant / temperature;
 * ```
 */
export const PLANCK_CONSTANT = 6.62607015e-34;

/**
 * Boltzmann constant in J/K
 *
 * Boltzmann's constant (k) relates temperature to energy at the molecular level.
 * It's used in the simulation for thermal calculations, determining particle
 * velocities, and calculating blackbody radiation properties.
 *
 * @example
 * ```typescript
 * // Calculate thermal energy of particles
 * const thermalEnergy = 1.5 * BOLTZMANN_CONSTANT * temperature;
 *
 * // Calculate root mean square velocity of gas molecules
 * const rmsVelocity = Math.sqrt((3 * BOLTZMANN_CONSTANT * temperature) / molecularMass);
 *
 * // Calculate atmospheric scale height
 * const scaleHeight = (BOLTZMANN_CONSTANT * temperature) / (molecularMass * surfaceGravity);
 * ```
 */
export const BOLTZMANN_CONSTANT = 1.380649e-23;

/**
 * Stefan-Boltzmann constant in W/(m²·K⁴)
 *
 * The Stefan-Boltzmann constant (σ) relates the total energy radiated by a
 * blackbody to its temperature. It's used in the simulation for calculating
 * stellar luminosity, planetary thermal radiation, and blackbody emission.
 *
 * @example
 * ```typescript
 * // Calculate stellar luminosity from temperature and radius
 * const luminosity = 4 * Math.PI * Math.pow(radius, 2) * STEFAN_BOLTZMANN_CONSTANT * Math.pow(temperature, 4);
 *
 * // Calculate planetary thermal emission
 * const thermalEmission = STEFAN_BOLTZMANN_CONSTANT * Math.pow(temperature, 4);
 *
 * // Calculate effective temperature from luminosity
 * const effectiveTemp = Math.pow(luminosity / (4 * Math.PI * Math.pow(radius, 2) * STEFAN_BOLTZMANN_CONSTANT), 0.25);
 * ```
 */
export const STEFAN_BOLTZMANN_CONSTANT = 5.670374419e-8;
