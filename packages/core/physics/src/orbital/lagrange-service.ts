import { OSVector3 } from "@teskooano/core-math";
import type {
  PhysicsStateReal,
  LagrangePoint,
  TwoBodySystem,
  LagrangeCalculationOptions,
} from "@teskooano/data-types";
import { CelestialType } from "@teskooano/data-types";
import {
  findAllLagrangePointsInSystem,
  createTwoBodySystem,
  calculateAllLagrangePoints,
  calculateHillSphereRadius,
} from "./lagrange";

/**
 * Configuration for filtering which body pairs to consider for Lagrange point calculations
 */
export interface LagrangeSystemFilter {
  /** Minimum mass ratio (secondary/total) to consider */
  minMassRatio?: number;
  /** Maximum mass ratio (secondary/total) to consider */
  maxMassRatio?: number;
  /** Minimum separation distance in meters */
  minSeparation_m?: number;
  /** Maximum separation distance in meters */
  maxSeparation_m?: number;
  /** Only consider pairs where primary is of these types */
  primaryTypes?: CelestialType[];
  /** Only consider pairs where secondary is of these types */
  secondaryTypes?: CelestialType[];
  /** Exclude certain body IDs from consideration */
  excludedBodyIds?: string[];
  /** Only include stable Lagrange points (L4, L5 for appropriate mass ratios) */
  onlyStablePoints?: boolean;
}

/**
 * Information about a significant body pair for Lagrange point analysis
 */
export interface SignificantBodyPair {
  /** Unique identifier for this pair */
  pairId: string;
  /** Two-body system information */
  system: TwoBodySystem;
  /** All Lagrange points for this pair */
  lagrangePoints: LagrangePoint[];
  /** Whether this is considered a major system (e.g., star-planet, planet-moon) */
  isMajorSystem: boolean;
  /** Classification of the system type */
  systemType:
    | "star-planet"
    | "planet-moon"
    | "star-star"
    | "planet-planet"
    | "other";
}

/**
 * Real-time tracking of Lagrange points as simulation evolves
 */
export interface LagrangePointHistory {
  /** Body pair identifier */
  pairId: string;
  /** Lagrange point ID */
  lagrangeId: "L1" | "L2" | "L3" | "L4" | "L5";
  /** History of positions over time */
  positionHistory: Array<{
    time_s: number;
    position_m: OSVector3;
    effectivePotential_Jkg: number;
  }>;
  /** Current stability status */
  currentStability: "stable" | "unstable" | "marginally_stable";
}

/**
 * Service for finding, tracking, and managing Lagrange points in celestial simulations
 */
export class LagrangePointService {
  private cachedLagrangePoints = new Map<string, SignificantBodyPair>();
  private lagrangeHistory = new Map<string, LagrangePointHistory[]>();
  private lastUpdateTime_s = 0;
  private bodyTypeMap = new Map<string, CelestialType>();

  constructor(
    private defaultCalculationOptions: LagrangeCalculationOptions = {},
    private defaultSystemFilter: LagrangeSystemFilter = {},
  ) {}

  /**
   * Updates the celestial body type mapping for better filtering
   */
  updateBodyTypes(bodyTypes: Map<string, CelestialType>): void {
    this.bodyTypeMap.clear();
    bodyTypes.forEach((type, bodyId) => {
      this.bodyTypeMap.set(bodyId, type);
    });
  }

  /**
   * Finds all significant Lagrange points in the current simulation state
   */
  findSignificantLagrangePoints(
    bodies: PhysicsStateReal[],
    currentTime_s: number,
    filter: LagrangeSystemFilter = {},
    options: LagrangeCalculationOptions = {},
  ): SignificantBodyPair[] {
    const mergedFilter = { ...this.defaultSystemFilter, ...filter };
    const mergedOptions = { ...this.defaultCalculationOptions, ...options };

    this.lastUpdateTime_s = currentTime_s;

    // Get all body pairs that meet the filter criteria
    const significantPairs = this.identifySignificantBodyPairs(
      bodies,
      mergedFilter,
    );

    // Calculate Lagrange points for each significant pair
    const results: SignificantBodyPair[] = [];

    significantPairs.forEach((pair) => {
      try {
        const lagrangePoints = calculateAllLagrangePoints(
          pair.system,
          mergedOptions,
        );

        // Apply stability filter if requested
        const filteredPoints = mergedFilter.onlyStablePoints
          ? lagrangePoints.filter(
              (point) =>
                point.stability === "stable" ||
                point.stability === "marginally_stable",
            )
          : lagrangePoints;

        if (filteredPoints.length > 0) {
          const significantPair: SignificantBodyPair = {
            ...pair,
            lagrangePoints: filteredPoints,
          };

          results.push(significantPair);

          // Cache the result
          this.cachedLagrangePoints.set(pair.pairId, significantPair);

          // Update history
          this.updateLagrangeHistory(
            pair.pairId,
            filteredPoints,
            currentTime_s,
          );
        }
      } catch (error) {
        console.warn(
          `Failed to calculate Lagrange points for ${pair.pairId}:`,
          error,
        );
      }
    });

    return results;
  }

  /**
   * Gets the most recent Lagrange points for a specific body pair
   */
  getLagrangePointsForPair(pairId: string): LagrangePoint[] | null {
    const cachedPair = this.cachedLagrangePoints.get(pairId);
    return cachedPair ? cachedPair.lagrangePoints : null;
  }

  /**
   * Gets all stable Lagrange points in the current system
   */
  getStableLagrangePoints(): LagrangePoint[] {
    const stablePoints: LagrangePoint[] = [];

    this.cachedLagrangePoints.forEach((pair) => {
      pair.lagrangePoints.forEach((point) => {
        if (
          point.stability === "stable" ||
          point.stability === "marginally_stable"
        ) {
          stablePoints.push(point);
        }
      });
    });

    return stablePoints;
  }

  /**
   * Finds the best Lagrange point for placing a spacecraft or object
   */
  findBestLagrangePointForPlacement(
    preferredPairId?: string,
    preferredPointType?: "L1" | "L2" | "L3" | "L4" | "L5",
    requireStability = true,
  ): { pairId: string; lagrangePoint: LagrangePoint } | null {
    let candidates: Array<{ pairId: string; lagrangePoint: LagrangePoint }> =
      [];

    // Collect all potential candidates
    this.cachedLagrangePoints.forEach((pair, pairId) => {
      pair.lagrangePoints.forEach((point) => {
        // Apply filters
        if (requireStability && point.stability === "unstable") return;
        if (preferredPointType && point.id !== preferredPointType) return;
        if (preferredPairId && pairId !== preferredPairId) return;

        candidates.push({ pairId, lagrangePoint: point });
      });
    });

    if (candidates.length === 0) return null;

    // Sort candidates by preference
    candidates.sort((a, b) => {
      // Prefer stable over marginally stable
      if (
        a.lagrangePoint.stability === "stable" &&
        b.lagrangePoint.stability !== "stable"
      )
        return -1;
      if (
        b.lagrangePoint.stability === "stable" &&
        a.lagrangePoint.stability !== "stable"
      )
        return 1;

      // Prefer L2 points (like JWST position)
      if (a.lagrangePoint.id === "L2" && b.lagrangePoint.id !== "L2") return -1;
      if (b.lagrangePoint.id === "L2" && a.lagrangePoint.id !== "L2") return 1;

      // Prefer L1 points next
      if (a.lagrangePoint.id === "L1" && b.lagrangePoint.id !== "L1") return -1;
      if (b.lagrangePoint.id === "L1" && a.lagrangePoint.id !== "L1") return 1;

      return 0;
    });

    return candidates[0];
  }

  /**
   * Gets historical tracking data for Lagrange points
   */
  getLagrangePointHistory(
    pairId: string,
    lagrangeId?: "L1" | "L2" | "L3" | "L4" | "L5",
  ): LagrangePointHistory[] {
    const history = this.lagrangeHistory.get(pairId) || [];

    if (lagrangeId) {
      return history.filter((h) => h.lagrangeId === lagrangeId);
    }

    return history;
  }

  /**
   * Clears all cached data (useful when simulation is reset)
   */
  clearCache(): void {
    this.cachedLagrangePoints.clear();
    this.lagrangeHistory.clear();
    this.lastUpdateTime_s = 0;
  }

  /**
   * Gets a summary of all current Lagrange point systems
   */
  getLagrangePointSummary(): {
    totalSystems: number;
    totalLagrangePoints: number;
    stableLagrangePoints: number;
    majorSystems: SignificantBodyPair[];
  } {
    let totalLagrangePoints = 0;
    let stableLagrangePoints = 0;
    const majorSystems: SignificantBodyPair[] = [];

    this.cachedLagrangePoints.forEach((pair) => {
      totalLagrangePoints += pair.lagrangePoints.length;

      pair.lagrangePoints.forEach((point) => {
        if (
          point.stability === "stable" ||
          point.stability === "marginally_stable"
        ) {
          stableLagrangePoints++;
        }
      });

      if (pair.isMajorSystem) {
        majorSystems.push(pair);
      }
    });

    return {
      totalSystems: this.cachedLagrangePoints.size,
      totalLagrangePoints,
      stableLagrangePoints,
      majorSystems,
    };
  }

  /**
   * Identifies significant body pairs for Lagrange point analysis
   */
  private identifySignificantBodyPairs(
    bodies: PhysicsStateReal[],
    filter: LagrangeSystemFilter,
  ): Array<Omit<SignificantBodyPair, "lagrangePoints">> {
    const pairs: Array<Omit<SignificantBodyPair, "lagrangePoints">> = [];

    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const body1 = bodies[i];
        const body2 = bodies[j];

        // Skip massless bodies
        if (body1.mass_kg <= 0 || body2.mass_kg <= 0) continue;

        // Skip excluded bodies
        if (filter.excludedBodyIds) {
          if (
            filter.excludedBodyIds.includes(body1.id) ||
            filter.excludedBodyIds.includes(body2.id)
          ) {
            continue;
          }
        }

        try {
          const system = createTwoBodySystem(body1, body2);

          // Apply mass ratio filters
          if (filter.minMassRatio && system.massRatio < filter.minMassRatio)
            continue;
          if (filter.maxMassRatio && system.massRatio > filter.maxMassRatio)
            continue;

          // Apply separation filters
          if (
            filter.minSeparation_m &&
            system.separation_m < filter.minSeparation_m
          )
            continue;
          if (
            filter.maxSeparation_m &&
            system.separation_m > filter.maxSeparation_m
          )
            continue;

          // Apply celestial type filters
          const primaryType = this.bodyTypeMap.get(system.primary.id);
          const secondaryType = this.bodyTypeMap.get(system.secondary.id);

          if (
            filter.primaryTypes &&
            primaryType &&
            !filter.primaryTypes.includes(primaryType)
          )
            continue;
          if (
            filter.secondaryTypes &&
            secondaryType &&
            !filter.secondaryTypes.includes(secondaryType)
          )
            continue;

          const pairId = `${system.primary.id}-${system.secondary.id}`;
          const systemType = this.classifySystemType(
            primaryType,
            secondaryType,
          );
          const isMajorSystem = this.isMajorSystem(
            system,
            primaryType,
            secondaryType,
          );

          pairs.push({
            pairId,
            system,
            isMajorSystem,
            systemType,
          });
        } catch (error) {
          console.warn(
            `Failed to create two-body system for ${body1.id}-${body2.id}:`,
            error,
          );
        }
      }
    }

    return pairs;
  }

  /**
   * Classifies the type of binary system
   */
  private classifySystemType(
    primaryType?: CelestialType,
    secondaryType?: CelestialType,
  ): "star-planet" | "planet-moon" | "star-star" | "planet-planet" | "other" {
    if (!primaryType || !secondaryType) return "other";

    const isStarPrimary = primaryType === CelestialType.STAR;
    const isStarSecondary = secondaryType === CelestialType.STAR;
    const isPlanetPrimary = [
      CelestialType.PLANET,
      CelestialType.GAS_GIANT,
    ].includes(primaryType);
    const isPlanetSecondary = [
      CelestialType.PLANET,
      CelestialType.GAS_GIANT,
    ].includes(secondaryType);
    const isMoonSecondary = secondaryType === CelestialType.MOON;

    if (isStarPrimary && isStarSecondary) return "star-star";
    if (isStarPrimary && isPlanetSecondary) return "star-planet";
    if (isPlanetPrimary && isMoonSecondary) return "planet-moon";
    if (isPlanetPrimary && isPlanetSecondary) return "planet-planet";

    return "other";
  }

  /**
   * Determines if a system is considered "major" for Lagrange point tracking
   */
  private isMajorSystem(
    system: TwoBodySystem,
    primaryType?: CelestialType,
    secondaryType?: CelestialType,
  ): boolean {
    // Consider star-planet and planet-moon systems as major
    const systemType = this.classifySystemType(primaryType, secondaryType);
    if (systemType === "star-planet" || systemType === "planet-moon")
      return true;

    // Consider binary star systems as major
    if (systemType === "star-star") return true;

    // Consider systems with significant mass ratios as major
    if (system.massRatio > 0.001 && system.massRatio < 0.5) return true;

    return false;
  }

  /**
   * Updates the historical tracking of Lagrange point positions
   */
  private updateLagrangeHistory(
    pairId: string,
    lagrangePoints: LagrangePoint[],
    currentTime_s: number,
  ): void {
    if (!this.lagrangeHistory.has(pairId)) {
      this.lagrangeHistory.set(pairId, []);
    }

    const histories = this.lagrangeHistory.get(pairId)!;

    lagrangePoints.forEach((point) => {
      let history = histories.find((h) => h.lagrangeId === point.id);

      if (!history) {
        history = {
          pairId,
          lagrangeId: point.id,
          positionHistory: [],
          currentStability: point.stability,
        };
        histories.push(history);
      }

      // Update current stability
      history.currentStability = point.stability;

      // Add new position to history
      history.positionHistory.push({
        time_s: currentTime_s,
        position_m: point.position_m.clone(),
        effectivePotential_Jkg: point.effectivePotential_Jkg,
      });

      // Limit history size to prevent memory issues (keep last 1000 points)
      if (history.positionHistory.length > 1000) {
        history.positionHistory = history.positionHistory.slice(-1000);
      }
    });
  }
}
