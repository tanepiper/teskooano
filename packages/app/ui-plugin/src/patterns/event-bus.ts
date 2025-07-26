/**
 * @fileoverview Event Bus System for Component Communication
 *
 * This module provides a centralized event system for loose coupling between
 * components and plugins. It supports:
 * - Type-safe event emissions and subscriptions
 * - Event namespacing and targeting
 * - Global and specific event listeners
 * - Automatic cleanup and memory management
 * - Event debugging and logging
 *
 * @example
 * ```typescript
 * import { EventBus, Events } from './event-bus';
 *
 * const bus = EventBus.getInstance();
 *
 * // Listen for events
 * const unsubscribe = bus.on(Events.OBJECT_SELECTED, (event) => {
 *   console.log('Object selected:', event.payload);
 * });
 *
 * // Emit events
 * bus.emit(Events.OBJECT_SELECTED, {
 *   objectId: 'earth',
 *   source: 'celestial-info-panel'
 * });
 *
 * // Clean up
 * unsubscribe();
 * ```
 */

/**
 * Configuration for emitted events
 */
export interface EventConfig {
  /** Event type identifier */
  type: string;
  /** Event payload data */
  payload?: any;
  /** Source component/plugin that emitted the event */
  source?: string;
  /** Target component/plugin (for directed events) */
  target?: string;
  /** Whether the event should bubble to global listeners */
  bubbles?: boolean;
  /** Whether the event can be cancelled */
  cancelable?: boolean;
  /** Timestamp when the event was created */
  timestamp?: number;
  /** Unique event ID for tracking */
  id?: string;
}

/**
 * Function signature for event listeners
 */
export type EventListener = (event: EventConfig) => void | Promise<void>;

/**
 * Options for event subscription
 */
export interface SubscriptionOptions {
  /** Only listen to events from specific source */
  source?: string;
  /** Only listen to events targeting specific target */
  target?: string;
  /** Whether to receive the event immediately if it was the last emitted */
  immediate?: boolean;
  /** Maximum number of times to trigger this listener */
  maxTriggers?: number;
}

/**
 * Event subscription handle
 */
interface EventSubscription {
  listener: EventListener;
  options: SubscriptionOptions;
  triggerCount: number;
  id: string;
}

/**
 * Centralized event bus for component communication
 */
export class EventBus {
  private static instance: EventBus;

  private listeners: Map<string, Map<string, EventSubscription>> = new Map();
  private globalListeners: Map<string, EventSubscription> = new Map();
  private lastEvents: Map<string, EventConfig> = new Map();
  private debugMode = false;
  private eventHistory: EventConfig[] = [];
  private maxHistorySize = 100;
  private subscriptionCounter = 0;

  private constructor() {
    // Private constructor for singleton
    this.setupGlobalErrorHandling();
  }

  /**
   * Get the singleton instance of the event bus
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Enable or disable debug mode for event logging
   * @param enabled Whether to enable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
    if (enabled) {
      console.log("🚌 EventBus debug mode enabled");
    }
  }

  /**
   * Emit an event to all relevant listeners
   * @param eventType Event type identifier
   * @param payload Event payload data
   * @param options Additional event options
   */
  emit(
    eventType: string,
    payload?: any,
    options: Partial<EventConfig> = {},
  ): void {
    const event: EventConfig = {
      type: eventType,
      payload,
      source: options.source,
      target: options.target,
      bubbles: options.bubbles ?? true,
      cancelable: options.cancelable ?? false,
      timestamp: Date.now(),
      id: this.generateEventId(),
      ...options,
    };

    // Store as last event for immediate subscriptions
    this.lastEvents.set(eventType, event);

    // Add to history
    this.addToHistory(event);

    // Debug logging
    if (this.debugMode) {
      console.log(`🚌 Event emitted: ${eventType}`, {
        payload,
        source: event.source,
        target: event.target,
      });
    }

    // Notify specific listeners
    this.notifyListeners(eventType, event);

    // Notify global listeners if event bubbles
    if (event.bubbles) {
      this.notifyGlobalListeners(event);
    }
  }

  /**
   * Listen to specific event type
   * @param eventType Event type to listen for
   * @param listener Function to call when event occurs
   * @param options Subscription options
   * @returns Unsubscribe function
   */
  on(
    eventType: string,
    listener: EventListener,
    options: SubscriptionOptions = {},
  ): () => void {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      listener,
      options,
      triggerCount: 0,
      id: subscriptionId,
    };

    // Initialize event type listeners map if needed
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Map());
    }

    this.listeners.get(eventType)!.set(subscriptionId, subscription);

    // Handle immediate option
    if (options.immediate && this.lastEvents.has(eventType)) {
      const lastEvent = this.lastEvents.get(eventType)!;
      if (this.shouldNotifyListener(lastEvent, subscription)) {
        this.callListener(subscription, lastEvent);
      }
    }

    if (this.debugMode) {
      console.log(`🚌 Listener added for: ${eventType}`, {
        subscriptionId,
        options,
      });
    }

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(subscriptionId);
      if (this.listeners.get(eventType)?.size === 0) {
        this.listeners.delete(eventType);
      }

      if (this.debugMode) {
        console.log(`🚌 Listener removed for: ${eventType}`, {
          subscriptionId,
        });
      }
    };
  }

  /**
   * Listen to all events (global listener)
   * @param listener Function to call for any event
   * @param options Subscription options
   * @returns Unsubscribe function
   */
  onAll(
    listener: EventListener,
    options: SubscriptionOptions = {},
  ): () => void {
    const subscriptionId = this.generateSubscriptionId();
    const subscription: EventSubscription = {
      listener,
      options,
      triggerCount: 0,
      id: subscriptionId,
    };

    this.globalListeners.set(subscriptionId, subscription);

    if (this.debugMode) {
      console.log(`🚌 Global listener added`, { subscriptionId, options });
    }

    return () => {
      this.globalListeners.delete(subscriptionId);

      if (this.debugMode) {
        console.log(`🚌 Global listener removed`, { subscriptionId });
      }
    };
  }

  /**
   * Listen to an event only once
   * @param eventType Event type to listen for
   * @param listener Function to call when event occurs
   * @param options Subscription options
   */
  once(
    eventType: string,
    listener: EventListener,
    options: SubscriptionOptions = {},
  ): void {
    const unsubscribe = this.on(
      eventType,
      (event) => {
        listener(event);
        unsubscribe();
      },
      { ...options, maxTriggers: 1 },
    );
  }

  /**
   * Remove all listeners for a specific event type
   * @param eventType Event type to clear
   */
  off(eventType: string): void {
    const removedCount = this.listeners.get(eventType)?.size || 0;
    this.listeners.delete(eventType);

    if (this.debugMode && removedCount > 0) {
      console.log(`🚌 Removed ${removedCount} listeners for: ${eventType}`);
    }
  }

  /**
   * Remove all listeners (global and specific)
   */
  clear(): void {
    const totalListeners = this.getTotalListenerCount();
    this.listeners.clear();
    this.globalListeners.clear();
    this.lastEvents.clear();
    this.eventHistory = [];

    if (this.debugMode && totalListeners > 0) {
      console.log(
        `🚌 Cleared all ${totalListeners} listeners and event history`,
      );
    }
  }

  /**
   * Get the event history for debugging
   * @param limit Maximum number of events to return
   */
  getEventHistory(limit?: number): EventConfig[] {
    const history = [...this.eventHistory];
    return limit ? history.slice(-limit) : history;
  }

  /**
   * Get statistics about the event bus
   */
  getStats(): {
    listenerCounts: Record<string, number>;
    globalListeners: number;
    eventHistory: number;
    lastEvents: string[];
  } {
    const listenerCounts: Record<string, number> = {};
    this.listeners.forEach((listeners, eventType) => {
      listenerCounts[eventType] = listeners.size;
    });

    return {
      listenerCounts,
      globalListeners: this.globalListeners.size,
      eventHistory: this.eventHistory.length,
      lastEvents: Array.from(this.lastEvents.keys()),
    };
  }

  /**
   * Notify listeners for a specific event type
   */
  private notifyListeners(eventType: string, event: EventConfig): void {
    const eventListeners = this.listeners.get(eventType);
    if (!eventListeners) return;

    const listenersToRemove: string[] = [];

    eventListeners.forEach((subscription, subscriptionId) => {
      if (this.shouldNotifyListener(event, subscription)) {
        this.callListener(subscription, event);

        // Check if listener should be removed after reaching max triggers
        if (
          subscription.options.maxTriggers &&
          subscription.triggerCount >= subscription.options.maxTriggers
        ) {
          listenersToRemove.push(subscriptionId);
        }
      }
    });

    // Remove listeners that reached their trigger limit
    listenersToRemove.forEach((id) => eventListeners.delete(id));
  }

  /**
   * Notify global listeners
   */
  private notifyGlobalListeners(event: EventConfig): void {
    const listenersToRemove: string[] = [];

    this.globalListeners.forEach((subscription, subscriptionId) => {
      if (this.shouldNotifyListener(event, subscription)) {
        this.callListener(subscription, event);

        if (
          subscription.options.maxTriggers &&
          subscription.triggerCount >= subscription.options.maxTriggers
        ) {
          listenersToRemove.push(subscriptionId);
        }
      }
    });

    // Remove listeners that reached their trigger limit
    listenersToRemove.forEach((id) => this.globalListeners.delete(id));
  }

  /**
   * Check if a listener should be notified for an event
   */
  private shouldNotifyListener(
    event: EventConfig,
    subscription: EventSubscription,
  ): boolean {
    const { options } = subscription;

    // Check source filter
    if (options.source && event.source !== options.source) {
      return false;
    }

    // Check target filter
    if (options.target && event.target !== options.target) {
      return false;
    }

    // Check max triggers
    if (
      options.maxTriggers &&
      subscription.triggerCount >= options.maxTriggers
    ) {
      return false;
    }

    return true;
  }

  /**
   * Call a listener safely with error handling
   */
  private callListener(
    subscription: EventSubscription,
    event: EventConfig,
  ): void {
    try {
      subscription.triggerCount++;

      const result = subscription.listener(event);

      // Handle async listeners
      if (result instanceof Promise) {
        result.catch((error) => {
          console.error(
            `🚌 Async event listener error for ${event.type}:`,
            error,
          );
        });
      }
    } catch (error) {
      console.error(`🚌 Event listener error for ${event.type}:`, error);
    }
  }

  /**
   * Add event to history with size management
   */
  private addToHistory(event: EventConfig): void {
    this.eventHistory.push(event);

    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory = this.eventHistory.slice(-this.maxHistorySize);
    }
  }

  /**
   * Generate unique event ID
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Generate unique subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${++this.subscriptionCounter}_${Math.random().toString(36).substring(2, 9)}`;
  }

  /**
   * Get total number of listeners
   */
  private getTotalListenerCount(): number {
    let total = this.globalListeners.size;
    this.listeners.forEach((listeners) => {
      total += listeners.size;
    });
    return total;
  }

  /**
   * Set up global error handling for uncaught errors in event listeners
   */
  private setupGlobalErrorHandling(): void {
    // This is already handled in callListener, but keeping for completeness
  }
}

/**
 * Convenience function to get the event bus instance
 */
export function getEventBus(): EventBus {
  return EventBus.getInstance();
}

/**
 * Decorator for automatically cleaning up event subscriptions
 * when a component is destroyed
 */
export function autoCleanup(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor,
) {
  const originalMethod = descriptor.value;

  descriptor.value = function (this: any, ...args: any[]) {
    const result = originalMethod.apply(this, args);

    // Store unsubscribe function for cleanup
    if (!this._eventUnsubscribers) {
      this._eventUnsubscribers = [];
    }

    if (typeof result === "function") {
      this._eventUnsubscribers.push(result);
    }

    return result;
  };

  return descriptor;
}
