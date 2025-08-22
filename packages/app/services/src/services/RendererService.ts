import { StateAccessor } from "@teskooano/core-state";
import { CelestialObject } from "@teskooano/data-types";
import { BehaviorSubject, Observable, Subscription } from "rxjs";
import { ModularSpaceRenderer } from "@teskooano/renderer-threejs";

/**
 * Renderer visual settings interface
 */
export interface RendererVisualSettings {
  /** Trail length multiplier for object trails */
  trailLengthMultiplier: number;
  /** Simulation configuration */
  simulationConfig: {
    mode: string;
    algorithm: string;
    integrator: string;
  };
  /** Time scale for the simulation */
  timeScale: number;
  /** Number of prediction steps for orbital predictions */
  predictionSteps: number;
  /** Duration of orbital predictions */
  predictionDuration: number;
}

/**
 * Renderer instance information
 */
export interface RendererInstance {
  /** Unique identifier for the renderer instance */
  id: string;
  /** The ModularSpaceRenderer instance */
  renderer: ModularSpaceRenderer;
  /** Container element for the renderer */
  container: HTMLElement;
  /** Whether the renderer is currently active */
  isActive: boolean;
  /** Whether the renderer is currently rendering */
  isRendering: boolean;
  /** Creation timestamp */
  createdAt: Date;
}

/**
 * Renderer service state interface
 */
export interface RendererServiceState {
  /** Map of all renderer instances */
  renderers: Map<string, RendererInstance>;
  /** Currently active renderer ID */
  activeRendererId: string | null;
  /** Current visual settings */
  visualSettings: RendererVisualSettings;
  /** Current simulation time */
  simulationTime: number;
  /** Whether any renderer is currently processing */
  isProcessing: boolean;
  /** Number of active renderers */
  activeRendererCount: number;
}

/**
 * Renderer service options
 */
export interface RendererServiceOptions {
  /** Default visual settings */
  defaultVisualSettings?: Partial<RendererVisualSettings>;
  /** Callback when a renderer is created */
  onRendererCreated?: (rendererId: string, renderer: ModularSpaceRenderer) => void;
  /** Callback when a renderer is destroyed */
  onRendererDestroyed?: (rendererId: string) => void;
  /** Callback when visual settings change */
  onVisualSettingsChanged?: (settings: RendererVisualSettings) => void;
}

/**
 * Default visual settings
 */
const DEFAULT_VISUAL_SETTINGS: RendererVisualSettings = {
  trailLengthMultiplier: 150,
  simulationConfig: {
    mode: 'realtime',
    algorithm: 'verlet',
    integrator: 'leapfrog'
  },
  timeScale: 1,
  predictionSteps: 100,
  predictionDuration: 365.25
};

/**
 * Centralized renderer service for managing renderer state and operations.
 * 
 * This service extracts renderer business logic and provides:
 * - Renderer instance management and lifecycle
 * - Visual settings management and synchronization
 * - State transformation and adaptation
 * - Observable renderer state for reactive UI updates
 * - Renderer coordination across multiple instances
 */
export class RendererService {
  private _state$: BehaviorSubject<RendererServiceState>;
  private _subscription = new Subscription();
  private _options: RendererServiceOptions;
  
  constructor(options: RendererServiceOptions = {}) {
    this._options = options;
    
    const initialVisualSettings = {
      ...DEFAULT_VISUAL_SETTINGS,
      ...options.defaultVisualSettings
    };
    
    const initialState: RendererServiceState = {
      renderers: new Map(),
      activeRendererId: null,
      visualSettings: initialVisualSettings,
      simulationTime: 0,
      isProcessing: false,
      activeRendererCount: 0,
    };
    
    this._state$ = new BehaviorSubject<RendererServiceState>(initialState);
    
    // Start listening to core state
    this._subscribeToCoreState();
  }
  
  /**
   * Get the current renderer service state as an observable
   */
  public get state$(): Observable<RendererServiceState> {
    return this._state$.asObservable();
  }
  
  /**
   * Get the current renderer service state value
   */
  public getCurrentState(): RendererServiceState {
    return this._state$.getValue();
  }
  
  /**
   * Register a new renderer instance
   * @param id Unique identifier for the renderer
   * @param renderer The ModularSpaceRenderer instance
   * @param container The container element
   */
  public registerRenderer(id: string, renderer: ModularSpaceRenderer, container: HTMLElement): void {
    const currentState = this._state$.getValue();
    const renderers = new Map(currentState.renderers);
    
    const rendererInstance: RendererInstance = {
      id,
      renderer,
      container,
      isActive: true,
      isRendering: false,
      createdAt: new Date(),
    };
    
    renderers.set(id, rendererInstance);
    
    this._updateState({
      renderers,
      activeRendererCount: this._countActiveRenderers(renderers),
      activeRendererId: currentState.activeRendererId || id, // Set as active if no active renderer
    });
    
    // Notify creation callback
    this._options.onRendererCreated?.(id, renderer);
  }
  
  /**
   * Unregister a renderer instance
   * @param id The renderer ID to unregister
   */
  public unregisterRenderer(id: string): void {
    const currentState = this._state$.getValue();
    const renderers = new Map(currentState.renderers);
    const rendererInstance = renderers.get(id);
    
    if (!rendererInstance) {
      console.warn(`[RendererService] Attempted to unregister non-existent renderer: ${id}`);
      return;
    }
    
    // Dispose of the renderer
    rendererInstance.renderer.dispose();
    
    // Remove from renderers map
    renderers.delete(id);
    
    const newActiveRendererId = currentState.activeRendererId === id ? null : currentState.activeRendererId;
    
    this._updateState({
      renderers,
      activeRendererId: newActiveRendererId,
      activeRendererCount: this._countActiveRenderers(renderers),
    });
    
    // Notify destruction callback
    this._options.onRendererDestroyed?.(id);
  }
  
  /**
   * Set the active renderer
   * @param rendererId The renderer ID to make active
   */
  public setActiveRenderer(rendererId: string): void {
    const currentState = this._state$.getValue();
    const renderer = currentState.renderers.get(rendererId);
    
    if (!renderer) {
      console.warn(`[RendererService] Attempted to activate non-existent renderer: ${rendererId}`);
      return;
    }
    
    this._updateState({
      activeRendererId: rendererId,
    });
  }
  
  /**
   * Start rendering for a specific renderer
   * @param rendererId The renderer ID
   */
  public startRendering(rendererId: string): void {
    const currentState = this._state$.getValue();
    const rendererInstance = currentState.renderers.get(rendererId);
    
    if (!rendererInstance) {
      console.warn(`[RendererService] Attempted to start rendering for non-existent renderer: ${rendererId}`);
      return;
    }
    
    if (rendererInstance.isRendering) {
      return; // Already rendering
    }
    
    // Start the renderer
    rendererInstance.renderer.start();
    
    // Update state
    const renderers = new Map(currentState.renderers);
    renderers.set(rendererId, { ...rendererInstance, isRendering: true });
    
    this._updateState({ renderers });
  }
  
  /**
   * Stop rendering for a specific renderer
   * @param rendererId The renderer ID
   */
  public stopRendering(rendererId: string): void {
    const currentState = this._state$.getValue();
    const rendererInstance = currentState.renderers.get(rendererId);
    
    if (!rendererInstance) {
      console.warn(`[RendererService] Attempted to stop rendering for non-existent renderer: ${rendererId}`);
      return;
    }
    
    if (!rendererInstance.isRendering) {
      return; // Already stopped
    }
    
    // Stop the renderer
    rendererInstance.renderer.stop();
    
    // Update state
    const renderers = new Map(currentState.renderers);
    renderers.set(rendererId, { ...rendererInstance, isRendering: false });
    
    this._updateState({ renderers });
  }
  
  /**
   * Update visual settings
   * @param settings New visual settings (partial update)
   */
  public updateVisualSettings(settings: Partial<RendererVisualSettings>): void {
    const currentState = this._state$.getValue();
    const newSettings = { ...currentState.visualSettings, ...settings };
    
    this._updateState({ visualSettings: newSettings });
    
    // Notify callback
    this._options.onVisualSettingsChanged?.(newSettings);
  }
  
  /**
   * Get a specific renderer instance
   * @param rendererId The renderer ID
   * @returns The renderer instance or undefined
   */
  public getRenderer(rendererId: string): RendererInstance | undefined {
    return this._state$.getValue().renderers.get(rendererId);
  }
  
  /**
   * Get the active renderer instance
   * @returns The active renderer instance or undefined
   */
  public getActiveRenderer(): RendererInstance | undefined {
    const currentState = this._state$.getValue();
    if (!currentState.activeRendererId) {
      return undefined;
    }
    return currentState.renderers.get(currentState.activeRendererId);
  }
  
  /**
   * Get all active renderers
   * @returns Array of active renderer instances
   */
  public getActiveRenderers(): RendererInstance[] {
    const renderers = Array.from(this._state$.getValue().renderers.values());
    return renderers.filter(renderer => renderer.isActive);
  }
  
  /**
   * Get all rendering renderers
   * @returns Array of currently rendering renderer instances
   */
  public getRenderingRenderers(): RendererInstance[] {
    const renderers = Array.from(this._state$.getValue().renderers.values());
    return renderers.filter(renderer => renderer.isRendering);
  }
  
  /**
   * Check if any renderers exist
   * @returns True if any renderers are registered
   */
  public hasRenderers(): boolean {
    return this._state$.getValue().renderers.size > 0;
  }
  
  /**
   * Check if any renderers are currently rendering
   * @returns True if any renderers are rendering
   */
  public hasRenderingRenderers(): boolean {
    const renderers = Array.from(this._state$.getValue().renderers.values());
    return renderers.some(renderer => renderer.isRendering);
  }
  
  /**
   * Process celestial objects update for all renderers
   * @param objects The updated celestial objects
   */
  public processCelestialObjectsUpdate(objects: Record<string, CelestialObject>): void {
    this._updateState({ isProcessing: true });
    
    try {
      // Process objects for all active renderers
      const activeRenderers = this.getActiveRenderers();
      
      for (const rendererInstance of activeRenderers) {
        // The actual object processing would be handled by the renderer's state adapter
        // This is a coordination point for the service
        console.debug(`[RendererService] Processing objects for renderer: ${rendererInstance.id}`);
      }
    } catch (error) {
      console.error('[RendererService] Error processing celestial objects:', error);
    } finally {
      this._updateState({ isProcessing: false });
    }
  }
  
  /**
   * Resize all renderers to fit their containers
   */
  public resizeAllRenderers(): void {
    const renderers = Array.from(this._state$.getValue().renderers.values());
    
    for (const rendererInstance of renderers) {
      if (rendererInstance.isActive) {
        rendererInstance.renderer.resize();
      }
    }
  }
  
  /**
   * Subscribe to core state changes
   * @private
   */
  private _subscribeToCoreState(): void {
    // Subscribe to celestial objects changes
    this._subscription.add(
      StateAccessor.getCelestialObjectsStream().subscribe((objects) => {
        this.processCelestialObjectsUpdate(objects);
      })
    );
    
    // Subscribe to simulation state changes
    this._subscription.add(
      StateAccessor.getSimulationStateStream().subscribe((simState) => {
        // Update simulation time
        this._updateState({ simulationTime: simState.time ?? 0 });
        
        // Extract and update visual settings
        const visualSettings = this._extractVisualSettings(simState);
        if (!this._compareVisualSettings(this.getCurrentState().visualSettings, visualSettings)) {
          this._updateState({ visualSettings });
          this._options.onVisualSettingsChanged?.(visualSettings);
        }
      })
    );
  }
  
  /**
   * Extract visual settings from simulation state
   * @private
   */
  private _extractVisualSettings(simState: any): RendererVisualSettings {
    return {
      trailLengthMultiplier: simState.visualSettings?.trailLengthMultiplier ?? 150,
      simulationConfig: simState.simulationConfig ?? {
        mode: 'realtime',
        algorithm: 'verlet',
        integrator: 'leapfrog'
      },
      timeScale: simState.timeScale ?? 1,
      predictionSteps: simState.visualSettings?.predictionSteps ?? 100,
      predictionDuration: simState.visualSettings?.predictionDuration ?? 365.25,
    };
  }
  
  /**
   * Compare two visual settings objects for equality
   * @private
   */
  private _compareVisualSettings(a: RendererVisualSettings, b: RendererVisualSettings): boolean {
    return (
      a.trailLengthMultiplier === b.trailLengthMultiplier &&
      a.simulationConfig.mode === b.simulationConfig.mode &&
      a.simulationConfig.algorithm === b.simulationConfig.algorithm &&
      a.simulationConfig.integrator === b.simulationConfig.integrator &&
      a.timeScale === b.timeScale &&
      a.predictionSteps === b.predictionSteps &&
      a.predictionDuration === b.predictionDuration
    );
  }
  
  /**
   * Count active renderers
   * @private
   */
  private _countActiveRenderers(renderers: Map<string, RendererInstance>): number {
    return Array.from(renderers.values()).filter(renderer => renderer.isActive).length;
  }
  
  /**
   * Update renderer service state
   * @private
   */
  private _updateState(updates: Partial<RendererServiceState>): void {
    const currentState = this._state$.getValue();
    const newState = { ...currentState, ...updates };
    this._state$.next(newState);
  }
  
  /**
   * Dispose of the renderer service and clean up resources
   */
  public destroy(): void {
    // Dispose all renderers
    const renderers = Array.from(this._state$.getValue().renderers.values());
    for (const rendererInstance of renderers) {
      rendererInstance.renderer.dispose();
    }
    
    this._subscription.unsubscribe();
    this._state$.complete();
  }
}