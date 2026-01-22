import { type OrbitalParameters, CelestialType } from "@teskooano/data-types";
import type { RenderableCelestialObject } from "@teskooano/data-types";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import {
  simulationManager,
  StateSubscriptionMixin,
} from "@teskooano/core-state";
import type { Observable } from "rxjs";
import * as THREE from "three";
import { OrbitCalculator } from "./OrbitCalculator";
import { SharedMaterials } from "../core/SharedMaterials";
import { LineHelper } from "@teskooano/renderer-threejs-helpers";
import { RenderOrderManager } from "@teskooano/renderer-threejs-core";
import {
  AU_METERS,
  SCALE,
  ThreeVector3Converter,
  GRAVITATIONAL_CONSTANT,
} from "@teskooano/data-values"; // Corrected import
import { type OSVector3 } from "@teskooano/core-math";
import { TrailCurveInterpolator } from "../renderers/TrailCurveInterpolator";
import {
  TrailCurveType,
  type TrailCurveConfig,
} from "../renderers/TrailManager";
import {
  calculateKeplerianPositionAtMeanAnomaly,
  calculateKeplerianPositionAtTrueAnomaly,
  calculateMeanAnomalyFromTrueAnomaly,
} from "@teskooano/core-physics";

/**
 * Manages the creation, update, visibility, and highlighting of static Keplerian orbit lines.
 *
 * This class is responsible for maintaining and rendering the classic elliptical orbit paths
 * based on Keplerian orbital elements. It works with the ObjectManager to add/remove lines
 * from the scene and handles visual properties like highlighting and visibility.
 *
 * Enhanced with curved trail interpolation for more realistic orbital visualization.
 */
export class KeplerianManager extends StateSubscriptionMixin {
  /** Map storing static Keplerian orbit lines, keyed by celestial object ID. */
  private lines: Map<string, THREE.Line> = new Map();

  /** Cache for THREE.Vector3 arrays to avoid reallocation */
  private positionCache: Map<string, THREE.Vector3[]> = new Map();
  /**
   * Cache for the raw calculated OSVector3 points to avoid recalculation.
   * The number is a version based on a key orbital parameter to check for changes.
   */
  private orbitPointCache: Map<
    string,
    { version: number; points: OSVector3[]; samplingMode: string }
  > = new Map();

  /** Object manager for adding/removing objects from the scene */
  private objectManager: ObjectManager;

  /** Observable for renderable object updates */
  private renderableObjects$: Observable<
    Record<string, RenderableCelestialObject>
  >;

  /** Latest state of renderable objects */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> =
    {};

  /** Line builder utility for efficient line creation and update */
  private lineBuilder: LineHelper;

  /** Converter for OSVector3 to THREE.Vector3 arrays */
  private threeVector3Converter: ThreeVector3Converter; // New instance

  /** Curve configuration for Keplerian orbit interpolation */
  private curveConfig: TrailCurveConfig = {
    type: TrailCurveType.Orbital,
    tension: 0.3,
    segments: 4,
    smoothing: 0.2,
    adaptiveThreshold: 5,
  };

  /** Group for all orbit lines to manage visibility and highlighting collectively */
  private orbitLinesGroup: THREE.Group;
  /** Dedicated group for keplerian lines within the orbit lines group */
  private keplerianLinesGroup: THREE.Group;

  /**
   * Creates an instance of KeplerianManager.
   *
   * @param objectManager - The scene's ObjectManager instance.
   * @param renderableObjects$ - An Observable emitting RenderableCelestialObject data.
   * @param orbitLinesGroup - Shared group for all orbit-related lines
   * @param curveConfig - Optional curve configuration for orbit interpolation
   */
  constructor(
    objectManager: ObjectManager,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
    orbitLinesGroup: THREE.Group,
    curveConfig?: TrailCurveConfig,
  ) {
    super();
    this.objectManager = objectManager;
    this.renderableObjects$ = renderableObjects$;
    this.lineBuilder = new LineHelper();
    this.threeVector3Converter = new ThreeVector3Converter(); // Initialize converter
    this.orbitLinesGroup = orbitLinesGroup; // Use the shared group

    if (curveConfig) {
      this.curveConfig = { ...this.curveConfig, ...curveConfig };
    }

    // Create a dedicated group for keplerian lines within the orbit lines group
    this.keplerianLinesGroup = new THREE.Group();
    this.keplerianLinesGroup.name = "GROUP_KEPLERIAN_LINES";
    this.orbitLinesGroup.add(this.keplerianLinesGroup);

    // Subscribe to renderable objects stream
    this.subscribeToState(this.renderableObjects$, (objects) => {
      this.latestRenderableObjects = objects;
    });
  }

  /**
   * Sets the curve configuration for Keplerian orbit interpolation.
   * @param config - The new curve configuration
   */
  setCurveConfig(config: TrailCurveConfig): void {
    this.curveConfig = { ...this.curveConfig, ...config };
  }

  /**
   * Gets the current curve configuration.
   * @returns The current curve configuration
   */
  getCurveConfig(): TrailCurveConfig {
    return { ...this.curveConfig };
  }

  /**
   * Creates or updates a static Keplerian orbit line for a given object.
   *
   * @param objectId - The unique ID of the celestial object whose orbit is being drawn.
   * @param orbitalParameters - The OrbitalParameters for the object.
   * @param parentId - The ID of the parent object around which this object orbits.
   * @param isVisible - The current visibility state for orbit lines.
   * @param highlightedObjectId - The ID of the currently highlighted object (or null).
   * @param highlightColor - The color to use for highlighting.
   */
  createOrUpdate(
    objectId: string,
    orbitalParameters: OrbitalParameters,
    parentId: string,
    isVisible: boolean,
    highlightedObjectId: string | null,
    highlightColor: THREE.Color,
    keplerOrbitMode: "full" | "trail",
  ): void {
    const existingLine = this.lines.get(objectId);
    const parentObject3D = this.objectManager.getObject(parentId);
    const allRenderableObjects = this.latestRenderableObjects;
    const parentState = allRenderableObjects[parentId];
    const objectState = allRenderableObjects[objectId];

    if (!parentObject3D || !parentState) {
      if (existingLine) this.remove(objectId);
      return;
    }

    // Get parent position
    const parentWorldPosition = new THREE.Vector3();
    parentObject3D.getWorldPosition(parentWorldPosition);

    // --- Orbit Point Calculation & Caching ---
    let orbitPointsOS: OSVector3[];
    const cachedData = this.orbitPointCache.get(objectId);
    const currentVersion = orbitalParameters.realSemiMajorAxis_m;
    const samplingMode =
      keplerOrbitMode === "trail" ? "meanAnomaly" : "trueAnomaly";

    if (
      cachedData &&
      cachedData.version === currentVersion &&
      cachedData.samplingMode === samplingMode
    ) {
      orbitPointsOS = cachedData.points;
    }
    // If the orbit has fundamentally changed or not cached, recalculate.
    else {
      orbitPointsOS = OrbitCalculator.calculateOrbitPoints(
        orbitalParameters,
        objectState,
        samplingMode,
      );
      this.orbitPointCache.set(objectId, {
        version: currentVersion,
        points: orbitPointsOS,
        samplingMode,
      });
    }
    // --- End Caching ---

    // Efficiently update or create the THREE.Vector3 array
    const cachedPositions = this.positionCache.get(objectId) ?? [];
    let orbitPointsTHREE = this.threeVector3Converter.update(
      orbitPointsOS,
      cachedPositions,
    );
    this.positionCache.set(objectId, orbitPointsTHREE);

    if (orbitPointsTHREE.length === 0) {
      if (existingLine) this.remove(objectId);
      return;
    }

    // --- Trail Logic ---
    let alphas: Float32Array | null = null;
    if (keplerOrbitMode === "trail") {
      const state = simulationManager.getSimulationState();
      const currentTime = state.time;
      const eccentricity = orbitalParameters.eccentricity;

      let meanMotion: number;
      let targetLagRad: number;
      let maxPossibleLagRad: number;

      if (eccentricity <= 1 && orbitalParameters.period_s > 0) {
        // Elliptical/Parabolic
        meanMotion = (2 * Math.PI) / orbitalParameters.period_s;
        // Target 90% of a period for the trail
        targetLagRad = 0.9 * 2 * Math.PI;
        maxPossibleLagRad = Math.min(targetLagRad, meanMotion * currentTime);
      } else {
        // Hyperbolic (or invalid period)
        const absA = Math.abs(orbitalParameters.realSemiMajorAxis_m);
        // Calculate mu from parent mass if available, otherwise fallback to Solar mu
        const mu = GRAVITATIONAL_CONSTANT * (parentState.mass || 1.989e30);
        meanMotion = Math.sqrt(mu / (absA * absA * absA));

        // For hyperbolic, we don't have a period. Use a fixed visual trail duration.
        // Let's use 10 days as a standard trail length for hyperbolic objects (e.g. comets)
        const targetTrailTime_s = 10 * 24 * 3600;
        targetLagRad = meanMotion * targetTrailTime_s;
        maxPossibleLagRad = Math.min(targetLagRad, meanMotion * currentTime);
      }

      // Calculate current absolute Mean Anomaly (NOT periodic moduloed)
      const initialMeanAnomaly = orbitalParameters.meanAnomaly;
      const M_now = initialMeanAnomaly + meanMotion * currentTime;

      // Dynamically sample history instead of filtering a static ring.
      // This ensures smooth growth and perfect alignment without wrap-around bugs.
      const numTrailPoints = 128; // Decent density for a smoothed trail
      const trailPoints: THREE.Vector3[] = [];
      const trailAlphasList: number[] = [];

      // For high-eccentricity (e > 0.9), we use a more stable True Anomaly sampling approach.
      // Iterative Kepler solvers can be unstable near e=1, causing AU-long "jumps".
      if (eccentricity > 0.9) {
        // 1. Find Current True Anomaly f_now from M_now
        const f_now = OrbitCalculator.calculateTrueAnomaly(M_now, eccentricity);

        // 2. Sample backwards in True Anomaly f
        // We'll sample a generous range (up to 180 degrees) and filter by lag
        for (let i = 0; i < numTrailPoints; i++) {
          const t = i / (numTrailPoints - 1); // 0 (tail) to 1 (head)

          // We sample f values leading up to f_now.
          // For high-e, f changes very fast at periapsis, so we sample denser there.
          // A simple linear f-sampling is actually very robust for visualization.
          const f_point = f_now - (1 - t) * Math.PI; // Sample up to 180 deg behind

          // Compute exact M_point for this f
          const M_point = calculateMeanAnomalyFromTrueAnomaly(
            f_point,
            eccentricity,
          );
          const lagRad = M_now - M_point;

          if (lagRad >= 0 && lagRad <= maxPossibleLagRad) {
            const posReal = calculateKeplerianPositionAtTrueAnomaly(
              orbitalParameters,
              f_point,
            );
            const posScaled = posReal.multiplyScalar(
              SCALE.RENDER_SCALE_AU / AU_METERS,
            );
            trailPoints.push(
              new THREE.Vector3(posScaled.x, posScaled.y, posScaled.z),
            );

            const lagRatio = targetLagRad > 0 ? lagRad / targetLagRad : 0;
            let alpha = 1.0;
            if (lagRatio > 0.5) {
              alpha = Math.max(0, 1.0 - (lagRatio - 0.5) / 0.4);
            }
            trailAlphasList.push(alpha);
          }
        }
      } else {
        // Standard Mean Anomaly sampling for elliptical/low-e orbits
        for (let i = 0; i < numTrailPoints; i++) {
          const t = i / (numTrailPoints - 1); // 0 (tail) to 1 (head)
          const lagRad = (1 - t) * maxPossibleLagRad;
          const M_point = M_now - lagRad;

          // Compute exact historical position
          const posReal = calculateKeplerianPositionAtMeanAnomaly(
            orbitalParameters,
            M_point,
          );
          const posScaled = posReal.multiplyScalar(
            SCALE.RENDER_SCALE_AU / AU_METERS,
          );

          trailPoints.push(
            new THREE.Vector3(posScaled.x, posScaled.y, posScaled.z),
          );

          // Fading logic: 1.0 for lag < 50% target, fade to 0.0 at 100% target
          const lagRatio = targetLagRad > 0 ? lagRad / targetLagRad : 0;
          let alpha = 1.0;
          if (lagRatio > 0.5) {
            alpha = Math.max(0, 1.0 - (lagRatio - 0.5) / 0.4);
          }
          trailAlphasList.push(alpha);
        }
      }

      orbitPointsTHREE = trailPoints;
      alphas = new Float32Array(trailAlphasList);

      // If we have no lag, don't bother rendering (e.g. at T=0)
      if (maxPossibleLagRad < 0.0001 || orbitPointsTHREE.length < 2) {
        if (existingLine) this.remove(objectId);
        return;
      }
    }
    // --- End Trail Logic ---

    // For Comets/Asteroids, disable interpolation as it can cause AU-long overshoots with Catmull-Rom
    // if points are even slightly noisy or have high curvature.
    const isErratic =
      objectState.type === CelestialType.COMET ||
      objectState.type === CelestialType.ASTEROID;
    const config = isErratic
      ? { ...this.curveConfig, type: TrailCurveType.Linear }
      : this.curveConfig;

    // Apply curve interpolation to Keplerian orbit points
    const interpolatedPoints = TrailCurveInterpolator.interpolate(
      orbitPointsTHREE,
      config,
    );

    // If we have alphas, we need to interpolate them too to match the higher point count
    if (alphas) {
      const originalCount = orbitPointsTHREE.length;
      const newCount = interpolatedPoints.length;
      const subSegments = this.curveConfig.segments || 1;
      const interpolatedAlphas = new Float32Array(newCount);

      for (let i = 0; i < newCount; i++) {
        const t = i / (newCount - 1);
        const originalIdx = t * (originalCount - 1);
        const low = Math.floor(originalIdx);
        const high = Math.ceil(originalIdx);
        const weight = originalIdx - low;
        interpolatedAlphas[i] =
          alphas[low] * (1 - weight) + alphas[high] * weight;
      }
      alphas = interpolatedAlphas;
    }

    // Choose the appropriate material based on type
    const isMoon = parentState.type !== CelestialType.STAR;
    let materialType: any = isMoon ? "KEPLERIAN_MOON" : "KEPLERIAN";
    if (keplerOrbitMode === "trail") materialType = "KEPLERIAN_TRAIL";

    if (existingLine) {
      // Check if material needs to change (e.g. from Solid to Shader)
      const currentMaterialType = existingLine.userData.materialType;
      if (currentMaterialType !== materialType) {
        this.remove(objectId);
        return this.createOrUpdate(
          objectId,
          orbitalParameters,
          parentId,
          isVisible,
          highlightedObjectId,
          highlightColor,
          keplerOrbitMode,
        );
      }

      // Update existing line
      this.lineBuilder.updateLine(
        existingLine,
        interpolatedPoints,
        interpolatedPoints.length,
      );

      // Update alpha attribute if it exists
      if (alphas) {
        const geometry = existingLine.geometry;
        let alphaAttr = geometry.getAttribute("alpha") as THREE.BufferAttribute;
        if (!alphaAttr || alphaAttr.count < alphas.length) {
          if (alphaAttr) geometry.deleteAttribute("alpha");
          alphaAttr = new THREE.BufferAttribute(alphas, 1);
          geometry.setAttribute("alpha", alphaAttr);
        } else {
          alphaAttr.copyArray(alphas);
          alphaAttr.needsUpdate = true;
        }
      }

      existingLine.position.copy(parentWorldPosition);
      existingLine.visible = isVisible;

      this.applyHighlight(
        objectId,
        existingLine,
        highlightedObjectId,
        highlightColor,
      );
    } else {
      // Create new line
      const material = SharedMaterials.clone(materialType);

      const newLine = this.lineBuilder.createLine(
        interpolatedPoints.length,
        material,
        `orbit-line-${objectId}`,
      );
      newLine.userData.materialType = materialType;

      // Update the line with the interpolated points
      this.lineBuilder.updateLine(
        newLine,
        interpolatedPoints,
        interpolatedPoints.length,
      );

      // Add alpha attribute if needed
      if (alphas) {
        newLine.geometry.setAttribute(
          "alpha",
          new THREE.BufferAttribute(alphas, 1),
        );
      }

      newLine.position.copy(parentWorldPosition);
      newLine.visible = isVisible;
      newLine.frustumCulled = false; // Disable frustum culling to ensure orbit lines are always visible

      // Apply correct render order for Keplerian orbits
      newLine.renderOrder =
        RenderOrderManager.getRenderOrderForOrbit("keplerian");

      // Orbit lines need to be positioned in absolute world space, not relative to celestial objects
      // So we add them directly to the scene
      this.keplerianLinesGroup.add(newLine);

      this.lines.set(objectId, newLine);

      this.applyHighlight(
        objectId,
        newLine,
        highlightedObjectId,
        highlightColor,
      );
    }
  }

  /**
   * Removes a specific Keplerian orbit line from the scene and internal tracking.
   *
   * @param objectId - The ID of the object whose line should be removed.
   */
  remove(objectId: string): void {
    const line = this.lines.get(objectId);
    if (line) {
      // Remove from scene directly since orbit lines are positioned in absolute world space
      this.keplerianLinesGroup.remove(line);

      this.lineBuilder.disposeLine(line);
      this.lines.delete(objectId);
      this.positionCache.delete(objectId);
      this.orbitPointCache.delete(objectId);
    }
  }

  /**
   * Removes all managed Keplerian lines.
   */
  clearAll(): void {
    this.lines.forEach((_, id) => this.remove(id));
    this.lines.clear();
  }

  /**
   * Sets the visibility of all managed Keplerian lines.
   *
   * @param visible - True to make lines visible, false to hide.
   */
  setVisibility(visible: boolean): void {
    this.keplerianLinesGroup.children.forEach((child) => {
      child.visible = visible;
    });
  }

  /**
   * Applies or removes the highlight effect for a specific object's line.
   *
   * @param targetObjectId - The ID of the object to potentially highlight or unhighlight.
   * @param highlightedObjectId - The ID currently being highlighted (or null).
   * @param highlightColor - The color for highlighting.
   */
  applyHighlightToObject(
    targetObjectId: string,
    highlightedObjectId: string | null,
    highlightColor: THREE.Color,
  ): void {
    const line = this.lines.get(targetObjectId);
    if (line) {
      this.applyHighlight(
        targetObjectId,
        line,
        highlightedObjectId,
        highlightColor,
      );
    }
  }

  /**
   * Resets the highlight on a previously highlighted line if it's no longer the target.
   *
   * @param previouslyHighlightedId - The ID that was previously highlighted.
   * @param currentHighlightedId - The ID currently being highlighted (or null).
   */
  resetPreviousHighlight(
    previouslyHighlightedId: string,
    currentHighlightedId: string | null,
  ): void {
    if (
      previouslyHighlightedId &&
      previouslyHighlightedId !== currentHighlightedId
    ) {
      const previousLine = this.lines.get(previouslyHighlightedId);
      if (
        previousLine &&
        previousLine.material instanceof THREE.LineBasicMaterial &&
        previousLine.userData.defaultColor
      ) {
        previousLine.material.color.copy(previousLine.userData.defaultColor);
      }
    }
  }

  /**
   * Helper to apply highlight state to a single line.
   *
   * @param lineObjectId - The ID of the object this line belongs to.
   * @param line - The line object itself.
   * @param highlightedObjectId - The ID currently being highlighted (or null).
   * @param highlightColor - The color for highlighting.
   * @private
   */
  private applyHighlight(
    lineObjectId: string,
    line: THREE.Line,
    highlightedObjectId: string | null,
    highlightColor: THREE.Color,
  ): void {
    const material = line.material;
    const isHighlighted = highlightedObjectId === lineObjectId;

    if (material instanceof THREE.LineBasicMaterial) {
      if (isHighlighted) {
        if (!line.userData.defaultColor) {
          line.userData.defaultColor = material.color.clone();
        }
        material.color.copy(highlightColor);
      } else if (line.userData.defaultColor) {
        material.color.copy(line.userData.defaultColor);
      }
    } else if (material instanceof THREE.ShaderMaterial) {
      if (isHighlighted) {
        if (!line.userData.defaultColor) {
          line.userData.defaultColor = material.uniforms.color.value.clone();
        }
        material.uniforms.color.value.copy(highlightColor);
      } else if (line.userData.defaultColor) {
        material.uniforms.color.value.copy(line.userData.defaultColor);
      }
    }
  }

  /**
   * Checks if a line exists for the given object ID.
   *
   * @param objectId - ID of the object to check
   * @returns True if a line exists for the object
   */
  hasLine(objectId: string): boolean {
    return this.lines.has(objectId);
  }

  /**
   * Disposes of all resources and cleans up internal state.
   */
  dispose(): void {
    super.dispose();
    this.lineBuilder.clear();

    // Clear the orbit lines group
    while (this.keplerianLinesGroup.children.length > 0) {
      this.keplerianLinesGroup.remove(this.keplerianLinesGroup.children[0]);
    }
  }
}
