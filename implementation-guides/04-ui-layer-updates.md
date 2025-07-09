# Implementation Guide: UI Layer Updates

## Overview
This guide details updating the UI layer components (Settings Panel and Engine Panel) to support the new two-mode simulation configuration system with intuitive user controls and responsive state updates.

## 🎯 Goals
- Replace single physics engine dropdown with mode-based configuration UI
- Implement conditional visibility for algorithm/integrator selectors
- Update engine display in main toolbar to show full configuration
- Maintain user-friendly experience during configuration changes
- Add validation feedback and error handling in UI

## ✅ Implementation To-Do List

### Phase 4A: Update Settings Panel

#### Task 4.1: Update Settings Controller
**File**: `apps/teskooano/src/plugins/settings/controller/SettingsController.ts`

**Current Issues:**
- Line 12: `ENGINE_OPTIONS` uses old physics engine types
- Line 87: Single engine dropdown initialization
- Line 172-174: `handleEngineChange` needs to handle new configuration
- Line 207: State reading logic needs update

**To-Do:**
- [ ] Replace `ENGINE_OPTIONS` with mode-based options
- [ ] Add algorithm and integrator option arrays
- [ ] Update initialization logic for three-dropdown system
- [ ] Implement conditional visibility logic
- [ ] Add proper event handlers for new dropdowns
- [ ] Update state synchronization

**Implementation:**
```typescript
import {
  getSimulationState,
  simulationState$,
  actions,
  type SimulationConfiguration,
  type SimulationMode,
  type IntegratorType,
  type AlgorithmType,
  StateSubscriptionMixin,
} from "@teskooano/core-state";

import { type TeskooanoSlider } from "../../../core/components/slider/Slider";
import { CustomEvents, SliderValueChangePayload } from "@teskooano/data-types";

// New configuration options for dropdowns
const MODE_OPTIONS: { value: SimulationMode; label: string; description: string }[] = [
  { 
    value: "ideal", 
    label: "Ideal Orrery", 
    description: "Perfect Keplerian orbits - stable and predictable" 
  },
  { 
    value: "nbody", 
    label: "N-Body Physics", 
    description: "Realistic gravitational interactions between all bodies" 
  },
];

const ALGORITHM_OPTIONS: { value: AlgorithmType; label: string; description: string; complexity: string }[] = [
  { 
    value: "direct", 
    label: "Direct Calculation", 
    description: "Exact forces, slow for many bodies",
    complexity: "O(N²)"
  },
  { 
    value: "barnes-hut", 
    label: "Barnes-Hut Tree", 
    description: "Approximated forces using spatial tree",
    complexity: "O(N log N)"
  },
  { 
    value: "fmm", 
    label: "Fast Multipole", 
    description: "Hierarchical multipole expansion",
    complexity: "O(N)"
  },
  { 
    value: "p3m", 
    label: "Particle-Mesh", 
    description: "Hybrid particle-grid method",
    complexity: "O(N log N)"
  },
];

const INTEGRATOR_OPTIONS: { value: IntegratorType; label: string; description: string; order: number }[] = [
  { 
    value: "euler", 
    label: "Euler Integration", 
    description: "Simple but less stable",
    order: 1
  },
  { 
    value: "symplectic", 
    label: "Symplectic Euler", 
    description: "Energy preserving variant",
    order: 1
  },
  { 
    value: "verlet", 
    label: "Verlet Integration", 
    description: "Stable and reversible (recommended)",
    order: 2
  },
  { 
    value: "rk4", 
    label: "Runge-Kutta 4th", 
    description: "High accuracy, more expensive",
    order: 4
  },
  { 
    value: "adaptive", 
    label: "Adaptive Step", 
    description: "Auto-adjusting time step",
    order: 4
  },
];

/**
 * Updated interface for settings panel elements
 */
export interface ISettingsPanelElements {
  formElement: HTMLFormElement;
  trailSliderElement: TeskooanoSlider;
  
  // Mode selection
  modeSelectElement: HTMLSelectElement;
  modeDescriptionElement: HTMLElement;
  
  // N-Body specific controls (conditionally visible)
  nBodyControlsContainer: HTMLElement;
  algorithmSelectElement: HTMLSelectElement;
  algorithmDescriptionElement: HTMLElement;
  integratorSelectElement: HTMLSelectElement;
  integratorDescriptionElement: HTMLElement;
  
  // Performance profile (existing)
  profileSelectElement: HTMLSelectElement;
  
  // Legacy engine dropdown (for backwards compatibility during transition)
  legacyEngineContainer?: HTMLElement;
  engineSelectElement?: HTMLSelectElement;
}

/**
 * Enhanced Settings Controller with configuration-based UI
 */
export class SettingsController extends StateSubscriptionMixin {
  constructor(private elements: ISettingsPanelElements) {
    super();
    this.addEventListenersAndPopulate();
  }

  public dispose(): void {
    this.removeEventListenersAndUnsubscribe();
    super.dispose();
  }

  private addEventListenersAndPopulate(): void {
    this.elements.formElement.addEventListener("submit", this.handleFormSubmit);

    // Populate dropdowns
    this.populateSelect(this.elements.modeSelectElement, MODE_OPTIONS);
    this.populateSelect(this.elements.algorithmSelectElement, ALGORITHM_OPTIONS);
    this.populateSelect(this.elements.integratorSelectElement, INTEGRATOR_OPTIONS);

    // Initialize with current state
    const initialState = getSimulationState();
    this.initializeControlsFromState(initialState);

    // Event listeners for new controls
    this.elements.modeSelectElement.addEventListener("change", this.handleModeChange);
    this.elements.algorithmSelectElement.addEventListener("change", this.handleAlgorithmChange);
    this.elements.integratorSelectElement.addEventListener("change", this.handleIntegratorChange);

    // Existing controls
    this.elements.trailSliderElement.addEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );

    // Subscribe to state changes
    this.subscribeToState(simulationState$, this.updateControlStates);
  }

  private removeEventListenersAndUnsubscribe(): void {
    this.elements.formElement.removeEventListener("submit", this.handleFormSubmit);
    this.elements.modeSelectElement.removeEventListener("change", this.handleModeChange);
    this.elements.algorithmSelectElement.removeEventListener("change", this.handleAlgorithmChange);
    this.elements.integratorSelectElement.removeEventListener("change", this.handleIntegratorChange);
    this.elements.trailSliderElement.removeEventListener(
      CustomEvents.SLIDER_CHANGE,
      this.handleTrailChange as EventListener,
    );
  }

  private handleFormSubmit = (e: Event) => e.preventDefault();

  /**
   * Populates a select element with options
   */
  private populateSelect<T extends { value: string; label: string }>(
    selectElement: HTMLSelectElement,
    options: T[]
  ): void {
    selectElement.innerHTML = "";
    options.forEach((option) => {
      const optionElement = document.createElement("option");
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      selectElement.appendChild(optionElement);
    });
  }

  /**
   * Initializes all controls based on current simulation state
   */
  private initializeControlsFromState(state: any): void {
    const config: SimulationConfiguration = state.simulationConfig;

    // Set mode
    this.elements.modeSelectElement.value = config.mode;
    this.updateModeDescription(config.mode);
    this.updateNBodyControlsVisibility(config.mode);

    // Set N-Body specific controls if applicable
    if (config.mode === "nbody") {
      if (config.algorithm) {
        this.elements.algorithmSelectElement.value = config.algorithm;
        this.updateAlgorithmDescription(config.algorithm);
      }
      if (config.integrator) {
        this.elements.integratorSelectElement.value = config.integrator;
        this.updateIntegratorDescription(config.integrator);
      }
    }

    // Existing controls
    this.elements.trailSliderElement.value = state.visualSettings.trailLengthMultiplier;
  }

  /**
   * Handles simulation mode changes
   */
  private handleModeChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const mode = target.value as SimulationMode;

    this.updateModeDescription(mode);
    this.updateNBodyControlsVisibility(mode);

    // Update simulation state
    actions.setSimulationMode(mode);
  };

  /**
   * Handles algorithm selection changes
   */
  private handleAlgorithmChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const algorithm = target.value as AlgorithmType;

    this.updateAlgorithmDescription(algorithm);
    actions.setNBodyAlgorithm(algorithm);
  };

  /**
   * Handles integrator selection changes
   */
  private handleIntegratorChange = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const integrator = target.value as IntegratorType;

    this.updateIntegratorDescription(integrator);
    actions.setNBodyIntegrator(integrator);
  };

  /**
   * Updates the mode description text
   */
  private updateModeDescription(mode: SimulationMode): void {
    const option = MODE_OPTIONS.find(opt => opt.value === mode);
    if (option && this.elements.modeDescriptionElement) {
      this.elements.modeDescriptionElement.textContent = option.description;
    }
  }

  /**
   * Updates algorithm description and performance info
   */
  private updateAlgorithmDescription(algorithm: AlgorithmType): void {
    const option = ALGORITHM_OPTIONS.find(opt => opt.value === algorithm);
    if (option && this.elements.algorithmDescriptionElement) {
      this.elements.algorithmDescriptionElement.innerHTML = 
        `${option.description} <span class="complexity">${option.complexity}</span>`;
    }
  }

  /**
   * Updates integrator description and order info
   */
  private updateIntegratorDescription(integrator: IntegratorType): void {
    const option = INTEGRATOR_OPTIONS.find(opt => opt.value === integrator);
    if (option && this.elements.integratorDescriptionElement) {
      this.elements.integratorDescriptionElement.innerHTML = 
        `${option.description} <span class="order">Order: ${option.order}</span>`;
    }
  }

  /**
   * Shows/hides N-Body specific controls based on mode
   */
  private updateNBodyControlsVisibility(mode: SimulationMode): void {
    const isNBodyMode = mode === "nbody";
    
    if (this.elements.nBodyControlsContainer) {
      this.elements.nBodyControlsContainer.style.display = isNBodyMode ? "block" : "none";
    }

    // If switching to ideal mode, ensure N-Body controls are disabled
    if (!isNBodyMode) {
      this.elements.algorithmSelectElement.disabled = true;
      this.elements.integratorSelectElement.disabled = true;
    } else {
      this.elements.algorithmSelectElement.disabled = false;
      this.elements.integratorSelectElement.disabled = false;
    }
  }

  /**
   * Existing trail change handler
   */
  private handleTrailChange = (event: CustomEvent<SliderValueChangePayload>): void => {
    const value = event.detail.value;
    if (typeof value === "number" && !isNaN(value)) {
      actions.setTrailLengthMultiplier(value);
    }
  };

  /**
   * Updates all control states when simulation state changes
   */
  private updateControlStates = (): void => {
    const state = getSimulationState();
    const config: SimulationConfiguration = state.simulationConfig;

    // Update mode if changed
    if (this.elements.modeSelectElement.value !== config.mode) {
      this.elements.modeSelectElement.value = config.mode;
      this.updateModeDescription(config.mode);
      this.updateNBodyControlsVisibility(config.mode);
    }

    // Update N-Body controls if in N-Body mode
    if (config.mode === "nbody") {
      if (config.algorithm && this.elements.algorithmSelectElement.value !== config.algorithm) {
        this.elements.algorithmSelectElement.value = config.algorithm;
        this.updateAlgorithmDescription(config.algorithm);
      }
      
      if (config.integrator && this.elements.integratorSelectElement.value !== config.integrator) {
        this.elements.integratorSelectElement.value = config.integrator;
        this.updateIntegratorDescription(config.integrator);
      }
    }

    // Update trail slider
    if (this.elements.trailSliderElement) {
      const currentMultiplier = state.visualSettings.trailLengthMultiplier;
      if (currentMultiplier !== this.elements.trailSliderElement.value) {
        this.elements.trailSliderElement.value = currentMultiplier;
      }
    }
  };
}
```

#### Task 4.2: Update Settings View Template
**File**: `apps/teskooano/src/plugins/settings/view/settings-panel.template.ts` (update existing)

**To-Do:**
- [ ] Replace single engine dropdown with mode-based UI
- [ ] Add conditional N-Body controls container
- [ ] Include description elements for user guidance
- [ ] Style conditional visibility transitions
- [ ] Add accessibility attributes

**Implementation:**
```typescript
export const settingsPanelTemplate = `
  <form class="settings-form">
    <div class="settings-group">
      <h3>Visual Settings</h3>
      
      <div class="setting-item">
        <label for="trail-slider">Trail Length</label>
        <teskooano-slider 
          id="trail-slider"
          min="0" 
          max="10" 
          step="0.1" 
          value="2">
        </teskooano-slider>
      </div>
    </div>

    <div class="settings-group">
      <h3>Simulation Mode</h3>
      
      <div class="setting-item">
        <label for="mode-select">Simulation Type</label>
        <select id="mode-select" class="setting-select">
          <!-- Populated by controller -->
        </select>
        <p id="mode-description" class="setting-description">
          <!-- Updated by controller -->
        </p>
      </div>

      <!-- N-Body specific controls (conditionally visible) -->
      <div id="nbody-controls" class="nbody-controls" style="display: none;">
        <div class="setting-item">
          <label for="algorithm-select">Force Algorithm</label>
          <select id="algorithm-select" class="setting-select">
            <!-- Populated by controller -->
          </select>
          <p id="algorithm-description" class="setting-description">
            <!-- Updated by controller -->
          </p>
        </div>

        <div class="setting-item">
          <label for="integrator-select">Time Integration</label>
          <select id="integrator-select" class="setting-select">
            <!-- Populated by controller -->
          </select>
          <p id="integrator-description" class="setting-description">
            <!-- Updated by controller -->
          </p>
        </div>
      </div>
    </div>

    <div class="settings-group">
      <h3>Performance</h3>
      
      <div class="setting-item">
        <label for="profile-select">Quality Profile</label>
        <select id="profile-select" class="setting-select">
          <!-- Existing performance options -->
        </select>
      </div>
    </div>
  </form>

  <style>
    .settings-form {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .settings-group {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .settings-group h3 {
      margin: 0;
      color: var(--color-text-primary);
      font-size: 1.1rem;
      font-weight: 600;
      border-bottom: 1px solid var(--color-border);
      padding-bottom: 0.5rem;
    }

    .setting-item {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .setting-item label {
      font-weight: 500;
      color: var(--color-text-secondary);
      font-size: 0.9rem;
    }

    .setting-select {
      padding: 0.5rem;
      border: 1px solid var(--color-border);
      border-radius: 4px;
      background: var(--color-background-secondary);
      color: var(--color-text-primary);
      font-size: 0.9rem;
    }

    .setting-select:focus {
      border-color: var(--color-accent);
      outline: none;
      box-shadow: 0 0 0 2px var(--color-accent-alpha);
    }

    .setting-description {
      margin: 0;
      font-size: 0.8rem;
      color: var(--color-text-tertiary);
      font-style: italic;
    }

    .complexity, .order {
      font-weight: 600;
      color: var(--color-accent);
    }

    .nbody-controls {
      margin-left: 1rem;
      padding-left: 1rem;
      border-left: 2px solid var(--color-border);
      transition: opacity 0.2s ease-in-out;
    }

    .nbody-controls.hidden {
      opacity: 0.5;
      pointer-events: none;
    }

    /* Animation for smooth transitions */
    .nbody-controls {
      transition: all 0.3s ease-in-out;
      max-height: 500px;
      overflow: hidden;
    }

    .nbody-controls[style*="display: none"] {
      max-height: 0;
      opacity: 0;
      margin: 0;
      padding: 0;
    }
  </style>
`;
```

### Phase 4B: Update Engine Panel Display

#### Task 4.3: Update Engine Panel Controller
**File**: `apps/teskooano/src/plugins/engine-panel/main-toolbar/simulation-controls/controller/simulation-controls.controller.ts`

**Current Issues:**
- Line 93: `_updateEngineDisplay()` uses old physics engine format

**To-Do:**
- [ ] Update engine display to show full configuration
- [ ] Format complex configurations into readable display
- [ ] Handle both ideal and N-Body mode displays
- [ ] Add tooltips with detailed information

**Implementation:**
```typescript
// ... existing imports ...
import type { SimulationConfiguration } from "@teskooano/core-state";
import { getConfigurationDisplayName, getConfigurationShortName } from "@teskooano/core-state";

export class SimulationControlsController extends StateSubscriptionMixin {
  // ... existing code ...

  public handleStateUpdate(state: SimulationState): void {
    this._updateTimeDisplay(state.time);
    this._updatePlayPauseButton(state.paused);
    this._updateScaleDisplay(state.timeScale);
    this._updateReverseButton(state.timeScale);
    this._updateSpeedButtons(state.paused, state.timeScale);
    this._updateEngineDisplay(state.simulationConfig); // Updated to use configuration
  }

  /**
   * Updates the engine display with current simulation configuration
   */
  private _updateEngineDisplay = (config: SimulationConfiguration | undefined): void => {
    const element = this.uiElements.engineValueDisplay;
    if (!element || !config) {
      if (element) {
        element.textContent = "-";
        element.setAttribute("data-full-name", "Unknown");
      }
      return;
    }

    // Get display names
    const shortName = getConfigurationShortName(config);
    const fullName = getConfigurationDisplayName(config);

    // Update display
    element.textContent = shortName;
    element.setAttribute("data-full-name", fullName);
    element.setAttribute("data-mode", config.mode);
    
    // Add CSS class for styling based on mode
    element.className = `engine-display mode-${config.mode}`;
    
    // Set tooltip with detailed information
    element.title = this.buildEngineTooltip(config);
  };

  /**
   * Builds detailed tooltip information for engine configuration
   */
  private buildEngineTooltip(config: SimulationConfiguration): string {
    if (config.mode === "ideal") {
      return "Ideal Orrery Mode\n" +
             "• Perfect Keplerian orbits\n" +
             "• No gravitational interactions\n" +
             "• Maximum stability and predictability";
    }

    const algorithmInfo = this.getAlgorithmInfo(config.algorithm);
    const integratorInfo = this.getIntegratorInfo(config.integrator);

    return `N-Body Physics Mode\n` +
           `• Algorithm: ${algorithmInfo.name} (${algorithmInfo.complexity})\n` +
           `• Integrator: ${integratorInfo.name} (Order ${integratorInfo.order})\n` +
           `• ${algorithmInfo.description}\n` +
           `• ${integratorInfo.description}`;
  }

  /**
   * Gets detailed algorithm information
   */
  private getAlgorithmInfo(algorithm?: AlgorithmType): { name: string; complexity: string; description: string } {
    switch (algorithm) {
      case "direct":
        return {
          name: "Direct Calculation",
          complexity: "O(N²)",
          description: "Exact force calculation between all body pairs"
        };
      case "barnes-hut":
        return {
          name: "Barnes-Hut Tree",
          complexity: "O(N log N)",
          description: "Spatial tree approximation for distant bodies"
        };
      case "fmm":
        return {
          name: "Fast Multipole Method",
          complexity: "O(N)",
          description: "Hierarchical multipole expansion"
        };
      case "p3m":
        return {
          name: "Particle-Mesh",
          complexity: "O(N log N)",
          description: "Hybrid particle-grid method"
        };
      default:
        return {
          name: "Unknown",
          complexity: "Unknown",
          description: "Algorithm not specified"
        };
    }
  }

  /**
   * Gets detailed integrator information
   */
  private getIntegratorInfo(integrator?: IntegratorType): { name: string; order: number; description: string } {
    switch (integrator) {
      case "euler":
        return {
          name: "Euler Integration",
          order: 1,
          description: "Simple first-order method"
        };
      case "symplectic":
        return {
          name: "Symplectic Euler",
          order: 1,
          description: "Energy-preserving variant"
        };
      case "verlet":
        return {
          name: "Verlet Integration",
          order: 2,
          description: "Stable and time-reversible"
        };
      case "rk4":
        return {
          name: "Runge-Kutta 4th Order",
          order: 4,
          description: "High accuracy integration"
        };
      case "adaptive":
        return {
          name: "Adaptive Step Size",
          order: 4,
          description: "Auto-adjusting time step"
        };
      default:
        return {
          name: "Unknown",
          order: 0,
          description: "Integrator not specified"
        };
    }
  }

  // ... rest of existing methods ...
}
```

#### Task 4.4: Update Engine Display Utilities
**File**: `apps/teskooano/src/plugins/engine-panel/main-toolbar/simulation-controls/controller/simulation-controls.utils.ts`

**Current Issues:**
- Line 60: `getEngineShortName()` function needs update for new configuration system

**To-Do:**
- [ ] Remove or deprecate `getEngineShortName()`
- [ ] Ensure compatibility with new configuration display functions

**Implementation:**
```typescript
// ... existing formatTime and formatScale functions remain unchanged ...

/**
 * @deprecated Use getConfigurationShortName from @teskooano/core-state instead
 * Gets a shortened, display-friendly name for a physics engine from its full identifier.
 */
export function getEngineShortName(engineName: string | undefined): string {
  console.warn('getEngineShortName is deprecated. Use getConfigurationShortName instead.');
  
  if (!engineName) return "-";
  const name = engineName.split("-")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Re-export new configuration utilities for convenience
export { 
  getConfigurationDisplayName, 
  getConfigurationShortName 
} from "@teskooano/core-state";
```

### Phase 4C: Add CSS Styling for New UI Components

#### Task 4.5: Add Responsive CSS for Configuration UI
**File**: `apps/teskooano/src/plugins/settings/view/settings-panel.css` (new)

**To-Do:**
- [ ] Style mode selector with clear visual hierarchy
- [ ] Add smooth transitions for conditional visibility
- [ ] Style algorithm/integrator dropdowns with technical styling
- [ ] Add responsive design for different screen sizes
- [ ] Include accessibility improvements

**Implementation:**
```css
/* Settings panel specific styles */
.engine-display {
  font-family: var(--font-mono);
  font-weight: 600;
  transition: all 0.2s ease;
}

.engine-display.mode-ideal {
  color: var(--color-success);
}

.engine-display.mode-nbody {
  color: var(--color-accent);
}

/* N-Body controls animation */
@keyframes slideDown {
  from {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    max-height: 500px;
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    max-height: 500px;
    opacity: 1;
    transform: translateY(0);
  }
  to {
    max-height: 0;
    opacity: 0;
    transform: translateY(-10px);
  }
}

.nbody-controls.show {
  animation: slideDown 0.3s ease-out;
}

.nbody-controls.hide {
  animation: slideUp 0.3s ease-out;
}

/* Technical indicator styling */
.complexity {
  background: var(--color-accent-alpha);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
}

.order {
  background: var(--color-info-alpha);
  padding: 0.2rem 0.4rem;
  border-radius: 3px;
  font-size: 0.7rem;
}

/* Responsive design */
@media (max-width: 768px) {
  .settings-form {
    padding: 0.5rem;
    gap: 1rem;
  }
  
  .nbody-controls {
    margin-left: 0.5rem;
    padding-left: 0.5rem;
  }
}
```

## 🧪 Testing Strategy

### Task 4.6: Create UI Component Tests
**File**: `apps/teskooano/src/plugins/settings/controller/SettingsController.spec.ts` (new)

**To-Do:**
- [ ] Test mode switching UI behavior
- [ ] Test conditional visibility of N-Body controls
- [ ] Test state synchronization with UI
- [ ] Test error handling and validation feedback
- [ ] Test accessibility features

## 📋 Implementation Checklist

### Pre-Implementation
- [ ] Complete state management changes (Guide 03)
- [ ] Review existing UI component structure
- [ ] Plan user experience flow for configuration changes

### Implementation Order
1. [ ] Update SettingsController with new configuration logic
2. [ ] Update settings view template with new UI structure
3. [ ] Update engine panel display controller
4. [ ] Add CSS styling for new components
5. [ ] Update engine display utilities
6. [ ] Create comprehensive UI tests
7. [ ] Test user experience flows

### Post-Implementation
- [ ] Test all UI interactions work correctly
- [ ] Verify responsive design on different screen sizes
- [ ] Test accessibility with screen readers
- [ ] Validate state synchronization across components
- [ ] Performance test UI updates

## 🎯 Success Criteria
- [ ] Mode switching UI is intuitive and responsive
- [ ] Conditional controls show/hide smoothly
- [ ] Engine display clearly shows current configuration
- [ ] All UI components properly synchronized with state
- [ ] No accessibility regressions
- [ ] Responsive design works on all target devices

## 📋 Dependencies
**Requires**: State management layer changes (Guide 03)
**Blocks**: Final integration testing

**Estimated Time**: 4-5 days
**Risk Level**: Medium (UI complexity)
**Impact Level**: High (user-facing changes)