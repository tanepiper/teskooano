import type { ComponentRegistryConfig } from '@teskooano/ui-plugin';

// Defines the base web components to load eagerly.
// The keys are the component tag names.
// The paths point to the modules defining the custom element classes.
// These paths are relative to the `apps/teskooano/src` directory or resolved via package name.

export const componentConfig: ComponentRegistryConfig = {
    // Components from apps/teskooano/src/components/shared:
    'teskooano-button':         { path: './components/shared/Button.js' }, // Assuming .js extension after build or direct TS path if setup allows
    'teskooano-card':           { path: './components/shared/Card.js' },
    'teskooano-checkbox':       { path: './components/shared/Checkbox.js' },
    'teskooano-collapsible':    { path: './components/shared/CollapsibleSection.js' }, // Check actual tag name
    'teskooano-form':           { path: './components/shared/Form.js' },
    'teskooano-labeled-value':  { path: './components/shared/LabeledValue.js' }, // Check actual tag name
    'teskooano-modal':          { path: './components/shared/Modal.js' },
    'teskooano-modal-manager':  { path: './components/shared/ModalManager.js' }, // If it's a component, check tag name
    'teskooano-output-display': { path: './components/shared/OutputDisplay.js' }, // Check actual tag name
    'teskooano-select':         { path: './components/shared/Select.js' },
    'teskooano-slider':         { path: './components/shared/Slider.js' },

    // Components from other locations (if any)
    // 'another-component': { path: '../path/to/AnotherComponent.js' }

    // Components from design system package (if applicable & not already globally loaded)
    // Note: If @teskooano/design-system already registers its components globally,
    // you might not need to list them here. Check its implementation.
    // 'ds-button': { path: '@teskooano/design-system/Button' },
}; 