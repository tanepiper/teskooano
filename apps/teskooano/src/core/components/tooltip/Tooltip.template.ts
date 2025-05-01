/**
 * HTML template for the TeskooanoTooltip component.
 */
export const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      /* Position relative allows absolute positioning of the tooltip content */
      position: relative;
      display: inline-block; /* Or block, depending on context */
      /* Prevent host from interfering with layout */
      /* width: 0; 
      height: 0; */
    }

    /* --- Positioning Base --- */
    /* Style the tooltip bubble */
    .tooltip {
       position: absolute; /* Base positioning, JS changes to fixed when shown */
      background-color: var(--color-tooltip-background, var(--color-surface-inverse, #333)); /* Inverse surface */
      color: var(--color-tooltip-text, var(--color-text-inverse, #fff)); /* Inverse text */
      padding: var(--space-2, 8px) var(--space-3, 12px);
      border-radius: var(--radius-md, 6px);
      border: var(--border-width-thin) solid var(--color-border-inverse, var(--color-surface-3, #555));
      box-shadow: var(--shadow-md); 
      font-size: var(--font-size-small, 0.875rem);
      line-height: var(--line-height-tight, 1.4);
      z-index: var(--z-index-tooltip, 150); /* Ensure high z-index */
      
      /* Hide by default, show on hover/focus of the parent/trigger */
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--transition-duration-fast, 150ms) var(--transition-timing-base, ease-in-out), 
                  visibility var(--transition-duration-fast, 150ms) var(--transition-timing-base, ease-in-out);
      pointer-events: none; /* Allow clicks to pass through */
      white-space: normal; /* Ensure text wrapping is allowed */
      max-width: 250px; /* Set a reasonable max-width */
      text-wrap: auto;
      fill: #fff;
    }

    /* --- Arrow Base --- */
    /* Basic Arrow - pointing UP */
    .tooltip::after {
      content: '';
      position: absolute;
      border-width: 5px;
      border-style: solid;
      /* Colors are set based on vertical alignment */
      border-color: transparent;
      /* Positioning set based on alignment classes */
    }

    /* Arrow for Vertical Alignment */
    .tooltip.vertical-above::after {
      bottom: -10px; /* Position arrow pointing up from bottom edge */
      /* Make bottom border visible, others transparent */
      border-color: transparent transparent var(--color-tooltip-background, var(--color-surface-inverse, #333)) transparent;
    }

    .tooltip.vertical-below::after {
      top: -10px; /* Position arrow pointing down from top edge */
      /* Make top border visible, others transparent */
      border-color: var(--color-tooltip-background, var(--color-surface-inverse, #333)) transparent transparent transparent;
    }

    /* Content layout */
    .tooltip-content {
       display: flex;
       align-items: flex-start; /* Align items to the start */
       gap: var(--space-2, 8px);
       min-width: 100px; /* Give content area a minimum width */
    }
    
    .icon ::slotted(svg) {
        fill: #fff;
    }

    .text-content {
        display: flex;
        flex-direction: column;
    }

    .main {
           word-break: break-word;
       word-wrap: break-word;
       width: 100%;
       }

    .title {
        font-weight: var(--font-weight-semibold);
        margin-bottom: var(--space-1, 4px);
        color: var(--color-tooltip-title-text, var(--color-text-inverse, #fff)); /* Can override */
    }
    
    /* Hide sections if slots are empty */
    .icon:empty,
    .title:empty {
      display: none;
    }

  </style>
  
  <div class="tooltip" role="tooltip" part="tooltip">
    <div class="tooltip-content" part="content">
      <div class="icon" part="icon"><slot name="icon"></slot></div>
      <div class="text-content" part="text-content">
         <div class="title" part="title"><slot name="title"></slot></div>
         <div class="main" part="main"><slot></slot></div> <!-- Default slot for main text -->
      </div>
    </div>
  </div>
`;
