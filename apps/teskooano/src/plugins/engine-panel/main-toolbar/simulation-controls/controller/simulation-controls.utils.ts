import { SimulationMode } from "@teskooano/data-types";

/**
 * Formats a time value in seconds into a human-readable string.
 * It uses units like years (y), days (d), hours (h), minutes (m), and seconds (s),
 * showing one decimal place for precision.
 *
 * @param {number} seconds - The total number of seconds to format.
 * @returns {string} The formatted time string (e.g., "3.5 d", "12.0 h").
 */
import {
  SECONDS_PER_MINUTE,
  SECONDS_PER_HOUR,
  SECONDS_PER_DAY,
  SECONDS_PER_YEAR_GREGORIAN,
} from "@teskooano/data-values";

export function formatTime(seconds: number): string {
  if (seconds === 0) return "0.0 s";

  if (Math.abs(seconds) >= SECONDS_PER_YEAR_GREGORIAN) {
    return `${(seconds / SECONDS_PER_YEAR_GREGORIAN).toFixed(1)} y`;
  }
  if (Math.abs(seconds) >= SECONDS_PER_DAY) {
    return `${(seconds / SECONDS_PER_DAY).toFixed(1)} d`;
  }
  if (Math.abs(seconds) >= SECONDS_PER_HOUR) {
    return `${(seconds / SECONDS_PER_HOUR).toFixed(1)} h`;
  }
  if (Math.abs(seconds) >= SECONDS_PER_MINUTE) {
    return `${(seconds / SECONDS_PER_MINUTE).toFixed(1)} m`;
  }
  return `${seconds.toFixed(1)} s`;
}

/**
 * Formats a simulation date based on a start date and elapsed seconds.
 * Uses Intl.DateTimeFormat for locale-aware date and time formatting.
 *
 * @param {Date} startDate - The starting date for the simulation
 * @param {number} elapsedSeconds - The elapsed simulation time in seconds
 * @param {boolean} compact - Whether to use a more compact format
 * @returns {string} The formatted date and time string
 */
export function formatSimulationDate(
  startDate: Date,
  elapsedSeconds: number,
  compact: boolean = false,
): string {
  const currentDate = new Date(startDate.getTime() + elapsedSeconds * 1000);

  if (compact) {
    // Compact format: "Jan 15, 14:30:25"
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return formatter.format(currentDate);
  } else {
    // Full format: "Jan 15, 2024, 14:30:25"
    const formatter = new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
    return formatter.format(currentDate);
  }
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

/**
 * Gets a display-friendly short name for a simulation configuration.
 * Simplified to show "N-Body" or "Ideal" since we only use Barnes-Hut + Verlet.
 *
 * @param config - The simulation configuration object
 * @returns Short display name ("N-Body" or "Ideal")
 */
export function getConfigurationShortName(config?: {
  mode: string;
  algorithm?: string;
  integrator?: string;
}): string {
  if (!config) return "-";

  if (config.mode === SimulationMode.IDEAL) {
    return "Ideal";
  }

  // Simplified: Always show "N-Body" for N-body mode
  // (internally uses Barnes-Hut + Velocity Verlet)
  return "N-Body";
}

/**
 * Gets a full display-friendly name for a simulation configuration.
 * Simplified since we only use Barnes-Hut + Velocity Verlet for N-body simulations.
 *
 * @param config - The simulation configuration object
 * @returns Full display name ("N-Body Simulation" or "Ideal Orrery")
 */
export function getConfigurationDisplayName(config?: {
  mode: string;
  algorithm?: string;
  integrator?: string;
}): string {
  if (!config) return "Unknown";

  if (config.mode === SimulationMode.IDEAL) {
    return "Ideal Orrery";
  }

  // Simplified: N-body always uses Barnes-Hut + Velocity Verlet
  return "N-Body Simulation";
}
