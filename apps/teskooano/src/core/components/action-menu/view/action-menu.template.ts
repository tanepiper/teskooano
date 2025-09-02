import MoreHorizontalIcon from "@fluentui/svg-icons/icons/more_horizontal_16_regular.svg?raw";

const template = document.createElement("template");
template.innerHTML = `
<style>
  :host {
    display: inline-block;
    position: relative;
  }

  .action-menu-container {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .menu-toggle-button {
    flex-shrink: 0;
  }

  .menu-container {
    position: absolute;
    z-index: 9999;
    display: inline-flex;
    align-items: center;
    background-color: rgba(40, 40, 60, 0.95);
    border-radius: 4px;
    padding: 4px;
    gap: 4px;
    overflow: visible;
    color: white;
    fill: var(--color-text-primary);
    max-width: 0;
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
    transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out, visibility 0.3s ease-in-out, pointer-events 0s 0.3s;
    white-space: nowrap;
    /* Ensure menu doesn't interfere with toggle button */
    min-width: 0;
    min-height: 0;
  }

  .menu-container teskooano-button {
    pointer-events: none;
  }

  .menu-container.expanded teskooano-button {
    pointer-events: auto;
  }

  .menu-container.expanded {
    max-width: 400px;
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
    transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out, visibility 0.3s ease-in-out, pointer-events 0s;
  }

  .menu-container teskooano-button {
    flex-shrink: 0;
    color: inherit;
  }

  .menu-container teskooano-button svg {
    width: 16px;
    height: 16px;
  }

  .menu-container teskooano-button:hover svg {
    fill: rgba(191, 237, 9, 0.85);
  }

  /* Active button states */
  .menu-container teskooano-button.active {
    --button-icon-color: rgba(191, 237, 9, 0.85);
  }

  .menu-container teskooano-button.active svg {
    fill: rgba(191, 237, 9, 0.85);
  }

  /* Direction-specific positioning */
  .menu-container[data-direction="left"] {
    right: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-right: 16px; /* Increased from 8px to prevent overlap */
  }

  .menu-container[data-direction="right"] {
    left: 100%;
    top: 50%;
    transform: translateY(-50%);
    margin-left: 16px; /* Increased from 8px to prevent overlap */
  }

  .menu-container[data-direction="top"] {
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-bottom: 8px;
    flex-direction: column;
  }

  .menu-container[data-direction="bottom"] {
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    margin-top: 8px;
    flex-direction: column;
  }
</style>

<div class="action-menu-container">
  <teskooano-button 
    id="menu-toggle-btn" 
    title="More Options" 
    variant="ghost" 
    class="menu-toggle-button"
    size="xs">
    <span slot="icon" id="menu-icon">${MoreHorizontalIcon}</span>
  </teskooano-button>
  
  <div class="menu-container" id="menu-container" data-direction="right">
    <!-- Dynamic action buttons will be inserted here -->
  </div>
</div>
`;

export { template };
