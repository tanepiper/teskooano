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
    padding: calc(var(--space-1) / 2) var(--space-1); /* 2px 4px */
    border-radius: var(--radius-sm); /* 3px -> 4px */
    transition: background-color var(--transition-duration-fast) ease;
    box-sizing: border-box; /* Include padding in width */
    gap: var(--space-1); /* 4px */
    font-size: var(--font-size-1); /* ~0.95em of base, now fixed token */
  }

  :host(:hover) {
     background-color: var(--color-surface-row-hover);
  }

  /* Focused state styling */
  :host([focused]) {
    background-color: var(--color-primary-hover); /* Muted primary */
    color: var(--color-text-on-primary);
    font-weight: var(--font-weight-bold);
  }
  :host([focused]) .celestial-icon {
      filter: brightness(0) invert(1);
  }
  :host([focused]) .object-name {
       /* Add specific styles for focused name if needed */
  }
   :host([focused]) teskooano-button {
        /* Ensure buttons are visible on focused background */
        --button-icon-color: var(--color-text-on-primary);
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
    gap: var(--space-2); /* 6px -> 8px */
  }

  .celestial-icon {
    width: var(--font-size-1); /* 14px, scale with text */
    height: var(--font-size-1); /* 14px, scale with text */
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
    gap: calc(var(--space-1) / 2); /* 2px */
    flex-shrink: 0; /* Prevent buttons shrinking */
  }

  teskooano-button {
    /* Rely on TeskooanoButton's 'sm' size variant for padding, min-height, icon-size */
    /* --button-padding: 2px; */
    /* --button-min-height: 18px; */
    /* --button-icon-size: 14px; */
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
