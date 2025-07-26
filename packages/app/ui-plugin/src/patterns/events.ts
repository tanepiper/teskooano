/**
 * @fileoverview Standard Event Registry for Teskooano
 * 
 * This module defines all standard events used throughout the Teskooano application.
 * It provides type-safe event definitions with payload interfaces and ensures
 * consistent event naming across all components and plugins.
 * 
 * @example
 * ```typescript
 * import { Events, ObjectSelectedPayload } from './events';
 * import { getEventBus } from './event-bus';
 * 
 * // Emit a typed event
 * getEventBus().emit(Events.OBJECT_SELECTED, {
 *   objectId: 'earth',
 *   object: earthObject,
 *   source: 'celestial-list'
 * } as ObjectSelectedPayload);
 * 
 * // Listen with type safety
 * getEventBus().on(Events.OBJECT_SELECTED, (event) => {
 *   const payload = event.payload as ObjectSelectedPayload;
 *   console.log(`Selected: ${payload.objectId}`);
 * });
 * ```
 */

// Note: Using any for CelestialObject to avoid cross-package import issues
// In actual usage, consumers should import the proper type
export interface CelestialObject {
  id: string;
  name: string;
  type: string;
  [key: string]: any;
}

/**
 * Standard event type constants
 * 
 * Event naming convention:
 * - Use UPPER_SNAKE_CASE for constants
 * - Format: [DOMAIN]:[ACTION] (e.g., 'object:selected')
 * - Domain should be a noun (object, camera, simulation, etc.)
 * - Action should be a past tense verb (selected, focused, started, etc.)
 */
export const Events = {
  // =====================================
  // Object Selection & Interaction Events
  // =====================================
  
  /** Fired when a celestial object is selected by user interaction */
  OBJECT_SELECTED: 'object:selected',
  
  /** Fired when a celestial object is deselected */
  OBJECT_DESELECTED: 'object:deselected',
  
  /** Fired when a celestial object receives focus (different from selection) */
  OBJECT_FOCUSED: 'object:focused',
  
  /** Fired when a celestial object loses focus */
  OBJECT_UNFOCUSED: 'object:unfocused',
  
  /** Fired when a celestial object should be highlighted in the visualization */
  OBJECT_HIGHLIGHTED: 'object:highlighted',
  
  /** Fired when a celestial object highlight should be removed */
  OBJECT_UNHIGHLIGHTED: 'object:unhighlighted',
  
  /** Fired when user hovers over a celestial object */
  OBJECT_HOVERED: 'object:hovered',
  
  /** Fired when user stops hovering over a celestial object */
  OBJECT_UNHOVERED: 'object:unhovered',

  // =====================================
  // Camera & View Events
  // =====================================
  
  /** Fired when camera should focus on a specific object */
  CAMERA_FOCUSED: 'camera:focused',
  
  /** Fired when camera position or orientation changes */
  CAMERA_MOVED: 'camera:moved',
  
  /** Fired when camera zoom level changes */
  CAMERA_ZOOMED: 'camera:zoomed',
  
  /** Fired when camera should reset to default position */
  CAMERA_RESET: 'camera:reset',
  
  /** Fired when camera transition animation starts */
  CAMERA_TRANSITION_STARTED: 'camera:transition_started',
  
  /** Fired when camera transition animation completes */
  CAMERA_TRANSITION_COMPLETED: 'camera:transition_completed',
  
  /** Fired when view mode changes (e.g., perspective to orthographic) */
  VIEW_MODE_CHANGED: 'view:mode_changed',
  
  /** Fired when view settings are updated */
  VIEW_SETTINGS_CHANGED: 'view:settings_changed',

  // =====================================
  // Simulation Events
  // =====================================
  
  /** Fired when simulation starts */
  SIMULATION_STARTED: 'simulation:started',
  
  /** Fired when simulation is paused */
  SIMULATION_PAUSED: 'simulation:paused',
  
  /** Fired when simulation is resumed */
  SIMULATION_RESUMED: 'simulation:resumed',
  
  /** Fired when simulation is stopped/reset */
  SIMULATION_STOPPED: 'simulation:stopped',
  
  /** Fired when simulation time is changed */
  SIMULATION_TIME_CHANGED: 'simulation:time_changed',
  
  /** Fired when simulation speed/time scale changes */
  SIMULATION_SPEED_CHANGED: 'simulation:speed_changed',
  
  /** Fired when physics engine settings change */
  SIMULATION_PHYSICS_CHANGED: 'simulation:physics_changed',

  // =====================================
  // System & Data Events
  // =====================================
  
  /** Fired when a new star system is loaded */
  SYSTEM_LOADED: 'system:loaded',
  
  /** Fired when a star system is generated */
  SYSTEM_GENERATED: 'system:generated',
  
  /** Fired when the current system is cleared */
  SYSTEM_CLEARED: 'system:cleared',
  
  /** Fired when system data is imported */
  SYSTEM_IMPORTED: 'system:imported',
  
  /** Fired when system data is exported */
  SYSTEM_EXPORTED: 'system:exported',
  
  /** Fired when system metadata changes */
  SYSTEM_METADATA_CHANGED: 'system:metadata_changed',

  // =====================================
  // UI Panel & Layout Events
  // =====================================
  
  /** Fired when a panel is opened */
  PANEL_OPENED: 'panel:opened',
  
  /** Fired when a panel is closed */
  PANEL_CLOSED: 'panel:closed',
  
  /** Fired when a panel is moved or resized */
  PANEL_MOVED: 'panel:moved',
  
  /** Fired when a panel gains focus */
  PANEL_FOCUSED: 'panel:focused',
  
  /** Fired when the layout configuration changes */
  LAYOUT_CHANGED: 'layout:changed',
  
  /** Fired when UI theme changes */
  THEME_CHANGED: 'theme:changed',

  // =====================================
  // Visualization & Rendering Events
  // =====================================
  
  /** Fired when orbital paths visibility toggles */
  ORBITS_VISIBILITY_CHANGED: 'orbits:visibility_changed',
  
  /** Fired when object labels visibility toggles */
  LABELS_VISIBILITY_CHANGED: 'labels:visibility_changed',
  
  /** Fired when visual effects settings change */
  EFFECTS_CHANGED: 'effects:changed',
  
  /** Fired when rendering quality settings change */
  RENDER_QUALITY_CHANGED: 'render:quality_changed',
  
  /** Fired when frame rate limit changes */
  FRAME_RATE_CHANGED: 'render:frame_rate_changed',

  // =====================================
  // User Interaction Events
  // =====================================
  
  /** Fired when user performs a search */
  SEARCH_PERFORMED: 'search:performed',
  
  /** Fired when search results are updated */
  SEARCH_RESULTS_UPDATED: 'search:results_updated',
  
  /** Fired when user activates a tool or mode */
  TOOL_ACTIVATED: 'tool:activated',
  
  /** Fired when user deactivates a tool or mode */
  TOOL_DEACTIVATED: 'tool:deactivated',
  
  /** Fired when user settings are updated */
  USER_SETTINGS_CHANGED: 'user:settings_changed',

  // =====================================
  // Error & Notification Events
  // =====================================
  
  /** Fired when an error occurs that should be displayed to user */
  ERROR_OCCURRED: 'error:occurred',
  
  /** Fired when a warning should be displayed */
  WARNING_ISSUED: 'warning:issued',
  
  /** Fired when an info notification should be shown */
  INFO_DISPLAYED: 'info:displayed',
  
  /** Fired when a success message should be shown */
  SUCCESS_DISPLAYED: 'success:displayed',

} as const;

/**
 * Type-safe event type from the Events constant
 */
export type EventType = typeof Events[keyof typeof Events];

// =====================================
// Event Payload Type Definitions
// =====================================

/**
 * Base interface for all event payloads
 */
export interface BaseEventPayload {
  /** Source component/plugin that triggered the event */
  source: string;
  /** Optional additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Payload for object selection events
 */
export interface ObjectSelectedPayload extends BaseEventPayload {
  /** ID of the selected object */
  objectId: string;
  /** The actual object data (optional, for performance) */
  object?: CelestialObject;
  /** Previous selection (for deselection events) */
  previousObjectId?: string;
}

/**
 * Payload for object interaction events (hover, highlight, etc.)
 */
export interface ObjectInteractionPayload extends BaseEventPayload {
  /** ID of the object being interacted with */
  objectId: string;
  /** Type of interaction */
  interactionType: 'hover' | 'highlight' | 'focus';
  /** Whether the interaction is starting or ending */
  active: boolean;
  /** Mouse/pointer position when interaction occurred */
  position?: { x: number; y: number };
}

/**
 * Payload for camera-related events
 */
export interface CameraEventPayload extends BaseEventPayload {
  /** Target object ID (for focus events) */
  objectId?: string;
  /** Camera position */
  position?: { x: number; y: number; z: number };
  /** Camera rotation */
  rotation?: { x: number; y: number; z: number };
  /** Zoom level */
  zoom?: number;
  /** Whether transition should be animated */
  animated?: boolean;
  /** Transition duration in milliseconds */
  duration?: number;
}

/**
 * Payload for simulation control events
 */
export interface SimulationEventPayload extends BaseEventPayload {
  /** Current simulation time */
  time?: number;
  /** Time scale/speed multiplier */
  timeScale?: number;
  /** Physics engine type */
  physicsEngine?: string;
  /** Simulation state */
  state?: 'running' | 'paused' | 'stopped';
  /** Performance metrics */
  performance?: {
    fps: number;
    frameTime: number;
    objectCount: number;
  };
}

/**
 * Payload for system data events
 */
export interface SystemEventPayload extends BaseEventPayload {
  /** Array of celestial objects in the system */
  objects?: CelestialObject[];
  /** System metadata */
  metadata?: {
    name?: string;
    description?: string;
    seed?: number;
    generatedAt?: number;
    objectCount?: number;
  };
  /** File path or URL (for import/export events) */
  filePath?: string;
  /** Data format */
  format?: 'json' | 'csv' | 'xml';
}

/**
 * Payload for panel/UI events
 */
export interface PanelEventPayload extends BaseEventPayload {
  /** Panel ID or component name */
  panelId: string;
  /** Panel title */
  title?: string;
  /** Panel position and size */
  bounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  /** Panel state */
  state?: 'opened' | 'closed' | 'minimized' | 'maximized';
}

/**
 * Payload for visualization setting events
 */
export interface VisualizationEventPayload extends BaseEventPayload {
  /** Setting type */
  settingType: 'orbits' | 'labels' | 'effects' | 'quality';
  /** Whether the setting is enabled */
  enabled?: boolean;
  /** Setting value */
  value?: any;
  /** Previous value (for change events) */
  previousValue?: any;
}

/**
 * Payload for search events
 */
export interface SearchEventPayload extends BaseEventPayload {
  /** Search query string */
  query: string;
  /** Search results */
  results?: Array<{
    objectId: string;
    name: string;
    type: string;
    relevance: number;
  }>;
  /** Number of results found */
  resultCount?: number;
  /** Search duration in milliseconds */
  duration?: number;
}

/**
 * Payload for error and notification events
 */
export interface NotificationEventPayload extends BaseEventPayload {
  /** Notification message */
  message: string;
  /** Notification title */
  title?: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info' | 'success';
  /** Error object (for error events) */
  error?: Error;
  /** Whether notification should auto-dismiss */
  autoDismiss?: boolean;
  /** Auto-dismiss duration in milliseconds */
  dismissAfter?: number;
}

/**
 * Type mapping for event types to their payload types
 */
export interface EventPayloadMap {
  [Events.OBJECT_SELECTED]: ObjectSelectedPayload;
  [Events.OBJECT_DESELECTED]: ObjectSelectedPayload;
  [Events.OBJECT_FOCUSED]: ObjectSelectedPayload;
  [Events.OBJECT_UNFOCUSED]: ObjectSelectedPayload;
  [Events.OBJECT_HIGHLIGHTED]: ObjectInteractionPayload;
  [Events.OBJECT_UNHIGHLIGHTED]: ObjectInteractionPayload;
  [Events.OBJECT_HOVERED]: ObjectInteractionPayload;
  [Events.OBJECT_UNHOVERED]: ObjectInteractionPayload;
  
  [Events.CAMERA_FOCUSED]: CameraEventPayload;
  [Events.CAMERA_MOVED]: CameraEventPayload;
  [Events.CAMERA_ZOOMED]: CameraEventPayload;
  [Events.CAMERA_RESET]: CameraEventPayload;
  [Events.CAMERA_TRANSITION_STARTED]: CameraEventPayload;
  [Events.CAMERA_TRANSITION_COMPLETED]: CameraEventPayload;
  [Events.VIEW_MODE_CHANGED]: VisualizationEventPayload;
  [Events.VIEW_SETTINGS_CHANGED]: VisualizationEventPayload;
  
  [Events.SIMULATION_STARTED]: SimulationEventPayload;
  [Events.SIMULATION_PAUSED]: SimulationEventPayload;
  [Events.SIMULATION_RESUMED]: SimulationEventPayload;
  [Events.SIMULATION_STOPPED]: SimulationEventPayload;
  [Events.SIMULATION_TIME_CHANGED]: SimulationEventPayload;
  [Events.SIMULATION_SPEED_CHANGED]: SimulationEventPayload;
  [Events.SIMULATION_PHYSICS_CHANGED]: SimulationEventPayload;
  
  [Events.SYSTEM_LOADED]: SystemEventPayload;
  [Events.SYSTEM_GENERATED]: SystemEventPayload;
  [Events.SYSTEM_CLEARED]: SystemEventPayload;
  [Events.SYSTEM_IMPORTED]: SystemEventPayload;
  [Events.SYSTEM_EXPORTED]: SystemEventPayload;
  [Events.SYSTEM_METADATA_CHANGED]: SystemEventPayload;
  
  [Events.PANEL_OPENED]: PanelEventPayload;
  [Events.PANEL_CLOSED]: PanelEventPayload;
  [Events.PANEL_MOVED]: PanelEventPayload;
  [Events.PANEL_FOCUSED]: PanelEventPayload;
  [Events.LAYOUT_CHANGED]: BaseEventPayload;
  [Events.THEME_CHANGED]: BaseEventPayload;
  
  [Events.ORBITS_VISIBILITY_CHANGED]: VisualizationEventPayload;
  [Events.LABELS_VISIBILITY_CHANGED]: VisualizationEventPayload;
  [Events.EFFECTS_CHANGED]: VisualizationEventPayload;
  [Events.RENDER_QUALITY_CHANGED]: VisualizationEventPayload;
  [Events.FRAME_RATE_CHANGED]: VisualizationEventPayload;
  
  [Events.SEARCH_PERFORMED]: SearchEventPayload;
  [Events.SEARCH_RESULTS_UPDATED]: SearchEventPayload;
  [Events.TOOL_ACTIVATED]: BaseEventPayload;
  [Events.TOOL_DEACTIVATED]: BaseEventPayload;
  [Events.USER_SETTINGS_CHANGED]: BaseEventPayload;
  
  [Events.ERROR_OCCURRED]: NotificationEventPayload;
  [Events.WARNING_ISSUED]: NotificationEventPayload;
  [Events.INFO_DISPLAYED]: NotificationEventPayload;
  [Events.SUCCESS_DISPLAYED]: NotificationEventPayload;
}

/**
 * Helper type to get the payload type for a specific event
 */
export type PayloadForEvent<T extends EventType> = T extends keyof EventPayloadMap 
  ? EventPayloadMap[T] 
  : BaseEventPayload;

/**
 * Utility functions for working with events
 */
export const EventUtils = {
  /**
   * Check if an event type is valid
   */
  isValidEventType(eventType: string): eventType is EventType {
    return Object.values(Events).includes(eventType as EventType);
  },
  
  /**
   * Get all events in a specific domain
   */
  getEventsByDomain(domain: string): EventType[] {
    return Object.values(Events).filter(event => 
      event.startsWith(`${domain}:`)
    ) as EventType[];
  },
  
  /**
   * Parse event type into domain and action
   */
  parseEventType(eventType: EventType): { domain: string; action: string } {
    const [domain, action] = eventType.split(':');
    return { domain, action };
  },
  
  /**
   * Create a namespaced event type
   */
  createEventType(domain: string, action: string): string {
    return `${domain}:${action}`;
  }
};

/**
 * Event domains for organizing events
 */
export const EventDomains = {
  OBJECT: 'object',
  CAMERA: 'camera',
  VIEW: 'view',
  SIMULATION: 'simulation',
  SYSTEM: 'system',
  PANEL: 'panel',
  LAYOUT: 'layout',
  THEME: 'theme',
  ORBITS: 'orbits',
  LABELS: 'labels',
  EFFECTS: 'effects',
  RENDER: 'render',
  SEARCH: 'search',
  TOOL: 'tool',
  USER: 'user',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success'
} as const;