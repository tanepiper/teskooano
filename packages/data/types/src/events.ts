/**
 * A map of custom event names used throughout the application.
 * Using constants helps prevent typos and ensures consistency.
 */
export const CustomEvents = {
  // --- Simulation & Engine Events ---
  SIMULATION_RESET_TIME: "resetSimulationTime", // Note: Also used as a constant RESET_SIMULATION_TIME_EVENT
  ORBIT_UPDATE: "orbitUpdate",
  RENDERER_READY: "renderer-ready",
  TEXTURE_PROGRESS: "texture-progress",
  TEXTURE_GENERATION_COMPLETE: "texture-generation-complete",
  START_TOUR_REQUEST: "start-tour-request", // EnginePlaceholder
  CAMERA_TRANSITION_COMPLETE: "camera-transition-complete", // ControlsManager

  // --- Celestial Object & Focus Events ---
  CELESTIAL_OBJECTS_LOADED: "celestial-objects-loaded",
  CELESTIAL_OBJECT_DESTROYED: "celestial-object-destroyed",
  FOCUS_REQUEST: "focus-request", // CelestialRow, FocusControl.interactions
  FOLLOW_REQUEST: "follow-request", // CelestialRow
  FOCUS_REQUEST_INITIATED: "focus-request-initiated", // FocusControl.interactions
  TRANSITION_COMPLETE: "transitioncomplete", // ControlsManager (Needs check for actual string)

  // --- UI Component Events ---
  TOGGLE: "toggle", // CollapsibleSection
  CONTENT_CHANGE: "content-change", // OutputDisplay
  COPY: "copy", // OutputDisplay
  CLEAR: "clear", // OutputDisplay
  CHANGE: "change", // Select, Slider
  SUBMIT_CUSTOM: "submit-custom", // Form
  RESET_CUSTOM: "reset-custom", // Form
  MODAL_CONFIRM: "modal-confirm", // Modal
  MODAL_CLOSE: "modal-close", // Modal
  MODAL_ADDITIONAL: "modal-additional", // Modal
  SELECT_CHANGE: "select:change", // Select (was generic 'change')
  SLIDER_CHANGE: "slider:change", // Slider (was generic 'change')

  // --- General Application Events ---
  COMMAND: "command", // invoker-commands

  // UI Interaction Events
  UI_PANEL_OPEN: "ui:panel:open",
  UI_PANEL_CLOSE: "ui:panel:close",
  UI_BUTTON_CLICK: "ui:button:click",
  UI_MODAL_SHOW: "ui:modal:show",
  UI_MODAL_HIDE: "ui:modal:hide",
  UI_NOTIFICATION_SHOW: "ui:notification:show",

  // Game State Events
  GAME_STATE_UPDATE: "game:state:update",
  PLAYER_POSITION_UPDATE: "player:position:update",
  ENTITY_ADDED: "entity:added",
  ENTITY_REMOVED: "entity:removed",

  // Add more events as needed...
} as const;

// You can also define specific event detail types if needed
// export interface UIPanelOpenDetail { panelId: string; }
// export interface EntityAddedDetail { entityId: string; type: string; }
// export interface FocusRequestDetail { objectId: string; }
