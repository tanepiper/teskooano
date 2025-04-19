import {
  Observable,
  Subject,
  interval,
  BehaviorSubject,
  merge,
  fromEvent,
} from 'rxjs';
import {
  map,
  distinctUntilChanged,
  startWith,
  shareReplay,
  takeUntil,
  switchMap,
  filter,
  tap,
  scan,
} from 'rxjs/operators';

/**
 * Checks if the Gamepad API is supported by the browser.
 * @returns `true` if `navigator.getGamepads` exists, `false` otherwise.
 */
export function isGamepadSupported(): boolean {
  return typeof navigator !== 'undefined' && 'getGamepads' in navigator;
}

/** Represents the state of connected gamepads. */
export interface GamepadState {
  /** An array of connected Gamepad objects, potentially containing nulls. */
  gamepads: (Gamepad | null)[];
  /** Whether the Gamepad API is supported. */
  isSupported: boolean;
}

const initialGamepadState: GamepadState = {
  gamepads: [],
  isSupported: isGamepadSupported(),
};

// Subject to manually stop the polling
const stopPolling$ = new Subject<void>();
// Subject to trigger polling updates
const pollTrigger$ = new BehaviorSubject<void>(undefined);

// Observable for gamepad connection events
const gamepadConnected$ = fromEvent<GamepadEvent>(window, 'gamepadconnected').pipe(
  tap(ev => console.log('Gamepad connected:', ev.gamepad.id)),
  map(event => ({ type: 'connected' as const, gamepad: event.gamepad }))
);

// Observable for gamepad disconnection events
const gamepadDisconnected$ = fromEvent<GamepadEvent>(window, 'gamepaddisconnected').pipe(
  tap(ev => console.log('Gamepad disconnected:', ev.gamepad.id)),
  map(event => ({ type: 'disconnected' as const, gamepad: event.gamepad }))
);

/**
 * Polls the navigator for the current state of all gamepads.
 * Necessary because button/axis changes don't fire events.
 * @returns An array of Gamepad objects or nulls.
 */
function pollGamepads(): (Gamepad | null)[] {
  if (!isGamepadSupported()) {
    return [];
  }
  // Need to convert the GamepadList to a standard array
  const gamepads = navigator.getGamepads();
  return Array.from(gamepads);
}

/**
 * An RxJS Observable that emits the state of connected gamepads.
 * It checks for connections/disconnections and polls for button/axis changes
 * using `requestAnimationFrame`.
 *
 * Note: Due to the polling nature, this can have performance implications.
 * It automatically stops polling when there are no subscribers.
 */
export const gamepadState$: Observable<GamepadState> = new Observable<GamepadState>(subscriber => {
    if (!isGamepadSupported()) {
      subscriber.next({ gamepads: [], isSupported: false });
      subscriber.complete();
      return;
    }

    let animationFrameId: number | null = null;
    let previousState: (Gamepad | null)[] = [];

    const connectionSubscription = merge(gamepadConnected$, gamepadDisconnected$)
      .pipe(
        // When connection changes, immediately poll
        tap(() => pollTrigger$.next()),
      )
      .subscribe(); // Simple subscription to trigger polling

    const pollSubscription = pollTrigger$.pipe(
      // Use requestAnimationFrame timing for polling efficiency
      switchMap(() => new Observable<void>(sub => {
          animationFrameId = requestAnimationFrame(() => {
              sub.next();
              sub.complete();
          });
          return () => {
              if (animationFrameId !== null) {
                  cancelAnimationFrame(animationFrameId);
                  animationFrameId = null;
              }
          };
      })),
      map(pollGamepads),
      // Only emit if the gamepads array has actually changed
      distinctUntilChanged((prev, curr) => {
          if (prev.length !== curr.length) return false;
          // Basic check: might need deeper comparison if needed
          return prev.every((p, i) =>
              p?.id === curr[i]?.id &&
              p?.connected === curr[i]?.connected &&
              p?.timestamp === curr[i]?.timestamp
          );
      }),
      tap(newState => previousState = newState), // Update previous state
      map(gamepads => ({ gamepads, isSupported: true })),
      startWith({ gamepads: pollGamepads(), isSupported: true }), // Emit initial state
      // Keep polling as long as the outer observable is subscribed
      tap(() => {
          // Schedule the next poll if still subscribed
          if (!subscriber.closed && animationFrameId === null) { // Avoid race conditions
             animationFrameId = requestAnimationFrame(() => {
                  animationFrameId = null; // Reset before next trigger
                  pollTrigger$.next();
              });
          }
      }),
    ).subscribe(subscriber); // Forward emissions to the main subscriber

    // Cleanup function
    return () => {
        connectionSubscription.unsubscribe();
        pollSubscription.unsubscribe();
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
        }
        console.log('Gamepad polling stopped.');
    };
}).pipe(
    shareReplay({ bufferSize: 1, refCount: true }) // Share polling among subscribers
);

/**
 * Retrieves the current state of all connected gamepads non-reactively.
 * @returns GamepadState object.
 */
export function getCurrentGamepadState(): GamepadState {
    return {
        gamepads: pollGamepads(),
        isSupported: isGamepadSupported(),
    };
}
