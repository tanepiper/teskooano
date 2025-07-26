/**
 * @fileoverview Teskooano UI Plugin Patterns
 * 
 * This module exports all the improved patterns for the Teskooano plugin system.
 * These patterns provide a more developer-friendly approach to building UI components
 * and plugins, inspired by modern frameworks like Nue.js but designed to work
 * within the existing Teskooano architecture.
 * 
 * ## Available Patterns
 * 
 * ### 1. Reactive State Management
 * - `ReactiveState` - Reactive state with computed properties and change tracking
 * - `createReactiveState` - Type-safe reactive state factory
 * - `connectObservable` - RxJS integration helper
 * 
 * ### 2. Event-Driven Communication
 * - `EventBus` - Centralized event system with debugging support
 * - `Events` - Standard event type registry
 * - Typed payload interfaces for all events
 * 
 * ### 3. Coming Soon (Phase 2)
 * - Template processing with directives
 * - Declarative component factory
 * - Convention-based plugin registration
 * - Template binding engine
 * 
 * @example Basic Usage
 * ```typescript
 * import { 
 *   ReactiveState, 
 *   EventBus, 
 *   Events, 
 *   ObjectSelectedPayload 
 * } from '@teskooano/ui-plugin/patterns';
 * 
 * // Create reactive state
 * const state = new ReactiveState({
 *   selectedObject: null,
 *   isLoading: false
 * });
 * 
 * // Add computed property
 * state.computed('hasSelection', {
 *   deps: ['selectedObject'],
 *   compute: (selectedObject) => selectedObject !== null
 * });
 * 
 * // Listen for changes
 * state.watch('selectedObject', (newValue) => {
 *   console.log('Selection changed:', newValue);
 * });
 * 
 * // Use event bus
 * const eventBus = EventBus.getInstance();
 * eventBus.on(Events.OBJECT_SELECTED, (event) => {
 *   const payload = event.payload as ObjectSelectedPayload;
 *   state.set('selectedObject', payload.object);
 * });
 * ```
 * 
 * @version 0.1.0 - Phase 1 Implementation
 * @author Teskooano Team
 */

// =====================================
// Reactive State Management
// =====================================

export {
  ReactiveState,
  createReactiveState,
  connectObservable,
  type ComputedDefinition,
  type StateWatcher
} from './reactive-state.js';

// =====================================
// Event System
// =====================================

export {
  EventBus,
  getEventBus,
  autoCleanup,
  type EventConfig,
  type EventListener,
  type SubscriptionOptions
} from './event-bus.js';

export {
  Events,
  EventUtils,
  EventDomains,
  type EventType,
  type PayloadForEvent,
  
  // Payload type exports
  type BaseEventPayload,
  type ObjectSelectedPayload,
  type ObjectInteractionPayload,
  type CameraEventPayload,
  type SimulationEventPayload,
  type SystemEventPayload,
  type PanelEventPayload,
  type VisualizationEventPayload,
  type SearchEventPayload,
  type NotificationEventPayload,
  type EventPayloadMap,
  type CelestialObject
} from './events.js';

// =====================================
// Utility Functions
// =====================================

/**
 * Create a reactive component state with event integration
 * This is a convenience function that sets up both reactive state
 * and event bus integration in one call.
 */
export function createComponentState<T extends Record<string, any>>(
  initialData: T,
  options: {
    /** Component name for event source identification */
    componentName: string;
    /** Auto-connect to specific events */
    autoEvents?: Array<{
      eventType: string;
      handler: (payload: any) => void;
    }>;
  }
) {
  const { ReactiveState: ReactiveStateClass, createReactiveState: createState } = require('./reactive-state.js');
  const { EventBus: EventBusClass } = require('./event-bus.js');
  
  const state = createState(initialData);
  const eventBus = EventBusClass.getInstance();
  const unsubscribers: Array<() => void> = [];

  // Set up auto-events
  options.autoEvents?.forEach(({ eventType, handler }) => {
    const unsubscribe = eventBus.on(eventType, (event: any) => {
      handler(event.payload);
    });
    unsubscribers.push(unsubscribe);
  });

  // Add convenience methods
  const enhancedState = state as any;

  enhancedState.emit = (eventType: string, payload?: any) => {
    eventBus.emit(eventType, payload, { source: options.componentName });
  };

  enhancedState.cleanup = () => {
    unsubscribers.forEach(unsubscribe => unsubscribe());
    state.dispose();
  };

  return enhancedState;
}

/**
 * Helper to create event listeners with automatic cleanup
 */
export function createEventListener(
  eventType: string,
  handler: any,
  options?: any
): { unsubscribe: () => void } {
  const { EventBus: EventBusClass } = require('./event-bus.js');
  const eventBus = EventBusClass.getInstance();
  const unsubscribe = eventBus.on(eventType, handler, options);
  
  return { unsubscribe };
}

/**
 * Helper to emit events with common patterns
 */
export function emitEvent(
  eventType: string,
  payload?: any,
  options?: {
    source?: string;
    target?: string;
    bubbles?: boolean;
  }
): void {
  const { EventBus: EventBusClass } = require('./event-bus.js');
  const eventBus = EventBusClass.getInstance();
  eventBus.emit(eventType, payload, options);
}

/**
 * Debug helper to inspect reactive state
 */
export function debugState(state: any, label?: string): void {
  const snapshot = state.snapshot();
  console.group(`🔍 State Debug${label ? ` - ${label}` : ''}`);
  console.log('Data:', snapshot.data);
  console.log('Computed:', snapshot.computed);
  console.log('Watched Properties:', state.getWatchedProperties());
  console.log('Computed Properties:', state.getComputedProperties());
  console.groupEnd();
}

/**
 * Debug helper to inspect event bus
 */
export function debugEventBus(): void {
  const { EventBus: EventBusClass } = require('./event-bus.js');
  const eventBus = EventBusClass.getInstance();
  const stats = eventBus.getStats();
  
  console.group('🚌 EventBus Debug');
  console.log('Listener Counts:', stats.listenerCounts);
  console.log('Global Listeners:', stats.globalListeners);
  console.log('Event History Count:', stats.eventHistory);
  console.log('Last Events:', stats.lastEvents);
  console.groupEnd();
}

/**
 * Enable debug mode for all patterns
 */
export function enablePatternDebugging(): void {
  const { EventBus: EventBusClass } = require('./event-bus.js');
  const eventBus = EventBusClass.getInstance();
  eventBus.setDebugMode(true);
  
  console.log('🚀 Teskooano UI Patterns - Debug mode enabled');
  console.log('Available debug functions:');
  console.log('- debugState(state, label?)');
  console.log('- debugEventBus()');
}

// =====================================
// Version Information
// =====================================

export const PATTERNS_VERSION = '0.1.0';
export const PATTERNS_PHASE = 'Phase 1 - Foundation';

/**
 * Get information about the patterns implementation
 */
export function getPatternsInfo(): {
  version: string;
  phase: string;
  implemented: string[];
  upcoming: string[];
} {
  return {
    version: PATTERNS_VERSION,
    phase: PATTERNS_PHASE,
    implemented: [
      'Reactive State Management',
      'Event-Driven Communication',
      'Typed Event Registry',
      'Component State Helpers'
    ],
    upcoming: [
      'Template Processing Engine',
      'Declarative Component Factory',
      'Convention-Based Plugin Registration',
      'Template Binding System'
    ]
  };
}

// =====================================
// Type Re-exports for Convenience
// =====================================

// Type aliases for convenience - consumers should import the actual types
export type Computed = any;
export type Watcher = any;
export type Event = any;
export type Listener = any;
export type ListenerOptions = any;
export type ObjectSelected = any;
export type CameraEvent = any;
export type SimulationEvent = any;
export type SystemEvent = any;
export type PanelEvent = any;
export type Notification = any;

/**
 * Default export for the patterns module
 */
export default {
  // Factories and utilities
  createComponentState,
  emitEvent,
  createEventListener,
  
  // Debug helpers
  debugState,
  debugEventBus,
  enablePatternDebugging,
  
  // Info
  getPatternsInfo,
  version: PATTERNS_VERSION,
  phase: PATTERNS_PHASE
};