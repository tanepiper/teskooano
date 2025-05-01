// --- Import Fluent UI Icons ---
import RocketRegular from "@fluentui/svg-icons/icons/rocket_20_regular.svg?raw";
import SparkleRegular from "@fluentui/svg-icons/icons/sparkle_20_regular.svg?raw";
import DocumentAddRegular from "@fluentui/svg-icons/icons/document_add_20_regular.svg?raw";
import ArrowDownloadRegular from "@fluentui/svg-icons/icons/arrow_download_20_regular.svg?raw";
import CopyRegular from "@fluentui/svg-icons/icons/copy_20_regular.svg?raw";
import ArrowUploadRegular from "@fluentui/svg-icons/icons/arrow_upload_20_regular.svg?raw";
import DeleteRegular from "@fluentui/svg-icons/icons/delete_20_regular.svg?raw";
import SparkleIcon from "@fluentui/svg-icons/icons/sparkle_24_regular.svg?raw";
import DeleteIcon from "@fluentui/svg-icons/icons/delete_24_regular.svg?raw";
import SaveIcon from "@fluentui/svg-icons/icons/save_24_regular.svg?raw";
import FolderOpenIcon from "@fluentui/svg-icons/icons/folder_open_24_regular.svg?raw";
import DocumentAddIcon from "@fluentui/svg-icons/icons/document_add_24_regular.svg?raw";
import CopyIcon from "@fluentui/svg-icons/icons/copy_24_regular.svg?raw";
import CheckmarkIcon from "@fluentui/svg-icons/icons/checkmark_24_regular.svg?raw";
// --- End Fluent UI Icons ---

// Define template outside the class for better organization
const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      font-family: var(--font-family-base, sans-serif);
      height: 100%;
      min-width: 240px; /* Default min width */
      width: auto; /* Let it size based on content */
    }

    /* When in mobile mode, adjust to fit more compactly into toolbar */
    :host([mobile]) {
      min-width: auto; /* Let it shrink */
      width: auto;
    }

    .teskooano-system-controls-container {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between; /* Align items nicely */
      width: 100%;
      padding: 0 var(--spacing-sm, 8px);
      height: 100%;
    }

     /* Ensure states take up appropriate space */
     .state {
       display: flex; /* Use flex for internal layout */
       flex-grow: 1; /* Allow state container to grow */
       align-items: center;
       gap: var(--spacing-md, 12px);
       width: 100%; /* Take full width within parent */
     }

     /* When mobile, stack items more readily if needed */
     :host([mobile]) .state {
       flex-wrap: wrap; /* Allow wrapping on small screens */
     }


    /* Styles for action groups */
    .actions {
      display: flex;
      flex-wrap: nowrap; /* Keep actions in a single row */
      align-items: center; /* Align buttons vertically */
    }

    /* Style the danger button specifically using the class */
    teskooano-button.danger::part(button) {
      background-color: var(--color-error, #e74c3c);
      border-color: var(--color-error, #e74c3c);
      color: var(--color-text-on-primary, white);
    }
     teskooano-button.danger:hover::part(button) {
       background-color: var(--color-error-dark, #c0392b);
       border-color: var(--color-error-dark, #c0392b);
     }

    /* Icon styles */
    /* REMOVED .icon class styles */

    /* Style the SVG icons */
    teskooano-button svg {
      width: 1.1em; /* Match previous .icon size */
      height: 1.1em;
      fill: currentColor; /* Use button text color */
      display: block; /* Ensure proper layout */
      margin: auto; /* Center if needed */
    }
    /* Remove margin from icon-only buttons on mobile */
    :host([mobile]) teskooano-button:not(:has(span:not([slot='icon']))) svg {
        margin: 0;
    }


    /* State-specific styles */
     .state--empty {
       /* display: flex; Inherited from .state */
       justify-content: flex-start; /* Align form and actions */
     }

    .state--empty .seed-form {
      display: flex;
      gap: var(--spacing-sm, 8px);
      align-items: center;
      flex-grow: 1; /* Allow form to take available space */
      min-width: 150px; /* Prevent excessive shrinking */
      max-width: 250px; /* Limit max width */
    }

    /* When in mobile mode, make the form more compact */
    :host([mobile]) .state--empty .seed-form {
       min-width: 120px;
       max-width: 180px;
       gap: var(--spacing-xs, 4px);
    }

    .state--empty .seed-form label {
      /* Keep hidden for space */
      display: none;
    }

    .state--empty .seed-form input[type="text"] {
      flex-grow: 1;
      height: calc(var(--control-height-sm, 32px) - 2px); /* Match button height */
      min-width: 80px; /* Minimum sensible width */
      padding: var(--space-1, 4px) var(--space-2, 8px);
      border: var(--border-width-thin, 1px) solid var(--color-border-subtle, #4a4a6a);
      border-radius: var(--radius-md, 4px);
      background-color: var(--color-surface-1, #1a1a2e);
      color: var(--color-text-primary, #e0e0fc);
      font-size: var(--font-size-small, 0.85rem);
    }
     :host([mobile]) .state--empty .seed-form input[type="text"] {
        height: calc(var(--control-height-xs, 28px) - 2px); /* Even smaller on mobile */
     }


    .state--empty .seed-form input.error {
      border-color: var(--color-error, #e74c3c);
      outline: 1px solid var(--color-error, #e74c3c); /* Add outline for visibility */
    }

     /* Hide regular submit button, use action button */
     .state--empty .seed-form teskooano-button[type="submit"] {
       /* Use dedicated button now */
       /* display: none; */
       /* Instead, let's make it an icon button */
       padding: 0; /* Remove padding if needed */
       min-width: fit-content; /* Adjust width for icon */
     }
     :host([mobile]) .state--empty .seed-form teskooano-button[type="submit"] span:not([slot='icon']) {
       display: none; /* Hide text on mobile */
     }
     :host([mobile]) .state--empty .seed-form teskooano-button[type="submit"] span[slot='icon'] {
       margin: 0; /* Remove margin */
     }

    /* Loaded state adjustments */
     .state--loaded {
        /* display: flex; Inherited */
        justify-content: space-between; /* Space out info and actions */
     }

    .state--loaded .system-info {
      display: flex;
      gap: var(--spacing-md, 12px);
      align-items: center;
      min-width: 120px; /* Give it some space */
      flex-shrink: 0; /* Don't let it shrink too easily */
    }

    .state--loaded .system-info .system-seed {
      color: var(--color-text-secondary, #a0a0cc);
      font-family: var(--font-family-monospace, monospace);
      font-size: var(--font-size-small, 0.85rem);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 150px;
      background-color: var(--color-surface-1, #1a1a2e);
      padding: 2px 6px;
      border-radius: var(--radius-sm, 2px);
      border: 1px solid var(--color-border-subtle, #4a4a6a);
    }

    .state--loaded .system-info .celestial-count {
      color: var(--color-text-secondary, #a0a0cc);
      font-size: var(--font-size-small, 0.85rem);
      white-space: nowrap;
    }

    /* Compact layout for mobile toolbar */
    :host([mobile]) .state--loaded {
        gap: var(--spacing-sm, 8px);
        flex-wrap: wrap; /* Allow wrap */
    }
    :host([mobile]) .state--loaded .system-info {
      flex-direction: row;
      align-items: flex-start;
      gap: var(--spacing-xs, 4px);
      min-width: 100px;
      width: 100%; /* Take full width when wrapped */
      order: 1; /* Put info first */
    }
    :host([mobile]) .state--loaded .actions {
       width: 100%; /* Take full width when wrapped */
       justify-content: flex-end; /* Align buttons right */
       order: 2; /* Put actions second */
    }


    /* Feedback indicator */
    .feedback {
      display: inline-block;
      margin-left: 4px;
      animation: fadeIn 0.3s ease-in;
      color: var(--color-success, #2ecc71); /* Green for success */
      font-weight: bold;
    }
     .feedback.error {
       color: var(--color-warning, #f39c12); /* Orange for warning/error */
     }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }

    /* Loading state overlay */
     .loading-overlay {
       position: absolute;
       inset: 0;
       background-color: rgba(0, 0, 0, 0.5);
       display: flex;
       align-items: center;
       justify-content: center;
       color: white;
       font-size: 1.2em;
       z-index: 10;
       border-radius: var(--radius-md, 4px);
     }
     .loading-overlay::after {
       content: '⏳'; /* Loading emoji */
       animation: spin 1s linear infinite;
       display: inline-block;
       margin-left: 8px;
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
        <teskooano-button type="submit" variant="secondary" size="sm" title="Generate System from Seed">
          ${RocketRegular}
          <!-- <span>Go</span> --> <!-- Remove text for icon only -->
        </teskooano-button>
      </form>
      <div class="actions">
        <teskooano-button data-action="random" variant="secondary" size="sm" title="Generate Random System">
          ${SparkleRegular}
        </teskooano-button>
        <teskooano-button data-action="create-blank" variant="ghost" size="sm" title="Create New Blank System">
          ${DocumentAddRegular}
        </teskooano-button>
        <!-- Import might need more work later -->
        <teskooano-button data-action="import" variant="ghost" size="sm" title="Import System from JSON">
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
        <teskooano-button data-action="copy-seed" variant="ghost" size="sm" title="Copy System Seed">
          ${CopyRegular}
        </teskooano-button>
        <teskooano-button data-action="export" variant="ghost" size="sm" title="Export System to JSON">
          ${ArrowUploadRegular}
        </teskooano-button>
        <teskooano-button data-action="clear" variant="ghost" class="danger" size="sm" title="Clear System">
          ${DeleteRegular}
        </teskooano-button>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div class="loading-overlay" style="display: none;">Generating...</div>

    <slot></slot> <!-- Keep slot for potential extensions -->
  </div>
`;

export { template as SystemControlsTemplate };

// Export icons for use in the component logic
export {
  SparkleIcon,
  DeleteIcon,
  SaveIcon,
  FolderOpenIcon,
  DocumentAddIcon,
  CopyIcon,
  CheckmarkIcon,
};
