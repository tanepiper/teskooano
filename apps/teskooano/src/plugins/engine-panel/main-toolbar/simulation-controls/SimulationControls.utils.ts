/**
 * Formats a time scale number into a human-readable string with units (K, M).
 * Handles positive, negative, and zero scales.
 *
 * @param {number} scale - The time scale factor.
 * @returns {string} The formatted time scale string (e.g., "1.0x", "10.5Kx", "-2.0Mx", "0.0x").
 */
export const formatScale = (scale: number): string => {
  const absScale = Math.abs(scale);
  let scaleText: string;
  if (scale === 0) return "0.0x";

  if (absScale >= 1000000) {
    scaleText = `${(scale / 1000000).toFixed(1)}M`;
  } else if (absScale >= 1000) {
    scaleText = `${(scale / 1000).toFixed(1)}K`;
  } else {
    scaleText = absScale >= 1 ? scale.toFixed(1) : scale.toFixed(2);
  }
  return `${scaleText}x`;
};

/**
 * Formats a simulation time in seconds into a string representation of days, hours, minutes, and seconds.
 *
 * @param {number} [timeSeconds=0] - The simulation time in seconds.
 * @returns {string} The formatted time string (e.g., "1d 02:30:15").
 */
export const formatTime = (timeSeconds: number = 0): string => {
  const days = Math.floor(timeSeconds / 86400);
  const hours = Math.floor((timeSeconds % 86400) / 3600);
  const minutes = Math.floor((timeSeconds % 3600) / 60);
  const seconds = Math.floor(timeSeconds % 60);
  return `${days}d ${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
};

/**
 * Generates a short name (acronym or first letter) for a physics engine name.
 *
 * @param {string} engineName - The full name of the physics engine.
 * @returns {string} The short name (e.g., "NB" for "N-Body", "B" for "BarnesHut") or "-" if no name is provided.
 */
export const getEngineShortName = (engineName: string): string => {
  if (!engineName || engineName === "-") return "-";

  // Friendly mapping to match the new labels in SettingsPanel
  switch (engineName) {
    case "verlet":
      return "A"; // Accurate
    case "euler":
      return "S"; // Simple
    case "symplectic":
      return "SY";
    case "kepler":
      return "K"; // Kepler
    default:
      break;
  }

  const words = engineName.split(/[-\s_]+/);
  if (words.length > 1 && words.every((word) => word.length > 0)) {
    return words.map((word) => word.charAt(0).toUpperCase()).join("");
  } else if (engineName.length > 0) {
    return engineName.charAt(0).toUpperCase();
  }
  return "-";
};
