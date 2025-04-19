import { Observable, fromEvent, merge } from "rxjs";
import {
  map,
  startWith,
  shareReplay,
  distinctUntilChanged,
} from "rxjs/operators";

/**
 * Interface for Device Orientation event data.
 */
export interface DeviceOrientationData {
  /** Rotation around the Z axis (0-360). Represents compass direction if the device is flat. */
  alpha: number | null;
  /** Rotation around the X axis (-180 to 180). Represents front-to-back tilt. */
  beta: number | null;
  /** Rotation around the Y axis (-90 to 90). Represents left-to-right tilt. */
  gamma: number | null;
  /** A boolean indicating if the orientation is calculated relative to the Earth's coordinate frame. */
  absolute: boolean;
  /** Indicates if the Device Orientation API is supported by the browser. */
  isSupported: boolean;
  /** Current permission state ('prompt', 'granted', 'denied'). */
  permissionState: PermissionState | "prompt";
  /** Error message if permission denied or API not supported */
  error?: string;
}

const initialOrientationState: DeviceOrientationData = {
  alpha: null,
  beta: null,
  gamma: null,
  absolute: false,
  isSupported:
    typeof window !== "undefined" && "DeviceOrientationEvent" in window,
  permissionState: "prompt", // Assume prompt needed initially
};

// Check for the specific permission request method needed for iOS 13+
const requiresPermissionRequest =
  typeof (DeviceOrientationEvent as any)?.requestPermission === "function";

let permissionState: PermissionState | "prompt" = "prompt";
if (!requiresPermissionRequest) {
  // If no permission request method exists, assume granted (older browsers/Android)
  permissionState = "granted";
  initialOrientationState.permissionState = "granted";
} else {
  // For iOS 13+, we need to explicitly check/request
  initialOrientationState.permissionState = "prompt";
}

// Internal function to create the observable
function createOrientationObservable(): Observable<DeviceOrientationData> {
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) {
    return new Observable((subscriber) => {
      subscriber.next({
        ...initialOrientationState,
        isSupported: false,
        error: "DeviceOrientationEvent not supported.",
      });
      subscriber.complete();
    });
  }

  // If permission is required but not granted, return state indicating prompt needed
  if (requiresPermissionRequest && permissionState !== "granted") {
    return new Observable((subscriber) => {
      subscriber.next({
        ...initialOrientationState,
        permissionState: permissionState,
        error:
          permissionState === "denied"
            ? "Permission denied."
            : "Permission required.",
      });
      // Keep the observable alive in case permission is granted later via requestPermission()
    });
  }

  // If supported and permission granted (or not needed)
  return fromEvent<DeviceOrientationEvent>(window, "deviceorientation").pipe(
    map(
      (event): DeviceOrientationData => ({
        alpha: event.alpha,
        beta: event.beta,
        gamma: event.gamma,
        absolute: event.absolute,
        isSupported: true,
        permissionState: "granted",
      }),
    ),
    startWith(<DeviceOrientationData>{
      ...initialOrientationState,
      isSupported: true,
      permissionState: "granted",
    }),
    distinctUntilChanged(
      (prev, curr) =>
        prev.alpha === curr.alpha &&
        prev.beta === curr.beta &&
        prev.gamma === curr.gamma,
    ), // Only emit when values actually change
  );
}

/**
 * An RxJS Observable that emits `DeviceOrientationData` whenever the device orientation changes.
 * It handles browser support checks and permission state (for iOS 13+).
 *
 * Use `requestDeviceOrientationPermission()` before subscribing on iOS 13+ devices.
 */
export const deviceOrientation$ = createOrientationObservable().pipe(
  shareReplay({ bufferSize: 1, refCount: true }), // Share the source and replay the last emission
);

/**
 * Requests permission to access Device Orientation events, specifically for iOS 13+.
 * This function should be called in response to a user gesture (e.g., a button click).
 *
 * @returns A Promise that resolves to `true` if permission is granted, `false` otherwise.
 */
export async function requestDeviceOrientationPermission(): Promise<boolean> {
  if (!requiresPermissionRequest) {
    console.log(
      "DeviceOrientationEvent.requestPermission() not needed or not supported.",
    );
    return true; // Permission not required
  }

  try {
    const state: PermissionState = await (
      DeviceOrientationEvent as any
    ).requestPermission();
    permissionState = state;
    if (state === "granted") {
      // Manually trigger an update to the observable if it exists and permission was granted
      // This is a bit hacky, might need a cleaner way to re-trigger observable creation
      (deviceOrientation$ as any)._subscribe(
        new (require("rxjs").Subscriber)(),
      );
      return true;
    } else {
      console.warn("Device orientation permission denied.");
      // Trigger update with denied state
      (deviceOrientation$ as any)._subscribe(
        new (require("rxjs").Subscriber)(),
      );
      return false;
    }
  } catch (error) {
    console.error("Error requesting device orientation permission:", error);
    permissionState = "denied"; // Assume denied on error
    // Trigger update with denied state
    (deviceOrientation$ as any)._subscribe(new (require("rxjs").Subscriber)());
    return false;
  }
}
