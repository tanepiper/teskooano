/**
 * Physical property ranges
 *
 * Valid ranges for various physical properties used throughout the simulation.
 * These help ensure realistic values and provide bounds for UI controls.
 */

/**
 * Minimum stellar temperature (K)
 *
 * The minimum realistic surface temperature for stars in the simulation.
 * This corresponds to the coolest M-type red dwarfs and brown dwarfs.
 * Used for validating stellar temperature inputs and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate stellar temperature input
 * const isValidTemperature = temperature >= MIN_STELLAR_TEMPERATURE && temperature <= MAX_STELLAR_TEMPERATURE;
 *
 * // Set UI slider range for stellar temperature
 * const temperatureSlider = createSlider(MIN_STELLAR_TEMPERATURE, MAX_STELLAR_TEMPERATURE, defaultTemp);
 *
 * // Clamp temperature to valid range
 * const clampedTemp = Math.max(MIN_STELLAR_TEMPERATURE, Math.min(temperature, MAX_STELLAR_TEMPERATURE));
 * ```
 */
export const MIN_STELLAR_TEMPERATURE = 2000;

/**
 * Maximum stellar temperature (K)
 *
 * The maximum realistic surface temperature for stars in the simulation.
 * This corresponds to the hottest O-type stars and Wolf-Rayet stars.
 * Used for validating stellar temperature inputs and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate stellar temperature input
 * const isValidTemperature = temperature >= MIN_STELLAR_TEMPERATURE && temperature <= MAX_STELLAR_TEMPERATURE;
 *
 * // Calculate temperature as percentage of valid range
 * const tempPercentage = (temperature - MIN_STELLAR_TEMPERATURE) / (MAX_STELLAR_TEMPERATURE - MIN_STELLAR_TEMPERATURE);
 *
 * // Determine stellar spectral class based on temperature
 * const spectralClass = temperature > 30000 ? 'O' : temperature > 10000 ? 'B' : 'A';
 * ```
 */
export const MAX_STELLAR_TEMPERATURE = 50000;

/**
 * Minimum planetary temperature (K)
 *
 * The minimum realistic surface temperature for planets in the simulation.
 * This corresponds to the coldest ice worlds and outer solar system objects.
 * Used for validating planetary temperature inputs and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate planetary temperature input
 * const isValidTemperature = temperature >= MIN_PLANETARY_TEMPERATURE && temperature <= MAX_PLANETARY_TEMPERATURE;
 *
 * // Determine if planet can support liquid water
 * const canSupportWater = temperature >= 273 && temperature <= 373; // 0-100°C
 *
 * // Calculate temperature in Celsius for display
 * const tempCelsius = temperature - 273.15;
 * ```
 */
export const MIN_PLANETARY_TEMPERATURE = 50;

/**
 * Maximum planetary temperature (K)
 *
 * The maximum realistic surface temperature for planets in the simulation.
 * This corresponds to the hottest lava worlds and planets very close to their stars.
 * Used for validating planetary temperature inputs and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate planetary temperature input
 * const isValidTemperature = temperature >= MIN_PLANETARY_TEMPERATURE && temperature <= MAX_PLANETARY_TEMPERATURE;
 *
 * // Determine planet type based on temperature
 * const planetType = temperature > 1000 ? 'LAVA' : temperature > 500 ? 'DESERT' : 'ROCKY';
 *
 * // Calculate thermal emission for rendering
 * const thermalEmission = STEFAN_BOLTZMANN_CONSTANT * Math.pow(temperature, 4);
 * ```
 */
export const MAX_PLANETARY_TEMPERATURE = 3000;

/**
 * Minimum albedo (reflectivity)
 *
 * The minimum possible albedo value for celestial objects.
 * A value of 0.0 represents a perfectly black object that absorbs all incident light.
 * Used for validating albedo inputs and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate albedo input
 * const isValidAlbedo = albedo >= MIN_ALBEDO && albedo <= MAX_ALBEDO;
 *
 * // Calculate reflected light intensity
 * const reflectedIntensity = incidentLight * albedo;
 *
 * // Determine object brightness for rendering
 * const brightness = 1 - albedo; // Darker objects have lower albedo
 * ```
 */
export const MIN_ALBEDO = 0.0;

/**
 * Maximum albedo (reflectivity)
 *
 * The maximum possible albedo value for celestial objects.
 * A value of 1.0 represents a perfectly reflective object that reflects all incident light.
 * Used for validating albedo inputs and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate albedo input
 * const isValidAlbedo = albedo >= MIN_ALBEDO && albedo <= MAX_ALBEDO;
 *
 * // Calculate absorbed light intensity
 * const absorbedIntensity = incidentLight * (1 - albedo);
 *
 * // Determine if object is highly reflective
 * const isHighlyReflective = albedo > 0.7;
 * ```
 */
export const MAX_ALBEDO = 1.0;

/**
 * Minimum orbital eccentricity
 *
 * The minimum possible orbital eccentricity value.
 * A value of 0.0 represents a perfectly circular orbit.
 * Used for validating orbital parameters and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate eccentricity input
 * const isValidEccentricity = eccentricity >= MIN_ECCENTRICITY && eccentricity <= MAX_ECCENTRICITY;
 *
 * // Determine orbit shape
 * const orbitShape = eccentricity === 0 ? 'circular' : eccentricity < 0.1 ? 'near-circular' : 'elliptical';
 *
 * // Calculate orbital stability
 * const isStable = eccentricity < 0.9; // Highly eccentric orbits may be unstable
 * ```
 */
export const MIN_ECCENTRICITY = 0.0;

/**
 * Maximum orbital eccentricity (hyperbolic)
 *
 * The maximum possible orbital eccentricity value.
 * Values above 1.0 represent hyperbolic (unbound) orbits, while values
 * between 0.0 and 1.0 represent elliptical (bound) orbits.
 * Used for validating orbital parameters and setting UI slider bounds.
 *
 * @example
 * ```typescript
 * // Validate eccentricity input
 * const isValidEccentricity = eccentricity >= MIN_ECCENTRICITY && eccentricity <= MAX_ECCENTRICITY;
 *
 * // Determine if orbit is bound or unbound
 * const isBound = eccentricity < 1.0;
 * const isHyperbolic = eccentricity > 1.0;
 *
 * // Calculate orbital energy
 * const orbitalEnergy = isBound ? 'negative' : 'positive';
 * ```
 */
export const MAX_ECCENTRICITY = 2.0;
