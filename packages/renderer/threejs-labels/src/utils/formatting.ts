import { AU_METERS } from "@teskooano/data-values";

/**
 * Formats a distance in AU to a human-readable string.
 *
 * @param distanceInAu Distance in astronomical units
 * @returns Formatted distance string
 */
export function formatDistance(distanceInAu: number): string {
  // Convert AU to meters for smaller distances
  const distanceInMeters = distanceInAu * AU_METERS;

  if (distanceInMeters < 1000) {
    // Less than 1 km - show in meters
    return `${distanceInMeters.toFixed(0)} m`;
  } else if (distanceInMeters < 1_000_000) {
    // Less than 1000 km - show in kilometers
    return `${(distanceInMeters / 1000).toFixed(1)} km`;
  } else if (distanceInAu < 0.2) {
    // Less than 0.2 AU - show in megameters
    return `${(distanceInMeters / 1_000_000).toFixed(1)} Mm`;
  } else if (distanceInAu < 10) {
    return `${distanceInAu.toFixed(2)} AU`;
  } else if (distanceInAu < 100) {
    return `${distanceInAu.toFixed(1)} AU`;
  } else {
    return `${distanceInAu.toFixed(0)} AU`;
  }
}

/**
 * Formats a speed in meters per second to a human-readable string.
 *
 * @param speedInMps Speed in meters per second
 * @returns Formatted speed string
 */
export function formatSpeed(speedInMps: number): string {
  if (speedInMps < 1000) {
    return `${speedInMps.toFixed(0)} m/s`;
  } else if (speedInMps < 1000000) {
    return `${(speedInMps / 1000).toFixed(1)} km/s`;
  } else {
    return `${(speedInMps / 1000000).toFixed(1)} Mm/s`;
  }
}
