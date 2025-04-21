import { Orientation } from "../../stores/layoutStore";

// --- Constants ---
const RESIZER_WIDTH = 4; // px
const MIN_UI_WIDTH_PX = 200;
const MIN_ENGINE_WIDTH_PX = 300;
const MIN_UI_HEIGHT_PX = 150;
const MIN_ENGINE_HEIGHT_PX = 200;
// --- End Constants ---

interface PanelResizerOptions {
  resizerElement: HTMLElement;
  uiContainer: HTMLElement;
  engineContainer: HTMLElement;
  parentElement: HTMLElement; // The main panel element containing ui/engine/resizer
  initialOrientation: Orientation;
  onResizeCallback: () => void; // Callback to trigger renderer resize etc.
}

/**
 * Manages the interactive resizing functionality between the engine view and UI container
 * within the CompositeEnginePanel. Handles mouse and touch events for dragging the resizer.
 */
export class PanelResizer {
  private resizerElement: HTMLElement;
  private uiContainer: HTMLElement;
  private engineContainer: HTMLElement;
  private parentElement: HTMLElement;
  private onResizeCallback: () => void;
  private currentOrientation: Orientation;

  private isResizing = false;
  private initialMousePos = { x: 0, y: 0 };
  private initialUiSize = { width: 0, height: 0 };

  // Bound event handlers for removal
  private handleMouseMoveBound = this.handleMouseMove.bind(this);
  private handleMouseUpBound = this.handleMouseUp.bind(this);
  private handleTouchMoveBound = this.handleTouchMove.bind(this);
  private handleTouchEndBound = this.handleTouchEnd.bind(this);

  constructor(options: PanelResizerOptions) {
    this.resizerElement = options.resizerElement;
    this.uiContainer = options.uiContainer;
    this.engineContainer = options.engineContainer;
    this.parentElement = options.parentElement;
    this.currentOrientation = options.initialOrientation;
    this.onResizeCallback = options.onResizeCallback;

    this.attachListeners();
    this.updateResizerStyle(this.currentOrientation); // Initial style
  }

  /**
   * Updates the resizer element's style based on the layout orientation.
   * @param orientation - The current layout orientation ('portrait' or 'landscape').
   */
  public updateResizerStyle(orientation: Orientation): void {
    this.currentOrientation = orientation; // Update internal state
    if (orientation === "portrait") {
      this.resizerElement.style.height = `${RESIZER_WIDTH}px`;
      this.resizerElement.style.width = "100%";
      this.resizerElement.style.cursor = "row-resize";
    } else {
      this.resizerElement.style.width = `${RESIZER_WIDTH}px`;
      this.resizerElement.style.height = "100%";
      this.resizerElement.style.cursor = "col-resize";
    }
  }

  private attachListeners(): void {
    this.resizerElement.addEventListener(
      "mousedown",
      this.handleMouseDown.bind(this),
    );
    this.resizerElement.addEventListener(
      "touchstart",
      this.handleTouchStart.bind(this),
      { passive: false },
    );
  }

  private detachListeners(): void {
    // Remove specific listeners if needed during cleanup
    // Note: handleMouseDown and handleTouchStart are bound inline in attachListeners,
    // so we need to store bound versions if we want to remove them specifically.
    // However, removing all listeners isn't standard practice unless replacing the element.
    // The primary cleanup is removing the *global* listeners in removeGlobalListeners.
    this.removeGlobalListeners();
  }

  private removeGlobalListeners(): void {
    window.removeEventListener("mousemove", this.handleMouseMoveBound);
    window.removeEventListener("mouseup", this.handleMouseUpBound);
    window.removeEventListener("mouseleave", this.handleMouseUpBound);
    document.removeEventListener("touchmove", this.handleTouchMoveBound);
    document.removeEventListener("touchend", this.handleTouchEndBound);
    document.removeEventListener("touchcancel", this.handleTouchEndBound);
  }

  // --- Mouse Handlers ---
  private handleMouseDown(event: MouseEvent): void {
    this.isResizing = true;
    this.resizerElement.classList.add("resizing");
    this.initialMousePos = { x: event.clientX, y: event.clientY };

    if (this.currentOrientation === "landscape") {
      this.initialUiSize = { width: this.uiContainer.offsetWidth, height: 0 };
    } else {
      this.initialUiSize = { width: 0, height: this.uiContainer.offsetHeight };
    }

    window.addEventListener("mousemove", this.handleMouseMoveBound);
    window.addEventListener("mouseup", this.handleMouseUpBound);
    window.addEventListener("mouseleave", this.handleMouseUpBound);

    event.preventDefault();
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.isResizing) return;
    this.performResize(event.clientX, event.clientY);
  }

  private handleMouseUp(): void {
    if (!this.isResizing) return;
    this.isResizing = false;
    this.resizerElement.classList.remove("resizing");
    this.removeGlobalListeners();
    this.onResizeCallback(); // Final callback after resize finishes
  }

  // --- Touch Handlers ---
  private handleTouchStart(event: TouchEvent): void {
    if (event.touches.length !== 1) return;
    event.preventDefault(); // Prevent scrolling while dragging

    this.isResizing = true;
    const touch = event.touches[0];
    this.initialMousePos = { x: touch.clientX, y: touch.clientY };

    if (this.currentOrientation === "landscape") {
      this.initialUiSize = { width: this.uiContainer.offsetWidth, height: 0 };
    } else {
      this.initialUiSize = { width: 0, height: this.uiContainer.offsetHeight };
    }

    document.addEventListener("touchmove", this.handleTouchMoveBound, {
      passive: false,
    });
    document.addEventListener("touchend", this.handleTouchEndBound);
    document.addEventListener("touchcancel", this.handleTouchEndBound);
  }

  private handleTouchMove(event: TouchEvent): void {
    if (!this.isResizing || event.touches.length !== 1) return;
    event.preventDefault(); // Prevent scrolling
    const touch = event.touches[0];
    this.performResize(touch.clientX, touch.clientY);
  }

  private handleTouchEnd(): void {
    if (!this.isResizing) return;
    this.isResizing = false;
    this.resizerElement.classList.remove("resizing"); // Ensure class is removed on touch end
    this.removeGlobalListeners();
    this.onResizeCallback(); // Final callback after resize finishes
  }

  // --- Shared Resize Logic ---
  private performResize(currentX: number, currentY: number): void {
    if (!this.isResizing) return;

    if (this.currentOrientation === "landscape") {
      const deltaX = currentX - this.initialMousePos.x;
      let newUiWidth = this.initialUiSize.width - deltaX; // Dragging left decreases width

      const containerWidth = this.parentElement.offsetWidth;
      // Calculate max width allowed for UI while respecting engine min width
      const maxUiWidth = containerWidth - MIN_ENGINE_WIDTH_PX - RESIZER_WIDTH;
      // Clamp the new width between min UI width and calculated max UI width
      newUiWidth = Math.max(MIN_UI_WIDTH_PX, Math.min(newUiWidth, maxUiWidth));

      this.uiContainer.style.flexBasis = `${newUiWidth}px`;
    } else {
      // Portrait
      const deltaY = currentY - this.initialMousePos.y;
      let newUiHeight = this.initialUiSize.height - deltaY; // Dragging up decreases height

      const containerHeight = this.parentElement.offsetHeight;
      // Calculate max height allowed for UI while respecting engine min height
      const maxUiHeight =
        containerHeight - MIN_ENGINE_HEIGHT_PX - RESIZER_WIDTH;
      // Clamp the new height between min UI height and calculated max UI height
      newUiHeight = Math.max(
        MIN_UI_HEIGHT_PX,
        Math.min(newUiHeight, maxUiHeight),
      );

      this.uiContainer.style.flexBasis = `${newUiHeight}px`;
    }
    // Trigger the callback (e.g., renderer resize) during the drag operation
    this.onResizeCallback();
  }

  /**
   * Cleans up event listeners. Should be called when the panel is disposed.
   */
  public destroy(): void {
    this.detachListeners();
    // Additional cleanup could go here if needed, e.g., removing the 'resizing' class
    this.resizerElement.classList.remove("resizing");
  }
}
