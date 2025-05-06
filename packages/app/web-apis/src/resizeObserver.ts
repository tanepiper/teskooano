import { BehaviorSubject } from "rxjs";

/** Represents the size information obtained from ResizeObserverEntry */
export interface ElementSize {
  inlineSize: number;
  blockSize: number;
  contentRect?: DOMRectReadOnly;
}

/** Options for observing element resize */
export interface ObserveResizeOptions {
  /** The ResizeObserver option for box sizing */
  box?: ResizeObserverBoxOptions;
  /** Throttle time in milliseconds */
  throttleMs?: number;
}

/** Object returned by observeElementResize */
export interface ElementResizeObserver {
  /** Reactive BehaviorSubject holding the element's dimensions */
  $elementSize: BehaviorSubject<ElementSize | null>;
  /** Function to stop observing the element */
  unobserve: () => void;
}

const DEFAULT_THROTTLE_MS = 150;

/**
 * Observes an HTML element for size changes using ResizeObserver and updates a Nanostore atom.
 *
 * @param targetElement The HTML element to observe.
 * @param options Configuration options for the observer and throttling.
 * @returns An object containing the reactive size store (`$elementSize`) and an `unobserve` function.
 *          Returns null if ResizeObserver is not supported or targetElement is invalid.
 */
export function observeElementResize(
  targetElement: HTMLElement | null,
  options: ObserveResizeOptions = {},
): ElementResizeObserver | null {
  if (
    typeof window === "undefined" ||
    !("ResizeObserver" in window) ||
    !targetElement
  ) {
    console.warn(
      "ResizeObserver not supported or target element is invalid. Cannot observe element resize.",
    );

    const $elementSize = new BehaviorSubject<ElementSize | null>(null);
    return {
      $elementSize,
      unobserve: () => {},
    };
  }

  const { box = "border-box", throttleMs = DEFAULT_THROTTLE_MS } = options;
  let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const $elementSize = new BehaviorSubject<ElementSize | null>(null);

  const observer = new ResizeObserver((entries) => {
    if (!entries || entries.length === 0) {
      return;
    }

    const entry = entries[0];

    let size: ElementSize | null = null;

    if (box === "border-box" && entry.borderBoxSize?.length > 0) {
      size = {
        inlineSize: entry.borderBoxSize[0].inlineSize,
        blockSize: entry.borderBoxSize[0].blockSize,
        contentRect: entry.contentRect,
      };
    } else if (box === "content-box" && entry.contentBoxSize?.length > 0) {
      size = {
        inlineSize: entry.contentBoxSize[0].inlineSize,
        blockSize: entry.contentBoxSize[0].blockSize,
        contentRect: entry.contentRect,
      };
    } else if (entry.contentRect) {
      size = {
        inlineSize: entry.contentRect.width,
        blockSize: entry.contentRect.height,
        contentRect: entry.contentRect,
      };
    }

    if (resizeTimeoutId) {
      clearTimeout(resizeTimeoutId);
    }

    resizeTimeoutId = setTimeout(() => {
      if (size) {
        $elementSize.next(size);
      }
      resizeTimeoutId = null;
    }, throttleMs);
  });

  observer.observe(targetElement, { box });

  const unobserve = () => {
    if (resizeTimeoutId) {
      clearTimeout(resizeTimeoutId);
    }
    observer.unobserve(targetElement);
    observer.disconnect();
  };

  return {
    $elementSize,
    unobserve,
  };
}
