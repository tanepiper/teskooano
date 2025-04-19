/**
 * Experimental: Represents the Idle Detector.
 * This interface might change as the specification evolves.
 */
declare class IdleDetector {
  constructor();
  readonly userState: "active" | "idle";
  readonly screenState: "locked" | "unlocked";
  onchange: ((this: IdleDetector, ev: Event) => any) | null;
  start(options?: { threshold: number; signal?: AbortSignal }): Promise<void>;
  addEventListener(
    type: "change",
    listener: (this: IdleDetector, ev: Event) => any,
    options?: boolean | AddEventListenerOptions,
  ): void;
  removeEventListener(
    type: "change",
    listener: (this: IdleDetector, ev: Event) => any,
    options?: boolean | EventListenerOptions,
  ): void;
}

declare global {
  interface Window {
    IdleDetector?: typeof IdleDetector;
  }
  interface WorkerGlobalScope {
    IdleDetector?: typeof IdleDetector;
  }
  interface PermissionStatus {
    onchange: ((this: PermissionStatus, ev: Event) => any) | null;
  }
}

/**
 * Checks if the Idle Detection API is likely supported by the browser.
 * Note: Actual availability might depend on user settings or permissions.
 * @returns `true` if `window.IdleDetector` exists, `false` otherwise.
 */
export function isIdleDetectionSupported(): boolean {
  return typeof window !== "undefined" && "IdleDetector" in window;
}

/**
 * Callback function type for idle state changes.
 */
export type IdleChangeCallback = (
  state: { user: "active" | "idle"; screen: "locked" | "unlocked" },
  detector: IdleDetector,
) => void;

/**
 * Interface for the controls returned by `observeIdleState`.
 */
export interface IdleObserverControls {
  /** Stop observing idle state changes and release the detector. */
  stop: () => void;
  /** The underlying IdleDetector instance (can be null if not supported/granted). */
  detector: IdleDetector | null;
}

/**
 * Experimental: Observes the user's idle state (active/idle) and screen state (locked/unlocked).
 * Requires the 'idle-detection' permission, which must be requested first.
 *
 * @param callback The function to call when the idle or screen state changes.
 * @param options Configuration options.
 * @param options.threshold Minimum idle time in milliseconds (default 60000ms).
 * @returns An object with a `stop` function and the detector instance, or null if not supported or permission denied.
 */
export async function observeIdleState(
  callback: IdleChangeCallback,
  options: { threshold?: number } = {},
): Promise<IdleObserverControls | null> {
  if (!isIdleDetectionSupported()) {
    console.warn("Idle Detection API is not supported.");
    return null;
  }

  try {
    // 1. Check Permission Status
    const permissionStatus = await navigator.permissions.query({
      name: "idle-detection" as PermissionName, // Cast needed as type might be missing
    });

    if (permissionStatus.state !== "granted") {
      console.warn(
        `Idle detection permission state is ${permissionStatus.state}. Please request permission first.`,
      );
      // Optionally, listen for changes in case permission is granted later
      // permissionStatus.onchange = () => { /* retry logic */ };
      return null;
    }

    // 2. Create and Start Detector
    const controller = new AbortController();
    const signal = controller.signal;
    const threshold = options.threshold ?? 60000;

    const detector = new window.IdleDetector!(); // Assert non-null based on support check

    // Listener for state changes
    const changeListener = () => {
      if (!detector) return;
      callback(
        {
          user: detector.userState,
          screen: detector.screenState,
        },
        detector,
      );
    };

    detector.addEventListener("change", changeListener);

    // Start the detector
    await detector.start({ threshold, signal });
    console.log("Idle detector started.");

    // Initial callback trigger
    changeListener();

    // Return controls
    return {
      stop: () => {
        controller.abort(); // This stops the detector via the signal
        if (detector) {
          detector.removeEventListener("change", changeListener);
        }
        console.log("Idle detector stopped.");
      },
      detector,
    };
  } catch (err: any) {
    // Log specific error messages if available
    if (err.name === "NotAllowedError") {
      console.error(
        "Idle detection permission denied or requires user activation.",
      );
    } else {
      console.error("Failed to start idle detector:", err);
    }
    return null;
  }
}

/**
 * Experimental: Requests permission to use the Idle Detection API.
 * This should ideally be called within a user gesture event handler.
 *
 * @returns A Promise resolving to the `PermissionState` ('granted' or 'denied').
 */
export async function requestIdleDetectionPermission(): Promise<
  PermissionState | "prompt"
> {
  if (!isIdleDetectionSupported()) {
    console.warn(
      "Idle Detection API is not supported, cannot request permission.",
    );
    return "denied";
  }
  try {
    // Attempting to query often implicitly requests if not granted, but best practice is explicit request if needed
    // However, Idle API currently doesn't have an explicit request method, relies on query + user activation.
    const permissionStatus = await navigator.permissions.query({
      name: "idle-detection" as PermissionName,
    });
    console.log(`Idle detection permission status: ${permissionStatus.state}`);
    // Re-check state after query, which might have prompted user
    return permissionStatus.state;
  } catch (err) {
    console.error("Error querying idle detection permission:", err);
    return "denied";
  }
}

import { Observable, Subject, from, defer, EMPTY, BehaviorSubject } from "rxjs";
import {
  switchMap,
  finalize,
  shareReplay,
  catchError,
  startWith,
  distinctUntilChanged,
} from "rxjs/operators";

/**
 * Interface for the state emitted by the idleState$ observable.
 */
export interface IdleObservableState {
  user: "active" | "idle" | null;
  screen: "locked" | "unlocked" | null;
  permissionState: PermissionState | "prompt";
  isSupported: boolean;
  error?: string;
}

const initialIdleObservableState: IdleObservableState = {
  user: null,
  screen: null,
  permissionState: "prompt",
  isSupported: isIdleDetectionSupported(),
};

// Subject to manage the permission state
const idlePermissionSubject = new BehaviorSubject<PermissionState | "prompt">(
  "prompt",
);

// Update permission state when queried
async function updateIdlePermissionState() {
  if (initialIdleObservableState.isSupported) {
    try {
      const status = await navigator.permissions.query({
        name: "idle-detection" as PermissionName,
      });
      idlePermissionSubject.next(status.state);
      // Listen for future changes (e.g., user revokes permission)
      status.onchange = () => {
        idlePermissionSubject.next(status.state);
      };
    } catch (err) {
      console.error("Error querying idle permission:", err);
      idlePermissionSubject.next("denied"); // Assume denied on error
    }
  } else {
    idlePermissionSubject.next("denied"); // Not supported is equivalent to denied
  }
}
// Initial check
updateIdlePermissionState();

/**
 * Experimental: An RxJS Observable that emits the user's idle state (active/idle)
 * and screen state (locked/unlocked) whenever they change.
 * Handles permission status automatically.
 *
 * Use `requestIdleDetectionPermission()` to prompt the user if the initial
 * `permissionState` is 'prompt'.
 *
 * @param threshold Minimum idle time in milliseconds before emitting 'idle' (default 60000ms).
 */
export function createIdleStateObservable(
  threshold: number = 60000,
): Observable<IdleObservableState> {
  return idlePermissionSubject.pipe(
    switchMap((permissionState) => {
      if (!initialIdleObservableState.isSupported) {
        return from([
          {
            ...initialIdleObservableState,
            isSupported: false,
            permissionState: "denied",
            error: "Idle Detection API not supported.",
          } as IdleObservableState,
        ]);
      }
      if (permissionState !== "granted") {
        return from([
          {
            ...initialIdleObservableState,
            permissionState,
            error:
              permissionState === "denied"
                ? "Permission denied."
                : "Permission required.",
          } as IdleObservableState,
        ]);
      }

      // Permission granted, attempt to start detector
      return new Observable<IdleObservableState>((subscriber) => {
        let detector: IdleDetector | null = null;
        let abortController = new AbortController();

        const startDetector = async () => {
          try {
            detector = new window.IdleDetector!();
            const signal = abortController.signal;

            const changeListener = () => {
              if (!detector) return;
              subscriber.next({
                user: detector.userState,
                screen: detector.screenState,
                permissionState: "granted",
                isSupported: true,
              });
            };

            detector.addEventListener("change", changeListener);
            await detector.start({ threshold, signal });

            // Emit initial state after start
            subscriber.next({
              user: detector.userState,
              screen: detector.screenState,
              permissionState: "granted",
              isSupported: true,
            });

            console.log("Idle detector started via Observable.");
          } catch (err: any) {
            console.error("Failed to start idle detector for Observable:", err);
            subscriber.next({
              ...initialIdleObservableState,
              permissionState: "granted", // Still granted, but failed to start
              error: `Failed to start detector: ${err.message}`,
            });
            // Don't complete, permission might still be valid
          }
        };

        startDetector();

        // Cleanup
        return () => {
          abortController.abort();
          if (detector) {
            // No removeEventListener needed, abort signal handles cleanup
          }
          detector = null;
          console.log("Idle detector stopped via Observable cleanup.");
        };
      });
    }),
    startWith(initialIdleObservableState), // Emit initial default state
    distinctUntilChanged(
      (prev, curr) =>
        prev.user === curr.user &&
        prev.screen === curr.screen &&
        prev.permissionState === curr.permissionState &&
        prev.error === curr.error,
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );
}

// Create a default instance of the observable
export const idleState$ = createIdleStateObservable();
