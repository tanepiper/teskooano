import type {
  PhysicsStateReal,
  OrbitalParameters,
  StabilityReport,
  HybridCorrectionConfig,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { calculateKeplerianStateAtTime } from "./ideal";

/**
 * Analyzes orbital stability and determines when Kepler corrections are needed
 */
export class OrbitalStabilityAnalyzer {
  /**
   * Analyzes the stability of a body's orbit
   */
  analyzeStability(
    body: PhysicsStateReal,
    orbitalParams: OrbitalParameters,
    parent: PhysicsStateReal,
    currentTime: number,
    correctionConfig: HybridCorrectionConfig
  ): StabilityReport {
    // 1. Calculate expected Keplerian position and velocity
    const expectedState = calculateKeplerianStateAtTime(
      orbitalParams,
      currentTime,
      parent.mass_kg
    );

    // 2. Calculate relative positions (body relative to parent)
    const actualRelativePos = body.position_m.clone().sub(parent.position_m);
    const actualRelativeVel = body.velocity_mps.clone().sub(parent.velocity_mps);

    // 3. Calculate errors
    const positionError = this.calculatePositionError(actualRelativePos, expectedState.position);
    const velocityError = this.calculateVelocityError(actualRelativeVel, expectedState.velocity);

    // 4. Determine if correction is needed
    const needsCorrection = this.evaluateCorrectionNeed(
      positionError,
      velocityError,
      correctionConfig.threshold
    );

    // 5. Calculate correction magnitude
    const correctionMagnitude = this.calculateCorrectionMagnitude(
      positionError,
      velocityError,
      correctionConfig
    );

    // 6. Determine recommended action
    const recommendedAction = this.getRecommendedAction(
      positionError,
      velocityError,
      correctionConfig
    );

    // 7. Calculate confidence level
    const confidence = this.calculateConfidence(
      positionError,
      velocityError,
      orbitalParams
    );

    return {
      isStable: !needsCorrection,
      positionError,
      velocityError,
      correctionMagnitude,
      recommendedAction,
      confidence,
    };
  }

  /**
   * Calculates position error magnitude
   */
  private calculatePositionError(
    actualPos: OSVector3,
    expectedPos: OSVector3
  ): number {
    const errorVector = actualPos.clone().sub(expectedPos);
    return errorVector.length();
  }

  /**
   * Calculates velocity error magnitude
   */
  private calculateVelocityError(
    actualVel: OSVector3,
    expectedVel: OSVector3
  ): number {
    const errorVector = actualVel.clone().sub(expectedVel);
    return errorVector.length();
  }

  /**
   * Evaluates whether a correction is needed based on error thresholds
   */
  private evaluateCorrectionNeed(
    positionError: number,
    velocityError: number,
    threshold: number
  ): boolean {
    // Convert absolute errors to relative errors
    // For position, we'll use a relative threshold based on orbital size
    // For velocity, we'll use a relative threshold based on orbital velocity
    
    // Simple threshold check - can be enhanced with more sophisticated logic
    const positionThreshold = threshold * 1e9; // 1% of 1 million km
    const velocityThreshold = threshold * 1000; // 1% of 1 km/s
    
    return positionError > positionThreshold || velocityError > velocityThreshold;
  }

  /**
   * Calculates the magnitude of correction needed
   */
  private calculateCorrectionMagnitude(
    positionError: number,
    velocityError: number,
    config: HybridCorrectionConfig
  ): number {
    // Normalize errors to a 0-1 scale
    const normalizedPositionError = Math.min(positionError / 1e9, 1.0);
    const normalizedVelocityError = Math.min(velocityError / 1000, 1.0);
    
    // Weight position and velocity errors
    const weightedError = normalizedPositionError * 0.7 + normalizedVelocityError * 0.3;
    
    // Apply maximum correction limit
    return Math.min(weightedError, config.maxCorrectionMagnitude);
  }

  /**
   * Determines the recommended correction action
   */
  private getRecommendedAction(
    positionError: number,
    velocityError: number,
    config: HybridCorrectionConfig
  ): "none" | "position" | "velocity" | "both" {
    if (positionError === 0 && velocityError === 0) {
      return "none";
    }

    const positionThreshold = config.threshold * 1e9;
    const velocityThreshold = config.threshold * 1000;

    const needsPosition = positionError > positionThreshold;
    const needsVelocity = velocityError > velocityThreshold;

    if (needsPosition && needsVelocity) {
      return "both";
    } else if (needsPosition) {
      return "position";
    } else if (needsVelocity) {
      return "velocity";
    }

    return "none";
  }

  /**
   * Calculates confidence level in the stability analysis
   */
  private calculateConfidence(
    positionError: number,
    velocityError: number,
    orbitalParams: OrbitalParameters
  ): number {
    // Base confidence starts at 1.0
    let confidence = 1.0;

    // Reduce confidence for very small orbits (where numerical errors matter more)
    if (orbitalParams.realSemiMajorAxis_m < 1e6) { // Less than 1000 km
      confidence *= 0.8;
    }

    // Reduce confidence for highly eccentric orbits
    if (orbitalParams.eccentricity > 0.8) {
      confidence *= 0.9;
    }

    // Reduce confidence for very large errors (indicating potential analysis issues)
    if (positionError > 1e12 || velocityError > 1e6) {
      confidence *= 0.5;
    }

    return Math.max(0.1, confidence);
  }

  /**
   * Analyzes stability trends over multiple time steps
   */
  analyzeStabilityTrend(
    stabilityHistory: StabilityReport[],
    windowSize: number = 10
  ): {
    trend: "improving" | "stable" | "degrading";
    rate: number;
    prediction: number;
  } {
    if (stabilityHistory.length < windowSize) {
      return {
        trend: "stable",
        rate: 0,
        prediction: 1.0,
      };
    }

    // Get recent stability reports
    const recentReports = stabilityHistory.slice(-windowSize);
    
    // Calculate trend
    const firstHalf = recentReports.slice(0, Math.floor(windowSize / 2));
    const secondHalf = recentReports.slice(Math.floor(windowSize / 2));
    
    const firstHalfAvg = firstHalf.reduce((sum, r) => sum + r.confidence, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, r) => sum + r.confidence, 0) / secondHalf.length;
    
    const rate = secondHalfAvg - firstHalfAvg;
    
    let trend: "improving" | "stable" | "degrading";
    if (Math.abs(rate) < 0.01) {
      trend = "stable";
    } else if (rate > 0) {
      trend = "improving";
    } else {
      trend = "degrading";
    }

    // Predict future stability
    const prediction = Math.max(0, Math.min(1, secondHalfAvg + rate * 2));

    return { trend, rate, prediction };
  }
}