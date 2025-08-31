import type { OrbitalParameters } from "@teskooano/data-types";
import { 
  calculateResonantAngle, 
  determineLibrationMode, 
  type ResonanceConfig,
  LibrationMode 
} from "./resonance";

/**
 * Enhanced n-body integrator with resonance detection and modeling
 * Based on findings from the LiDO paper about 10:1 resonance dynamics
 */
export interface ResonanceState {
  isResonant: boolean;
  resonanceConfig: ResonanceConfig | null;
  librationMode: LibrationMode | null;
  librationAmplitude: number;
  resonantAngle: number;
  stabilityScore: number;
  timeInResonance: number;
}

/**
 * Configuration for resonance-aware integration
 */
export interface ResonanceIntegrationConfig {
  enableResonanceDetection: boolean;
  resonanceTolerance: number;
  librationDetectionWindow: number;
  stabilityThreshold: number;
  maxIntegrationSteps: number;
  timeStep: number;
}

/**
 * Default configuration for resonance integration
 */
export const DEFAULT_RESONANCE_CONFIG: ResonanceIntegrationConfig = {
  enableResonanceDetection: true,
  resonanceTolerance: 0.1,
  librationDetectionWindow: 1000, // orbital periods
  stabilityThreshold: 0.5,
  maxIntegrationSteps: 10000,
  timeStep: 0.5, // years
};

/**
 * Resonance-aware n-body integrator
 * Handles complex resonance dynamics including novel libration modes
 */
export class ResonanceIntegrator {
  private config: ResonanceIntegrationConfig;
  private resonanceHistory: Map<string, ResonanceState[]> = new Map();

  constructor(config: Partial<ResonanceIntegrationConfig> = {}) {
    this.config = { ...DEFAULT_RESONANCE_CONFIG, ...config };
  }

  /**
   * Integrate orbital evolution with resonance detection
   */
  public integrateWithResonance(
    tnoElements: OrbitalParameters,
    planetElements: OrbitalParameters,
    resonanceConfig: ResonanceConfig,
    integrationTime: number
  ): {
    finalElements: OrbitalParameters;
    resonanceState: ResonanceState;
    evolutionHistory: Array<{
      time: number;
      elements: OrbitalParameters;
      resonanceState: ResonanceState;
    }>;
  } {
    const evolutionHistory: Array<{
      time: number;
      elements: OrbitalParameters;
      resonanceState: ResonanceState;
    }> = [];

    let currentElements = { ...tnoElements };
    let timeInResonance = 0;
    const resonantAngles: number[] = [];

    // Integrate over the specified time period
    for (let step = 0; step < this.config.maxIntegrationSteps; step++) {
      const currentTime = step * this.config.timeStep * 365.25 * 24 * 3600; // Convert to seconds
      
      // Update orbital elements (simplified - in practice would use full n-body integration)
      currentElements = this.updateOrbitalElements(currentElements, currentTime);
      
      // Calculate resonant angle
      const resonantAngle = calculateResonantAngle(
        currentElements,
        planetElements,
        resonanceConfig.ratio
      );
      resonantAngles.push(resonantAngle);

      // Check if in resonance
      const isResonant = this.checkResonance(currentElements, planetElements, resonanceConfig);
      
      if (isResonant) {
        timeInResonance += this.config.timeStep;
      }

      // Determine libration mode if we have enough data
      let librationMode: LibrationMode | null = null;
      let librationAmplitude = 0;
      
      if (resonantAngles.length >= this.config.librationDetectionWindow) {
        const recentAngles = resonantAngles.slice(-this.config.librationDetectionWindow);
        librationMode = determineLibrationMode(recentAngles);
        librationAmplitude = Math.max(...recentAngles) - Math.min(...recentAngles);
      }

      // Calculate stability score
      const stabilityScore = this.calculateStabilityScore(
        currentElements,
        librationAmplitude,
        timeInResonance
      );

      const resonanceState: ResonanceState = {
        isResonant,
        resonanceConfig: isResonant ? resonanceConfig : null,
        librationMode,
        librationAmplitude,
        resonantAngle,
        stabilityScore,
        timeInResonance,
      };

      evolutionHistory.push({
        time: currentTime,
        elements: currentElements,
        resonanceState,
      });

      // Stop if we've reached the integration time
      if (currentTime >= integrationTime) {
        break;
      }
    }

    const finalResonanceState = evolutionHistory[evolutionHistory.length - 1]?.resonanceState || {
      isResonant: false,
      resonanceConfig: null,
      librationMode: null,
      librationAmplitude: 0,
      resonantAngle: 0,
      stabilityScore: 0,
      timeInResonance: 0,
    };

    return {
      finalElements: currentElements,
      resonanceState: finalResonanceState,
      evolutionHistory,
    };
  }

  /**
   * Check if an object is currently in resonance
   */
  private checkResonance(
    tnoElements: OrbitalParameters,
    planetElements: OrbitalParameters,
    resonanceConfig: ResonanceConfig
  ): boolean {
    const tnoPeriod = tnoElements.period_s;
    const planetPeriod = planetElements.period_s;
    const expectedRatio = resonanceConfig.ratio.p / resonanceConfig.ratio.q;
    const actualRatio = planetPeriod / tnoPeriod;
    
    const periodMatch = Math.abs(actualRatio - expectedRatio) < this.config.resonanceTolerance;
    
    // Also check if semi-major axis is within resonance width
    // Compute current semi-major axis in AU from realSemiMajorAxis_m (1 AU = 149,597,870,700 m)
    const AU = 149_597_870_700;
    const smaAU = tnoElements.realSemiMajorAxis_m / AU;
    const axisMatch = Math.abs(smaAU - resonanceConfig.semiMajorAxisCenter) < resonanceConfig.width;
    
    return periodMatch && axisMatch;
  }

  /**
   * Calculate stability score based on LiDO paper findings
   */
  private calculateStabilityScore(
    elements: OrbitalParameters,
    librationAmplitude: number,
    timeInResonance: number
  ): number {
    // Factors that contribute to stability:
    // 1. Low eccentricity (more stable)
    const eccentricityScore = Math.max(0, 1 - elements.eccentricity);
    
    // 2. Low inclination (more stable, but high inclination can be stable in some cases)
    const inclinationScore = Math.max(
      0,
      1 - ((elements.inclination * 180) / Math.PI / 45),
    );
    
    // 3. Small libration amplitude (more stable)
    const librationScore = Math.max(0, 1 - (librationAmplitude / 360));
    
    // 4. Time spent in resonance (longer time = more stable)
    const timeScore = Math.min(1, timeInResonance / 1000); // Normalize to 1000 years
    
    // Weighted combination
    const stabilityScore = (
      0.3 * eccentricityScore +
      0.2 * inclinationScore +
      0.3 * librationScore +
      0.2 * timeScore
    );
    
    return Math.max(0, Math.min(1, stabilityScore));
  }

  /**
   * Simplified orbital element update (in practice would use full n-body integration)
   */
  private updateOrbitalElements(
    elements: OrbitalParameters,
    timeOffset: number,
  ): OrbitalParameters {
    // This is a simplified update - in practice would use full n-body integration
    // with perturbations from all major planets
    
    const updatedElements = { ...elements };
    
    // Update mean anomaly based on time
    const meanMotion = (2 * Math.PI) / elements.period_s;
    const deltaM = meanMotion * timeOffset;
    updatedElements.meanAnomaly = (elements.meanAnomaly + deltaM) % (2 * Math.PI);
    
    // Add small perturbations to simulate n-body effects
    // These would be calculated from actual gravitational interactions
    const perturbationScale = 1e-6;
    updatedElements.semiMajorAxisAU += (Math.random() - 0.5) * perturbationScale;
    updatedElements.eccentricity += (Math.random() - 0.5) * perturbationScale * 0.1;
    
    return updatedElements;
  }

  /**
   * Analyze resonance evolution over time
   */
  public analyzeResonanceEvolution(
    evolutionHistory: Array<{
      time: number;
      elements: OrbitalElements;
      resonanceState: ResonanceState;
    }>
  ): {
    totalTimeInResonance: number;
    librationModeChanges: Array<{
      time: number;
      fromMode: LibrationMode | null;
      toMode: LibrationMode;
    }>;
    stabilityEvolution: Array<{
      time: number;
      stabilityScore: number;
    }>;
    averageStabilityScore: number;
  } {
    let totalTimeInResonance = 0;
    const librationModeChanges: Array<{
      time: number;
      fromMode: LibrationMode | null;
      toMode: LibrationMode;
    }> = [];
    const stabilityEvolution: Array<{
      time: number;
      stabilityScore: number;
    }> = [];
    
    let previousLibrationMode: LibrationMode | null = null;
    
    for (const entry of evolutionHistory) {
      if (entry.resonanceState.isResonant) {
        totalTimeInResonance += this.config.timeStep;
      }
      
      if (entry.resonanceState.librationMode && 
          entry.resonanceState.librationMode !== previousLibrationMode) {
        librationModeChanges.push({
          time: entry.time,
          fromMode: previousLibrationMode,
          toMode: entry.resonanceState.librationMode,
        });
        previousLibrationMode = entry.resonanceState.librationMode;
      }
      
      stabilityEvolution.push({
        time: entry.time,
        stabilityScore: entry.resonanceState.stabilityScore,
      });
    }
    
    const averageStabilityScore = stabilityEvolution.length > 0 
      ? stabilityEvolution.reduce((sum, entry) => sum + entry.stabilityScore, 0) / stabilityEvolution.length
      : 0;
    
    return {
      totalTimeInResonance,
      librationModeChanges,
      stabilityEvolution,
      averageStabilityScore,
    };
  }
}