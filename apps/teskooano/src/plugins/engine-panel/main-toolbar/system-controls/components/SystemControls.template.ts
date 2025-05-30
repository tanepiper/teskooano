import RocketRegular from "@fluentui/svg-icons/icons/rocket_20_regular.svg?raw";
import SparkleRegular from "@fluentui/svg-icons/icons/sparkle_20_regular.svg?raw";
import DocumentAddRegular from "@fluentui/svg-icons/icons/document_add_20_regular.svg?raw";
import ArrowDownloadRegular from "@fluentui/svg-icons/icons/arrow_download_20_regular.svg?raw";
import CopyRegular from "@fluentui/svg-icons/icons/copy_20_regular.svg?raw";
import ArrowUploadRegular from "@fluentui/svg-icons/icons/arrow_upload_20_regular.svg?raw";
import DeleteRegular from "@fluentui/svg-icons/icons/delete_20_regular.svg?raw";
import HomeRegular from "@fluentui/svg-icons/icons/home_20_regular.svg?raw";

const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      font-family: var(--font-family-base);
      height: 100%;
      min-width: calc(var(--space-10) * 3 + var(--space-8)); /* 240px */
      width: auto;
    }

    :host([mobile]) {
      min-width: auto;
      width: auto;
    }

    .teskooano-system-controls-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 0 var(--space-2);
      height: 100%;
    }

     .state {
       display: flex;
       flex-grow: 1;
       align-items: center;
       gap: var(--space-3);
       width: 100%;
     }

     :host([mobile]) .state {
       flex-wrap: wrap;
     }

    .actions {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
    }

    teskooano-button.danger::part(button) {
      background-color: var(--color-error);
      border-color: var(--color-error);
      color: var(--color-text-on-primary); /* Text on error buttons */
      transition: filter var(--transition-duration-fast) var(--transition-timing-base);
    }
    
    :host([mobile]) teskooano-button:not(:has(span:not([slot='icon']))) svg {
        margin: 0;
    }

     .state--empty {
       justify-content: flex-start;
     }

    .state--empty .seed-form {
      display: flex;
      gap: var(--space-2);
      align-items: center;
      flex-grow: 1;
      min-width: calc(var(--space-10) * 2 + var(--space-4) + var(--space-2)); /* ~152px */
      max-width: calc(var(--space-10) * 4 - var(--space-1)); /* ~252px */
    }

    :host([mobile]) .state--empty .seed-form {
       min-width: calc(var(--space-10) * 2 - var(--space-2)); /* 120px */
       max-width: calc(var(--space-10) * 3 - var(--space-3)); /* 180px */
       gap: var(--space-1);
    }

    .state--empty .seed-form label {
      display: none;
    }

    .state--empty .seed-form input[type="text"] {
      flex-grow: 1;
      height: calc(var(--control-height-sm) - 2px); /* Adjust for border */
      min-width: calc(var(--space-10) + var(--space-4)); /* 80px */
      padding: var(--space-1) var(--space-2);
      border: var(--border-width-thin) solid var(--color-border-subtle);
      border-radius: var(--radius-sm); /* Smaller radius for inputs */
      background-color: var(--color-surface-1);
      color: var(--color-text-primary);
      font-size: var(--font-size-1);
    }
     :host([mobile]) .state--empty .seed-form input[type="text"] {
        height: calc(var(--control-height-xs) - 2px); /* Adjust for border */
     }

    .state--empty .seed-form input.error {
      border-color: var(--color-error);
      outline: var(--border-width-thin) solid var(--color-error);
    }

     .state--empty .seed-form teskooano-button[type="submit"] {
       padding: 0;
       min-width: fit-content;
     }
     :host([mobile]) .state--empty .seed-form teskooano-button[type="submit"] span:not([slot='icon']) {
       display: none;
     }
     :host([mobile]) .state--empty .seed-form teskooano-button[type="submit"] span[slot='icon'] {
       margin: 0;
     }

    .state--loaded {
        justify-content: space-between;
     }

    .state--loaded .system-info {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      min-width: calc(var(--space-10) * 2 - var(--space-2)); /* 120px */
      flex-shrink: 0;
    }

    .state--loaded .system-info .system-seed {
      color: var(--color-text-secondary);
      font-family: var(--font-family-monospace);
      font-size: var(--font-size-1);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: calc(var(--space-10) * 2 + var(--space-4) + var(--space-2)); /* ~152px, was 150px */
      background-color: var(--color-surface-1);
      padding: var(--space-1) var(--space-2); /* Was 2px 6px */
      border-radius: var(--radius-sm);
      border: var(--border-width-thin) solid var(--color-border-subtle);
    }

    .state--loaded .system-info .celestial-count {
      color: var(--color-text-secondary);
      font-size: var(--font-size-1);
      white-space: nowrap;
    }

    :host([mobile]) .state--loaded {
        gap: var(--space-2); /* Was var(--spacing-sm, 8px) */
        flex-wrap: wrap;
    }
    :host([mobile]) .state--loaded .system-info {
      flex-direction: row;
      align-items: flex-start;
      gap: var(--space-1); /* Was var(--spacing-xs, 4px) */
      min-width: calc(var(--space-10) + var(--space-6) + var(--space-1)); /* 100px */
      width: 100%;
      order: 1;
    }
    :host([mobile]) .state--loaded .actions {
       width: 100%;
       justify-content: flex-end;
       order: 2;
    }

    .feedback {
      display: inline-block;
      margin-left: var(--space-1); /* Was 4px */
      animation: fadeIn 0.3s ease-in;
      color: var(--color-success);
      font-weight: bold;
    }
     .feedback.error {
       color: var(--color-warning); /* Was #f39c12 */
     }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

     .loading-overlay {
       position: absolute;
       inset: 0;
       background-color: var(--color-scrim); /* Was --color-scrim-light */
       display: flex;
       align-items: center;
       justify-content: center;
       color: var(--color-text-on-dark, var(--color-text-primary));
       font-size: 1.2em;
       z-index: 10;
       border-radius: var(--radius-md);
     }
     .loading-overlay::after {
       content: '⏳';
       animation: spin 1s linear infinite;
       display: inline-block;
       margin-left: var(--space-2); /* Was 8px */
     }

     @keyframes spin {
       from { transform: rotate(0deg); }
       to { transform: rotate(360deg); }
     }

  </style>
  <div class="teskooano-system-controls-container">
    <!-- Empty State -->
    <div class="state state--empty">
      <form class="seed-form">
        <label for="seed">Seed:</label>
        <input type="text" id="seed" name="seed" placeholder="Enter seed..."
               aria-label="System seed input">
        <teskooano-button 
            id="generate-seed-button"
            type="submit" 
            variant="secondary" 
            size="sm" 
            title="Generate System from Seed"
            tooltip-title="Generate"
            tooltip-text="Generate system from entered seed"
            tooltip-icon='${RocketRegular}' /* Use _20 icon for consistency? */>
          ${RocketRegular}
        </teskooano-button>
      </form>
      <div class="actions">
        <teskooano-button
            data-action="home" 
            variant="ghost" 
            size="sm" 
            title="Load Home System (Solar System)"
            tooltip-title="Home System"
            tooltip-text="Load the Solar System as the current system"
            tooltip-icon='${HomeRegular}'>
          ${HomeRegular}
        </teskooano-button>
        <teskooano-button 
            id="generate-random-button"
            data-action="random" 
            variant="secondary" 
            size="sm" 
            title="Generate Random System"
            tooltip-title="Random Seed"
            tooltip-text="Generate system using a random seed"
            tooltip-icon='${SparkleRegular}'>
          ${SparkleRegular}
        </teskooano-button>
        <teskooano-button 
            data-action="create-blank" 
            variant="ghost" 
            size="sm" 
            title="Create New Blank System"
            tooltip-title="New Blank"
            tooltip-text="Create a new blank system with just a star"
            tooltip-icon='${DocumentAddRegular}'>
          ${DocumentAddRegular}
        </teskooano-button>
        <teskooano-button 
            data-action="import" 
            variant="ghost" 
            size="sm" 
            title="Import System from JSON"
            tooltip-title="Import System"
            tooltip-text="Import system from a JSON file"
            tooltip-icon='${ArrowDownloadRegular}'>
          ${ArrowDownloadRegular}
        </teskooano-button>
      </div>
    </div>

    <!-- Loaded State -->
    <div class="state state--loaded" style="display: none;">
      <div class="system-info">
        <span class="system-seed" title="Current Seed">---------</span>
        <span class="celestial-count">0 Celestials</span>
      </div>
      <div class="actions">
        <teskooano-button 
            data-action="copy-seed" 
            variant="ghost" 
            size="sm" 
            title="Copy System Seed"
            tooltip-title="Copy Seed"
            tooltip-text="Copy the current system seed to the clipboard"
            tooltip-icon='${CopyRegular}'>
          ${CopyRegular}
        </teskooano-button>
        <teskooano-button 
            data-action="export" 
            variant="ghost" 
            size="sm" 
            title="Export System to JSON"
            tooltip-title="Export System"
            tooltip-text="Export current system objects and seed to a JSON file"
            tooltip-icon='${ArrowUploadRegular}'>
          ${ArrowUploadRegular}
        </teskooano-button>
        <teskooano-button 
            data-action="clear" 
            variant="ghost" 
            class="danger" 
            size="sm" 
            title="Clear System"
            tooltip-title="Clear System"
            tooltip-text="Clear all objects from the current system"
            tooltip-icon='${DeleteRegular}'>
          ${DeleteRegular}
        </teskooano-button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" style="display: none;">Generating...</div>

    <slot></slot>
  </div>
`;

export { template as SystemControlsTemplate };
