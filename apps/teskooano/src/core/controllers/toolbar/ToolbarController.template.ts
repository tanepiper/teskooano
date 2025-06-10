export const template = document.createElement("template");

template.innerHTML = `
  <style>
    /* Styles moved from ToolbarController.css */
    .toolbar-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: var(--space-sm) var(--space-md); /* Use tokens */
      background-color: var(--color-surface-2); /* Use token */
      border-bottom: var(--border-width-thin) solid var(--color-border-neutral); /* Use tokens */
      gap: var(--space-md); /* Default gap, adjust in controller for mobile */
      box-sizing: border-box;
      height: 60px; /* Or use a token if defined */
      overflow: hidden; /* Prevent items wrapping */
      fill: var(--color-text-primary);
    }

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: var(--space-xs); /* Default gap between items in a section */
      flex-shrink: 0; /* Prevent sections from shrinking */
    }

    .left-button-group {
      /* Specific styles for the left group if needed */
      flex-grow: 0; /* Don't grow */
      gap: var(--space-xs, 10px); /* Explicitly set smaller gap for items within this group */
    }

    .widget-area {
      flex-grow: 1; /* Allow widget area to take remaining space */
      justify-content: flex-start; /* Align widgets to the right */
      overflow-x: auto; /* Allow horizontal scrolling */
      white-space: nowrap; /* Prevent widgets from wrapping */
      gap: var(--space-sm); /* Smaller gap for widgets */
      display: flex; /* Explicitly ensure it's a flex container, though inherited via .toolbar-section */
      align-items: center; /* Align items vertically in the center */
    }

    .widget-area::-webkit-scrollbar, .widget-area::-webkit-scrollbar-button { display: none; }

    /* Ensure buttons/widgets don't shrink and align correctly for scrolling */
    .toolbar-section > * {
        flex-shrink: 0;
    }

    .widget-area > * { /* Targeting direct children of widget-area */
      display: flex; /* Or use flex properties on widget-area if preferred */
      vertical-align: top; /* Align to top if using inline-block */
    }

    /* Basic styling for toolbar items (can be refined) */
    .toolbar-widget {
        /* Add specific styles if needed */
    }

    /* Mobile state handled by controller adding/removing attributes or classes if needed */

    #toolbar-logo img {
        /* Ensure image scales correctly within the button */
        width: 100%;
        height: 100%;
        object-fit: contain;
    }

    teskooano-button {
        fill: var(--color-text-primary);
    }

  </style>
  <div class="toolbar-section">
  <!-- Static Logo Button -->
    <teskooano-button 
        id="toolbar-logo" 
        title="Visit Teskooano Website" 
        variant="image" 
        size="m" 
        tooltip-text="Visit Teskooano Website" 
        tooltip-title="Teskooano" 
        tooltip-horizontal-align="start">
        <span slot="icon"><img src="/assets/icon.png" alt="Teskooano Logo"></span>
    </teskooano-button>
    </div>
  <div class="toolbar-section left-button-group">
    
    <!-- Dynamic plugin buttons will be added here -->
  </div>
  <div class="toolbar-section widget-area">
    <!-- Dynamic plugin widgets will be added here -->
  </div>
`;
