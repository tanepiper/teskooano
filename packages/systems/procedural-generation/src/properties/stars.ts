import type { CelestialObject, SpectralClass } from "@teskooano/data-types";

/**
 * @internal
 * Bolometric correction constants based on Habets and Heintz (1981).
 * This table provides generalized corrections for main-sequence stars.
 */
const bolometricCorrections: Record<string, number> = {
  B: -2.0,
  A: -0.3,
  F: -0.15,
  G: -0.4,
  K: -0.8,
  M: -2.0,
};

/**
 * @internal
 * The bolometric magnitude of the Sun, a standard reference value.
 */
const MBOL_SUN = 4.72;

/**
 * Calculates the habitable zone boundaries for a star based on its intrinsic luminosity.
 * This is the preferred method for procedurally generated stars where physical
 * properties are already known.
 *
 * @param luminosity The star's absolute luminosity in solar units (L☉).
 * @returns An object containing the inner and outer boundaries of the habitable zone in AU.
 */
export function calculateHabitableZoneFromLuminosity(luminosity: number): {
  innerBoundary: number;
  outerBoundary: number;
} {
  // These calculations are based on the work of Kasting et al. (1993) and
  // Whitmire et al. (1996), using stellar flux to define the zone's edges.
  const innerBoundary = Math.sqrt(luminosity / 1.1);
  const outerBoundary = Math.sqrt(luminosity / 0.53);

  return { innerBoundary, outerBoundary };
}

/**
 * Calculates the habitable zone boundaries for a star from observational data.
 * This function is useful for modeling real-world stars based on data as
 * seen from Earth.
 *
 * @param apparentMagnitude The star's apparent visual magnitude (mv).
 * @param distance The star's distance from Earth in parsecs (d).
 * @param spectralClass The star's spectral class (e.g., "G2V").
 * @returns An object containing the inner and outer boundaries of the habitable zone in AU.
 */
export function calculateHabitableZoneFromObservation(
  apparentMagnitude: number,
  distance: number,
  spectralClass: SpectralClass,
): { innerBoundary: number; outerBoundary: number } {
  // Stage 1: Calculate the star's absolute luminosity.
  // Step 1: Calculate absolute visual magnitude (Mv)
  const Mv = apparentMagnitude - 5 * Math.log10(distance / 10);

  // Step 2: Calculate bolometric magnitude (Mbol)
  const mainSpectralType = spectralClass.charAt(0).toUpperCase();
  const bc = bolometricCorrections[mainSpectralType];
  if (bc === undefined) {
    throw new Error(
      `No bolometric correction value found for spectral type: ${mainSpectralType}`,
    );
  }
  const Mbol = Mv + bc;

  // Step 3: Calculate absolute luminosity relative to the Sun.
  const luminosity = Math.pow(10, 0.4 * (MBOL_SUN - Mbol));

  // Stage 2: Use the calculated luminosity to find the habitable zone.
  return calculateHabitableZoneFromLuminosity(luminosity);
}
