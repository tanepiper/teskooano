import BoxMultipleArrowRightFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_right_24_filled.svg?raw";

const template = document.createElement("template");
template.innerHTML = `
<style>
  /* Styles previously in EngineToolbar.injectStyles */
  .engine-overlay-toolbar-container {
    position: absolute;
    top: 0px;
    left: 0px;
    z-index: 9999;
    display: inline-flex;
    align-items: center; /* Align items vertically */
    justify-content: space-between; /* Push widget area to the right */
    background-color: rgba(40, 40, 60, 0.7);
    border-radius: 4px;
    padding: 4px;
    gap: 4px;
    overflow: visible; /* Allow content overflow */
    color: white; /* Default text/icon color */
    fill: var(--color-text-primary);
  }

  .engine-overlay-toolbar-container teskooano-button {
    flex-shrink: 0; /* Prevent buttons from shrinking */
    color: inherit; /* Inherit color from container */
  }

  .engine-overlay-toolbar-container teskooano-button svg {
    width: 18px;
    height: 18px;
  }

  teskooano-button.toolbar-toggle-button svg {
    fill: rgba(191, 237, 9, 0.85);
  }

  .engine-overlay-toolbar-container teskooano-button:not(.toolbar-toggle-button):hover svg{
    fill: rgba(191, 237, 9, 0.85);
  }

  .toolbar-collapsible-buttons {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    max-width: 0; /* Initially hidden */
    overflow: hidden;
    transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out;
    white-space: nowrap; /* Prevent wrapping during transition */
    opacity: 0; /* Start hidden */
    visibility: hidden; /* Start hidden */
  }

  .toolbar-collapsible-buttons.expanded {
    max-width: 500px; /* Adjust as needed */
    opacity: 1;
    visibility: visible;
  }

  .toolbar-widget-area {
    display: inline-flex;
    gap: 4px;
    align-items: center;
  }

  .toolbar-widget-area > * {
    flex-shrink: 0;
  }
</style>
<div class="toolbar-left-section">
  <teskooano-button
    id="engine-toolbar-toggle-button"
    class="toolbar-toggle-button"
    variant="icon"
    size="lg"
    title="Show Tools"
  >
    <span slot="icon">${BoxMultipleArrowRightFilled}</span>
  </teskooano-button>
  <div class="toolbar-collapsible-buttons">
    <!-- Dynamic buttons will be inserted here -->
  </div>
</div>
<div class="toolbar-widget-area">
  <!-- Dynamic widgets will be inserted here -->
</div>
`;

export { template };
