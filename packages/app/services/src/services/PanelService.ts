import { StateAccessor } from "@teskooano/core-state";
import { BehaviorSubject, Observable, Subscription } from "rxjs";

/**
 * Panel instance information
 */
export interface PanelInstance {
  /** Unique identifier for the panel */
  id: string;
  /** Component name/type of the panel */
  componentName: string;
  /** Display title of the panel */
  title: string;
  /** Whether the panel is currently visible */
  isVisible: boolean;
  /** Whether the panel is currently active/focused */
  isActive: boolean;
  /** Panel creation timestamp */
  createdAt: Date;
  /** Panel lifecycle state */
  state: PanelLifecycleState;
  /** Additional panel parameters */
  params?: Record<string, any>;
}

/**
 * Panel lifecycle states
 */
export enum PanelLifecycleState {
  INITIALIZING = 'initializing',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DISPOSING = 'disposing',
  DISPOSED = 'disposed'
}

/**
 * Panel service state interface
 */
export interface PanelServiceState {
  /** Map of all registered panel instances */
  panels: Map<string, PanelInstance>;
  /** Currently active panel ID */
  activePanelId: string | null;
  /** Whether any panel is currently initializing */
  isInitializing: boolean;
  /** Number of active panels */
  activePanelCount: number;
  /** Whether the service is managing panel lifecycle based on celestial objects */
  autoLifecycleEnabled: boolean;
}

/**
 * Panel lifecycle management options
 */
export interface PanelLifecycleOptions {
  /** Whether to automatically manage panel lifecycle based on celestial objects */
  autoLifecycle?: boolean;
  /** Callback when a panel needs to be created */
  onCreatePanel?: (panelId: string, componentName: string) => void;
  /** Callback when a panel needs to be destroyed */
  onDestroyPanel?: (panelId: string) => void;
  /** Callback when a panel becomes active */
  onPanelActivated?: (panelId: string) => void;
  /** Callback when a panel becomes inactive */
  onPanelDeactivated?: (panelId: string) => void;
}

/**
 * Centralized panel service for managing panel lifecycle and coordination.
 * 
 * This service extracts panel management business logic and provides:
 * - Panel instance tracking and state management
 * - Lifecycle coordination (create, activate, deactivate, destroy)
 * - Auto-lifecycle management based on celestial objects
 * - Panel state synchronization
 * - Observable panel state for reactive UI updates
 */
export class PanelService {
  private _state$: BehaviorSubject<PanelServiceState>;
  private _subscription = new Subscription();
  private _options: PanelLifecycleOptions;
  
  constructor(options: PanelLifecycleOptions = {}) {
    this._options = options;
    
    const initialState: PanelServiceState = {
      panels: new Map(),
      activePanelId: null,
      isInitializing: false,
      activePanelCount: 0,
      autoLifecycleEnabled: options.autoLifecycle ?? false,
    };
    
    this._state$ = new BehaviorSubject<PanelServiceState>(initialState);
    
    // Start auto-lifecycle management if enabled
    if (options.autoLifecycle) {
      this._startAutoLifecycle();
    }
  }
  
  /**
   * Get the current panel service state as an observable
   */
  public get state$(): Observable<PanelServiceState> {
    return this._state$.asObservable();
  }
  
  /**
   * Get the current panel service state value
   */
  public getCurrentState(): PanelServiceState {
    return this._state$.getValue();
  }
  
  /**
   * Register a new panel instance
   * @param panelInfo Panel information
   */
  public registerPanel(panelInfo: Omit<PanelInstance, 'createdAt' | 'state'>): void {
    const currentState = this._state$.getValue();
    const panels = new Map(currentState.panels);
    
    const panel: PanelInstance = {
      ...panelInfo,
      createdAt: new Date(),
      state: PanelLifecycleState.INITIALIZING,
    };
    
    panels.set(panel.id, panel);
    
    this._updateState({
      panels,
      isInitializing: true,
      activePanelCount: this._countActivePanels(panels),
    });
    
    // Notify creation callback
    this._options.onCreatePanel?.(panel.id, panel.componentName);
    
    // Mark as active after a brief delay to simulate initialization
    setTimeout(() => {
      this._updatePanelState(panel.id, PanelLifecycleState.ACTIVE);
    }, 100);
  }
  
  /**
   * Unregister a panel instance
   * @param panelId The panel ID to unregister
   */
  public unregisterPanel(panelId: string): void {
    const currentState = this._state$.getValue();
    const panels = new Map(currentState.panels);
    const panel = panels.get(panelId);
    
    if (!panel) {
      console.warn(`[PanelService] Attempted to unregister non-existent panel: ${panelId}`);
      return;
    }
    
    // Mark as disposing
    this._updatePanelState(panelId, PanelLifecycleState.DISPOSING);
    
    // Notify destruction callback
    this._options.onDestroyPanel?.(panelId);
    
    // Remove from panels map
    panels.delete(panelId);
    
    const newActivePanelId = currentState.activePanelId === panelId ? null : currentState.activePanelId;
    
    this._updateState({
      panels,
      activePanelId: newActivePanelId,
      activePanelCount: this._countActivePanels(panels),
    });
  }
  
  /**
   * Activate a panel (bring to focus)
   * @param panelId The panel ID to activate
   */
  public activatePanel(panelId: string): void {
    const currentState = this._state$.getValue();
    const panel = currentState.panels.get(panelId);
    
    if (!panel) {
      console.warn(`[PanelService] Attempted to activate non-existent panel: ${panelId}`);
      return;
    }
    
    // Deactivate previously active panel
    if (currentState.activePanelId && currentState.activePanelId !== panelId) {
      this._deactivatePanel(currentState.activePanelId);
    }
    
    // Update panel state
    const panels = new Map(currentState.panels);
    panels.set(panelId, { ...panel, isActive: true });
    
    this._updateState({
      panels,
      activePanelId: panelId,
    });
    
    // Notify activation callback
    this._options.onPanelActivated?.(panelId);
  }
  
  /**
   * Deactivate a panel
   * @param panelId The panel ID to deactivate
   */
  public deactivatePanel(panelId: string): void {
    this._deactivatePanel(panelId);
  }
  
  /**
   * Update panel visibility
   * @param panelId The panel ID
   * @param isVisible Whether the panel should be visible
   */
  public setPanelVisibility(panelId: string, isVisible: boolean): void {
    const currentState = this._state$.getValue();
    const panel = currentState.panels.get(panelId);
    
    if (!panel) {
      console.warn(`[PanelService] Attempted to set visibility for non-existent panel: ${panelId}`);
      return;
    }
    
    const panels = new Map(currentState.panels);
    panels.set(panelId, { ...panel, isVisible });
    
    this._updateState({ panels });
  }
  
  /**
   * Get a specific panel instance
   * @param panelId The panel ID
   * @returns The panel instance or undefined
   */
  public getPanel(panelId: string): PanelInstance | undefined {
    return this._state$.getValue().panels.get(panelId);
  }
  
  /**
   * Get all panels of a specific component type
   * @param componentName The component name
   * @returns Array of matching panel instances
   */
  public getPanelsByComponent(componentName: string): PanelInstance[] {
    const panels = Array.from(this._state$.getValue().panels.values());
    return panels.filter(panel => panel.componentName === componentName);
  }
  
  /**
   * Get all active panels
   * @returns Array of active panel instances
   */
  public getActivePanels(): PanelInstance[] {
    const panels = Array.from(this._state$.getValue().panels.values());
    return panels.filter(panel => 
      panel.state === PanelLifecycleState.ACTIVE && panel.isVisible
    );
  }
  
  /**
   * Check if any panels exist
   * @returns True if any panels are registered
   */
  public hasPanels(): boolean {
    return this._state$.getValue().panels.size > 0;
  }
  
  /**
   * Check if any panels are currently visible
   * @returns True if any panels are visible
   */
  public hasVisiblePanels(): boolean {
    const panels = Array.from(this._state$.getValue().panels.values());
    return panels.some(panel => panel.isVisible);
  }
  
  /**
   * Enable or disable auto-lifecycle management
   * @param enabled Whether to enable auto-lifecycle
   */
  public setAutoLifecycle(enabled: boolean): void {
    const currentState = this._state$.getValue();
    if (currentState.autoLifecycleEnabled === enabled) {
      return;
    }
    
    this._updateState({ autoLifecycleEnabled: enabled });
    
    if (enabled) {
      this._startAutoLifecycle();
    } else {
      this._stopAutoLifecycle();
    }
  }
  
  /**
   * Start auto-lifecycle management based on celestial objects
   * @private
   */
  private _startAutoLifecycle(): void {
    this._subscription.add(
      StateAccessor.getCelestialObjectsStream().subscribe((celestialObjects) => {
        const hasObjects = Object.keys(celestialObjects).length > 0;
        this._handleAutoLifecycle(hasObjects);
      })
    );
  }
  
  /**
   * Stop auto-lifecycle management
   * @private
   */
  private _stopAutoLifecycle(): void {
    this._subscription.unsubscribe();
    this._subscription = new Subscription();
  }
  
  /**
   * Handle auto-lifecycle logic
   * @private
   */
  private _handleAutoLifecycle(hasObjects: boolean): void {
    const currentState = this._state$.getValue();
    const activePanels = this.getActivePanels();
    
    if (hasObjects && activePanels.length === 0) {
      // Objects exist but no active panels - this might indicate panels need to be created
      // The specific logic here would depend on the application's needs
      console.debug('[PanelService] Objects detected, but no active panels');
    } else if (!hasObjects && activePanels.length > 0) {
      // No objects but panels exist - might want to show placeholders
      console.debug('[PanelService] No objects detected, but panels are active');
    }
  }
  
  /**
   * Deactivate a panel (internal method)
   * @private
   */
  private _deactivatePanel(panelId: string): void {
    const currentState = this._state$.getValue();
    const panel = currentState.panels.get(panelId);
    
    if (!panel) return;
    
    const panels = new Map(currentState.panels);
    panels.set(panelId, { ...panel, isActive: false });
    
    const newActivePanelId = currentState.activePanelId === panelId ? null : currentState.activePanelId;
    
    this._updateState({
      panels,
      activePanelId: newActivePanelId,
    });
    
    // Notify deactivation callback
    this._options.onPanelDeactivated?.(panelId);
  }
  
  /**
   * Update a panel's lifecycle state
   * @private
   */
  private _updatePanelState(panelId: string, state: PanelLifecycleState): void {
    const currentState = this._state$.getValue();
    const panel = currentState.panels.get(panelId);
    
    if (!panel) return;
    
    const panels = new Map(currentState.panels);
    panels.set(panelId, { ...panel, state });
    
    const isInitializing = Array.from(panels.values()).some(
      p => p.state === PanelLifecycleState.INITIALIZING
    );
    
    this._updateState({
      panels,
      isInitializing,
      activePanelCount: this._countActivePanels(panels),
    });
  }
  
  /**
   * Count active panels
   * @private
   */
  private _countActivePanels(panels: Map<string, PanelInstance>): number {
    return Array.from(panels.values()).filter(
      panel => panel.state === PanelLifecycleState.ACTIVE && panel.isVisible
    ).length;
  }
  
  /**
   * Update panel service state
   * @private
   */
  private _updateState(updates: Partial<PanelServiceState>): void {
    const currentState = this._state$.getValue();
    const newState = { ...currentState, ...updates };
    this._state$.next(newState);
  }
  
  /**
   * Dispose of the panel service and clean up resources
   */
  public destroy(): void {
    this._subscription.unsubscribe();
    this._state$.complete();
  }
}