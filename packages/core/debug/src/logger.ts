/**
 * Logging utilities for debug messages
 */
import { DebugLevel, debugConfig, isDebugEnabled } from './index';

/**
 * Log a message if the current debug level permits
 * 
 * @param level Debug level of the message
 * @param message The message to log
 * @param args Additional arguments to log
 */
export function log(level: DebugLevel, message: string, ...args: any[]): void {
  if (!debugConfig.logging || !isDebugEnabled(level)) {
    return;
  }

  switch (level) {
    case DebugLevel.ERROR:
      console.error(`[ERROR] ${message}`, ...args);
      break;
    case DebugLevel.WARN:
      console.warn(`[WARN] ${message}`, ...args);
      break;
    case DebugLevel.INFO:
      console.info(`[INFO] ${message}`, ...args);
      break;
    case DebugLevel.DEBUG:
      console.debug(`[DEBUG] ${message}`, ...args);
      break;
    case DebugLevel.TRACE:
      console.trace(`[TRACE] ${message}`, ...args);
      break;
  }
}

/**
 * Convenience method for logging errors
 */
export function error(message: string, ...args: any[]): void {
  log(DebugLevel.ERROR, message, ...args);
}

/**
 * Convenience method for logging warnings
 */
export function warn(message: string, ...args: any[]): void {
  log(DebugLevel.WARN, message, ...args);
}

/**
 * Convenience method for logging info messages
 */
export function info(message: string, ...args: any[]): void {
  log(DebugLevel.INFO, message, ...args);
}

/**
 * Convenience method for logging debug messages
 */
export function debug(message: string, ...args: any[]): void {
  log(DebugLevel.DEBUG, message, ...args);
}

/**
 * Convenience method for logging trace messages
 */
export function trace(message: string, ...args: any[]): void {
  log(DebugLevel.TRACE, message, ...args);
}

/**
 * Helper to measure execution time of a function
 * 
 * @param name Name of the operation being timed
 * @param fn Function to execute and time
 * @returns The result of the function
 */
export function timeExecution<T>(name: string, fn: () => T): T {
  if (!debugConfig.logging || !isDebugEnabled(DebugLevel.DEBUG)) {
    return fn();
  }

  console.time(`[TIME] ${name}`);
  const result = fn();
  console.timeEnd(`[TIME] ${name}`);
  return result;
}

/**
 * Create a logger instance for a specific module
 * 
 * @param moduleName Name of the module using this logger
 * @returns Object with logging methods
 */
export function createLogger(moduleName: string) {
  return {
    error: (message: string, ...args: any[]) => error(`[${moduleName}] ${message}`, ...args),
    warn: (message: string, ...args: any[]) => warn(`[${moduleName}] ${message}`, ...args),
    info: (message: string, ...args: any[]) => info(`[${moduleName}] ${message}`, ...args),
    debug: (message: string, ...args: any[]) => debug(`[${moduleName}] ${message}`, ...args),
    trace: (message: string, ...args: any[]) => trace(`[${moduleName}] ${message}`, ...args),
    time: <T>(operationName: string, fn: () => T) => timeExecution(`${moduleName}:${operationName}`, fn)
  };
} 