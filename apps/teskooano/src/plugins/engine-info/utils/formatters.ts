/**
 * Formats a 3D vector object into a readable string '(x, y, z)'.
 *
 * @param vec - The vector object with x, y, z properties.
 * @param precision - The number of decimal places to round each component to.
 * @returns A formatted string representation of the vector, or '(?, ?, ?)' if input is invalid.
 */
export function formatVector(
  vec?: { x: number; y: number; z: number },
  precision: number = 0,
): string {
  if (!vec) return "(?, ?, ?)";
  const factor = Math.pow(10, precision);
  const x = Math.round(vec.x * factor) / factor;
  const y = Math.round(vec.y * factor) / factor;
  const z = Math.round(vec.z * factor) / factor;

  return `(${x.toLocaleString()}, ${y.toLocaleString()}, ${z.toLocaleString()})`;
}

/**
 * Formats a number using locale-specific settings (e.g., adding commas).
 *
 * @param num - The number to format.
 * @returns A formatted string representation of the number, or '-' if input is invalid.
 */
export function formatNumber(num?: number): string {
  return num != null && Number.isFinite(num) ? num.toLocaleString() : "-";
}

/**
 * Formats a number representing bytes into a more readable Megabytes (MB) string.
 *
 * @param bytes - The number of bytes.
 * @returns A formatted string in MB (e.g., '12.3 MB'), or '- MB' if input is invalid.
 */
export function formatMemory(bytes?: number): string {
  if (bytes == null || !Number.isFinite(bytes)) return "- MB";
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
