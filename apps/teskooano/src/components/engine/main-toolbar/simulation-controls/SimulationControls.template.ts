import PlayRegular from "@fluentui/svg-icons/icons/play_20_regular.svg?raw";
import PauseRegular from "@fluentui/svg-icons/icons/pause_20_regular.svg?raw";
import PreviousRegular from "@fluentui/svg-icons/icons/previous_20_regular.svg?raw";
import NextRegular from "@fluentui/svg-icons/icons/next_20_regular.svg?raw";
import ArrowClockwiseRegular from "@fluentui/svg-icons/icons/arrow_clockwise_20_regular.svg?raw";

export const template = document.createElement("template");
template.innerHTML = `
  <style>
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
      font-family: var(--font-family-base);
    }

    .controls-container {
      display: inline-flex;
      align-items: center;
      justify-content: space-between;
    }
    .display-container {
      display: inline-flex;
      align-items: center;
      gap: var(--spacing-sm);
    }

    /* Style the SVG icons */
    teskooano-button svg {
        width: 1em; /* Adjust size as needed */
        height: 1em;
        fill: var(--color-text-primary);
        display: block;
        margin: auto;
    }

    /* Keep styles for separator and scale display */
    .separator {
        width: var(--border-width-thin); /* Use token */
        height: 20px;
        background-color: var(--color-border-subtle); /* Use token */
        margin: 0 var(--spacing-xs); /* Use token */
    }
    .display-value {
        font-family: var(--font-family-mono); /* Use token */
        font-size: var(--font-size-small); /* Use token */
        color: var(--color-text-secondary); /* Use token */
        min-width: 60px;
        text-align: center;
        padding: var(--space-1) var(--space-2); /* Use tokens */
        border: var(--border-width-thin) solid var(--color-border-subtle); /* Use tokens */
        border-radius: var(--radius-sm); /* Use token */
        background-color: var(--color-surface-1); /* Use token */
    }
    #time-value {
        min-width: 120px;
        color: var(--color-primary); /* Use token (was primary-light) */
    }
    #engine-value {
        min-width: 30px;
        color: var(--color-text-primary); /* Use token (was text) */
        font-weight: var(--font-weight-bold); /* Use token */
        text-transform: uppercase;
    }
    /* Optional tooltip styles for engine letter */
    #engine-value:hover::after {
        content: attr(data-full-name);
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-surface-2); /* Use token (was surface) */
        border: var(--border-width-thin) solid var(--color-border-subtle); /* Use tokens */
        padding: var(--space-1) var(--space-2); /* Use tokens */
        border-radius: var(--radius-sm); /* Use token */
        font-size: var(--font-size-small); /* Use token */
        white-space: nowrap;
        pointer-events: none;
        opacity: 0.9;
        z-index: 10;
    }
    :host([mobile]) #time-value {
       min-width: 90px; /* Reduce width */
       font-size: 0.9em; /* Slightly smaller font */
    }
    :host([mobile]) #scale-value {
       min-width: 50px; /* Reduce width */
       font-size: 0.9em;
    }
  </style>

  <div class="controls-container">
  <teskooano-button id="reverse" title="Reverse Direction">
      ${ArrowClockwiseRegular}
  </teskooano-button>
  <teskooano-button id="speed-down" title="Decrease Speed">
      ${PreviousRegular}
  </teskooano-button>
  <teskooano-button id="play-pause" title="Play/Pause">
      ${PauseRegular} <!-- Initial state: Pause icon -->
  </teskooano-button>
   <teskooano-button id="speed-up" title="Increase Speed">
       ${NextRegular}
   </teskooano-button>
  </div>
  <div class="separator"></div>
  <div class="display-container">
    <span class="display-value" id="scale-value" title="Time Scale">-</span>
    <span class="display-value" id="time-value" title="Simulation Time">-</span>
    <span class="display-value" id="engine-value" title="Physics Engine">-</span>
  </div>
`;

export const PlayIcon = PlayRegular;
export const PauseIcon = PauseRegular;
