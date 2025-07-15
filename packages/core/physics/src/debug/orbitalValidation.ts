import { OSVector3 } from "@teskooano/core-math";
import { GRAVITATIONAL_CONSTANT as G } from "../units/constants";

/**
 * Debug utility to test orbital conservation laws.
 * Validates that our physics engine maintains the mathematical properties
 * proven in the eccentricity vector conservation proof.
 */
export class OrbitalValidationDebugger {
  private testResults: Array<{
    testName: string;
    isValid: boolean;
    details: any;
    timestamp: number;
  }> = [];

  /**
   * Tests the energy-eccentricity relation: e² = 2HL² + 1
   *
   * @param position_m Position vector relative to central body (m)
   * @param velocity_mps Velocity vector relative to central body (m/s)
   * @param parentMass_kg Mass of the central body (kg)
   * @param tolerance Relative tolerance for validation (default: 1e-6)
   * @returns Validation result
   */
  testEnergyEccentricityRelation(
    position_m: OSVector3,
    velocity_mps: OSVector3,
    parentMass_kg: number,
    tolerance: number = 1e-6,
  ): {
    isValid: boolean;
    expectedEccentricitySquared: number;
    actualEccentricitySquared: number;
    relativeError: number;
    energy: number;
    angularMomentumSquared: number;
  } {
    const mu = G * parentMass_kg;

    // Calculate energy per unit mass: H = v²/2 - μ/r
    const velocitySquared = velocity_mps.lengthSq();
    const positionMagnitude = position_m.length();
    const energy = velocitySquared / 2 - mu / positionMagnitude;

    // Calculate angular momentum: L = r × v
    const angularMomentum = new OSVector3();
    angularMomentum.copy(position_m).cross(velocity_mps);
    const angularMomentumSquared = angularMomentum.lengthSq();

    // Calculate eccentricity vector: e = (v × L) / μ - r/|r|
    const term1 = new OSVector3();
    term1
      .copy(velocity_mps)
      .cross(angularMomentum)
      .multiplyScalar(1 / mu);

    const term2 = new OSVector3();
    term2.copy(position_m).multiplyScalar(1 / positionMagnitude);

    const eccentricityVector = new OSVector3();
    eccentricityVector.copy(term1).sub(term2);
    const actualEccentricitySquared = eccentricityVector.lengthSq();

    // Expected eccentricity squared from energy relation: e² = 2HL² + 1
    const expectedEccentricitySquared = 2 * energy * angularMomentumSquared + 1;

    const relativeError =
      Math.abs(actualEccentricitySquared - expectedEccentricitySquared) /
      Math.abs(expectedEccentricitySquared);
    const isValid = relativeError <= tolerance;

    return {
      isValid,
      expectedEccentricitySquared,
      actualEccentricitySquared,
      relativeError,
      energy,
      angularMomentumSquared,
    };
  }

  /**
   * Tests that the eccentricity vector is orthogonal to the angular momentum vector.
   *
   * @param position_m Position vector relative to central body (m)
   * @param velocity_mps Velocity vector relative to central body (m/s)
   * @param parentMass_kg Mass of the central body (kg)
   * @param tolerance Absolute tolerance for orthogonality check (default: 1e-12)
   * @returns Validation result
   */
  testEccentricityAngularMomentumOrthogonality(
    position_m: OSVector3,
    velocity_mps: OSVector3,
    parentMass_kg: number,
    tolerance: number = 1e-12,
  ): {
    isValid: boolean;
    dotProduct: number;
    eccentricityMagnitude: number;
    angularMomentumMagnitude: number;
  } {
    const mu = G * parentMass_kg;

    // Calculate angular momentum: L = r × v
    const angularMomentum = new OSVector3();
    angularMomentum.copy(position_m).cross(velocity_mps);
    const angularMomentumMagnitude = angularMomentum.length();

    // Calculate eccentricity vector: e = (v × L) / μ - r/|r|
    const term1 = new OSVector3();
    term1
      .copy(velocity_mps)
      .cross(angularMomentum)
      .multiplyScalar(1 / mu);

    const term2 = new OSVector3();
    term2.copy(position_m).multiplyScalar(1 / position_m.length());

    const eccentricityVector = new OSVector3();
    eccentricityVector.copy(term1).sub(term2);
    const eccentricityMagnitude = eccentricityVector.length();

    // Test orthogonality: e · L = 0
    const dotProduct = eccentricityVector.dot(angularMomentum);

    const result = {
      isValid: Math.abs(dotProduct) < tolerance,
      dotProduct,
      eccentricityMagnitude,
      angularMomentumMagnitude,
    };

    this.testResults.push({
      testName: "Eccentricity-Angular Momentum Orthogonality",
      isValid: result.isValid,
      details: result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Comprehensive test of all orbital conservation laws.
   *
   * @param position_m Position vector relative to central body (m)
   * @param velocity_mps Velocity vector relative to central body (m/s)
   * @param parentMass_kg Mass of the central body (kg)
   * @returns All validation results
   */
  testAllConservationLaws(
    position_m: OSVector3,
    velocity_mps: OSVector3,
    parentMass_kg: number,
  ): {
    energyEccentricityRelation: ReturnType<
      OrbitalValidationDebugger["testEnergyEccentricityRelation"]
    >;
    orthogonality: ReturnType<
      OrbitalValidationDebugger["testEccentricityAngularMomentumOrthogonality"]
    >;
    energy: number;
    angularMomentumMagnitude: number;
    eccentricityMagnitude: number;
    isAllValid: boolean;
  } {
    const energyEccentricityRelation = this.testEnergyEccentricityRelation(
      position_m,
      velocity_mps,
      parentMass_kg,
    );
    const orthogonality = this.testEccentricityAngularMomentumOrthogonality(
      position_m,
      velocity_mps,
      parentMass_kg,
    );

    const angularMomentum = new OSVector3();
    angularMomentum.copy(position_m).cross(velocity_mps);
    const angularMomentumMagnitude = angularMomentum.length();

    const mu = G * parentMass_kg;
    const term1 = new OSVector3();
    term1
      .copy(velocity_mps)
      .cross(angularMomentum)
      .multiplyScalar(1 / mu);

    const term2 = new OSVector3();
    term2.copy(position_m).multiplyScalar(1 / position_m.length());

    const eccentricityVector = new OSVector3();
    eccentricityVector.copy(term1).sub(term2);
    const eccentricityMagnitude = eccentricityVector.length();

    return {
      energyEccentricityRelation,
      orthogonality,
      energy: energyEccentricityRelation.energy,
      angularMomentumMagnitude,
      eccentricityMagnitude,
      isAllValid: energyEccentricityRelation.isValid && orthogonality.isValid,
    };
  }

  /**
   * Tests conservation over time by comparing initial and final states.
   *
   * @param initialState Initial position and velocity
   * @param finalState Final position and velocity
   * @param parentMass_kg Mass of the central body (kg)
   * @param tolerance Relative tolerance for conservation check (default: 1e-6)
   * @returns Conservation validation results
   */
  testConservationOverTime(
    initialState: { position: OSVector3; velocity: OSVector3 },
    finalState: { position: OSVector3; velocity: OSVector3 },
    parentMass_kg: number,
    tolerance: number = 1e-6,
  ): {
    energyConserved: boolean;
    angularMomentumConserved: boolean;
    eccentricityVectorConserved: boolean;
    energyChange: number;
    angularMomentumChange: number;
    eccentricityVectorChange: number;
  } {
    const mu = G * parentMass_kg;

    // Calculate initial values
    const initialEnergy =
      initialState.velocity.lengthSq() / 2 -
      mu / initialState.position.length();
    const initialAngularMomentum = new OSVector3();
    initialAngularMomentum
      .copy(initialState.position)
      .cross(initialState.velocity);
    const initialAngularMomentumMagnitude = initialAngularMomentum.length();

    const initialTerm1 = new OSVector3();
    initialTerm1
      .copy(initialState.velocity)
      .cross(initialAngularMomentum)
      .multiplyScalar(1 / mu);
    const initialTerm2 = new OSVector3();
    initialTerm2
      .copy(initialState.position)
      .multiplyScalar(1 / initialState.position.length());
    const initialEccentricityVector = new OSVector3();
    initialEccentricityVector.copy(initialTerm1).sub(initialTerm2);
    const initialEccentricityMagnitude = initialEccentricityVector.length();

    // Calculate final values
    const finalEnergy =
      finalState.velocity.lengthSq() / 2 - mu / finalState.position.length();
    const finalAngularMomentum = new OSVector3();
    finalAngularMomentum.copy(finalState.position).cross(finalState.velocity);
    const finalAngularMomentumMagnitude = finalAngularMomentum.length();

    const finalTerm1 = new OSVector3();
    finalTerm1
      .copy(finalState.velocity)
      .cross(finalAngularMomentum)
      .multiplyScalar(1 / mu);
    const finalTerm2 = new OSVector3();
    finalTerm2
      .copy(finalState.position)
      .multiplyScalar(1 / finalState.position.length());
    const finalEccentricityVector = new OSVector3();
    finalEccentricityVector.copy(finalTerm1).sub(finalTerm2);
    const finalEccentricityMagnitude = finalEccentricityVector.length();

    // Calculate changes
    const energyChange =
      Math.abs(finalEnergy - initialEnergy) /
      Math.max(Math.abs(initialEnergy), 1);
    const angularMomentumChange =
      Math.abs(
        finalAngularMomentumMagnitude - initialAngularMomentumMagnitude,
      ) / Math.max(initialAngularMomentumMagnitude, 1);
    const eccentricityVectorChange =
      Math.abs(finalEccentricityMagnitude - initialEccentricityMagnitude) /
      Math.max(initialEccentricityMagnitude, 1);

    const result = {
      energyConserved: energyChange < tolerance,
      angularMomentumConserved: angularMomentumChange < tolerance,
      eccentricityVectorConserved: eccentricityVectorChange < tolerance,
      energyChange,
      angularMomentumChange,
      eccentricityVectorChange,
    };

    this.testResults.push({
      testName: "Conservation Over Time",
      isValid:
        result.energyConserved &&
        result.angularMomentumConserved &&
        result.eccentricityVectorConserved,
      details: result,
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Gets all test results.
   */
  getTestResults(): Array<{
    testName: string;
    isValid: boolean;
    details: any;
    timestamp: number;
  }> {
    return [...this.testResults];
  }

  /**
   * Clears all test results.
   */
  clearTestResults(): void {
    this.testResults = [];
  }

  /**
   * Logs a summary of all test results to the console.
   */
  logTestSummary(): void {
    console.log("=== Orbital Conservation Law Test Summary ===");

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter((r) => r.isValid).length;
    const failedTests = totalTests - passedTests;

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests}`);
    console.log(`Failed: ${failedTests}`);
    console.log(
      `Success Rate: ${((passedTests / totalTests) * 100).toFixed(2)}%`,
    );

    if (failedTests > 0) {
      console.log("\nFailed Tests:");
      this.testResults
        .filter((r) => !r.isValid)
        .forEach((result) => {
          console.log(`- ${result.testName}:`, result.details);
        });
    }

    console.log("=============================================");
  }
}

/**
 * Global instance for easy access.
 */
export const orbitalValidationDebugger = new OrbitalValidationDebugger();
