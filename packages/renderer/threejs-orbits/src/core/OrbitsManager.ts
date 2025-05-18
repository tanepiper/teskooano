import * as THREE from "three";
import { type RenderableCelestialObject, type RendererStateAdapter } from "@teskooano/renderer-threejs";
import type { Observable, Subscription } from "rxjs";
import type { ObjectManager } from "@teskooano/renderer-threejs-objects";
import { KeplerianManager } from "../keplerian/KeplerianManager";
import { TrailManager } from "../verlet/TrailManager";
import { PredictionManager } from "../verlet/PredictionManager";

/**
 * Enum defining the available modes for orbit visualization.
 * - `Keplerian`: Static elliptical orbits calculated from orbital parameters.
 * - `Verlet`: Dynamic trails and predictions based on Verlet integration physics.
 */
export enum VisualizationMode {
  Keplerian = "KEPLERIAN",
  Verlet = "VERLET",
}

/**
 * Manager for orbit visualizations, serving as the main entry point for the module.
 * 
 * This class coordinates between different visualization systems (Keplerian orbits, 
 * Verlet trails, and trajectory predictions) and handles mode switching, visibility,
 * and highlighting.
 */
export class OrbitsManager {
  /** Current visualization mode */
  private currentMode: VisualizationMode = VisualizationMode.Keplerian;
  
  /** Manager for Keplerian (static elliptical) orbit visualizations */
  private keplerianManager: KeplerianManager;
  
  /** Manager for position history trail visualizations */
  private trailManager: TrailManager;
  
  /** Manager for future trajectory prediction visualizations */
  private predictionManager: PredictionManager;
  
  /** Flag indicating if visualizations are visible */
  private visualizationVisible: boolean = true;
  
  /** Currently highlighted object ID */
  private highlightedObjectId: string | null = null;
  
  /** Color used for highlighting */
  private highlightColor: THREE.Color = new THREE.Color(0xffff00);
  
  /** Subscription for the adapter settings */
  private adapterSettingsSubscription: Subscription | null = null;
  
  /** Subscription for renderable objects */
  private objectsSubscription: Subscription | null = null;
  
  /** Cache of the latest renderable objects */
  private latestRenderableObjects: Record<string, RenderableCelestialObject> = {};
  
  /** Throttle counter for trail updates */
  private trailUpdateCounter: number = 0;
  
  /** How often to update trail geometries (every N frames) */
  private readonly trailUpdateFrequency: number = 5;
  
  /** Throttle counter for prediction updates */
  private predictionUpdateCounter: number = 0;
  
  /** How often to recalculate predictions (every N frames) */
  private readonly predictionUpdateFrequency: number = 15;
  
  /** State adapter for accessing visualization settings */
  private stateAdapter: RendererStateAdapter;

  /**
   * Creates a new OrbitsManager instance.
   * 
   * @param objectManager - The scene's ObjectManager for rendering operations
   * @param stateAdapter - Adapter for accessing engine state and settings
   * @param renderableObjects$ - Observable stream of renderable object data
   */
  constructor(
    objectManager: ObjectManager,
    stateAdapter: RendererStateAdapter,
    renderableObjects$: Observable<Record<string, RenderableCelestialObject>>,
  ) {
    this.stateAdapter = stateAdapter;
    
    // Initialize sub-managers
    this.keplerianManager = new KeplerianManager(objectManager, renderableObjects$);
    this.trailManager = new TrailManager(objectManager);
    this.predictionManager = new PredictionManager(objectManager);
    
    // Subscribe to renderable objects stream
    this.objectsSubscription = renderableObjects$.subscribe((objects) => {
      this.latestRenderableObjects = objects;
    });
    
    // Subscribe to visualization settings
    this.adapterSettingsSubscription = this.stateAdapter.$visualSettings.subscribe((settings) => {
      const newMode = settings.physicsEngine === "verlet" 
        ? VisualizationMode.Verlet 
        : VisualizationMode.Keplerian;
        
      if (newMode !== this.currentMode) {
        this.setVisualizationMode(newMode);
      }
    });
    
    // Set initial mode based on current settings
    const initialSettings = this.stateAdapter.$visualSettings.getValue();
    this.currentMode = initialSettings.physicsEngine === "verlet"
      ? VisualizationMode.Verlet
      : VisualizationMode.Keplerian;
  }
  
  /**
   * Sets the visualization mode (Keplerian or Verlet).
   * 
   * @param mode - The visualization mode to use
   */
  setVisualizationMode(mode: VisualizationMode): void {
    if (mode === this.currentMode) return;
    
    this.currentMode = mode;
    
    if (mode === VisualizationMode.Keplerian) {
      // Clean up Verlet visualizations when switching to Keplerian
      this.trailManager.setVisibility(false);
      this.predictionManager.clearAllPredictions();
    } else {
      // Clean up Keplerian visualizations when switching to Verlet
      this.keplerianManager.clearAll();
    }
    
    // Update visualizations with the new mode
    this.updateAllVisualizations();
  }
  
  /**
   * Updates all visualizations based on the current mode and settings.
   * This should be called once per frame from the render loop.
   */
  updateAllVisualizations(): void {
    const objects = this.latestRenderableObjects;
    const visualSettings = this.stateAdapter.$visualSettings.getValue();
    
    // Periodically clean up memory
    if (this.predictionUpdateCounter === 0) {
      if (this.currentMode === VisualizationMode.Verlet) {
        const maxHistoryLength = 100 * visualSettings.trailLengthMultiplier;
        this.trailManager.limitHistoryMemory(maxHistoryLength);
      }
    }
    
    if (this.currentMode === VisualizationMode.Keplerian) {
      // Update Keplerian orbit lines
      Object.values(objects).forEach((obj) => {
        if (obj.orbit && obj.parentId) {
          this.keplerianManager.createOrUpdate(
            obj.celestialObjectId,
            obj.orbit,
            obj.parentId,
            this.visualizationVisible,
            this.highlightedObjectId,
            this.highlightColor,
          );
        } else if (this.keplerianManager.lines.has(obj.celestialObjectId)) {
          this.keplerianManager.remove(obj.celestialObjectId);
        }
      });
    } else {
      // Update Verlet visualizations
      
      // Determine if we should update trail geometry this frame
      this.trailUpdateCounter++;
      const shouldUpdateTrailGeometry = 
        this.trailUpdateCounter >= this.trailUpdateFrequency;
      
      if (shouldUpdateTrailGeometry) {
        this.trailUpdateCounter = 0;
      }
      
      // Update trail for each object
      const maxHistoryLength = 100 * visualSettings.trailLengthMultiplier;
      Object.values(objects).forEach((obj) => {
        this.trailManager.updateTrail(
          obj.celestialObjectId,
          obj,
          maxHistoryLength,
          shouldUpdateTrailGeometry,
        );
      });
      
      // Determine if we should update predictions this frame
      this.predictionUpdateCounter++;
      const shouldUpdatePredictions = 
        this.predictionUpdateCounter >= this.predictionUpdateFrequency;
      
      if (shouldUpdatePredictions) {
        this.predictionUpdateCounter = 0;
      }
      
      // Only show prediction for highlighted object
      if (this.highlightedObjectId) {
        this.predictionManager.updatePrediction(
          this.highlightedObjectId,
          shouldUpdatePredictions,
        );
        this.predictionManager.highlightPrediction(this.highlightedObjectId);
      } else {
        this.predictionManager.highlightPrediction(null);
      }
    }
  }
  
  /**
   * Toggles the visibility of all visualizations.
   */
  toggleVisualization(): void {
    this.setVisibility(!this.visualizationVisible);
  }
  
  /**
   * Gets the current visibility state.
   * 
   * @returns Whether visualizations are currently visible
   */
  isVisualizationVisible(): boolean {
    return this.visualizationVisible;
  }
  
  /**
   * Sets the visibility of all visualizations.
   * 
   * @param visible - Whether visualizations should be visible
   */
  setVisibility(visible: boolean): void {
    if (visible === this.visualizationVisible) return;
    
    this.visualizationVisible = visible;
    
    // Update visibility in active managers
    this.keplerianManager.setVisibility(visible);
    this.trailManager.setVisibility(visible);
    this.predictionManager.setVisibility(visible);
  }
  
  /**
   * Highlights a specific object's visualizations.
   * 
   * @param objectId - ID of the object to highlight, or null to clear highlight
   */
  highlightVisualization(objectId: string | null): void {
    const previouslyHighlightedId = this.highlightedObjectId;
    this.highlightedObjectId = objectId;
    
    // Reset previous highlighting in Keplerian manager
    if (previouslyHighlightedId && previouslyHighlightedId !== objectId) {
      this.keplerianManager.resetPreviousHighlight(
        previouslyHighlightedId,
        objectId,
      );
    }
    
    // Apply highlighting to appropriate managers
    if (objectId) {
      if (this.currentMode === VisualizationMode.Keplerian) {
        this.keplerianManager.applyHighlightToObject(
          objectId,
          objectId,
          this.highlightColor,
        );
      } else {
        this.trailManager.setHighlightedObject(objectId, this.highlightColor);
        this.predictionManager.highlightPrediction(objectId);
      }
    } else {
      // Clear highlighting
      if (this.currentMode === VisualizationMode.Verlet) {
        this.predictionManager.highlightPrediction(null);
      }
    }
  }
  
  /**
   * Cleans up all resources used by the managers.
   * Should be called when the manager is no longer needed.
   */
  dispose(): void {
    // Clean up subscriptions
    this.adapterSettingsSubscription?.unsubscribe();
    this.adapterSettingsSubscription = null;
    
    this.objectsSubscription?.unsubscribe();
    this.objectsSubscription = null;
    
    // Clean up visualization managers
    this.keplerianManager.dispose();
    this.trailManager.dispose();
    this.predictionManager.dispose();
    
    this.highlightedObjectId = null;
  }
} 