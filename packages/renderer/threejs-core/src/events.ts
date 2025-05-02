/**
 * Simple event emitter for renderer events
 */
type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events: Map<string, EventCallback[]> = new Map();

  /**
   * Register an event listener
   */
  on(event: string, callback: EventCallback): () => void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }

    this.events.get(event)!.push(callback);

    return () => {
      const callbacks = this.events.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index !== -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  /**
   * Emit an event
   */
  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach((callback) => callback(...args));
    }
  }
}

/**
 * Events that can be emitted by the renderer
 */
export const rendererEvents = new EventEmitter();
