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
