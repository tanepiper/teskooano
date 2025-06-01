import ArrowSyncCircleIcon from "@fluentui/svg-icons/icons/arrow_sync_circle_24_regular.svg?raw";
import DismissCircleIcon from "@fluentui/svg-icons/icons/dismiss_circle_24_regular.svg?raw";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: block;
      font-family: var(--font-family-base);
      font-size: var(--font-size-1);
      fill: var(--color-text-primary);
    }
    .control-section {
      margin-bottom: var(--spacing-md);
      padding-bottom: var(--space-3);
      border-bottom: var(--border-width-thin) solid var(--color-border-subtle);
    }
    .control-section:last-child {
       border-bottom: none;
       margin-bottom: 0;
       padding-bottom: 0;
    }
    .button-row {
      display: flex;
      gap: var(--space-2); /* 8px */
    }
    teskooano-button#reset-view,
    teskooano-button#clear-focus {
      flex-grow: 1;
    }

    .lists-container {
      display: flex;
      flex-direction: column;
      gap: var(--spacing-md); /* 16px */
      max-height: 550px;
      overflow-y: auto;
    }

    .list-section {
      flex-shrink: 0;
    }

    .section-header {
      /* Base h3 styles are applied by default, override/add specifics below */
      margin: 0 0 var(--space-3) 0; /* Override default h3 margins */
      padding: var(--space-1) var(--space-3);
      background-color: var(--color-surface-3); /* Closest opaque alternative */
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: space-between;
      /* font-weight and color are inherited or set by h3 base style */
    }

    .section-header .count {
      font-size: var(--font-size-1); /* Use smallest standard token */
      font-weight: normal; /* Explicitly set if different from parent */
      color: var(--color-text-secondary);
    }

    .target-list-container {
      padding-right: var(--space-1); /* Space for scrollbar */
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

export { template };
