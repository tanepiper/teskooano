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
    const permissionStatus = await navigator.permissions.query({
      name: "idle-detection" as PermissionName,
    });

    if (permissionStatus.state !== "granted") {
      console.warn(
        `Idle detection permission state is ${permissionStatus.state}. Please request permission first.`,
      );

      return null;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const threshold = options.threshold ?? 60000;

    const detector = new window.IdleDetector!();

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

    await detector.start({ threshold, signal });

    changeListener();

    return {
      stop: () => {
        controller.abort();
        if (detector) {
          detector.removeEventListener("change", changeListener);
        }
      },
      detector,
    };
  } catch (err: any) {
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
    const permissionStatus = await navigator.permissions.query({
      name: "idle-detection" as PermissionName,
    });

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

const idlePermissionSubject = new BehaviorSubject<PermissionState | "prompt">(
  "prompt",
);

async function updateIdlePermissionState() {
  if (initialIdleObservableState.isSupported) {
    try {
      const status = await navigator.permissions.query({
        name: "idle-detection" as PermissionName,
      });
      idlePermissionSubject.next(status.state);

      status.onchange = () => {
        idlePermissionSubject.next(status.state);
      };
    } catch (err) {
      console.error("Error querying idle permission:", err);
      idlePermissionSubject.next("denied");
    }
  } else {
    idlePermissionSubject.next("denied");
  }
}

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

            subscriber.next({
              user: detector.userState,
              screen: detector.screenState,
              permissionState: "granted",
              isSupported: true,
            });
          } catch (err: any) {
            console.error("Failed to start idle detector for Observable:", err);
            subscriber.next({
              ...initialIdleObservableState,
              permissionState: "granted",
              error: `Failed to start detector: ${err.message}`,
            });
          }
        };

        startDetector();

        return () => {
          abortController.abort();
          if (detector) {
          }
          detector = null;
        };
      });
    }),
    startWith(initialIdleObservableState),
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

export const idleState$ = createIdleStateObservable();
