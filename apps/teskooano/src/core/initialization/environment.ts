/**
 * Environment validation utilities for application initialization.
 * Extracted from main.ts to reduce cognitive complexity.
 */

export class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(`Environment validation failed: ${message}`);
    this.name = "EnvironmentValidationError";
  }
}

export interface AppEnvironment {
  appElement: HTMLElement;
  toolbarElement: HTMLElement;
}

/**
 * Validates that all required DOM elements are present before app initialization.
 * Throws EnvironmentValidationError if any critical elements are missing.
 */
export function validateEnvironment(): AppEnvironment {
  const appElement = document.getElementById("app");
  const toolbarElement = document.getElementById("toolbar");

  if (!appElement) {
    throw new EnvironmentValidationError(
      "Application container element (#app) not found",
    );
  }

  if (!toolbarElement) {
    throw new EnvironmentValidationError(
      "Toolbar container element (#toolbar) not found",
    );
  }

  return { appElement, toolbarElement };
}