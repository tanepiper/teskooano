import ArrowSyncCircleIcon from "@fluentui/svg-icons/icons/arrow_sync_circle_24_regular.svg?raw";
import DismissCircleIcon from "@fluentui/svg-icons/icons/dismiss_circle_24_regular.svg?raw";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--font-family, sans-serif);
      font-size: 0.9em;
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
    /* Update selectors */
    teskooano-button#reset-view,
    teskooano-button#clear-focus {
      flex-grow: 1;
      /* Assuming teskooano-button handles its own base styling */
    }

    .target-list-container {
        max-height: 400px; /* Or adjust as needed */
        overflow-y: auto;
        padding-right: 5px; /* Space for scrollbar */
    }
    /* Styles for the focus item buttons */
    button.focus-item {
      /* Reset button defaults */
      border: none;
      background: none;
      margin: 0 0 2px 0; /* Add bottom margin */
      padding: 0;
      font: inherit;
      color: inherit;
      text-align: left;
      cursor: pointer;
      width: 100%; /* Make button fill container width */

      /* Original focus-item styles */
      display: flex;
      align-items: center;
      padding: 4px 6px; /* Re-apply padding */
      border-radius: 3px;
      transition: background-color 0.15s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    button.focus-item:hover {
      background-color: var(--color-surface-hover, rgba(255, 255, 255, 0.1));
    }
    button.focus-item.active {
      background-color: var(--color-primary, #6c63ff);
      color: white;
      font-weight: bold;
    }
    button.focus-item.active .celestial-icon {
       filter: brightness(0) invert(1); /* Make icon white on active */
    }
    .celestial-icon {
      width: 14px;
      height: 14px;
      margin-right: 6px;
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      flex-shrink: 0;
      /* Basic placeholder colors */
      border-radius: 50%;
      display: inline-block;
    }
    .star-icon { background-color: yellow; }
    .planet-icon { background-color: skyblue; }
    .gas-giant-icon { background-color: orange; }
    .moon-icon { background-color: lightgrey; }
    .asteroid-field-icon { background-color: brown; }
    .oort-cloud-icon { background-color: darkgrey; }
    .default-icon { background-color: white; }

    /* Style for destroyed items */
    button.focus-item.destroyed {
      color: var(--color-text-disabled, #888);
      text-decoration: line-through;
      cursor: not-allowed;
      opacity: 0.6;
      background-color: transparent; /* Ensure no hover/active background */
    }
    button.focus-item.destroyed:hover {
      background-color: transparent; /* Prevent hover effect */
    }
    button.focus-item.destroyed .celestial-icon {
      filter: grayscale(100%) opacity(50%);
    }

    /* Style for annihilated items */
    button.focus-item.annihilated {
      color: var(--color-text-disabled, #888);
      text-decoration: line-through;
      cursor: not-allowed;
      opacity: 0.4; /* Even more faded than destroyed */
      background-color: transparent;
    }
    button.focus-item.annihilated:hover {
      background-color: transparent;
    }
    button.focus-item.annihilated .celestial-icon {
      filter: grayscale(100%) opacity(30%);
    }

    .indent-1 { margin-left: 15px; }
    .indent-2 { margin-left: 30px; }

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

  <div class="target-list-container" id="target-list">
    <!-- Object list populated here -->
  </div>
`;

export default template;