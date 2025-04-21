import { atom, WritableAtom } from "nanostores";

// --- Types --- //

/** Represents the size information obtained from ResizeObserverEntry */
export interface ElementSize {
  inlineSize: number; // Corresponds to width for horizontal writing modes
  blockSize: number; // Corresponds to height for horizontal writing modes
  contentRect?: DOMRectReadOnly; // Optional: provide the contentRect if needed
}

/** Options for observing element resize */
export interface ObserveResizeOptions {
  /** The ResizeObserver option for box sizing */
  box?: ResizeObserverBoxOptions; // 'content-box', 'border-box', 'device-pixel-content-box'
  /** Throttle time in milliseconds */
  throttleMs?: number;
}

/** Object returned by observeElementResize */
export interface ElementResizeObserver {
  /** Reactive atom store holding the element's dimensions */
  $elementSize: WritableAtom<ElementSize | null>;
  /** Function to stop observing the element */
  unobserve: () => void;
}

// --- Constants --- //

const DEFAULT_THROTTLE_MS = 150;

// --- Implementation --- //

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
    // Return a dummy observer that does nothing
    const $elementSize = atom<ElementSize | null>(null);
    return {
      $elementSize,
      unobserve: () => {},
    };
  }

  const { box = "border-box", throttleMs = DEFAULT_THROTTLE_MS } = options;
  let resizeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  const $elementSize = atom<ElementSize | null>(null); // Initialize with null

  const observer = new ResizeObserver((entries) => {
    if (!entries || entries.length === 0) {
      return;
    }

    // We only observe one element per observer instance in this setup
    const entry = entries[0];

    let size: ElementSize | null = null;

    // Prefer borderBoxSize or contentBoxSize based on options
    // Note: borderBoxSize/contentBoxSize are arrays, take the first element
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
      // Fallback to contentRect if specific box size is not available
      // (older browsers might only support contentRect)
      size = {
        inlineSize: entry.contentRect.width,
        blockSize: entry.contentRect.height,
        contentRect: entry.contentRect,
      };
    }

    // Throttle updates
    if (resizeTimeoutId) {
      clearTimeout(resizeTimeoutId);
    }

    resizeTimeoutId = setTimeout(() => {
      if (size) {
        $elementSize.set(size);
      }
      resizeTimeoutId = null;
    }, throttleMs);
  });

  // Start observing
  observer.observe(targetElement, { box });

  // Function to stop observing
  const unobserve = () => {
    if (resizeTimeoutId) {
      clearTimeout(resizeTimeoutId);
    }
    observer.unobserve(targetElement);
    observer.disconnect(); // Clean up the observer fully
  };

  return {
    $elementSize,
    unobserve,
  };
}
