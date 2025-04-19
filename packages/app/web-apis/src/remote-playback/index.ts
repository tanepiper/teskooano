import { Observable, fromEvent, from, BehaviorSubject, defer, merge, of } from 'rxjs';
import { map, startWith, distinctUntilChanged, shareReplay, switchMap, catchError, tap, finalize } from 'rxjs/operators';

// Define necessary types based on the Remote Playback API spec
declare global {
  interface HTMLMediaElement {
    readonly remote: RemotePlayback;
    disableRemotePlayback: boolean;
  }

  interface RemotePlayback extends EventTarget {
    readonly state: 'disconnected' | 'connecting' | 'connected';
    onconnecting: ((this: RemotePlayback, ev: Event) => any) | null;
    onconnect: ((this: RemotePlayback, ev: Event) => any) | null;
    ondisconnect: ((this: RemotePlayback, ev: Event) => any) | null;

    watchAvailability(callback: (available: boolean) => void): Promise<number>;
    cancelWatchAvailability(id?: number): Promise<void>;
    prompt(): Promise<void>;
  }

  // Add constructor type to Window if needed, although it's usually accessed via element.remote
  // interface Window { RemotePlayback?: RemotePlayback; }
}

/** Type for the state emitted by remotePlaybackState$ */
export type RemotePlaybackStatus = 'disconnected' | 'connecting' | 'connected';

/** Type for the state emitted by remotePlaybackAvailability$ */
export interface RemotePlaybackAvailabilityState {
  isSupported: boolean;
  isAvailable: boolean;
  error?: string;
  watchId?: number;
}

/** Type for the state emitted by remotePlaybackConnectionState$ */
export interface RemotePlaybackConnectionState {
  isSupported: boolean;
  status: RemotePlaybackStatus;
  error?: string;
}


/**
 * Checks if the Remote Playback API is likely available for a given media element.
 * @param element The HTMLMediaElement (<video> or <audio>) to check.
 * @returns `true` if `element.remote` exists, `false` otherwise.
 */
export function isRemotePlaybackSupported(element: HTMLMediaElement): boolean {
  return typeof element.remote !== 'undefined';
}

/**
 * Creates an RxJS Observable that watches for the availability of remote playback devices
 * for a given media element.
 *
 * @param element The HTMLMediaElement (<video> or <audio>) to monitor.
 * @returns An Observable emitting RemotePlaybackAvailabilityState.
 */
export function watchRemotePlaybackAvailability(element: HTMLMediaElement): Observable<RemotePlaybackAvailabilityState> {
  return new Observable<RemotePlaybackAvailabilityState>(subscriber => {
    if (!isRemotePlaybackSupported(element)) {
      subscriber.next({ isSupported: false, isAvailable: false, error: 'Remote Playback API not supported on this element.' });
      subscriber.complete();
      return;
    }

    let watchId: number | undefined;
    let isWatching = true;

    const initialState: RemotePlaybackAvailabilityState = {
        isSupported: true,
        isAvailable: false, // Assume not available until callback confirms
    };
    subscriber.next(initialState); // Emit initial state

    const callback = (available: boolean) => {
       if (isWatching) { // Ensure callback doesn't fire after cleanup
           const newState = { ...initialState, isAvailable: available, watchId: watchId };
           subscriber.next(newState);
       }
    };

    element.remote!.watchAvailability(callback)
      .then(id => {
          if (!isWatching) { // Handle race condition if unsubscribed before promise resolves
              element.remote!.cancelWatchAvailability(id).catch(e => console.error("Error cancelling watchAvailability after unsubscribe:", e));
              return;
          }
          console.log(`Started watching remote playback availability (ID: ${id})`);
          watchId = id;
          // Emit state again with the watchId included
           const newState = { ...initialState, isAvailable: initialState.isAvailable, watchId: watchId }; // Re-emit with ID
           subscriber.next(newState);
      })
      .catch(err => {
        console.error('Failed to watch remote playback availability:', err);
        subscriber.next({ ...initialState, error: `Failed to watch availability: ${err.message}` });
        // Don't complete, allow potential retries or manual prompt
      });

    // Cleanup function
    return () => {
      isWatching = false;
      if (watchId !== undefined && element.remote) {
        console.log(`Stopping watching remote playback availability (ID: ${watchId})`);
        element.remote.cancelWatchAvailability(watchId)
           .catch(err => console.error('Failed to cancel remote playback availability watch:', err));
      } else if (watchId === undefined) {
         // If promise hadn't resolved yet, try cancelling without ID (might work)
         element.remote?.cancelWatchAvailability()
            .catch(err => console.error('Failed to cancel remote playback availability watch (no ID):', err));
      }
       console.log("Remote playback availability observable finalized.");
    };
  }).pipe(
      distinctUntilChanged((prev, curr) => prev.isAvailable === curr.isAvailable && prev.error === curr.error && prev.watchId === curr.watchId),
      shareReplay({ bufferSize: 1, refCount: true })
  );
}

/**
 * Prompts the user to select a remote playback device for the given media element.
 * Disables remote playback temporarily during the prompt.
 * @param element The HTMLMediaElement (<video> or <audio>).
 * @returns A Promise that resolves when the connection is successful or the prompt is dismissed,
 *          and rejects if the API is unsupported or the prompt fails.
 */
export async function promptRemotePlaybackDevice(element: HTMLMediaElement): Promise<void> {
    if (!isRemotePlaybackSupported(element)) {
        return Promise.reject(new Error('Remote Playback API not supported on this element.'));
    }

    // Temporarily disable remote playback on the element itself to avoid conflicts
    // although this might not be strictly necessary depending on UA behavior.
    const wasDisabled = element.disableRemotePlayback;
    element.disableRemotePlayback = true;

    try {
        console.log('Prompting for remote playback device...');
        await element.remote!.prompt();
        console.log('Remote playback prompt finished.');
        // Note: This promise resolves even if the user cancels. Check state separately.
    } catch (err: any) {
        console.error('Failed to prompt for remote playback device:', err);
        throw err; // Re-throw the error
    } finally {
        // Restore original setting
        element.disableRemotePlayback = wasDisabled;
    }
}

/**
 * Creates an RxJS Observable that emits the current connection state of remote playback
 * for a given media element.
 *
 * @param element The HTMLMediaElement (<video> or <audio>) to monitor.
 * @returns An Observable emitting RemotePlaybackConnectionState.
 */
export function getRemotePlaybackState(element: HTMLMediaElement): Observable<RemotePlaybackConnectionState> {

  const initialState: RemotePlaybackConnectionState = {
    isSupported: isRemotePlaybackSupported(element),
    status: element.remote?.state ?? 'disconnected', // Initial state from element
  };

  if (!initialState.isSupported) {
     return new BehaviorSubject<RemotePlaybackConnectionState>({...initialState, error: 'Remote Playback API not supported on this element.'}).asObservable();
  }

  // Events to trigger state updates
  const connecting$ = fromEvent(element.remote!, 'connecting').pipe(map(() => 'connecting' as const));
  const connect$ = fromEvent(element.remote!, 'connect').pipe(map(() => 'connected' as const));
  const disconnect$ = fromEvent(element.remote!, 'disconnect').pipe(map(() => 'disconnected' as const));

  return merge(connecting$, connect$, disconnect$).pipe(
    startWith(initialState.status), // Emit initial state derived from element.remote.state
    distinctUntilChanged(),
    map(status => ({ isSupported: true, status })), // Map event strings to state objects
    shareReplay({ bufferSize: 1, refCount: true }),
    catchError((err, caught) => {
       console.error("Error in remote playback state stream:", err);
       // Emit an error state but keep the stream alive if possible
       return of({ isSupported: true, status: 'disconnected' as RemotePlaybackStatus, error: `Stream error: ${err.message}` });
    }),
    finalize(() => console.log("Remote playback state observable finalized."))
  );
} 