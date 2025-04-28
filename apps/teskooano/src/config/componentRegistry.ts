import type { ComponentRegistryConfig } from "@teskooano/ui-plugin";

// Defines the base web components to load eagerly.
// The keys are the component tag names.
// The paths point to the modules defining the custom element classes.
// These paths are relative to the `apps/teskooano/src` directory or resolved via package name.

export const componentConfig: ComponentRegistryConfig = {
  // Components from apps/teskooano/src/components/shared:
  "teskooano-button": {
    path: "../components/shared/Button.ts",
    className: "TeskooanoButton",
  }, // Assuming .js extension after build or direct TS path if setup allows
  "teskooano-card": {
    path: "../components/shared/Card.ts",
    className: "TeskooanoCard",
  },
  "teskooano-checkbox": {
    path: "../components/shared/Checkbox.ts",
    className: "TeskooanoCheckbox",
  },
  "teskooano-collapsible": {
    path: "../components/shared/CollapsibleSection.ts",
    className: "TeskooanoCollapsibleSection",
  }, // Check actual tag name
  "teskooano-form": {
    path: "../components/shared/Form.ts",
    className: "TeskooanoForm",
  },
  "teskooano-labeled-value": {
    path: "../components/shared/LabeledValue.ts",
    className: "TeskooanoLabeledValue",
  }, // Check actual tag name
  "teskooano-modal": {
    path: "../components/shared/Modal.ts",
    className: "TeskooanoModal",
  },
  "teskooano-modal-manager": {
    path: "../components/shared/ModalManager.ts",
    className: "TeskooanoModalManager",
    isCustomElement: false,
  }, // If it's a component, check tag name
  "teskooano-output-display": {
    path: "../components/shared/OutputDisplay.ts",
    className: "TeskooanoOutputDisplay",
  }, // Check actual tag name
  "teskooano-select": {
    path: "../components/shared/Select.ts",
    className: "TeskooanoSelect",
  },
  "teskooano-slider": {
    path: "../components/shared/Slider.ts",
    className: "TeskooanoSlider",
  },

  // Components from other locations (if any)
  // 'another-component': { path: '../path/to/AnotherComponent.js' }

  // Components from design system package (if applicable & not already globally loaded)
  // Note: If @teskooano/design-system already registers its components globally,
  // you might not need to list them here. Check its implementation.
  // 'ds-button': { path: '@teskooano/design-system/Button' },
};
