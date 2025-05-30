import BoxMultipleArrowRightFilled from "@fluentui/svg-icons/icons/box_multiple_arrow_right_24_filled.svg?raw";

const template = document.createElement("template");
template.innerHTML = `
<style>
  .engine-overlay-toolbar-container {
    position: absolute;
    top: 0;
    left: 0;
    z-index: var(--z-index-engine-toolbar);
    display: inline-flex;
    align-items: center;
    justify-content: space-between;
    background-color: var(--color-surface-2-alpha-70);
    border-radius: var(--radius-sm);
    padding: var(--space-1);
    gap: var(--space-1);
    overflow: visible;
    color: var(--color-text-primary);
    fill: var(--color-text-primary);
  }

  .engine-overlay-toolbar-container teskooano-button {
    flex-shrink: 0;
    color: inherit;
  }

  .engine-overlay-toolbar-container teskooano-button svg {
    width: var(--font-size-4);
    height: var(--font-size-4);
  }

  teskooano-button#engine-toolbar-toggle-button svg,
  .engine-overlay-toolbar-container teskooano-button:not(#engine-toolbar-toggle-button):hover svg {
    fill: var(--color-accent-attention-fill);
  }

  .toolbar-collapsible-buttons {
    display: inline-flex;
    gap: var(--space-1);
    align-items: center;
    max-width: 0;
    overflow: hidden;
    transition: max-width 0.3s ease-in-out, opacity 0.3s ease-in-out;
    white-space: nowrap;
    opacity: 0;
    visibility: hidden;
  }

  .toolbar-collapsible-buttons.expanded {
    max-width: 500px;
    opacity: 1;
    visibility: visible;
  }

  .toolbar-widget-area {
    display: inline-flex;
    gap: var(--space-1);
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
