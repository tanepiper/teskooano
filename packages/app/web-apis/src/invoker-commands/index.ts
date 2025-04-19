import { Observable, fromEvent, Subject } from "rxjs";
import { filter, map, share, takeUntil } from "rxjs/operators";

// Extend HTMLButtonElement interface for type safety
declare global {
  interface HTMLButtonElement {
    commandForElement: HTMLElement | null;
    command: string | null;

    // Non-standard properties often associated (might exist depending on implementation)
    commandTargetElement?: HTMLElement | null; // Alternative or older name?
  }
  // Define the CommandEvent if not already globally available
  interface CommandEvent extends Event {
    readonly command: string;
  }

  interface GlobalEventHandlersEventMap {
    command: CommandEvent;
  }

  interface Window {
    // Define the expected constructor signature for CommandEvent
    CommandEvent?: {
      new (
        type: "command",
        eventInitDict?: EventInit & { command?: string },
      ): CommandEvent;
      prototype: CommandEvent;
    };
  }
}

/**
 * Checks if the Invoker Commands API seems supported by checking button prototype.
 * Note: Actual behavior depends on browser implementation and feature flags.
 * @returns `true` if `commandForElement` is on `HTMLButtonElement.prototype`, `false` otherwise.
 */
export function isInvokerCommandsSupported(): boolean {
  return (
    typeof HTMLButtonElement !== "undefined" &&
    "commandForElement" in HTMLButtonElement.prototype &&
    "command" in HTMLButtonElement.prototype
  );
}

/**
 * Creates an RxJS Observable that listens for specific command events on a target element.
 * Useful for handling custom commands triggered by buttons with `commandfor` and `command` attributes.
 *
 * Example:
 * ```html
 * <button commandfor="my-target" command="--custom-action">Do Action</button>
 * <div id="my-target">Target Element</div>
 * ```
 * ```typescript
 * const target = document.getElementById('my-target');
 * if (target) {
 *   createCommandObservable(target, '--custom-action').subscribe(event => {
 *     console.log('Custom action command received:', event);
 *     // Handle the command
 *   });
 * }
 * ```
 *
 * @param targetElement The element that will receive the command events (referenced by `commandfor`).
 * @param commandName The specific command string to listen for (value of the `command` attribute). If omitted, listens for *all* command events on the target.
 * @param abortSignal Optional AbortSignal to stop listening.
 * @returns An Observable emitting CommandEvent objects, or null if API is not supported.
 */
export function createCommandObservable(
  targetElement: HTMLElement,
  commandName?: string,
  abortSignal?: AbortSignal,
): Observable<CommandEvent> | null {
  if (!isInvokerCommandsSupported()) {
    // Even if prototype check fails, basic event listening might work if polyfilled or partially implemented
    console.warn(
      'Invoker Commands API prototype properties not found, but attempting to listen for "command" event.',
    );
    // Allow proceeding but with a warning.
  }

  const commandEvent$ = fromEvent<CommandEvent>(targetElement, "command").pipe(
    filter(
      (event) => commandName === undefined || event.command === commandName,
    ),
    share(),
  );

  // Handle abortion
  if (abortSignal) {
    const stop$ = fromEvent(abortSignal, "abort");
    return commandEvent$.pipe(takeUntil(stop$));
  }

  return commandEvent$;
}

/**
 * Programmatically invokes a command on a target element.
 * This simulates a user clicking a button associated with the target and command.
 * Requires the browser to support dispatching `CommandEvent`.
 *
 * @param targetElement The element to dispatch the command event on.
 * @param command The command string to dispatch.
 * @param options Optional event init options (bubbles, cancelable).
 * @returns `true` if the event was dispatched, `false` otherwise (e.g., CommandEvent constructor unsupported).
 */
export function invokeCommand(
  targetElement: EventTarget, // Can be any EventTarget, not just HTMLElement
  command: string,
  options: EventInit = { bubbles: true, cancelable: true },
): boolean {
  try {
    // Check if CommandEvent constructor exists before trying to use it
    if (typeof window.CommandEvent === "undefined") {
      console.error(
        "CommandEvent constructor is not supported in this browser.",
      );
      return false;
    }
    // Note: The standard CommandEvent constructor currently might not exist
    // or might not have the 'command' property directly settable.
    // This is based on the spec, but browser implementations vary.
    // If this fails, a custom event might be needed as a fallback.
    const commandEvent = new CustomEvent("command", {
      ...options,
      detail: { command: command }, // Using detail as a common way to pass data
    }) as any; // Use 'any' as CommandEvent constructor might not match this shape

    // Attempt to set the command property directly if possible (might not work)
    // This relies on potential future implementations or non-standard behavior.
    try {
      Object.defineProperty(commandEvent, "command", {
        value: command,
        writable: false,
      });
    } catch (e) {
      console.warn(
        "Could not define 'command' property directly on event. Using detail object.",
      );
    }

    console.log(`Dispatching command "${command}" on target:`, targetElement);
    return targetElement.dispatchEvent(commandEvent);
  } catch (err) {
    console.error(`Failed to dispatch command "${command}":`, err);

    // Fallback attempt with a simple CustomEvent if CommandEvent fails
    try {
      console.log(
        `Falling back to dispatching CustomEvent for command "${command}"`,
      );
      const customEvent = new CustomEvent("command", {
        ...options,
        detail: { command: command },
      });
      return targetElement.dispatchEvent(customEvent);
    } catch (fallbackErr) {
      console.error(
        `Fallback CustomEvent dispatch failed for command "${command}":`,
        fallbackErr,
      );
      return false;
    }
  }
}
