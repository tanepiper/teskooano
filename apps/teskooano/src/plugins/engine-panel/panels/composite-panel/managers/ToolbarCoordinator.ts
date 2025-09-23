import type { EngineToolbar } from "../../../../../core/interface/engine-toolbar";
import type { EngineToolbarManager } from "../../../../../core/interface/engine-toolbar";
import type { CompositeEnginePanel } from "../CompositeEnginePanel";

/**
 * Simple coordinator for managing the engine toolbar in the CompositeEnginePanel.
 * Handles toolbar creation, management, and disposal.
 * Focused on core functionality without over-engineering.
 */
export class ToolbarCoordinator {
  private _toolbar: EngineToolbar | null = null;
  private _toolbarManager: EngineToolbarManager | null = null;
  private _panelId: string | undefined;
  private _toolbarContainer: HTMLElement | null = null;

  constructor(
    private readonly panel: CompositeEnginePanel,
    private readonly shadowRoot: ShadowRoot,
  ) {}

  /**
   * Initialize the toolbar coordinator
   */
  public initialize(
    panelId: string,
    toolbarManager: EngineToolbarManager,
  ): void {
    this._panelId = panelId;
    this._toolbarManager = toolbarManager;
    this._toolbarContainer = this.shadowRoot.querySelector(
      "teskooano-engine-toolbar",
    ) as HTMLElement;
  }

  /**
   * Create the engine toolbar
   */
  public createToolbar(): EngineToolbar | null {
    if (!this._panelId || !this._toolbarManager || !this._toolbarContainer) {
      console.error(
        "[ToolbarCoordinator] Cannot create toolbar: missing panelId, toolbarManager, or container",
      );
      return null;
    }

    this._toolbar = this._toolbarManager.createToolbarForPanel(
      this._panelId,
      this._toolbarContainer,
      this.panel,
    );

    return this._toolbar;
  }

  /**
   * Get the current toolbar
   */
  public getToolbar(): EngineToolbar | null {
    return this._toolbar;
  }

  /**
   * Dispose of the toolbar
   */
  public dispose(): void {
    if (this._toolbarManager && this._panelId) {
      this._toolbarManager.disposeToolbarForPanel(this._panelId);
    }
    this._toolbar = null;
    this._toolbarManager = null;
    this._panelId = undefined;
    this._toolbarContainer = null;
  }

  /**
   * Check if toolbar is initialized
   */
  public isInitialized(): boolean {
    return !!(this._panelId && this._toolbarManager && this._toolbarContainer);
  }
}
