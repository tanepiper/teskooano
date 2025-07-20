import ArrowSyncCircleIcon from "@fluentui/svg-icons/icons/arrow_sync_circle_24_regular.svg?raw";
import DismissCircleIcon from "@fluentui/svg-icons/icons/dismiss_circle_24_regular.svg?raw";
import { CelestialType } from "@teskooano/data-types";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      font-family: var(--font-family, sans-serif);
      font-size: 0.9em;
      fill: #fff;
    }

    .panel-header {
      padding: 12px 16px;
      background-color: var(--color-surface-2, rgba(255, 255, 255, 0.05));
      border-bottom: 1px solid var(--color-border, #4a4a6a);
      flex-shrink: 0;
    }

    .panel-title {
      margin: 0;
      font-size: 1.1em;
      font-weight: 600;
      color: var(--color-text-primary, #fff);
    }

    .connected-window {
      margin: 4px 0 0 0;
      font-size: 0.85em;
      color: var(--color-text-secondary, #aaa);
      font-style: italic;
    }

    .control-section {
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid var(--color-border, #4a4a6a);
      flex-shrink: 0; /* Don't shrink control sections */
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

    .target-list-container {
        flex: 2; /* Take 2/3 of available space */
        min-height: 200px; /* Minimum reasonable height */
        overflow-y: auto;
        padding-right: 5px; /* Space for scrollbar */
    }

    .destroyed-section {
        flex: 1; /* Take 1/3 of available space */
        min-height: 150px; /* Minimum reasonable height */
        overflow-y: auto;
    }

    .destroyed-list-container {
        overflow-y: auto;
        padding-right: 5px; /* Space for scrollbar */
        max-height: calc(100% - 30px); /* Account for title */
    }

    /* --- Tree View Styles --- */
    ul, #focus-tree-list {
      list-style-type: none;
    }
    #focus-tree-list {
      margin: 0;
      padding: 0;
    }
    li {
      padding: 0;
      margin: 0;
      /* Add a little space between top-level items */
      /* margin-bottom: 1px; */
    }

    /* Container for caret + row OR just row (leaf) */
    .list-item-content {
        display: flex;
        align-items: center;
        padding-left: 4px; /* Base padding */
        min-height: 32px; /* Increased to match caret height */
    }
    .list-item-content.leaf-node {
        padding-left: 36px; /* Increased indent to align with text after larger caret */
    }

    /* Style the caret/arrow container (SPAN) */
    .caret {
      cursor: pointer;
      user-select: none;
      display: inline-block; /* Or flex if needed */
      width: 32px; /* Increased for better touch target */
      height: 32px; /* Increased for better touch target */
      flex-shrink: 0;
      margin-right: 4px; /* Space between caret and row */
      position: relative; /* For pseudo-element positioning */
      transition: transform 0.15s ease-out;
      /* Ensure good touch target on mobile */
      min-width: 32px;
      min-height: 32px;
    }
    /* Caret arrow using ::before */
    .caret::before {
      content: "\\25B6"; /* Right arrow */
      color: var(--color-text-secondary, #aaa);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 16px; /* Increased font size for better visibility */
    }
    .caret.caret-down::before {
      transform: translate(-50%, -50%) rotate(90deg);
    }

    /* Make the row take up remaining space */
    .list-item-content celestial-row {
       flex-grow: 1;
       /* Remove internal padding if handled by li/contentDiv now */
       /* padding: 0 !important; */
    }

    /* Hide/show nested lists */
    .nested {
      display: none;
      padding-left: 22px; /* Indentation for nested lists (aligns with leaf nodes) */
      margin: 0;
    }
    ul.nested.active {
      display: block;
    }
    /* --- End Tree View Styles --- */


    /* --- Status Styling (Applied to LI) --- */
    li.destroyed .list-item-content .caret::before,
    li.annihilated .list-item-content .caret::before {
      color: var(--color-text-disabled, #888);
      transform: translate(-50%, -50%) rotate(0deg) !important; /* Ensure always right arrow, no rotation */
    }
    li.destroyed .list-item-content .caret,
    li.annihilated .list-item-content .caret {
       /* cursor: not-allowed; -- Removed to allow interaction */
    }

    li.destroyed { opacity: 0.6; }
    li.annihilated { opacity: 0.4; }

    /* --- End Status Styling --- */


    .empty-message {
        padding: 10px;
        color: var(--color-text-secondary, #aaa);
        text-align: center;
        font-style: italic;
    }

    .destroyed-title {
        margin: 0 0 10px 0;
        padding: 0;
        font-size: 1em;
        font-weight: bold;
        color: var(--color-text-primary, #fff);
    }

  </style>

  <div class="panel-header">
    <p class="connected-window" id="connected-window">Not connected</p>
  </div>

  <div class="control-section">
    <div class="button-row">
      <teskooano-button id="reset-view" title="Reset Camera View & Clear Focus" icon-svg='${ArrowSyncCircleIcon}'>Reset</teskooano-button>
      <teskooano-button id="clear-focus" title="Clear Camera Focus" icon-svg='${DismissCircleIcon}'>Clear</teskooano-button>
    </div>
  </div>

  <div class="target-list-container">
     <ul id="focus-tree-list">
       <!-- Tree populated here -->
     </ul>
  </div>

  <div class="destroyed-section control-section">
    <h3 class="destroyed-title">Destroyed Objects</h3>
    <div class="destroyed-list-container">
      <ul id="destroyed-list">
        <!-- Destroyed items populated here -->
      </ul>
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
