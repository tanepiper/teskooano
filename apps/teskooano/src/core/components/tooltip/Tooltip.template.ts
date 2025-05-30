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
      z-index: var(--z-index-tooltip, 150); /* Use token from JSDoc or component default */
      fill: var(--color-text-primary);
    }

    /* --- Positioning Base --- */
    /* Style the tooltip bubble */
    .tooltip {
       position: absolute; /* Base positioning, JS changes to fixed when shown */
      background-color: var(--color-tooltip-background, var(--color-surface-inverse));
      color: var(--color-tooltip-text, var(--color-text-inverse));
      padding: var(--space-2) var(--space-3);
      border-radius: var(--radius-md);
      border: var(--border-width-thin) solid var(--color-border-inverse, var(--color-surface-3));
      box-shadow: var(--shadow-md); 
      font-size: var(--font-size-1); /* Was --font-size-small */
      line-height: var(--line-height-tight);
      z-index: var(--z-index-tooltip, 150); /* Consistent with host, or could be +1 */
      
      /* Hide by default, show on hover/focus of the parent/trigger */
      opacity: 0;
      visibility: hidden;
      transition: opacity var(--transition-duration-fast) var(--transition-timing-base), 
                  visibility var(--transition-duration-fast) var(--transition-timing-base);
      pointer-events: none; /* Allow clicks to pass through */
      white-space: normal; /* Ensure text wrapping is allowed */
      max-width: var(--layout-tooltip-max-width); /* Use new token */
      text-wrap: auto;
    }

    /* --- Arrow Base --- */
    /* Basic Arrow - pointing UP */
    .tooltip::after {
      content: '';
      position: absolute;
      border-width: var(--size-tooltip-arrow-base); /* Use new token */
      border-style: solid;
      border-color: transparent;
    }

    /* Arrow for Vertical Alignment */
    .tooltip.vertical-above::after {
      bottom: calc(-1 * var(--size-tooltip-arrow-base) * 2); /* Use token */
      /* Make bottom border visible, others transparent */
      border-color: transparent transparent var(--color-tooltip-background, var(--color-surface-inverse)) transparent;
    }

    .tooltip.vertical-below::after {
      top: calc(-1 * var(--size-tooltip-arrow-base) * 2); /* Use token */
      /* Make top border visible, others transparent */
      border-color: var(--color-tooltip-background, var(--color-surface-inverse)) transparent transparent transparent;
    }

    /* Content layout */
    .tooltip-content {
       display: flex;
       align-items: flex-start; /* Align items to the start */
       gap: var(--space-2);
       min-width: 100px; /* Give content area a minimum width */
    }
    
    .icon {
        /* Container for the icon slot */
        flex-shrink: 0; 
        line-height: 0; 
        /* Add explicit size constraints to the container */
        width: var(--space-8); /* 48px */
        height: var(--space-8); /* 48px */
        display: flex; /* Use flex to center content if needed */
        align-items: center;
        justify-content: center;
        overflow: hidden; /* Hide overflow */
    }
    
    /* Style slotted SVG */
    .icon ::slotted(svg) {
       display: block;
       width: 100%; 
       height: 100%;
       max-width: var(--space-5); /* 24px */
       max-height: var(--space-5); /* 24px */
       object-fit: contain; /* Good practice even for SVG */
       fill: currentColor; /* Apply fill only to SVGs */
     }
 
    /* Style slotted Image AND images rendered via innerHTML */
    .icon ::slotted(img),
    .icon img {
        display: block;
        /* Make image fill the container */
        width: 100%;
        height: 100%;
        max-width: var(--space-8); /* 48px, matches icon container */
        max-height: var(--space-8);
        object-fit: contain;
    }

    /* Apply fill only to SVGs - Already moved into specific SVG rule
    .icon ::slotted(svg) {
        fill: currentColor;
    } */
    
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
        margin-bottom: var(--space-1);
        color: var(--color-tooltip-title-text, var(--color-text-inverse));
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
