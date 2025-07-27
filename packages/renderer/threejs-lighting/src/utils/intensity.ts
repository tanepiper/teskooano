/**
 * A collection of utility functions for lighting calculations.
 */

/**
 * Calculates a visually appropriate light intensity from a star's physical luminosity.
 * Real stellar luminosities have an enormous dynamic range. This function maps the
 * physical value (in Solar units, L☉) to a perceptual one for the renderer using
 * a clamped power function, which provides a good balance for visual representation.
 *
 * The formula is based on a similar calculation used in the procedural generation system
 * to ensure consistency.
 *
 * @param luminosity_L_sun - The star's luminosity in solar units (L☉).
 * @returns A non-linear, clamped intensity value suitable for a THREE.Light.
 */
export function calculateVisualIntensity(luminosity_L_sun: number): number {
  // Clamp luminosity to prevent extreme values from causing visual artifacts.
  // Min clamp avoids log(0) issues and ensures dim stars are still visible.
  // Max clamp prevents ultra-luminous stars from blowing out the scene.
  const clampedLuminosity = Math.max(
    0.0001,
    Math.min(luminosity_L_sun, 500000),
  );

  // Use a power function (sqrt) to compress the vast dynamic range.
  // The multiplier is a magic number to scale the result to a visually pleasing range.
  const intensity = Math.pow(clampedLuminosity, 0.4) * 2.5;

  return intensity;
}
