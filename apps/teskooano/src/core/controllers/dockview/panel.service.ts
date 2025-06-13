import { BehaviorSubject, Observable } from "rxjs";
import type { DockviewPanelApi } from "dockview-core";

/**
 * @class PanelService
 * @singleton
 * @description Manages the registration of UI panel instances and the state of the currently active panel.
 * This service consolidates panel registration and active panel state management.
 */
class PanelService {
  private static instance: PanelService;

  private readonly panelInstanceRegistry = new Map<string, any>();
  private readonly _activePanelApi =
    new BehaviorSubject<DockviewPanelApi | null>(null);

  /** Observable for the currently active Dockview panel API. Emits null if no panel is active. */
  public readonly activePanelApi$: Observable<DockviewPanelApi | null>;

  private constructor() {
    this.activePanelApi$ = this._activePanelApi.asObservable();
  }

  /**
   * Provides access to the singleton instance of the PanelService.
   */
  public static getInstance(): PanelService {
    if (!PanelService.instance) {
      PanelService.instance = new PanelService();
    }
    return PanelService.instance;
  }

  /**
   * Registers a panel instance with a given ID.
   * @param id - The unique identifier for the panel.
   * @param instance - The instance of the panel to register.
   */
  public registerPanelInstance(id: string, instance: any): void {
    this.panelInstanceRegistry.set(id, instance);
  }

  /**
   * Unregisters a panel instance by its ID.
   * @param id - The unique identifier for the panel to unregister.
   */
  public unregisterPanelInstance(id: string): void {
    this.panelInstanceRegistry.delete(id);
  }

  /**
   * Retrieves a registered panel instance by its ID.
   * @param id - The unique identifier for the panel.
   * @returns The panel instance, or undefined if not found.
   * @template T - The expected type of the panel instance.
   */
  public getPanelInstance<T = any>(id: string): T | undefined {
    return this.panelInstanceRegistry.get(id) as T | undefined;
  }

  /**
   * Sets the currently active Dockview panel API.
   * @param panelApi - The API of the active panel, or null if no panel is active.
   */
  public setActivePanelApi(panelApi: DockviewPanelApi | null): void {
    this._activePanelApi.next(panelApi);
  }

  /**
   * Gets the API of the currently active Dockview panel.
   * @returns The API of the active panel, or null if no panel is active.
   */
  public getActivePanelApi(): DockviewPanelApi | null {
    return this._activePanelApi.getValue();
  }
}

/** Singleton instance of the PanelService. */
export const panelService = PanelService.getInstance();
