import { BehaviorSubject } from "rxjs";

export type Orientation = "portrait" | "landscape";

/**
 * Determines the initial screen orientation.
 * @returns {Orientation} The initial orientation.
 */
function getInitialOrientation(): Orientation {
  // Check if window and matchMedia are available (for SSR or specific environments)
  if (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function"
  ) {
    return window.matchMedia("(orientation: portrait)").matches
      ? "portrait"
      : "landscape";
  }
  return "landscape"; // Default if window/matchMedia is not available
}

/**
 * An RxJS BehaviorSubject that holds the current layout orientation ('portrait' or 'landscape').
 * It automatically updates based on window orientation changes.
 */
const orientationSubject = new BehaviorSubject<Orientation>(
  getInitialOrientation(),
);

// --- Media Query Listener ---
let mediaQueryList: MediaQueryList | null = null;

function handleOrientationChange(event: MediaQueryListEvent): void {
  const newOrientation: Orientation = event.matches ? "portrait" : "landscape";
  if (orientationSubject.getValue() !== newOrientation) {
    orientationSubject.next(newOrientation);
  }
}

// Setup listener only in browser environment
if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  mediaQueryList = window.matchMedia("(orientation: portrait)");
  // Add listener using the recommended addEventListener method
  try {
    mediaQueryList.addEventListener("change", handleOrientationChange);
  } catch (e) {
    // Fallback for older browsers
    try {
      mediaQueryList.addListener(handleOrientationChange);
    } catch (fallbackError) {
      console.error("Failed to add orientation listener:", fallbackError);
    }
  }
} else {
  console.warn(
    "Cannot add orientation listener: window.matchMedia not available.",
  );
}

/**
 * Observable stream of layout orientation changes.
 * Emits the current orientation ('portrait' or 'landscape') immediately upon subscription
 * and whenever it changes.
 */
export const layoutOrientation$ = orientationSubject.asObservable();

/**
 * Cleans up the orientation listener.
 * Call this if the application needs explicit cleanup.
 */
export function cleanupOrientationListener(): void {
  if (mediaQueryList) {
    try {
      mediaQueryList.removeEventListener("change", handleOrientationChange);
    } catch (e) {
      // Fallback for older browsers
      try {
        mediaQueryList.removeListener(handleOrientationChange);
      } catch (fallbackError) {
        console.error("Failed to remove orientation listener:", fallbackError);
      }
    }
    mediaQueryList = null;
  }
}
