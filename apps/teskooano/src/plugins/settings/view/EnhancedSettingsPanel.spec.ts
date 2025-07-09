import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { EnhancedSettingsPanel } from './EnhancedSettingsPanel';
import { simulationStateService } from '@teskooano/core-state';

// Mock the slider component
class MockTeskooanoSlider extends HTMLElement {
  private _value: number = 0;
  
  get value(): number {
    return this._value;
  }
  
  set value(val: number) {
    this._value = val;
    this.dispatchEvent(new CustomEvent('slider-change', {
      detail: { value: val }
    }));
  }
  
  constructor() {
    super();
    this.addEventListener = vi.fn();
    this.removeEventListener = vi.fn();
  }
}

// Register mock slider
customElements.define('teskooano-slider', MockTeskooanoSlider);

describe('Enhanced Settings Panel UI Layer', () => {
  let panel: EnhancedSettingsPanel;
  let container: HTMLDivElement;

  beforeEach(() => {
    // Reset simulation state to known configuration
    simulationStateService.setSimulationConfiguration({
      mode: 'nbody',
      algorithm: 'barnes-hut',
      integrator: 'verlet'
    });

    // Create container and panel
    container = document.createElement('div');
    document.body.appendChild(container);
    
    panel = new EnhancedSettingsPanel();
    container.appendChild(panel);
    
    // Wait for component to initialize
    return new Promise(resolve => setTimeout(resolve, 10));
  });

  afterEach(() => {
    if (container.parentNode) {
      container.parentNode.removeChild(container);
    }
  });

  describe('Component Initialization', () => {
    it('should create shadow DOM with all required elements', () => {
      expect(panel.shadowRoot).toBeTruthy();
      
      const requiredElements = [
        '#enhanced-settings-form',
        '#setting-trail-length',
        '#setting-simulation-mode',
        '#current-mode-badge',
        '#nbody-controls',
        '#setting-algorithm',
        '#setting-integrator',
        '#config-display',
        '#mode-performance',
        '#setting-performance-profile',
        '#validation-messages'
      ];

      requiredElements.forEach(selector => {
        const element = panel.shadowRoot!.querySelector(selector);
        expect(element).toBeTruthy();
      });
    });

    it('should initialize controller successfully', () => {
      expect(panel.getController()).toBeTruthy();
      expect(panel.isReady()).toBe(true);
    });

    it('should display current mode in badge', () => {
      const badge = panel.shadowRoot!.querySelector('#current-mode-badge') as HTMLElement;
      expect(badge.textContent).toBe('N-Body');
      expect(badge.classList.contains('nbody')).toBe(true);
    });

    it('should show N-Body controls for N-Body mode', () => {
      const nbodyControls = panel.shadowRoot!.querySelector('#nbody-controls') as HTMLElement;
      expect(nbodyControls.classList.contains('visible')).toBe(true);
    });
  });

  describe('Mode Switching', () => {
    it('should switch to ideal mode and hide N-Body controls', async () => {
      const modeSelect = panel.shadowRoot!.querySelector('#setting-simulation-mode') as HTMLSelectElement;
      const nbodyControls = panel.shadowRoot!.querySelector('#nbody-controls') as HTMLElement;
      const badge = panel.shadowRoot!.querySelector('#current-mode-badge') as HTMLElement;

      // Switch to ideal mode
      modeSelect.value = 'ideal';
      modeSelect.dispatchEvent(new Event('change'));

      // Wait for UI update
      await new Promise(resolve => setTimeout(resolve, 50));

      expect(nbodyControls.classList.contains('visible')).toBe(false);
      expect(badge.textContent).toBe('Ideal');
      expect(badge.classList.contains('ideal')).toBe(true);
      expect(badge.classList.contains('nbody')).toBe(false);
    });

    it('should switch to N-Body mode and show controls', async () => {
      // Start in ideal mode
      simulationStateService.setSimulationMode('ideal');
      await new Promise(resolve => setTimeout(resolve, 50));

      const modeSelect = panel.shadowRoot!.querySelector('#setting-simulation-mode') as HTMLSelectElement;
      const nbodyControls = panel.shadowRoot!.querySelector('#nbody-controls') as HTMLElement;

      // Switch to N-Body mode
      modeSelect.value = 'nbody';
      modeSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(nbodyControls.classList.contains('visible')).toBe(true);
    });
  });

  describe('N-Body Algorithm and Integrator Selection', () => {
    it('should update algorithm selection', async () => {
      const algorithmSelect = panel.shadowRoot!.querySelector('#setting-algorithm') as HTMLSelectElement;
      
      algorithmSelect.value = 'fmm';
      algorithmSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 50));

      const currentConfig = simulationStateService.getSimulationConfiguration();
      expect(currentConfig.algorithm).toBe('fmm');
    });

    it('should update integrator selection', async () => {
      const integratorSelect = panel.shadowRoot!.querySelector('#setting-integrator') as HTMLSelectElement;
      
      integratorSelect.value = 'rk4';
      integratorSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 50));

      const currentConfig = simulationStateService.getSimulationConfiguration();
      expect(currentConfig.integrator).toBe('rk4');
    });

    it('should prevent algorithm changes in ideal mode', async () => {
      // Switch to ideal mode
      simulationStateService.setSimulationMode('ideal');
      await new Promise(resolve => setTimeout(resolve, 50));

      const algorithmSelect = panel.shadowRoot!.querySelector('#setting-algorithm') as HTMLSelectElement;
      
      // Try to change algorithm (should fail)
      algorithmSelect.value = 'direct';
      algorithmSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 50));

      // Algorithm should revert since we're in ideal mode
      const currentConfig = simulationStateService.getSimulationConfiguration();
      expect(currentConfig.mode).toBe('ideal');
      expect(currentConfig.algorithm).toBeUndefined();
    });
  });

  describe('Performance Indicators', () => {
    it('should show optimal performance for ideal mode', async () => {
      simulationStateService.setSimulationMode('ideal');
      await new Promise(resolve => setTimeout(resolve, 50));

      const performanceText = panel.shadowRoot!.querySelector('.performance-text') as HTMLElement;
      const performanceDot = panel.shadowRoot!.querySelector('.performance-dot') as HTMLElement;

      expect(performanceText.textContent).toBe('Optimal performance');
      expect(performanceDot.classList.contains('warning')).toBe(false);
      expect(performanceDot.classList.contains('error')).toBe(false);
    });

    it('should show warning for direct algorithm', async () => {
      simulationStateService.setSimulationConfiguration({
        mode: 'nbody',
        algorithm: 'direct',
        integrator: 'verlet'
      });
      await new Promise(resolve => setTimeout(resolve, 50));

      const performanceText = panel.shadowRoot!.querySelector('.performance-text') as HTMLElement;
      const performanceDot = panel.shadowRoot!.querySelector('.performance-dot') as HTMLElement;

      expect(performanceText.textContent).toContain('small systems');
      expect(performanceDot.classList.contains('warning')).toBe(true);
    });

    it('should show balanced performance for Barnes-Hut', async () => {
      simulationStateService.setSimulationConfiguration({
        mode: 'nbody',
        algorithm: 'barnes-hut',
        integrator: 'verlet'
      });
      await new Promise(resolve => setTimeout(resolve, 50));

      const performanceText = panel.shadowRoot!.querySelector('.performance-text') as HTMLElement;
      expect(performanceText.textContent).toContain('Balanced performance');
    });
  });

  describe('Configuration Display', () => {
    it('should update configuration display for ideal mode', async () => {
      simulationStateService.setSimulationMode('ideal');
      await new Promise(resolve => setTimeout(resolve, 50));

      const configDisplay = panel.shadowRoot!.querySelector('#config-display') as HTMLElement;
      expect(configDisplay.textContent).toContain('Ideal Orrery');
    });

    it('should update configuration display for N-Body mode', async () => {
      simulationStateService.setSimulationConfiguration({
        mode: 'nbody',
        algorithm: 'fmm',
        integrator: 'rk4'
      });
      await new Promise(resolve => setTimeout(resolve, 50));

      const configDisplay = panel.shadowRoot!.querySelector('#config-display') as HTMLElement;
      expect(configDisplay.textContent).toContain('N-Body Physics');
      expect(configDisplay.textContent).toContain('FMM + RK4');
    });
  });

  describe('Trail Length Slider', () => {
    it('should update trail length when slider changes', async () => {
      const slider = panel.shadowRoot!.querySelector('#setting-trail-length') as MockTeskooanoSlider;
      
      slider.value = 300;

      await new Promise(resolve => setTimeout(resolve, 50));

      const currentState = simulationStateService.getSimulationState();
      expect(currentState.visualSettings.trailLengthMultiplier).toBe(300);
    });

    it('should reflect current trail length in slider', () => {
      simulationStateService.setTrailLengthMultiplier(150);
      
      const slider = panel.shadowRoot!.querySelector('#setting-trail-length') as MockTeskooanoSlider;
      expect(slider.value).toBe(150);
    });
  });

  describe('Validation and Error Handling', () => {
    it('should show validation messages for invalid operations', async () => {
      const validationMessages = panel.shadowRoot!.querySelector('#validation-messages') as HTMLElement;
      
      // This should trigger an error since we're trying to set algorithm in ideal mode
      simulationStateService.setSimulationMode('ideal');
      await new Promise(resolve => setTimeout(resolve, 50));

      const algorithmSelect = panel.shadowRoot!.querySelector('#setting-algorithm') as HTMLSelectElement;
      algorithmSelect.value = 'direct';
      algorithmSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 50));

      // The validation message should appear (though it auto-hides)
      expect(validationMessages.style.display).toBe('block');
    });

    it('should clear validation messages on successful operations', async () => {
      const validationMessages = panel.shadowRoot!.querySelector('#validation-messages') as HTMLElement;
      
      // Make a valid change
      const modeSelect = panel.shadowRoot!.querySelector('#setting-simulation-mode') as HTMLSelectElement;
      modeSelect.value = 'ideal';
      modeSelect.dispatchEvent(new Event('change'));

      await new Promise(resolve => setTimeout(resolve, 50));

      expect(validationMessages.style.display).toBe('none');
    });
  });

  describe('Responsive Design and Animations', () => {
    it('should apply CSS transitions for smooth mode switching', async () => {
      const nbodyControls = panel.shadowRoot!.querySelector('#nbody-controls') as HTMLElement;
      
      // Check that transition styles are applied
      const computedStyle = window.getComputedStyle(nbodyControls);
      expect(computedStyle.transition).toContain('all');
    });

    it('should have proper CSS grid layout for N-Body controls', () => {
      const nbodyControls = panel.shadowRoot!.querySelector('#nbody-controls') as HTMLElement;
      const computedStyle = window.getComputedStyle(nbodyControls);
      
      expect(computedStyle.display).toBe('grid');
      expect(computedStyle.gridTemplateColumns).toContain('1fr 1fr');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all form controls', () => {
      const formControls = panel.shadowRoot!.querySelectorAll('select, teskooano-slider');
      
      formControls.forEach(control => {
        const id = control.id;
        const label = panel.shadowRoot!.querySelector(`label[for="${id}"]`);
        expect(label).toBeTruthy();
      });
    });

    it('should have info icons with descriptive titles', () => {
      const infoIcons = panel.shadowRoot!.querySelectorAll('.info-icon[title]');
      
      infoIcons.forEach(icon => {
        const title = icon.getAttribute('title');
        expect(title).toBeTruthy();
        expect(title!.length).toBeGreaterThan(20); // Ensure meaningful descriptions
      });
    });

    it('should support keyboard navigation for select elements', () => {
      const selects = panel.shadowRoot!.querySelectorAll('select');
      
      selects.forEach(select => {
        expect(select.tabIndex).toBe(0); // Should be keyboard focusable
      });
    });
  });

  describe('Component Lifecycle', () => {
    it('should cleanup controller when disconnected', () => {
      const controller = panel.getController();
      expect(controller).toBeTruthy();

      // Disconnect the component
      panel.disconnectedCallback();

      expect(panel.getController()).toBeNull();
      expect(panel.isReady()).toBe(false);
    });

    it('should handle multiple connect/disconnect cycles', () => {
      // Disconnect and reconnect
      panel.disconnectedCallback();
      panel.connectedCallback();

      expect(panel.isReady()).toBe(true);
      expect(panel.getController()).toBeTruthy();
    });
  });

  describe('Integration with State Management', () => {
    it('should reflect external state changes', async () => {
      // Change state externally
      simulationStateService.setSimulationConfiguration({
        mode: 'nbody',
        algorithm: 'p3m',
        integrator: 'adaptive'
      });

      await new Promise(resolve => setTimeout(resolve, 50));

      // UI should update
      const algorithmSelect = panel.shadowRoot!.querySelector('#setting-algorithm') as HTMLSelectElement;
      const integratorSelect = panel.shadowRoot!.querySelector('#setting-integrator') as HTMLSelectElement;

      expect(algorithmSelect.value).toBe('p3m');
      expect(integratorSelect.value).toBe('adaptive');
    });

    it('should maintain UI consistency during rapid state changes', async () => {
      // Rapid state changes
      simulationStateService.setSimulationMode('ideal');
      simulationStateService.setSimulationMode('nbody');
      simulationStateService.setNBodyAlgorithm('fmm');
      simulationStateService.setNBodyIntegrator('symplectic');

      await new Promise(resolve => setTimeout(resolve, 100));

      // UI should reflect final state
      const modeSelect = panel.shadowRoot!.querySelector('#setting-simulation-mode') as HTMLSelectElement;
      const algorithmSelect = panel.shadowRoot!.querySelector('#setting-algorithm') as HTMLSelectElement;
      const integratorSelect = panel.shadowRoot!.querySelector('#setting-integrator') as HTMLSelectElement;

      expect(modeSelect.value).toBe('nbody');
      expect(algorithmSelect.value).toBe('fmm');
      expect(integratorSelect.value).toBe('symplectic');
    });
  });
});