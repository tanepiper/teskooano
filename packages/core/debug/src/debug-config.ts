/**
 * Debug level enumeration
 */
export enum DebugLevel {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
  TRACE = 5,
}

/**
 * Global debug configuration
 */
export interface DebugConfig {
  /** Current debug level */
  level: DebugLevel;
  /** Whether to display debug visuals */
  visualize: boolean;
  /** Whether to log debug messages to console */
  logging: boolean;
}

/**
 * Global debug configuration
 */
export const debugConfig: DebugConfig = {
  level:
    process.env.NODE_ENV === "production" ? DebugLevel.ERROR : DebugLevel.INFO,
  visualize: process.env.NODE_ENV !== "production",
  logging: process.env.NODE_ENV !== "production",
};

/**
 * Helper function to check if debugging is enabled for a specific level
 */
export function isDebugEnabled(level: DebugLevel): boolean {
  return level <= debugConfig.level;
}

/**
 * Helper function to check if visualization is enabled
 */
export function isVisualizationEnabled(): boolean {
  return debugConfig.visualize;
}

/**
 * Set whether debug visualization is enabled
 *
 * @param enabled True to enable visualization, false to disable
 */
export function setVisualizationEnabled(enabled: boolean): void {
  debugConfig.visualize = enabled;
}
