import EyeIcon from "@fluentui/svg-icons/icons/eye_24_regular.svg?raw";
import PersonRunningFilledIcon from "@fluentui/svg-icons/icons/person_running_20_regular.svg?raw";
import { stellarAnimations } from "../utils/celestial-icon-styles";

const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    display: flex; /* Use flexbox for the row itself */
    align-items: center;
    width: 100%;
    padding: 2px 4px; /* Reduced padding */
    border-radius: 3px;
    transition: background-color 0.15s ease;
    box-sizing: border-box; /* Include padding in width */
    gap: 4px; /* Space between elements */
    font-size: 0.95em; /* Slightly smaller font */
  }

  :host(:hover) {
     background-color: var(--color-surface-hover, rgba(255, 255, 255, 0.1));
  }

  /* Focused state styling */
  :host([focused]) {
    background-color: var(--color-primary-muted, #5551cc); /* Use a muted primary */
    color: var(--color-text-on-primary, white);
    font-weight: bold;
  }
  :host([focused]) .celestial-icon {
      filter: brightness(0) invert(1);
  }
  :host([focused]) .object-name {
       /* Add specific styles for focused name if needed */
  }
   :host([focused]) teskooano-button {
        /* Ensure buttons are visible on focused background */
        --button-icon-color: var(--color-text-on-primary, white);
   }


  /* Inactive state styling - only hide buttons */
  :host([inactive]) .action-buttons {
    display: none; /* Hide buttons for destroyed items */
  }



  .icon-name-container {
    display: flex;
    align-items: center;
    flex-grow: 1; /* Take remaining space */
    overflow: hidden; /* Prevent overflow */
    gap: 6px;
  }

  .celestial-icon {
    width: 14px;
    height: 14px;
    background-size: contain;
    background-repeat: no-repeat;
    background-position: center;
    flex-shrink: 0;
    border-radius: 50%; /* Keep the round icon style */
    /* Default background set via JS based on type */
  }

  .object-name {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .action-buttons {
    display: flex;
    align-items: center;
    gap: 2px; /* Small gap between action buttons */
    flex-shrink: 0; /* Prevent buttons shrinking */
  }

  teskooano-button {
    /* Use small variant, icon-only */
    --button-padding: 2px;
    --button-min-height: 18px; /* Adjust size */
    --button-icon-size: 14px;
    --button-icon-color: currentColor; /* Added: Make icon inherit text color */
  }

  /* Stellar animations */
  ${stellarAnimations}

</style>

<div class="icon-name-container">
  <span id="icon" class="celestial-icon"></span>
  <span id="name" class="object-name">Object Name</span>
</div>
<div class="action-buttons">
  <teskooano-button size="sm" id="focus-btn" title="Focus Camera" appearance="stealth">
    <span slot="icon">
      ${EyeIcon}
    </span>
  </teskooano-button>
  <teskooano-button size="sm" id="follow-btn" title="Follow Object" appearance="stealth">
    <span slot="icon">
      ${PersonRunningFilledIcon}
    </span>
  </teskooano-button>
</div>
`;

export { template };
