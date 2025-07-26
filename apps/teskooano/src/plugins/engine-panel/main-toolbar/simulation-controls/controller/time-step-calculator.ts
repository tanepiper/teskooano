/**
 * Calculates time steps for jumping to specific dates in the simulation.
 * Works with the engine's existing time stepping system rather than doing complex orbital math.
 */
export class TimeStepCalculator {
  /**
   * Calculates the number of time steps needed to reach a target date from the current simulation time.
   *
   * @param currentSimulationDate - The current simulation start date
   * @param currentSimulationTime - The current simulation elapsed time in seconds
   * @param targetDate - The target date to jump to
   * @param stepSizeSeconds - The size of each physics step in seconds (default: 86400 = 1 day)
   * @returns Object containing the number of steps and direction
   */
  public static calculateTimeSteps(
    currentSimulationDate: Date,
    currentSimulationTime: number,
    targetDate: Date,
    stepSizeSeconds: number = 86400, // Default to 1 day steps
  ): {
    steps: number;
    direction: "forward" | "backward";
    totalTimeSeconds: number;
    stepSizeSeconds: number;
  } {
    // Calculate the current effective date (start date + elapsed time)
    const currentEffectiveDate = new Date(
      currentSimulationDate.getTime() + currentSimulationTime * 1000,
    );

    // Calculate the time difference in seconds
    const timeDifferenceSeconds =
      (targetDate.getTime() - currentEffectiveDate.getTime()) / 1000;

    // Determine direction - if target is in the future, go forward; if in the past, go backward
    const direction = timeDifferenceSeconds >= 0 ? "forward" : "backward";

    // Calculate number of steps needed
    const steps = Math.abs(Math.round(timeDifferenceSeconds / stepSizeSeconds));

    console.log(`[TimeStepCalculator] Time jump calculation:`, {
      currentEffectiveDate: currentEffectiveDate.toISOString(),
      targetDate: targetDate.toISOString(),
      timeDifferenceSeconds,
      direction,
      steps,
      stepSizeSeconds,
    });

    return {
      steps,
      direction,
      totalTimeSeconds: timeDifferenceSeconds,
      stepSizeSeconds,
    };
  }

  /**
   * Determines an appropriate step size based on the time difference.
   * Uses larger steps for larger time jumps to improve performance.
   */
  public static getOptimalStepSize(timeDifferenceSeconds: number): number {
    const absDifference = Math.abs(timeDifferenceSeconds);

    // More than 100 years: 1 year steps
    if (absDifference > 100 * 365.25 * 24 * 3600) {
      return 365.25 * 24 * 3600; // 1 year
    }

    // More than 10 years: 1 month steps
    if (absDifference > 10 * 365.25 * 24 * 3600) {
      return 30.44 * 24 * 3600; // ~1 month
    }

    // More than 1 year: 1 week steps
    if (absDifference > 365.25 * 24 * 3600) {
      return 7 * 24 * 3600; // 1 week
    }

    // More than 1 month: 1 day steps
    if (absDifference > 30 * 24 * 3600) {
      return 24 * 3600; // 1 day
    }

    // More than 1 day: 1 hour steps
    if (absDifference > 24 * 3600) {
      return 3600; // 1 hour
    }

    // Less than 1 day: 1 minute steps
    return 60; // 1 minute
  }

  /**
   * Validates that a date change is reasonable (not too far in the past/future)
   */
  public static validateDateChange(
    currentDate: Date,
    targetDate: Date,
    maxYears: number = 1000,
  ): { isValid: boolean; reason?: string } {
    const timeDifferenceMs = Math.abs(
      targetDate.getTime() - currentDate.getTime(),
    );
    const yearMs = 365.25 * 24 * 3600 * 1000;
    const yearsdifference = timeDifferenceMs / yearMs;

    if (yearsdifference > maxYears) {
      return {
        isValid: false,
        reason: `Date change too large: ${Math.round(yearsdifference)} years (max: ${maxYears} years)`,
      };
    }

    // Check if date is too far in the past (before year 1900)
    if (targetDate.getFullYear() < 1900) {
      return {
        isValid: false,
        reason: "Date cannot be before year 1900",
      };
    }

    // Check if date is too far in the future (after year 3000)
    if (targetDate.getFullYear() > 3000) {
      return {
        isValid: false,
        reason: "Date cannot be after year 3000",
      };
    }

    return { isValid: true };
  }
}
