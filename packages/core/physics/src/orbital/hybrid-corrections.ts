import type {
  PhysicsStateReal,
  OrbitalParameters,
  StabilityReport,
  CorrectionVector,
  HybridCorrectionConfig,
} from "@teskooano/data-types";
import { OSVector3 } from "@teskooano/core-math";
import { calculateKeplerianStateAtTime } from "./ideal";
import { sortBodiesByHierarchy } from "../utils";

/**
 * Applies Kepler corrections to stabilize orbits in hybrid mode
 */
export class HybridCorrectionEngine {
  /**
   * Applies corrections to stabilize orbits
   */
  applyCorrections(
    bodies: PhysicsStateReal[],
    orbitalParameters: Map<string, OrbitalParameters>,
    parentIds: Map<string, string>,
    correctionConfig: HybridCorrectionConfig,
    stabilityReports: Map<string, StabilityReport>
  ): PhysicsStateReal[] {
    // 1. Detect bodies needing correction
    const bodiesNeedingCorrection = this.detectUnstableBodies(
      stabilityReports,
      correctionConfig
    );

    if (bodiesNeedingCorrection.size === 0) {
      return bodies; // No corrections needed
    }

    // 2. Calculate correction vectors
    const corrections = this.calculateCorrections(
      bodies,
      orbitalParameters,
      parentIds,
      stabilityReports,
      bodiesNeedingCorrection,
      correctionConfig
    );

    // 3. Apply hierarchical corrections if enabled
    if (correctionConfig.hierarchicalCorrections) {
      return this.applyHierarchicalCorrections(
        bodies,
        corrections,
        parentIds,
        correctionConfig
      );
    } else {
      return this.applyDirectCorrections(bodies, corrections);
    }
  }

  /**
   * Detects which bodies need corrections
   */
  private detectUnstableBodies(
    stabilityReports: Map<string, StabilityReport>,
    config: HybridCorrectionConfig
  ): Set<string> {
    const unstableIds = new Set<string>();

    for (const [bodyId, report] of stabilityReports) {
      if (!report.isStable && report.correctionMagnitude > 0) {
        unstableIds.add(bodyId);
      }
    }

    return unstableIds;
  }

  /**
   * Calculates correction vectors for unstable bodies
   */
  private calculateCorrections(
    bodies: PhysicsStateReal[],
    orbitalParameters: Map<string, OrbitalParameters>,
    parentIds: Map<string, string>,
    stabilityReports: Map<string, StabilityReport>,
    unstableIds: Set<string>,
    config: HybridCorrectionConfig
  ): Map<string, CorrectionVector> {
    const corrections = new Map<string, CorrectionVector>();

    for (const bodyId of unstableIds) {
      const body = bodies.find(b => b.id === bodyId);
      const report = stabilityReports.get(bodyId);
      const orbitalParams = orbitalParameters.get(bodyId);
      const parentId = parentIds.get(bodyId);

      if (!body || !report || !orbitalParams || !parentId) {
        continue;
      }

      const parent = bodies.find(b => b.id === parentId);
      if (!parent) {
        continue;
      }

      // Calculate expected Keplerian state
      const expectedState = calculateKeplerianStateAtTime(
        orbitalParams,
        Date.now() / 1000, // Current time in seconds
        parent.mass_kg
      );

      // Calculate current relative state
      const currentRelativePos = body.position_m.clone().sub(parent.position_m);
      const currentRelativeVel = body.velocity_mps.clone().sub(parent.velocity_mps);

      // Calculate correction vectors
      const positionCorrection = expectedState.position.clone().sub(currentRelativePos);
      const velocityCorrection = expectedState.velocity.clone().sub(currentRelativeVel);

      // Apply correction magnitude scaling
      const scale = Math.min(report.correctionMagnitude, config.maxCorrectionMagnitude);
      positionCorrection.multiplyScalar(scale);
      velocityCorrection.multiplyScalar(scale);

      // Determine priority based on error magnitude and body hierarchy
      const priority = this.calculateCorrectionPriority(
        bodyId,
        parentIds,
        report.correctionMagnitude
      );

      corrections.set(bodyId, {
        positionCorrection,
        velocityCorrection,
        preservesMomentum: config.preserveMomentum,
        priority,
      });
    }

    return corrections;
  }

  /**
   * Applies corrections hierarchically (parent bodies first)
   */
  private applyHierarchicalCorrections(
    bodies: PhysicsStateReal[],
    corrections: Map<string, CorrectionVector>,
    parentIds: Map<string, string>,
    config: HybridCorrectionConfig
  ): PhysicsStateReal[] {
    const sortedBodies = sortBodiesByHierarchy(bodies, parentIds);
    const correctedBodies = [...bodies];
    const appliedCorrections = new Set<string>();

    // Apply corrections in hierarchical order
    for (const body of sortedBodies) {
      const correction = corrections.get(body.id);
      if (!correction || appliedCorrections.has(body.id)) {
        continue;
      }

      // Apply correction
      const correctedBody = this.applySingleCorrection(body, correction);
      correctedBodies[correctedBodies.findIndex(b => b.id === body.id)] = correctedBody;
      appliedCorrections.add(body.id);

      // Propagate corrections to child bodies if needed
      this.propagateCorrectionsToChildren(
        body.id,
        correctedBody,
        correctedBodies,
        parentIds,
        corrections,
        appliedCorrections
      );
    }

    // Apply momentum conservation if enabled
    if (config.preserveMomentum) {
      return this.conserveMomentum(correctedBodies, corrections);
    }

    return correctedBodies;
  }

  /**
   * Applies corrections directly without hierarchy
   */
  private applyDirectCorrections(
    bodies: PhysicsStateReal[],
    corrections: Map<string, CorrectionVector>
  ): PhysicsStateReal[] {
    const correctedBodies = [...bodies];

    for (const [bodyId, correction] of corrections) {
      const bodyIndex = correctedBodies.findIndex(b => b.id === bodyId);
      if (bodyIndex !== -1) {
        correctedBodies[bodyIndex] = this.applySingleCorrection(
          correctedBodies[bodyIndex],
          correction
        );
      }
    }

    return correctedBodies;
  }

  /**
   * Applies a single correction to a body
   */
  private applySingleCorrection(
    body: PhysicsStateReal,
    correction: CorrectionVector
  ): PhysicsStateReal {
    const newPosition = body.position_m.clone().add(correction.positionCorrection);
    const newVelocity = body.velocity_mps.clone().add(correction.velocityCorrection);

    return {
      ...body,
      position_m: newPosition,
      velocity_mps: newVelocity,
    };
  }

  /**
   * Propagates corrections to child bodies
   */
  private propagateCorrectionsToChildren(
    parentId: string,
    correctedParent: PhysicsStateReal,
    allBodies: PhysicsStateReal[],
    parentIds: Map<string, string>,
    corrections: Map<string, CorrectionVector>,
    appliedCorrections: Set<string>
  ): void {
    // Find all children of this parent
    for (const [childId, childParentId] of parentIds) {
      if (childParentId === parentId && !appliedCorrections.has(childId)) {
        const childIndex = allBodies.findIndex(b => b.id === childId);
        if (childIndex !== -1) {
          const child = allBodies[childIndex];
          
          // Calculate relative position change
          const originalRelativePos = child.position_m.clone().sub(allBodies.find(b => b.id === parentId)!.position_m);
          const newRelativePos = child.position_m.clone().sub(correctedParent.position_m);
          const positionDelta = newRelativePos.clone().sub(originalRelativePos);
          
          // Apply position adjustment to maintain relative positioning
          const adjustedChild = {
            ...child,
            position_m: child.position_m.clone().add(positionDelta),
          };
          
          allBodies[childIndex] = adjustedChild;
          appliedCorrections.add(childId);
        }
      }
    }
  }

  /**
   * Calculates correction priority based on hierarchy and error magnitude
   */
  private calculateCorrectionPriority(
    bodyId: string,
    parentIds: Map<string, string>,
    errorMagnitude: number
  ): number {
    // Base priority is error magnitude
    let priority = errorMagnitude;

    // Higher priority for bodies closer to root (fewer parents)
    let currentId = bodyId;
    let depth = 0;
    while (parentIds.has(currentId)) {
      currentId = parentIds.get(currentId)!;
      depth++;
    }
    
    // Reduce priority for deeper bodies (multiply by depth factor)
    priority *= (1 + depth * 0.1);

    return priority;
  }

  /**
   * Conserves total momentum across all bodies
   */
  private conserveMomentum(
    bodies: PhysicsStateReal[],
    corrections: Map<string, CorrectionVector>
  ): PhysicsStateReal[] {
    // Calculate total momentum before corrections
    const totalMomentumBefore = new OSVector3(0, 0, 0);
    for (const body of bodies) {
      const momentum = body.velocity_mps.clone().multiplyScalar(body.mass_kg);
      totalMomentumBefore.add(momentum);
    }

    // Calculate total momentum after corrections
    const totalMomentumAfter = new OSVector3(0, 0, 0);
    for (const body of bodies) {
      const momentum = body.velocity_mps.clone().multiplyScalar(body.mass_kg);
      totalMomentumAfter.add(momentum);
    }

    // Calculate momentum difference
    const momentumDifference = totalMomentumAfter.clone().sub(totalMomentumBefore);

    // Distribute momentum correction across all bodies (proportional to mass)
    const totalMass = bodies.reduce((sum, body) => sum + body.mass_kg, 0);
    if (totalMass > 0) {
      const velocityAdjustment = momentumDifference.clone().multiplyScalar(-1 / totalMass);
      
      for (let i = 0; i < bodies.length; i++) {
        bodies[i] = {
          ...bodies[i],
          velocity_mps: bodies[i].velocity_mps.clone().add(velocityAdjustment),
        };
      }
    }

    return bodies;
  }

  /**
   * Calculates optimal correction frequency based on simulation parameters
   */
  calculateOptimalCorrectionFrequency(
    timeScale: number,
    bodyCount: number,
    averageError: number,
    config: HybridCorrectionConfig
  ): number {
    if (config.frequency !== "adaptive") {
      return config.frequency === "per-step" ? 1.0 : 0.0;
    }

    const { baseFrequency, timeScaleFactor, bodyCountFactor, errorFactor } = config.adaptive;

    // Higher time scales need more frequent corrections
    const timeScaleMultiplier = Math.log10(timeScale + 1) * timeScaleFactor;
    
    // More bodies need more frequent corrections
    const bodyCountMultiplier = Math.log10(bodyCount) * bodyCountFactor;
    
    // Higher errors need more frequent corrections
    const errorMultiplier = Math.min(averageError * 10, errorFactor);

    return baseFrequency * (1 + timeScaleMultiplier + bodyCountMultiplier + errorMultiplier);
  }
}