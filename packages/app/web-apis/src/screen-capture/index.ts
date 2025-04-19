import { Observable, from, of, throwError } from "rxjs";
import { catchError, tap, map } from "rxjs/operators";

// Augment existing MediaDevices interface and define necessary types
declare global {
  interface MediaDevices {
    getDisplayMedia(
      constraints?: DisplayMediaStreamConstraints,
    ): Promise<MediaStream>;
  }

  // Based on MDN documentation for DisplayMediaStreamConstraints
  interface DisplayMediaStreamConstraints {
    video?: boolean | MediaTrackConstraints;
    audio?: boolean | MediaTrackConstraints;
    // Screen Capture specific constraints
    preferCurrentTab?: boolean; // Example constraint (check spec/browser support)
    selfBrowserSurface?: "include" | "exclude"; // Example
    surfaceSwitching?: "include" | "exclude"; // Example
    systemAudio?: "include" | "exclude"; // Example
    controller?: any; // For CaptureController, type broadly for now
  }

  // Augment MediaTrackConstraints for Screen Capture options
  interface MediaTrackConstraints {
    displaySurface?: "application" | "browser" | "monitor" | "window";
    logicalSurface?: boolean;
    suppressLocalAudioPlayback?: boolean; // Experimental
    // Add other constraints as needed, e.g., cursor
    cursor?: "always" | "motion" | "never";
  }
}

/**
 * Checks if the Screen Capture API (getDisplayMedia) is likely supported.
 * @returns `true` if `navigator.mediaDevices.getDisplayMedia` exists, `false` otherwise.
 */
export function isScreenCaptureSupported(): boolean {
  return (
    typeof navigator !== "undefined" &&
    typeof navigator.mediaDevices !== "undefined" &&
    typeof navigator.mediaDevices.getDisplayMedia !== "undefined"
  );
}

/**
 * Requests a MediaStream for screen capture using `navigator.mediaDevices.getDisplayMedia()`.
 * This will typically prompt the user to select a display surface (screen, window, tab).
 *
 * @param options Constraints for the requested display media (video, audio, specific surfaces, etc.).
 * @returns A Promise resolving with the MediaStream if successful, or rejecting on error/denial.
 */
export async function requestDisplayMedia(
  options?: DisplayMediaStreamConstraints,
): Promise<MediaStream> {
  if (!isScreenCaptureSupported()) {
    return Promise.reject(
      new Error("Screen Capture API (getDisplayMedia) is not supported."),
    );
  }

  try {
    console.log("Requesting display media with options:", options);
    const stream = await navigator.mediaDevices.getDisplayMedia(options);
    console.log("Display media stream obtained.");

    // Add listener to stop tracks when the stream ends (e.g., user clicks "Stop sharing")
    stream.getTracks().forEach((track) => {
      track.onended = () => {
        console.log(
          `Screen capture track (${track.kind}: ${track.label || "N/A"}) ended.`,
        );
        // You might want to signal the end of capture here
        // e.g., call a cleanup function or emit an event
      };
    });

    return stream;
  } catch (err: any) {
    console.error("Failed to get display media:", err);
    // Handle specific errors (e.g., NotAllowedError for permission denial)
    if (err.name === "NotAllowedError") {
      console.warn("Screen capture permission denied by user.");
    }
    throw err; // Re-throw the error for the caller to handle
  }
}

/**
 * An RxJS Observable wrapper around `requestDisplayMedia`.
 * Emits the MediaStream upon successful capture, then completes.
 * Emits an error if capture fails or is denied.
 *
 * @param options Constraints for the requested display media.
 * @returns An Observable emitting the MediaStream or an error.
 */
export function requestDisplayMediaObservable(
  options?: DisplayMediaStreamConstraints,
): Observable<MediaStream> {
  return from(requestDisplayMedia(options)).pipe(
    tap((stream) =>
      console.log("Display media stream obtained via Observable."),
    ),
    catchError((err) => {
      console.error(
        "Error obtaining display media stream via Observable:",
        err,
      );
      // Return an observable that emits the error
      return throwError(() => err); // Use throwError factory
      // Alternatively, return EMPTY or a specific error object:
      // return of(err).pipe(map(e => { throw e; }));
      // return EMPTY;
    }),
    // Note: This observable completes after emitting the stream once.
    // Further interaction (like track ending) needs separate handling if required reactively.
  );
}
