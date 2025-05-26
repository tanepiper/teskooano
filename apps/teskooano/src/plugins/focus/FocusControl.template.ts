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
    }

    /* --- Tree View Styles --- */
    ul, #focus-tree-list, #destroyed-list {
      list-style-type: none;
    }
    #focus-tree-list, #destroyed-list {
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
        min-height: 24px; /* Ensure consistent height */
    }
    .list-item-content.leaf-node {
        padding-left: 22px; /* Indent leaf nodes further to align with text after caret */
    }

    /* Style the caret/arrow container (SPAN) */
    .caret {
      cursor: pointer;
      user-select: none;
      display: inline-block; /* Or flex if needed */
      width: 18px; /* Fixed width for alignment */
      height: 18px; /* Match button size roughly */
      flex-shrink: 0;
      margin-right: 4px; /* Space between caret and row */
      position: relative; /* For pseudo-element positioning */
      transition: transform 0.15s ease-out;
    }
    /* Caret arrow using ::before */
    .caret::before {
      content: "\\25B6"; /* Right arrow */
      color: var(--color-text-secondary, #aaa);
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      font-size: 10px; /* Adjust size */
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
       cursor: not-allowed;
    }

    li.destroyed { opacity: 0.6; }
    li.annihilated { opacity: 0.4; }

    /* --- End Status Styling --- */

    /* --- Destroyed List Styles --- */
    #destroyed-list li {
      padding: 2px 0;
      opacity: 0.7;
    }
    
    #destroyed-list li.annihilated {
      opacity: 0.5;
    }
    
    #destroyed-list .destruction-time {
      font-size: 0.8em;
      color: var(--color-text-secondary, #888);
      margin-left: 10px;
    }
    /* --- End Destroyed List Styles --- */

    .empty-message {
        padding: 10px;
        color: var(--color-text-secondary, #aaa);
        text-align: center;
        font-style: italic;
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
      <div class="target-list-container">
        <ul id="focus-tree-list">
          <!-- Active tree populated here -->
        </ul>
      </div>
    </div>
    
    <div class="list-section">
      <h3 class="section-header">
        Destroyed Objects
        <span class="count" id="destroyed-count">(0)</span>
      </h3>
      <div class="target-list-container">
        <ul id="destroyed-list">
          <!-- Destroyed objects listed here -->
        </ul>
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
