import {
  IntegratorType,
  AlgorithmType,
  SimulationMode,
} from "@teskooano/data-types";

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
 *
 * @param config - The simulation configuration object
 * @returns Short display name (e.g., "BH-Ver", "TPM-Y4")
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

  let algorithmShort: string;
  switch (config.algorithm) {
    case AlgorithmType.BARNES_HUT:
      algorithmShort = "BH";
      break;
    case AlgorithmType.FMM:
      algorithmShort = "FMM";
      break;
    case AlgorithmType.P3M:
      algorithmShort = "P3M";
      break;
    case AlgorithmType.TREE_PM:
      algorithmShort = "TPM";
      break;
    case AlgorithmType.DIRECT:
      algorithmShort = "Dir";
      break;
    default:
      algorithmShort = "Dir";
      break;
  }

  let integratorShort: string;
  switch (config.integrator) {
    case IntegratorType.EULER:
      integratorShort = "Eul";
      break;
    case IntegratorType.SYMPLECTIC:
      integratorShort = "Sym";
      break;
    case IntegratorType.VERLET:
      integratorShort = "Ver";
      break;
    case IntegratorType.RK4:
      integratorShort = "RK4";
      break;
    case IntegratorType.ADAPTIVE:
      integratorShort = "Adp";
      break;
    case IntegratorType.YOSHIDA4:
      integratorShort = "Y4";
      break;
    case IntegratorType.FOREST_RUTH:
      integratorShort = "FR";
      break;
    case IntegratorType.PEFRL:
      integratorShort = "PEFRL";
      break;
    case IntegratorType.LEAPFROG:
      integratorShort = "LF";
      break;
    default:
      integratorShort = "?";
      break;
  }

  return `${algorithmShort}-${integratorShort}`;
}

/**
 * Gets a full display-friendly name for a simulation configuration.
 *
 * @param config - The simulation configuration object
 * @returns Full display name (e.g., "N-Body (Barnes-Hut + Verlet)")
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

  let algorithmName: string;
  switch (config.algorithm) {
    case AlgorithmType.BARNES_HUT:
      algorithmName = "Barnes-Hut";
      break;
    case AlgorithmType.FMM:
      algorithmName = "Fast Multipole";
      break;
    case AlgorithmType.P3M:
      algorithmName = "Particle-Mesh";
      break;
    case AlgorithmType.TREE_PM:
      algorithmName = "Tree-PM";
      break;
    case AlgorithmType.DIRECT:
      algorithmName = "Direct";
      break;
    default:
      algorithmName = "Unknown";
      break;
  }

  let integratorName: string;
  switch (config.integrator) {
    case IntegratorType.EULER:
      integratorName = "Euler";
      break;
    case IntegratorType.SYMPLECTIC:
      integratorName = "Symplectic";
      break;
    case IntegratorType.VERLET:
      integratorName = "Verlet";
      break;
    case IntegratorType.RK4:
      integratorName = "RK4";
      break;
    case IntegratorType.ADAPTIVE:
      integratorName = "Adaptive RK";
      break;
    case IntegratorType.YOSHIDA4:
      integratorName = "Yoshida 4th";
      break;
    case IntegratorType.FOREST_RUTH:
      integratorName = "Forest-Ruth";
      break;
    case IntegratorType.PEFRL:
      integratorName = "PEFRL";
      break;
    case IntegratorType.LEAPFROG:
      integratorName = "Leapfrog";
      break;
    default:
      integratorName = "Unknown";
      break;
  }

  return `N-Body (${algorithmName} + ${integratorName})`;
}
