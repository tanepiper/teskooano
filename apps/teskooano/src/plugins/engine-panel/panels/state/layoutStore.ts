import { BehaviorSubject, Observable } from "rxjs";
import { map } from "rxjs/operators";

export type Orientation = "portrait" | "landscape";

/**
 * Represents the complete layout state of the composite engine panel
 */
export interface LayoutState {
  /**
   * Current screen orientation
   */
  orientation: Orientation;
  /**
   * Current viewport width in pixels
   */
  viewportWidth: number;
  /**
   * Current viewport height in pixels
   */
  viewportHeight: number;
  /**
   * Whether the panel is in fullscreen mode
   */
  isFullscreen: boolean;
  /**
   * Whether the panel is maximized within its container
   */
  isMaximized: boolean;
  /**
   * Current device pixel ratio
   */
  devicePixelRatio: number;
}

/**
 * Configuration options for the LayoutStore
 */
export interface LayoutStoreConfig {
  /**
   * Whether to automatically start listening for layout changes
   * @default true
   */
  autoStart?: boolean;
  /**
   * Whether to track viewport dimensions
   * @default true
   */
  trackViewport?: boolean;
  /**
   * Whether to track fullscreen state
   * @default true
   */
  trackFullscreen?: boolean;
}

/**
 * A comprehensive layout store that manages all layout-related state for the composite engine panel.
 * Tracks orientation, viewport dimensions, fullscreen state, and other layout concerns.
 */
export class LayoutStore {
  private readonly _layoutSubject: BehaviorSubject<LayoutState>;
  private _mediaQueryList: MediaQueryList | null = null;
  private _isListening = false;
  private _config: Required<LayoutStoreConfig>;

  constructor(config: LayoutStoreConfig = {}) {
    this._config = {
      autoStart: true,
      trackViewport: true,
      trackFullscreen: true,
      ...config,
    };

    this._layoutSubject = new BehaviorSubject<LayoutState>(
      this.getInitialLayoutState(),
    );

    if (this._config.autoStart) {
      this.startListening();
    }
  }

  /**
   * Observable stream of complete layout state changes.
   * Emits the current layout state immediately upon subscription
   * and whenever any layout property changes.
   */
  public get layoutState$(): Observable<LayoutState> {
    return this._layoutSubject.asObservable();
  }

  /**
   * Observable stream of orientation changes only.
   * Convenience method for components that only need orientation updates.
   */
  public get orientation$(): Observable<Orientation> {
    return this._layoutSubject.asObservable().pipe(
      // Extract only orientation from the layout state
      map((state) => state.orientation),
    );
  }

  /**
   * Gets the current complete layout state
   */
  public get currentLayoutState(): LayoutState {
    return this._layoutSubject.getValue();
  }

  /**
   * Gets the current orientation value
   */
  public get currentOrientation(): Orientation {
    return this._layoutSubject.getValue().orientation;
  }

  /**
   * Determines the initial layout state.
   */
  private getInitialLayoutState(): LayoutState {
    const orientation = this.getInitialOrientation();
    const viewportWidth =
      typeof window !== "undefined" ? window.innerWidth : 1920;
    const viewportHeight =
      typeof window !== "undefined" ? window.innerHeight : 1080;
    const devicePixelRatio =
      typeof window !== "undefined" ? window.devicePixelRatio : 1;

    return {
      orientation,
      viewportWidth,
      viewportHeight,
      isFullscreen: this.getInitialFullscreenState(),
      isMaximized: false, // Will be updated by panel state
      devicePixelRatio,
    };
  }

  /**
   * Determines the initial screen orientation.
   */
  private getInitialOrientation(): Orientation {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function"
    ) {
      return window.matchMedia("(orientation: portrait)").matches
        ? "portrait"
        : "landscape";
    }
    return "landscape";
  }

  /**
   * Determines the initial fullscreen state.
   */
  private getInitialFullscreenState(): boolean {
    if (typeof document !== "undefined") {
      return !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
    }
    return false;
  }

  /**
   * Starts listening for layout changes
   */
  public startListening(): void {
    if (this._isListening) {
      return;
    }

    if (typeof window !== "undefined") {
      // Listen for orientation changes
      if (typeof window.matchMedia === "function") {
        this._mediaQueryList = window.matchMedia("(orientation: portrait)");

        try {
          this._mediaQueryList.addEventListener(
            "change",
            this.handleOrientationChange,
          );
        } catch (e) {
          try {
            this._mediaQueryList.addListener(this.handleOrientationChange);
          } catch (fallbackError) {
            console.error("Failed to add orientation listener:", fallbackError);
          }
        }
      }

      // Listen for viewport changes
      if (this._config.trackViewport) {
        window.addEventListener("resize", this.handleViewportChange);
      }

      // Listen for fullscreen changes
      if (this._config.trackFullscreen) {
        document.addEventListener(
          "fullscreenchange",
          this.handleFullscreenChange,
        );
        document.addEventListener(
          "webkitfullscreenchange",
          this.handleFullscreenChange,
        );
        document.addEventListener(
          "mozfullscreenchange",
          this.handleFullscreenChange,
        );
        document.addEventListener(
          "MSFullscreenChange",
          this.handleFullscreenChange,
        );
      }

      this._isListening = true;
    } else {
      console.warn("Cannot add layout listeners: window not available.");
    }
  }

  /**
   * Stops listening for layout changes
   */
  public stopListening(): void {
    if (!this._isListening) {
      return;
    }

    // Remove orientation listener
    if (this._mediaQueryList) {
      try {
        this._mediaQueryList.removeEventListener(
          "change",
          this.handleOrientationChange,
        );
      } catch (e) {
        console.error("Failed to remove orientation listener:", e);
      }
      this._mediaQueryList = null;
    }

    // Remove viewport listener
    if (this._config.trackViewport) {
      window.removeEventListener("resize", this.handleViewportChange);
    }

    // Remove fullscreen listeners
    if (this._config.trackFullscreen) {
      document.removeEventListener(
        "fullscreenchange",
        this.handleFullscreenChange,
      );
      document.removeEventListener(
        "webkitfullscreenchange",
        this.handleFullscreenChange,
      );
      document.removeEventListener(
        "mozfullscreenchange",
        this.handleFullscreenChange,
      );
      document.removeEventListener(
        "MSFullscreenChange",
        this.handleFullscreenChange,
      );
    }

    this._isListening = false;
  }

  /**
   * Handles orientation change events
   */
  private handleOrientationChange = (event: MediaQueryListEvent): void => {
    const newOrientation: Orientation = event.matches
      ? "portrait"
      : "landscape";

    this.updateLayoutState({ orientation: newOrientation });
  };

  /**
   * Handles viewport resize events
   */
  private handleViewportChange = (): void => {
    if (typeof window !== "undefined") {
      this.updateLayoutState({
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
      });
    }
  };

  /**
   * Handles fullscreen change events
   */
  private handleFullscreenChange = (): void => {
    this.updateLayoutState({
      isFullscreen: this.getInitialFullscreenState(),
    });
  };

  /**
   * Updates the layout state with partial updates
   */
  private updateLayoutState(updates: Partial<LayoutState>): void {
    const currentState = this._layoutSubject.getValue();
    const newState = { ...currentState, ...updates };

    // Only emit if there are actual changes
    if (JSON.stringify(currentState) !== JSON.stringify(newState)) {
      this._layoutSubject.next(newState);
    }
  }

  /**
   * Updates the maximized state (called by panel management)
   */
  public setMaximized(isMaximized: boolean): void {
    this.updateLayoutState({ isMaximized });
  }

  /**
   * Disposes of the layout store and cleans up all resources
   */
  public dispose(): void {
    this.stopListening();
    this._layoutSubject.complete();
  }
}
