/**
 * Clamps a number between a minimum and maximum value.
 * @param value The number to clamp.
 * @param min The minimum allowed value.
 * @param max The maximum allowed value.
 * @returns The clamped number.
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Linearly interpolates between two numbers.
 * @param start The starting value.
 * @param end The ending value.
 * @param t The interpolation factor (usually between 0 and 1).
 * @returns The interpolated value.
 */
export function lerp(start: number, end: number, t: number): number {
  return start + t * (end - start);
}

/**
 * Converts degrees to radians.
 * @param degrees The angle in degrees.
 * @returns The angle in radians.
 */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/**
 * Converts radians to degrees.
 * @param radians The angle in radians.
 * @returns The angle in degrees.
 */
export function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Checks if two numbers are approximately equal within a given tolerance.
 * @param a The first number.
 * @param b The second number.
 * @param epsilon The tolerance for equality comparison. Defaults to 0.000001.
 * @returns True if the numbers are approximately equal, false otherwise.
 */
export function equals(a: number, b: number, epsilon = 0.000001): boolean {
  return Math.abs(a - b) <= epsilon;
}

/**
 * Checks if a number is a power of two.
 * @param value The number to check.
 * @returns True if the number is a power of two, false otherwise.
 */
export function isPowerOfTwo(value: number): boolean {
  return (value & (value - 1)) === 0;
}

/**
 * Calculates the smallest power of two greater than or equal to the given number.
 * @param value The input number.
 * @returns The ceiling power of two.
 */
export function ceilPowerOfTwo(value: number): number {
  return Math.pow(2, Math.ceil(Math.log2(value)));
}

/**
 * Calculates the largest power of two less than or equal to the given number.
 * @param value The input number.
 * @returns The floor power of two.
 */
export function floorPowerOfTwo(value: number): number {
  return Math.pow(2, Math.floor(Math.log2(value)));
}

/**
 * Calculates the nearest power of two to the given number.
 * @param value The input number.
 * @returns The nearest power of two.
 */
export function nearestPowerOfTwo(value: number): number {
  return Math.pow(2, Math.round(Math.log2(value)));
}

/**
 * Generates a Version 4 UUID (Universally Unique Identifier).
 * @returns A string representing the generated UUID.
 */
export function generateUUID(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after `wait` milliseconds have elapsed since the last time the
 * debounced function was invoked.
 * @template T The type of the function to debounce.
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @returns A debounced function.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every `limit` milliseconds.
 * @template T The type of the function to throttle.
 * @param func The function to throttle.
 * @param limit The throttling period in milliseconds.
 * @returns A throttled function.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Creates a memoized function that caches the results of function calls.
 * Subsequent calls with the same arguments will return the cached result.
 * Note: Uses JSON.stringify for cache key, suitable for primitive arguments or simple objects.
 * @template T The type of the function to memoize.
 * @param func The function to memoize.
 * @returns A memoized function.
 */
export function memoize<T extends (...args: any[]) => any>(
  func: T,
): (...args: Parameters<T>) => ReturnType<T> {
  const cache = new Map<string, ReturnType<T>>();
  return function executedFunction(...args: Parameters<T>): ReturnType<T> {
    const key = JSON.stringify(args);
    if (cache.has(key)) {
      return cache.get(key)!;
    }
    const result = func(...args);
    cache.set(key, result);
    return result;
  };
}
