import { BehaviorSubject } from "rxjs";

export type Orientation = "portrait" | "landscape";

/**
 * Determines the initial screen orientation.
 * @returns {Orientation} The initial orientation.
 */
function getInitialOrientation(): Orientation {
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
 * An RxJS BehaviorSubject that holds the current layout orientation ('portrait' or 'landscape').
 * It automatically updates based on window orientation changes.
 */
const orientationSubject = new BehaviorSubject<Orientation>(
  getInitialOrientation(),
);

let mediaQueryList: MediaQueryList | null = null;

function handleOrientationChange(event: MediaQueryListEvent): void {
  const newOrientation: Orientation = event.matches ? "portrait" : "landscape";
  if (orientationSubject.getValue() !== newOrientation) {
    orientationSubject.next(newOrientation);
  }
}

if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
  mediaQueryList = window.matchMedia("(orientation: portrait)");

  try {
    mediaQueryList.addEventListener("change", handleOrientationChange);
  } catch (e) {
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
      try {
        mediaQueryList.removeListener(handleOrientationChange);
      } catch (fallbackError) {
        console.error("Failed to remove orientation listener:", fallbackError);
      }
    }
    mediaQueryList = null;
  }
}
