/**
 * A map of custom event names used throughout the application.
 * Using constants helps prevent typos and ensures consistency.
 */
export const CustomEvents = {
  COMPOSITE_ENGINE_INITIALIZED: "composite-engine-initialized",
  SYSTEM_GENERATION_START: "system-generation-start",
  SYSTEM_GENERATION_COMPLETE: "system-generation-complete",
  SIMULATION_RESET_TIME: "resetSimulationTime",
  ORBIT_UPDATE: "orbitUpdate",
  RENDERER_READY: "renderer-ready",
  TEXTURE_PROGRESS: "texture-progress",
  TEXTURE_GENERATION_COMPLETE: "texture-generation-complete",
  START_TOUR_REQUEST: "start-tour-request",
  CAMERA_TRANSITION_COMPLETE: "camera-transition-complete",
  USER_CAMERA_MANIPULATION: "user-camera-manipulation",

  CELESTIAL_OBJECTS_LOADED: "celestial-objects-loaded",
  CELESTIAL_OBJECT_DESTROYED: "celestial-object-destroyed",
  FOCUS_REQUEST: "focus-request", // This will likely be deprecated or repurposed for general selection
  MOVE_TO_REQUEST: "move-to-request", // New for Move To action
  LOOK_AT_REQUEST: "look-at-request", // New for Look At action
  FOLLOW_REQUEST: "follow-request", // Existing, ensure it maps to followCelestial
  FOCUS_REQUEST_INITIATED: "focus-request-initiated", // May need renaming if FOCUS_REQUEST changes meaning
  TRANSITION_COMPLETE: "transitioncomplete",

  TOGGLE: "toggle",
  CONTENT_CHANGE: "content-change",
  COPY: "copy",
  CLEAR: "clear",
  CHANGE: "change",
  SUBMIT_CUSTOM: "submit-custom",
  RESET_CUSTOM: "reset-custom",
  MODAL_CONFIRM: "modal-confirm",
  MODAL_CLOSE: "modal-close",
  MODAL_ADDITIONAL: "modal-additional",
  SELECT_CHANGE: "select:change",
  SLIDER_CHANGE: "slider:change",

  COMMAND: "command",

  UI_PANEL_OPEN: "ui:panel:open",
  UI_PANEL_CLOSE: "ui:panel:close",
  UI_BUTTON_CLICK: "ui:button:click",
  UI_MODAL_SHOW: "ui:modal:show",
  UI_MODAL_HIDE: "ui:modal:hide",
  UI_NOTIFICATION_SHOW: "ui:notification:show",

  GAME_STATE_UPDATE: "game:state:update",
  PLAYER_POSITION_UPDATE: "player:position:update",
  ENTITY_ADDED: "entity:added",
  ENTITY_REMOVED: "entity:removed",
} as const;

export interface SliderValueChangePayload {
  value: number;
}
