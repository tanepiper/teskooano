/**
 * Universal Touch Event Handler
 * Provides consistent touch behavior across all components
 */

export interface TouchHandlerOptions {
  /** Prevent default touch behavior */
  preventDefault?: boolean;
  /** Stop event propagation */
  stopPropagation?: boolean;
  /** Delay before considering it a valid touch (ms) */
  touchDelay?: number;
  /** Maximum distance allowed for touch movement (px) */
  maxTouchMove?: number;
  /** Enable visual feedback */
  visualFeedback?: boolean;
}

export class TouchHandler {
  private element: HTMLElement;
  private options: Required<TouchHandlerOptions>;
  private touchStartTime: number = 0;
  private touchStartPosition: { x: number; y: number } | null = null;
  private isTouch: boolean = false;
  private clickHandler?: (event: Event) => void;

  constructor(
    element: HTMLElement,
    clickHandler: (event: Event) => void,
    options: TouchHandlerOptions = {}
  ) {
    this.element = element;
    this.clickHandler = clickHandler;
    this.options = {
      preventDefault: false,
      stopPropagation: false,
      touchDelay: 0,
      maxTouchMove: 10,
      visualFeedback: true,
      ...options,
    };

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    // Handle both touch and mouse events
    this.element.addEventListener("touchstart", this.handleTouchStart, { passive: false });
    this.element.addEventListener("touchmove", this.handleTouchMove, { passive: false });
    this.element.addEventListener("touchend", this.handleTouchEnd, { passive: false });
    this.element.addEventListener("touchcancel", this.handleTouchCancel, { passive: false });
    
    // Handle click events (for non-touch devices)
    this.element.addEventListener("click", this.handleClick);
    
    // Prevent context menu on long press
    this.element.addEventListener("contextmenu", this.handleContextMenu);
  }

  private handleTouchStart = (event: TouchEvent): void => {
    this.isTouch = true;
    this.touchStartTime = Date.now();
    
    const touch = event.touches[0];
    this.touchStartPosition = {
      x: touch.clientX,
      y: touch.clientY,
    };

    if (this.options.visualFeedback) {
      this.element.classList.add("touch-active");
    }

    if (this.options.preventDefault) {
      event.preventDefault();
    }
    if (this.options.stopPropagation) {
      event.stopPropagation();
    }
  };

  private handleTouchMove = (event: TouchEvent): void => {
    if (!this.touchStartPosition) return;

    const touch = event.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchStartPosition.x);
    const deltaY = Math.abs(touch.clientY - this.touchStartPosition.y);
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // If moved too far, cancel the touch
    if (distance > this.options.maxTouchMove) {
      this.cancelTouch();
    }
  };

  private handleTouchEnd = (event: TouchEvent): void => {
    if (!this.touchStartPosition) return;

    const touchDuration = Date.now() - this.touchStartTime;
    
    // Remove visual feedback
    if (this.options.visualFeedback) {
      this.element.classList.remove("touch-active");
    }

    // Check if touch is valid
    if (touchDuration >= this.options.touchDelay) {
      // Prevent ghost click
      event.preventDefault();
      
      if (this.options.stopPropagation) {
        event.stopPropagation();
      }

      // Execute the click handler
      if (this.clickHandler) {
        this.clickHandler(event);
      }
    }

    this.resetTouch();
  };

  private handleTouchCancel = (): void => {
    this.cancelTouch();
  };

  private handleClick = (event: MouseEvent): void => {
    // If this click event came after a touch event, ignore it
    if (this.isTouch) {
      event.preventDefault();
      event.stopPropagation();
      this.isTouch = false;
      return;
    }

    // Normal click handling for non-touch devices
    if (this.clickHandler) {
      this.clickHandler(event);
    }
  };

  private handleContextMenu = (event: Event): void => {
    // Prevent context menu on touch devices
    if (this.isTouch) {
      event.preventDefault();
    }
  };

  private cancelTouch(): void {
    if (this.options.visualFeedback) {
      this.element.classList.remove("touch-active");
    }
    this.resetTouch();
  }

  private resetTouch(): void {
    this.touchStartPosition = null;
    this.touchStartTime = 0;
    // Reset isTouch after a short delay to handle ghost clicks
    setTimeout(() => {
      this.isTouch = false;
    }, 300);
  }

  public destroy(): void {
    this.element.removeEventListener("touchstart", this.handleTouchStart);
    this.element.removeEventListener("touchmove", this.handleTouchMove);
    this.element.removeEventListener("touchend", this.handleTouchEnd);
    this.element.removeEventListener("touchcancel", this.handleTouchCancel);
    this.element.removeEventListener("click", this.handleClick);
    this.element.removeEventListener("contextmenu", this.handleContextMenu);
    
    if (this.options.visualFeedback) {
      this.element.classList.remove("touch-active");
    }
  }
}

/**
 * Helper function to add touch support to any element
 */
export function addTouchSupport(
  element: HTMLElement,
  clickHandler: (event: Event) => void,
  options?: TouchHandlerOptions
): TouchHandler {
  return new TouchHandler(element, clickHandler, options);
}

/**
 * CSS classes for touch feedback
 */
export const TOUCH_FEEDBACK_CSS = `
.touch-active {
  transform: scale(0.98);
  opacity: 0.8;
  transition: transform 0.1s ease, opacity 0.1s ease;
}

button.touch-active,
[role="button"].touch-active {
  background-color: var(--color-surface-active, rgba(255, 255, 255, 0.1));
}
`;