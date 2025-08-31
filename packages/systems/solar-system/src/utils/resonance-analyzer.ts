import { 
  ResonanceIntegrator, 
  NEPTUNE_RESONANCES,
  type ResonanceConfig,
  LibrationMode 
} from "@teskooano/core-physics";
import { type OrbitalElements } from "@teskooano/core-physics";
import { celestialManager } from "@teskooano/core-state";

/**
 * Resonance analysis tool for studying TNO dynamics
 * Based on findings from the LiDO paper and other resonance studies
 */
export class ResonanceAnalyzer {
  private integrator: ResonanceIntegrator;

  constructor() {
    this.integrator = new ResonanceIntegrator({
      enableResonanceDetection: true,
      resonanceTolerance: 0.05, // Stricter tolerance for analysis
      librationDetectionWindow: 500, // Shorter window for faster analysis
      timeStep: 0.1, // Smaller time step for higher precision
    });
  }

  /**
   * Analyze a TNO's resonance with Neptune
   */
  public analyzeTNOResonance(
    tnoId: string,
    integrationTime: number = 10000 // years
  ): {
    tnoId: string;
    resonanceAnalysis: Array<{
      resonanceType: string;
      config: ResonanceConfig;
      analysis: {
        isResonant: boolean;
        librationMode: LibrationMode | null;
        stabilityScore: number;
        timeInResonance: number;
        librationAmplitude: number;
        averageStabilityScore: number;
        modeChanges: Array<{
          time: number;
          fromMode: LibrationMode | null;
          toMode: LibrationMode;
        }>;
      };
    }>;
    summary: {
      mostStableResonance: string | null;
      totalTimeInResonance: number;
      averageStabilityScore: number;
      librationModeDistribution: Record<LibrationMode, number>;
    };
  } {
    const tno = celestialManager.getObject(tnoId);
    const neptune = celestialManager.getObject("neptune");
    
    if (!tno || !neptune) {
      throw new Error(`Could not find TNO (${tnoId}) or Neptune`);
    }

    const tnoElements = tno.orbit;
    const neptuneElements = neptune.orbit;
    
    const resonanceAnalysis: Array<{
      resonanceType: string;
      config: ResonanceConfig;
      analysis: any;
    }> = [];

    // Analyze each known Neptune resonance
    for (const [resonanceType, config] of Object.entries(NEPTUNE_RESONANCES)) {
      const integrationResult = this.integrator.integrateWithResonance(
        tnoElements,
        neptuneElements,
        config,
        integrationTime * 365.25 * 24 * 3600 // Convert to seconds
      );

      const evolutionAnalysis = this.integrator.analyzeResonanceEvolution(
        integrationResult.evolutionHistory
      );

      resonanceAnalysis.push({
        resonanceType,
        config,
        analysis: {
          isResonant: integrationResult.resonanceState.isResonant,
          librationMode: integrationResult.resonanceState.librationMode,
          stabilityScore: integrationResult.resonanceState.stabilityScore,
          timeInResonance: integrationResult.resonanceState.timeInResonance,
          librationAmplitude: integrationResult.resonanceState.librationAmplitude,
          averageStabilityScore: evolutionAnalysis.averageStabilityScore,
          modeChanges: evolutionAnalysis.librationModeChanges,
        },
      });
    }

    // Generate summary
    const summary = this.generateResonanceSummary(resonanceAnalysis);

    return {
      tnoId,
      resonanceAnalysis,
      summary,
    };
  }

  /**
   * Analyze LiDO object specifically
   */
  public analyzeLiDOObject(): {
    lidoAnalysis: any;
    comparisonWithOtherTNOs: any;
    novelLibrationMode: {
      description: string;
      significance: string;
      implications: string[];
    };
  } {
    const lidoAnalysis = this.analyzeTNOResonance("lido-2020-vn40");
    
    // Compare with other known resonant TNOs
    const comparisonWithOtherTNOs = this.compareWithKnownResonators();
    
    // Analysis of the novel libration mode
    const novelLibrationMode = {
      description: "Libration around 0° instead of the typical 90°, 180°, 270° centers",
      significance: "First confirmed case of this libration mode in Neptune's external resonances",
      implications: [
        "High-inclination objects in n:1 resonances can exhibit different libration behavior",
        "The resonant interaction becomes strongly dependent on argument of pericenter (ω)",
        "Resonant islands shift as ω precesses, switching libration centers",
        "This affects the on-sky distribution of resonant TNOs",
        "Survey strategies may need to account for this novel libration mode",
      ],
    };

    return {
      lidoAnalysis,
      comparisonWithOtherTNOs,
      novelLibrationMode,
    };
  }

  /**
   * Compare LiDO with other known resonant TNOs
   */
  private compareWithKnownResonators(): {
    comparison: Array<{
      tnoId: string;
      resonanceType: string;
      inclination: number;
      eccentricity: number;
      librationMode: LibrationMode | null;
      stabilityScore: number;
    }>;
    patterns: {
      highInclinationObjects: string[];
      novelLibrationModes: string[];
      mostStableResonators: string[];
    };
  } {
    const knownResonators = [
      "lido-2020-vn40", // 10:1
      // Add other known resonant TNOs as they're implemented
    ];

    const comparison: Array<{
      tnoId: string;
      resonanceType: string;
      inclination: number;
      eccentricity: number;
      librationMode: LibrationMode | null;
      stabilityScore: number;
    }> = [];

    const patterns = {
      highInclinationObjects: [] as string[],
      novelLibrationModes: [] as string[],
      mostStableResonators: [] as string[],
    };

    for (const tnoId of knownResonators) {
      const tno = celestialManager.getObject(tnoId);
      if (!tno) continue;

      const analysis = this.analyzeTNOResonance(tnoId);
      const bestResonance = analysis.resonanceAnalysis.find(r => r.analysis.isResonant);
      
      if (bestResonance) {
        comparison.push({
          tnoId,
          resonanceType: bestResonance.resonanceType,
          inclination: tno.orbit.inclinationDeg,
          eccentricity: tno.orbit.eccentricity,
          librationMode: bestResonance.analysis.librationMode,
          stabilityScore: bestResonance.analysis.stabilityScore,
        });

        // Categorize patterns
        if (tno.orbit.inclinationDeg > 20) {
          patterns.highInclinationObjects.push(tnoId);
        }
        
        if (bestResonance.analysis.librationMode === LibrationMode.ZERO_CENTER) {
          patterns.novelLibrationModes.push(tnoId);
        }
        
        if (bestResonance.analysis.stabilityScore > 0.7) {
          patterns.mostStableResonators.push(tnoId);
        }
      }
    }

    return { comparison, patterns };
  }

  /**
   * Generate summary statistics for resonance analysis
   */
  private generateResonanceSummary(resonanceAnalysis: Array<{
    resonanceType: string;
    config: ResonanceConfig;
    analysis: any;
  }>): {
    mostStableResonance: string | null;
    totalTimeInResonance: number;
    averageStabilityScore: number;
    librationModeDistribution: Record<LibrationMode, number>;
  } {
    let mostStableResonance: string | null = null;
    let maxStabilityScore = 0;
    let totalTimeInResonance = 0;
    let totalStabilityScore = 0;
    let stabilityCount = 0;
    const librationModeDistribution: Record<LibrationMode, number> = {
      [LibrationMode.SYMMETRIC]: 0,
      [LibrationMode.ASYMMETRIC_LEADING]: 0,
      [LibrationMode.ASYMMETRIC_TRAILING]: 0,
      [LibrationMode.ZERO_CENTER]: 0,
    };

    for (const resonance of resonanceAnalysis) {
      if (resonance.analysis.isResonant) {
        totalTimeInResonance += resonance.analysis.timeInResonance;
        totalStabilityScore += resonance.analysis.stabilityScore;
        stabilityCount++;

        if (resonance.analysis.stabilityScore > maxStabilityScore) {
          maxStabilityScore = resonance.analysis.stabilityScore;
          mostStableResonance = resonance.resonanceType;
        }

        if (resonance.analysis.librationMode) {
          librationModeDistribution[resonance.analysis.librationMode]++;
        }
      }
    }

    return {
      mostStableResonance,
      totalTimeInResonance,
      averageStabilityScore: stabilityCount > 0 ? totalStabilityScore / stabilityCount : 0,
      librationModeDistribution,
    };
  }

  /**
   * Generate a report on resonance dynamics
   */
  public generateResonanceReport(): {
    title: string;
    summary: string;
    keyFindings: string[];
    implications: string[];
    recommendations: string[];
  } {
    const lidoAnalysis = this.analyzeLiDOObject();
    
    return {
      title: "Resonance Dynamics Analysis: LiDO Discovery and Implications",
      summary: "Analysis of 2020 VN40 (LiDO) reveals novel libration behavior in Neptune's 10:1 resonance, providing insights into the dynamics of high-inclination resonant TNOs.",
      keyFindings: [
        "2020 VN40 exhibits libration around 0°, a previously unknown mode for Neptune's external resonances",
        "High-inclination objects in n:1 resonances show different libration behavior than low-inclination objects",
        "The resonant interaction becomes strongly dependent on the argument of pericenter (ω)",
        "Resonant islands shift as ω precesses, creating new libration centers",
        "This affects the on-sky distribution and detectability of resonant TNOs",
      ],
      implications: [
        "Survey strategies for distant resonators need to account for novel libration modes",
        "High-inclination resonant TNOs may be more common than previously thought",
        "The 10:1 resonance population is likely larger than current detections suggest",
        "Resonance sticking efficiency may be higher for high-inclination objects",
        "Long-term stability predictions need to account for libration mode changes",
      ],
      recommendations: [
        "Implement enhanced resonance detection algorithms that can identify novel libration modes",
        "Develop survey strategies specifically targeting high-inclination resonant TNOs",
        "Improve n-body integration to handle complex resonance dynamics",
        "Add resonance analysis tools to the planetary physics engine",
        "Create visualization tools for libration mode evolution",
      ],
    };
  }
}