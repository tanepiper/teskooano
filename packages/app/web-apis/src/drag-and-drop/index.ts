import { Observable, fromEvent, merge } from "rxjs";
import { map, share, takeUntil, tap } from "rxjs/operators";

/**
 * Checks if the browser environment supports basic drag and drop events.
 * This is generally true in modern browsers.
 * @returns `true`
 */
export function isDragAndDropSupported(): boolean {
  // Basic check - Drag and Drop is widely supported.
  // More specific checks could involve 'draggable' attribute or event constructor checks.
  return typeof window !== "undefined";
}

/**
 * Enum for standard drag effect types.
 */
export enum DragEffect {
  Copy = "copy",
  Move = "move",
  Link = "link",
  None = "none",
}

/**
 * Enum for standard drop effect types.
 */
export enum DropEffect {
  Copy = "copy",
  Move = "move",
  Link = "link",
  None = "none",
}

/**
 * Options for making an element draggable.
 */
export interface DraggableOptions {
  /** Data to be transferred during the drag. Key is format (e.g., 'text/plain'), value is data string. */
  data?: Record<string, string>;
  /** Allowed drag effect ('copy', 'move', 'link', 'none', or combinations). */
  dragEffect?: DragEffect | string; // Allow custom strings too
  /** Optional element to use as the drag ghost image. */
  dragImage?: {
    element: Element;
    xOffset: number;
    yOffset: number;
  };
  /** Optional signal to remove event listeners. */
  abortSignal?: AbortSignal;
}

/**
 * Makes an HTML element draggable.
 *
 * @param element The element to make draggable.
 * @param options Configuration for the drag behavior.
 * @returns An object with an `unsubscribe` method to remove listeners, or null if not supported.
 */
export function makeDraggable(
  element: HTMLElement,
  options: DraggableOptions = {},
): { unsubscribe: () => void } | null {
  if (!isDragAndDropSupported()) {
    console.warn("Drag and Drop not supported (basic check failed).");
    return null;
  }

  element.draggable = true;

  const handleDragStart = (event: DragEvent) => {
    if (event.dataTransfer) {
      // Set drag effect
      event.dataTransfer.effectAllowed = (options.dragEffect ||
        DragEffect.Copy) as any;

      // Set data payload
      if (options.data) {
        for (const format in options.data) {
          event.dataTransfer.setData(format, options.data[format]);
        }
      } else {
        // Default data if none provided (useful for debugging)
        event.dataTransfer.setData(
          "text/plain",
          element.id || "draggable-element",
        );
      }

      // Set custom drag image
      if (options.dragImage) {
        event.dataTransfer.setDragImage(
          options.dragImage.element,
          options.dragImage.xOffset,
          options.dragImage.yOffset,
        );
      }
    }
  };

  const handleDragEnd = (event: DragEvent) => {
    // You could potentially use event.dataTransfer.dropEffect here
  };

  element.addEventListener("dragstart", handleDragStart);
  element.addEventListener("dragend", handleDragEnd);

  const unsubscribe = () => {
    element.removeEventListener("dragstart", handleDragStart);
    element.removeEventListener("dragend", handleDragEnd);
    element.draggable = false; // Reset draggable attribute
  };

  // Handle abortion
  options.abortSignal?.addEventListener("abort", unsubscribe, { once: true });

  return { unsubscribe };
}

/**
 * Options for making an element a drop zone.
 */
export interface DropZoneOptions {
  /** Allowed drop effect ('copy', 'move', 'link', 'none'). Determines cursor and final effect. */
  dropEffect?: DropEffect;
  /** Array of data formats (e.g., 'text/plain', 'Files') that this zone accepts. If empty/omitted, allows any. */
  acceptedFormats?: string[];
  /** Optional signal to remove event listeners. */
  abortSignal?: AbortSignal;
  /** CSS class to add when a valid item is dragged over. */
  dragOverClass?: string;
}

/**
 * Creates an RxJS Observable stream for drop events on a target element.
 * Handles `dragenter`, `dragover`, `dragleave`, and `drop`.
 *
 * @param element The element to act as the drop zone.
 * @param options Configuration for the drop zone behavior.
 * @returns An Observable emitting `DragEvent` objects for successful drops, or null if not supported.
 */
export function createDropZoneObservable(
  element: HTMLElement,
  options: DropZoneOptions = {},
): Observable<DragEvent> | null {
  if (!isDragAndDropSupported()) {
    console.warn("Drag and Drop not supported (basic check failed).");
    return null;
  }

  const dragOverClass = options.dragOverClass;
  const acceptedFormats = options.acceptedFormats;
  const dropEffect = options.dropEffect || DropEffect.Copy;

  const preventDefaults = (event: DragEvent) => {
    event.preventDefault();
  };

  const handleDragEnter = (event: DragEvent) => {
    event.preventDefault(); // Necessary to allow dropping
    // Check if data type is acceptable (if specified)
    if (acceptedFormats && event.dataTransfer) {
      const types = Array.from(event.dataTransfer.types);
      if (!acceptedFormats.some((format) => types.includes(format))) {
        return; // Not an accepted type
      }
    }
    if (dragOverClass) {
      element.classList.add(dragOverClass);
    }
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = dropEffect; // Show allowed cursor
    }
  };

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault(); // Necessary to allow dropping!
    // Ensure drop effect is consistently set
    if (event.dataTransfer) {
      // Check accepted formats again in case state changed mid-drag
      if (acceptedFormats) {
        const types = Array.from(event.dataTransfer.types);
        if (!acceptedFormats.some((format) => types.includes(format))) {
          event.dataTransfer.dropEffect = DropEffect.None; // Indicate invalid drop
          return;
        }
      }
      event.dataTransfer.dropEffect = dropEffect;
    }
  };

  const handleDragLeave = (event: DragEvent) => {
    // Check if the leave is going outside the element bounds
    if (!element.contains(event.relatedTarget as Node)) {
      if (dragOverClass) {
        element.classList.remove(dragOverClass);
      }
    }
  };

  const handleDrop = (event: DragEvent) => {
    event.preventDefault(); // Prevent default drop action (like opening link)
    if (dragOverClass) {
      element.classList.remove(dragOverClass);
    }
    // Final check for accepted formats
    if (acceptedFormats && event.dataTransfer) {
      const types = Array.from(event.dataTransfer.types);
      if (!acceptedFormats.some((format) => types.includes(format))) {
        console.warn(`Drop rejected on ${element.id}: Invalid data format.`);
        return; // Reject drop
      }
    }
    // Drop event is emitted by the observable stream below
  };

  // Add listeners
  element.addEventListener("dragenter", handleDragEnter);
  element.addEventListener("dragover", handleDragOver);
  element.addEventListener("dragleave", handleDragLeave);
  element.addEventListener("drop", handleDrop);
  // Need to prevent default on dragover to allow drop
  // element.addEventListener('dragover', preventDefaults);

  const drop$ = fromEvent<DragEvent>(element, "drop").pipe(
    // The actual drop event emission
    tap((event) => {
      // Potentially process data here if needed universally
      // const data = event.dataTransfer?.getData('text/plain');
    }),
    share(), // Share the stream among multiple subscribers
  );

  // Cleanup logic using takeUntil
  const stop$ = options.abortSignal
    ? fromEvent(options.abortSignal, "abort")
    : new Observable<never>(); // An observable that never emits if no signal

  stop$.subscribe(() => {
    element.removeEventListener("dragenter", handleDragEnter);
    element.removeEventListener("dragover", handleDragOver);
    element.removeEventListener("dragleave", handleDragLeave);
    element.removeEventListener("drop", handleDrop);
    // element.removeEventListener('dragover', preventDefaults);
    if (dragOverClass) {
      element.classList.remove(dragOverClass); // Ensure class is removed
    }
  });

  return drop$.pipe(takeUntil(stop$));
}
