/**
 * Manages time tracking and calculations for celestial renderers.
 * Provides utilities for time-based animations, delta time calculations, and simulation time management.
 */
export class TimeManager {
  /**
   * The timestamp when the manager was instantiated, used to calculate elapsed time.
   */
  private startTime: number = Date.now() / 1000;

  /**
   * The current elapsed time since the manager was instantiated.
   */
  private elapsedTime: number = 0;

  /**
   * The last recorded simulation time, used for delta time calculations.
   */
  private lastSimulationTime: number = 0;

  /**
   * Creates a new TimeManager with optional start time.
   * @param startTime Optional custom start time in seconds. If not provided, uses current time.
   */
  constructor(startTime?: number) {
    if (startTime !== undefined) {
      this.startTime = startTime;
    }
  }

  /**
   * Updates the elapsed time based on the current simulation time.
   * @param simulationTime The current simulation time.
   * @param timeScale The time scale factor.
   */
  public update(simulationTime: number, timeScale: number = 1): void {
    this.elapsedTime = (simulationTime - this.startTime) * timeScale;
    this.lastSimulationTime = simulationTime;
  }

  /**
   * Gets the current elapsed time since the manager was created.
   * @returns The elapsed time in seconds.
   */
  public getElapsedTime(): number {
    return this.elapsedTime;
  }

  /**
   * Gets the start time of the manager.
   * @returns The start time in seconds.
   */
  public getStartTime(): number {
    return this.startTime;
  }

  /**
   * Calculates the delta time since the last update.
   * @param currentSimulationTime The current simulation time.
   * @param timeScale The time scale factor.
   * @returns The delta time in seconds.
   */
  public getDeltaTime(
    currentSimulationTime: number,
    timeScale: number = 1,
  ): number {
    const deltaTime =
      (currentSimulationTime - this.lastSimulationTime) * timeScale;
    return deltaTime;
  }

  /**
   * Gets the last recorded simulation time.
   * @returns The last simulation time in seconds.
   */
  public getLastSimulationTime(): number {
    return this.lastSimulationTime;
  }

  /**
   * Resets the time manager to a new start time.
   * @param newStartTime Optional new start time. If not provided, uses current time.
   */
  public reset(newStartTime?: number): void {
    this.startTime =
      newStartTime !== undefined ? newStartTime : Date.now() / 1000;
    this.elapsedTime = 0;
    this.lastSimulationTime = 0;
  }

  /**
   * Creates a normalized time value for animations.
   * This oscillates between 0 and 1 based on the given period.
   * @param period The period of the oscillation in seconds.
   * @param offset Optional phase offset.
   * @returns A value between 0 and 1.
   */
  public getNormalizedTime(period: number, offset: number = 0): number {
    const phase = (this.elapsedTime + offset) / period;
    return (Math.sin(phase * 2 * Math.PI) + 1) / 2;
  }

  /**
   * Creates a sawtooth wave time value for animations.
   * This increases linearly from 0 to 1 over the given period, then resets.
   * @param period The period of the sawtooth wave in seconds.
   * @param offset Optional phase offset.
   * @returns A value between 0 and 1.
   */
  public getSawtoothTime(period: number, offset: number = 0): number {
    const phase = (this.elapsedTime + offset) % period;
    return phase / period;
  }

  /**
   * Creates a triangle wave time value for animations.
   * This increases from 0 to 1, then decreases back to 0 over the given period.
   * @param period The period of the triangle wave in seconds.
   * @param offset Optional phase offset.
   * @returns A value between 0 and 1.
   */
  public getTriangleTime(period: number, offset: number = 0): number {
    const sawtooth = this.getSawtoothTime(period, offset);
    return sawtooth <= 0.5 ? sawtooth * 2 : 2 - sawtooth * 2;
  }

  /**
   * Creates a smooth step time value for animations.
   * Uses smoothstep interpolation for smooth acceleration and deceleration.
   * @param period The period of the smooth step in seconds.
   * @param offset Optional phase offset.
   * @returns A smoothly interpolated value between 0 and 1.
   */
  public getSmoothStepTime(period: number, offset: number = 0): number {
    const linear = this.getSawtoothTime(period, offset);
    return linear * linear * (3 - 2 * linear);
  }

  /**
   * Checks if a certain amount of time has passed since the last check.
   * Useful for triggering periodic events.
   * @param interval The interval to check in seconds.
   * @returns True if the interval has passed.
   */
  public hasIntervalPassed(interval: number): boolean {
    return (
      this.elapsedTime % interval <
      (this.elapsedTime - this.getDeltaTime(Date.now() / 1000)) % interval
    );
  }

  /**
   * Gets the current real-world time in seconds.
   * @returns The current timestamp in seconds.
   */
  public static getCurrentTime(): number {
    return Date.now() / 1000;
  }

  /**
   * Converts milliseconds to seconds.
   * @param milliseconds The time in milliseconds.
   * @returns The time in seconds.
   */
  public static millisecondsToSeconds(milliseconds: number): number {
    return milliseconds / 1000;
  }

  /**
   * Converts seconds to milliseconds.
   * @param seconds The time in seconds.
   * @returns The time in milliseconds.
   */
  public static secondsToMilliseconds(seconds: number): number {
    return seconds * 1000;
  }
}
