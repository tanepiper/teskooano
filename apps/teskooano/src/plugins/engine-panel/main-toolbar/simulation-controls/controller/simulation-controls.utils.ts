/**
 * Formats a time value in seconds into a human-readable string.
 * It uses units like years (y), days (d), hours (h), minutes (m), and seconds (s),
 * showing one decimal place for precision.
 *
 * @param {number} seconds - The total number of seconds to format.
 * @returns {string} The formatted time string (e.g., "3.5 d", "12.0 h").
 */
export function formatTime(seconds: number): string {
  if (seconds === 0) return "0.0 s";

  const SECONDS_IN_MINUTE = 60;
  const SECONDS_IN_HOUR = 3600;
  const SECONDS_IN_DAY = 86400;
  const SECONDS_IN_YEAR = 31536000;

  if (Math.abs(seconds) >= SECONDS_IN_YEAR) {
    return `${(seconds / SECONDS_IN_YEAR).toFixed(1)} y`;
  }
  if (Math.abs(seconds) >= SECONDS_IN_DAY) {
    return `${(seconds / SECONDS_IN_DAY).toFixed(1)} d`;
  }
  if (Math.abs(seconds) >= SECONDS_IN_HOUR) {
    return `${(seconds / SECONDS_IN_HOUR).toFixed(1)} h`;
  }
  if (Math.abs(seconds) >= SECONDS_IN_MINUTE) {
    return `${(seconds / SECONDS_IN_MINUTE).toFixed(1)} m`;
  }
  return `${seconds.toFixed(1)} s`;
}

/**
 * Formats a simulation time scale multiplier into a compact, readable string.
 * It uses metric-like prefixes (K, M) for large numbers.
 *
 * @param {number} scale - The time scale multiplier.
 * @returns {string} The formatted scale string (e.g., "1x", "1024x", "1.05M x").
 */
export function formatScale(scale: number): string {
  if (scale === 0) return "Paused";
  const absScale = Math.abs(scale);

  let formattedScale;
  if (absScale >= 1_000_000) {
    formattedScale = `${(absScale / 1_000_000).toPrecision(3)}M`;
  } else if (absScale >= 1000) {
    formattedScale = `${(absScale / 1000).toPrecision(3)}K`;
  } else if (absScale < 1 && absScale > 0) {
    formattedScale = absScale.toPrecision(2);
  } else {
    formattedScale = Math.round(absScale);
  }

  return `${scale < 0 ? "-" : ""}${formattedScale}x`;
}

/**
 * Gets a shortened, display-friendly name for a physics engine from its full identifier.
 *
 * @param {string | undefined} engineName - The full engine name (e.g., "verlet-integrator").
 * @returns {string} The shortened, capitalized name (e.g., "Verlet").
 */
export function getEngineShortName(engineName: string | undefined): string {
  if (!engineName) return "-";
  const name = engineName.split("-")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}
