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

    /* Keep styles for separator and scale display */
    .separator {
        width: var(--border-width-thin);
        height: calc(var(--space-4) + var(--space-1)); /* 20px */
        background-color: var(--color-border-subtle);
        margin: 0 var(--spacing-xs);
    }
    .display-value {
        font-family: var(--font-family-mono);
        font-size: var(--font-size-small);
        color: var(--color-text-secondary);
        min-width: calc(var(--space-8) + var(--space-3)); /* 60px */
        text-align: center;
        padding: var(--space-1) var(--space-2);
        border: var(--border-width-thin) solid var(--color-border-subtle);
        border-radius: var(--radius-sm);
        background-color: var(--color-surface-1);
    }
    #time-value {
        min-width: calc(var(--space-10) * 2 - var(--space-2)); /* 120px */
        color: var(--color-primary);
    }
    #engine-value {
        min-width: var(--space-6); /* 32px, was 30px */
        color: var(--color-text-primary);
        font-weight: var(--font-weight-bold);
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
       min-width: calc(var(--space-10) + var(--space-5) + var(--space-1)); /* ~92px, was 90px */
       font-size: 0.9em;
    }
    :host([mobile]) #scale-value {
       min-width: var(--space-8); /* 48px, was 50px */
       font-size: 0.9em;
    }

    #scale-select {
      display: none;
      min-width: calc(var(--space-10) + var(--space-2)); /* ~72px, was 70px */
      font-family: var(--font-family-mono);
      font-size: var(--font-size-small);
      color: var(--color-text-secondary);
      padding: var(--space-1) var(--space-2);
      border: var(--border-width-thin) solid var(--color-border-subtle);
      border-radius: var(--radius-sm);
      background-color: var(--color-surface-1);
      cursor: pointer;
    }
  </style>

  <div class="controls-container">
  <teskooano-button size="lg" variant="icon" id="reverse" title="Reverse Direction" tooltip-text="Reverse simulation direction."
        tooltip-title="Reverse" 
        tooltip-horizontal-align="start">
     <span slot="icon">${ArrowClockwiseRegular}</span>
  </teskooano-button>
  <teskooano-button size="lg" variant="icon" id="speed-down" title="Decrease Speed" tooltip-text="Decrease simulation speed (halve)."
        tooltip-title="Decrease Speed" 
        tooltip-horizontal-align="start">
      <span slot="icon">${PreviousRegular}</span>
  </teskooano-button>
  <teskooano-button size="lg" variant="icon" id="play-pause" title="Play/Pause" tooltip-text="Pause simulation"
        tooltip-title="Simulation Control" 
        tooltip-horizontal-align="start">
      <span slot="icon">${PauseRegular}</span>
  </teskooano-button>
   <teskooano-button size="lg" variant="icon" id="speed-up" title="Increase Speed" tooltip-text="Increase simulation speed (double)."
        tooltip-title="Increase Speed" 
        tooltip-horizontal-align="start">
       <span slot="icon">${NextRegular}</span>
   </teskooano-button>
  </div>
  <div class="separator"></div>
  <div class="display-container">
    <span class="display-value" id="scale-value" title="Time Scale">-</span>
    <select id="scale-select" title="Select Time Scale"></select>
    <span class="display-value" id="time-value" title="Simulation Time">-</span>
    <span class="display-value" id="engine-value" title="Physics Engine">-</span>
  </div>
`;

export const PlayIcon = PlayRegular;
export const PauseIcon = PauseRegular;
export const PreviousIcon = PreviousRegular;
export const NextIcon = NextRegular;
export const ReverseIcon = ArrowClockwiseRegular;
