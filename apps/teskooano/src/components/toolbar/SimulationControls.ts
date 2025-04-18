import { actions, simulationState } from '@teskooano/core-state';
import { TeskooanoButton } from '../shared/Button'; // Import the custom button

const template = document.createElement('template');
template.innerHTML = `
  <style>
    :host {
      display: inline-flex; /* Change back to inline-flex */
      align-items: center;
      gap: 8px; /* Spacing between elements */
      font-family: var(--font-family, sans-serif);
      /* padding: 0 10px; /* Removed overall padding? Add back if needed */
    }
    /* REMOVED specific overrides for teskooano-button */
    /* Buttons will now inherit styles from Button.ts */
    
    /* Keep style for icon-only buttons */
    teskooano-button span[slot="icon"] {
        margin-right: 0; /* Icon only */
    }
    /* Keep styles for separator and scale display */
    .separator {
        width: 1px;
        height: 20px;
        background-color: var(--color-border, #4a4a6a);
        margin: 0 5px; 
    }
    .display-value {
        font-family: var(--font-family-monospace, monospace);
        font-size: 0.95em;
        color: var(--color-text-secondary, #aaa);
        min-width: 60px; 
        text-align: center;
        padding: 4px 6px;
        border: 1px solid var(--color-border, #4a4a6a);
        border-radius: 4px;
        background-color: var(--color-surface-low, #202030);
    }
    #time-value {
        min-width: 120px;
        color: var(--color-primary-light, #9fa8da);
    }
    #engine-value {
        min-width: 30px;
        color: var(--color-text, #e0e0fc);
        font-weight: bold;
        text-transform: uppercase;
    }
    /* Optional tooltip styles for engine letter */
    #engine-value:hover::after {
        content: attr(data-full-name);
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        background: var(--color-surface, #2a2a3e);
        border: 1px solid var(--color-border, #4a4a6a);
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.9em;
        white-space: nowrap;
        pointer-events: none;
        opacity: 0.9;
        z-index: 10;
    }
  </style>

  <teskooano-button id="reverse" title="Reverse Direction">
      <span slot="icon">↺</span>
  </teskooano-button>
  <teskooano-button id="speed-down" title="Decrease Speed">
      <span slot="icon">⏮</span>
  </teskooano-button>
  <teskooano-button id="play-pause" title="Play/Pause">
      <span slot="icon">⏸</span> <!-- Initial state: Pause icon -->
  </teskooano-button>
   <teskooano-button id="speed-up" title="Increase Speed">
       <span slot="icon">⏭</span>
   </teskooano-button>
  <div class="separator"></div>
  <span class="display-value" id="scale-value" title="Time Scale">-</span>
  <span class="display-value" id="time-value" title="Simulation Time">-</span>
  <span class="display-value" id="engine-value" title="Physics Engine">-</span>
`;

export class ToolbarSimulationControls extends HTMLElement {
  private playPauseButton: TeskooanoButton | null = null;
  private speedUpButton: TeskooanoButton | null = null;
  private speedDownButton: TeskooanoButton | null = null;
  private reverseButton: TeskooanoButton | null = null;
  private scaleValueDisplay: HTMLElement | null = null;
  private timeValueDisplay: HTMLElement | null = null;
  private engineValueDisplay: HTMLElement | null = null;
  private unsubscribeSimState: (() => void) | null = null;

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
  }

  connectedCallback() {
    this.playPauseButton = this.shadowRoot!.getElementById('play-pause') as TeskooanoButton | null;
    this.speedUpButton = this.shadowRoot!.getElementById('speed-up') as TeskooanoButton | null;
    this.speedDownButton = this.shadowRoot!.getElementById('speed-down') as TeskooanoButton | null;
    this.reverseButton = this.shadowRoot!.getElementById('reverse') as TeskooanoButton | null;
    this.scaleValueDisplay = this.shadowRoot!.getElementById('scale-value');
    this.timeValueDisplay = this.shadowRoot!.getElementById('time-value');
    this.engineValueDisplay = this.shadowRoot!.getElementById('engine-value');

    this.addEventListeners();
    // Direct subscription might be fine, assuming state structure matches
    this.unsubscribeSimState = simulationState.subscribe(this.updateButtonStates);
    this.updateButtonStates(); // Initial state update
  }

  disconnectedCallback() {
    this.unsubscribeSimState?.();
    this.removeEventListeners();
  }

  private addEventListeners(): void {
    this.playPauseButton?.addEventListener('click', actions.togglePause);
    this.speedUpButton?.addEventListener('click', () => {
      const currentScale = simulationState.get().timeScale;
      const newScale = currentScale === 0 ? 1 :
                       currentScale < 0 ? Math.min(currentScale / 2, -0.1) :
                       Math.min(currentScale * 2, 10000000);
      actions.setTimeScale(newScale);
    });
    this.speedDownButton?.addEventListener('click', () => {
      const currentScale = simulationState.get().timeScale;
      const newScale = currentScale > 0 ? Math.max(currentScale / 2, 0.1) :
                       currentScale < 0 ? Math.max(currentScale * 2, -10000000) :
                       0; 
       actions.setTimeScale(newScale);
    });
    this.reverseButton?.addEventListener('click', () => {
      const currentScale = simulationState.get().timeScale;
      actions.setTimeScale(currentScale === 0 ? -1 : -currentScale); 
    });
  }

  private removeEventListeners(): void {
     this.playPauseButton?.removeEventListener('click', actions.togglePause);
     // No removal needed for anonymous arrow functions used for speed/reverse
  }

  private formatScale(scale: number): string {
      const absScale = Math.abs(scale);
      let scaleText: string;
      if (scale === 0) return "0.0x";

      if (absScale >= 1000000) {
          scaleText = `${(scale / 1000000).toFixed(1)}M`;
      } else if (absScale >= 1000) {
          scaleText = `${(scale / 1000).toFixed(1)}K`;
      } else {
          scaleText = absScale < 1 ? scale.toFixed(2) : scale.toFixed(1);
      }
      return `${scaleText}x`;
  }
  
  private formatTime(timeSeconds: number = 0): string {
      const days = Math.floor(timeSeconds / 86400);
      const hours = Math.floor((timeSeconds % 86400) / 3600);
      const minutes = Math.floor((timeSeconds % 3600) / 60);
      const seconds = Math.floor(timeSeconds % 60);
      return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  private getEngineShortName(engineName: string): string {
      if (!engineName) return '-';
      
      // Get first letter or first letter of each word for acronym
      const words = engineName.split(/[\s-_]+/);
      if (words.length > 1) {
          // Create acronym from first letter of each word
          return words.map(word => word.charAt(0).toUpperCase()).join('');
      } else {
          // Just use first letter
          return engineName.charAt(0).toUpperCase();
      }
  }

  // Arrow function to preserve 'this' context when used as callback
  private updateButtonStates = (): void => {
    const state = simulationState.get();

    if (this.playPauseButton) {
      const iconSpan = this.playPauseButton.querySelector('span[slot="icon"]');
      if (iconSpan) {
         iconSpan.textContent = state.paused ? '⏵' : '⏸'; // Update icon text
      }
      this.playPauseButton.title = state.paused ? 'Play Simulation' : 'Pause Simulation';
      this.playPauseButton.toggleAttribute('active', !state.paused);
    }

    if (this.speedDownButton) {
        const disableSpeedDown = state.paused || (state.timeScale > 0 && state.timeScale <= 0.1) || (state.timeScale < 0 && state.timeScale >= -10000000);
        this.speedDownButton.disabled = disableSpeedDown; // Use property setter
    }
    if (this.speedUpButton) {
        const disableSpeedUp = state.paused || (state.timeScale < 0 && state.timeScale <= -0.1) || (state.timeScale > 0 && state.timeScale >= 10000000);
        this.speedUpButton.disabled = disableSpeedUp; // Use property setter
    }

    if (this.reverseButton) {
        this.reverseButton.toggleAttribute('active', state.timeScale < 0);
    }

    if (this.scaleValueDisplay) {
        this.scaleValueDisplay.textContent = this.formatScale(state.timeScale);
        this.scaleValueDisplay.style.color = state.timeScale < 0
            ? 'var(--color-accent-alt, #ff8a65)' 
            : 'var(--color-text-secondary, #aaa)';
    }
    
    // Update time display
    if (this.timeValueDisplay) {
        this.timeValueDisplay.textContent = this.formatTime(state.time);
    }
    
    // Update engine display
    if (this.engineValueDisplay) {
        const engineName = state.physicsEngine || '-';
        this.engineValueDisplay.textContent = this.getEngineShortName(engineName);
        this.engineValueDisplay.setAttribute('data-full-name', engineName);
    }
  }
}

const ELEMENT_TAG = 'toolbar-simulation-controls';
if (!customElements.get(ELEMENT_TAG)) {
  customElements.define(ELEMENT_TAG, ToolbarSimulationControls);
}
