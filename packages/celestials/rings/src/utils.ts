// Kepler's Third Law: orbital period is proportional to semi-major axis^(3/2)
// For rings, we use the average radius as the semi-major axis
export function calculateKeplerianRotationRate(
  innerRadius: number,
  outerRadius: number,
): number {
  // Use average radius as semi-major axis
  const avgRadius = (innerRadius + outerRadius) / 2;

  // Faster rotation for inner rings, slower for outer rings
  // Scale factor is arbitrary but gives reasonable visual speeds
  const scaleFactor = 0.02;

  // Apply Kepler's law: rotation rate ∝ 1/sqrt(radius^3)
  // Higher value = faster rotation
  return scaleFactor / Math.sqrt(avgRadius * avgRadius * avgRadius);
}

/**
 * Calculate the Schwarzschild radius (event horizon) for a black hole
 * @param mass_kg Mass of the black hole in kg
 * @returns Schwarzschild radius in meters
 */
export function calculateSchwarzschildRadius(mass_kg: number): number {
  const G = 6.6743e-11; // Gravitational constant
  const c = 299792458; // Speed of light
  return (2 * G * mass_kg) / (c * c);
}

/**
 * Calculate the innermost stable circular orbit (ISCO) for a black hole
 * @param mass_kg Mass of the black hole in kg
 * @param spinParameter Dimensionless spin parameter (0 = non-rotating, 1 = maximally rotating)
 * @returns ISCO radius in gravitational radii (R_g = GM/c²)
 */
export function calculateISCO(
  mass_kg: number,
  spinParameter: number = 0,
): number {
  const G = 6.6743e-11;
  const c = 299792458;
  const R_g = (G * mass_kg) / (c * c);

  if (spinParameter === 0) {
    // Non-rotating black hole (Schwarzschild)
    return 6 * R_g;
  } else {
    // Rotating black hole (Kerr) - simplified approximation
    const a = spinParameter * R_g;
    const Z1 =
      1 +
      Math.pow(1 - a * a, 1 / 3) *
        (Math.pow(1 + a, 1 / 3) + Math.pow(1 - a, 1 / 3));
    const Z2 = Math.sqrt(3 * a * a + Z1 * Z1);
    return R_g * (3 + Z2 - Math.sqrt((3 - Z1) * (3 + Z1 + 2 * Z2)));
  }
}

/**
 * Calculate accretion disk temperature profile
 * @param mass_kg Black hole mass in kg
 * @param accretionRate Accretion rate in solar masses per year
 * @param radius Distance from black hole center in meters
 * @returns Temperature in Kelvin
 */
export function calculateAccretionDiskTemperature(
  mass_kg: number,
  accretionRate: number,
  radius: number,
): number {
  const G = 6.6743e-11;
  const c = 299792458;
  const sigma = 5.670374419e-8; // Stefan-Boltzmann constant
  const M_sun = 1.989e30; // Solar mass in kg

  // Convert accretion rate to kg/s
  const accretionRate_kgs = (accretionRate * M_sun) / (365.25 * 24 * 3600);

  // Use a more realistic temperature calculation
  // For supermassive black holes, temperatures are typically 10^4 - 10^7 K
  // Scale based on mass and accretion rate, but cap at reasonable values

  // Calculate the raw temperature using the standard formula
  const rawTemperature = Math.pow(
    (3 * G * mass_kg * accretionRate_kgs) /
      (8 * Math.PI * sigma * Math.pow(radius, 3)),
    0.25,
  );

  // Cap the temperature at reasonable values for visualization
  // Most accretion disks have temperatures between 10^3 and 10^7 K
  const maxTemperature = 1e7; // 10 million K
  const minTemperature = 1e3; // 1 thousand K

  return Math.max(minTemperature, Math.min(maxTemperature, rawTemperature));
}

/**
 * Calculate accretion disk luminosity
 * @param mass_kg Black hole mass in kg
 * @param accretionRate Accretion rate in solar masses per year
 * @returns Luminosity in watts
 */
export function calculateAccretionDiskLuminosity(
  mass_kg: number,
  accretionRate: number,
): number {
  const c = 299792458;
  const M_sun = 1.989e30;

  // Convert accretion rate to kg/s
  const accretionRate_kgs = (accretionRate * M_sun) / (365.25 * 24 * 3600);

  // Luminosity = η * Ṁ * c² where η is efficiency (typically 0.1 for thin disks)
  const efficiency = 0.1;
  return efficiency * accretionRate_kgs * c * c;
}

/**
 * Generate realistic accretion disk properties for a black hole
 * @param blackHoleMass_kg Mass of the black hole in kg
 * @param accretionRate_MsunPerYear Accretion rate in solar masses per year
 * @param spinParameter Dimensionless spin parameter (0-1, where 1 is maximum rotation)
 * @returns Accretion disk properties
 */
export function generateAccretionDiskProperties(
  blackHoleMass_kg: number,
  accretionRate_MsunPerYear: number = 1e-8,
  spinParameter: number = 0.8,
): {
  innerRadius: number;
  outerRadius: number;
  color: string;
  opacity: number;
  rotationRate: number;
  temperature: number;
  accretionRate: number;
  emissionType: number;
  isRelativistic: boolean;
  innerEdgeRadius: number;
} {
  const G = 6.6743e-11;
  const C = 299792458;
  const SOLAR_MASS_KG = 1.989e30;
  const SOLAR_RADIUS_M = 6.957e8;

  // Calculate Schwarzschild radius
  const schwarzschildRadius = (2 * G * blackHoleMass_kg) / (C * C);

  // Calculate innermost stable circular orbit (ISCO)
  // For Kerr black holes, ISCO depends on spin
  let iscoRadius: number;
  if (spinParameter > 0) {
    // Kerr black hole - ISCO depends on spin
    const a = spinParameter; // Dimensionless spin parameter
    const z1 =
      1 +
      Math.pow(1 - a * a, 1 / 3) *
        (Math.pow(1 + a, 1 / 3) + Math.pow(1 - a, 1 / 3));
    const z2 = Math.sqrt(3 * a * a + z1 * z1);
    iscoRadius =
      schwarzschildRadius * (3 + z2 - Math.sqrt((3 - z1) * (3 + z1 + 2 * z2)));
  } else {
    // Schwarzschild black hole - ISCO at 3 Schwarzschild radii
    iscoRadius = 3 * schwarzschildRadius;
  }

  // Calculate realistic disk temperature using standard thin disk model
  const accretionRate_kgPerSecond =
    (accretionRate_MsunPerYear * SOLAR_MASS_KG) / (365.25 * 24 * 3600);

  // Use the standard thin disk temperature profile: T ∝ (M * Ṁ / r³)^(1/4)
  // Temperature at the inner edge (ISCO)
  const innerTemperature = calculateAccretionDiskTemperature(
    blackHoleMass_kg,
    accretionRate_MsunPerYear,
    iscoRadius,
  );

  // Outer radius (typically 100-1000 times inner radius)
  const outerRadius = iscoRadius * (100 + Math.random() * 900);

  // Determine color based on temperature
  let color: string;
  if (innerTemperature > 100000) {
    color = "#87CEEB"; // Blue-white for very hot disks
  } else if (innerTemperature > 50000) {
    color = "#FFD700"; // Yellow-white for hot disks
  } else if (innerTemperature > 20000) {
    color = "#FF6B35"; // Orange for warm disks
  } else if (innerTemperature > 10000) {
    color = "#FF4500"; // Red-orange for cooler disks
  } else {
    color = "#8B0000"; // Dark red for cool disks
  }

  // Calculate rotation rate (Keplerian orbital frequency at ISCO)
  const orbitalPeriod =
    2 * Math.PI * Math.sqrt(Math.pow(iscoRadius, 3) / (G * blackHoleMass_kg));
  const rotationRate = 1 / orbitalPeriod;

  return {
    innerRadius: iscoRadius,
    outerRadius: outerRadius,
    color: color,
    opacity: 0.8 + Math.random() * 0.2, // 0.8-1.0 opacity
    rotationRate: rotationRate,
    temperature: innerTemperature,
    accretionRate: accretionRate_MsunPerYear,
    emissionType: 0, // Thermal emission
    isRelativistic: true,
    innerEdgeRadius: iscoRadius / schwarzschildRadius, // In gravitational radii
  };
}
