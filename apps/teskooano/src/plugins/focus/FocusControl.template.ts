import ArrowSyncCircleIcon from "@fluentui/svg-icons/icons/arrow_sync_circle_24_regular.svg?raw";
import DismissCircleIcon from "@fluentui/svg-icons/icons/dismiss_circle_24_regular.svg?raw";
import { CelestialType } from "@teskooano/data-types";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--font-family, sans-serif);
      font-size: 0.9em;
      fill: #fff;
    }
    .control-section {
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--color-border, #4a4a6a);
    }
    .control-section:last-child {
       border-bottom: none;
       margin-bottom: 0;
       padding-bottom: 0;
    }
    .button-row {
      display: flex;
      gap: 8px;
    }
    teskooano-button#reset-view,
    teskooano-button#clear-focus {
      flex-grow: 1;
    }

    .lists-container {
      display: flex;
      flex-direction: column;
      gap: 20px;
      max-height: 550px;
      overflow-y: auto;
    }

    .list-section {
      flex-shrink: 0;
    }

    .section-header {
      font-weight: bold;
      color: var(--color-text-primary, #fff);
      margin: 0 0 10px 0;
      padding: 5px 10px;
      background-color: var(--color-surface-secondary, rgba(255, 255, 255, 0.1));
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-header .count {
      font-size: 0.85em;
      font-weight: normal;
      color: var(--color-text-secondary, #aaa);
    }

    .target-list-container {
      padding-right: 5px; /* Space for scrollbar */
      min-height: 100px; /* Ensure minimum height for lists */
    }

    /* Web component containers */
    focus-tree-list,
    destroyed-objects-list {
      display: block;
      width: 100%;
    }
  </style>

  <div class="control-section">
    <div class="button-row">
      <teskooano-button id="reset-view" title="Reset Camera View & Clear Focus" icon-svg='${ArrowSyncCircleIcon}'>Reset</teskooano-button>
      <teskooano-button id="clear-focus" title="Clear Camera Focus" icon-svg='${DismissCircleIcon}'>Clear</teskooano-button>
    </div>
  </div>

  <div class="lists-container">
    <div class="list-section">
      <h3 class="section-header">
        Active Objects
        <span class="count" id="active-count">(0)</span>
      </h3>
      <div class="target-list-container" id="active-list-container">
        <!-- Focus tree list component will be inserted here -->
      </div>
    </div>
    
    <div class="list-section">
      <h3 class="section-header">
        Destroyed Objects
        <span class="count" id="destroyed-count">(0)</span>
      </h3>
      <div class="target-list-container" id="destroyed-list-container">
        <!-- Destroyed objects list component will be inserted here -->
      </div>
    </div>
  </div>
`;

const iconStyles: Record<string, string> = {
  [CelestialType.STAR]: "background-color: yellow;",
  [CelestialType.PLANET]: "background-color: skyblue;",
  [CelestialType.GAS_GIANT]: "background-color: orange;",
  [CelestialType.DWARF_PLANET]: "background-color: lightblue;",
  [CelestialType.MOON]: "background-color: lightgrey;",
  [CelestialType.ASTEROID_FIELD]: "background-color: brown;",
  [CelestialType.OORT_CLOUD]: "background-color: darkgrey;",
  default: "background-color: white;",
};

export { template, iconStyles };
