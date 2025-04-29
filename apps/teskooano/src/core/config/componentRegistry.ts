import type { ComponentRegistryConfig } from "@teskooano/ui-plugin";

export const componentConfig: ComponentRegistryConfig = {
  "teskooano-button": {
    path: "../core/components/button",
    className: "TeskooanoButton",
    isCustomElement: true,
  },
  "teskooano-card": {
    path: "../core/components/card",
    className: "TeskooanoCard",
    isCustomElement: true,
  },
  "teskooano-labeled-value": {
    path: "../plugins/shared/LabeledValue.ts",
    className: "TeskooanoLabeledValue",
    isCustomElement: true,
  },
  "teskooano-modal": {
    path: "../plugins/shared/Modal.ts",
    className: "TeskooanoModal",
    isCustomElement: true,
  },
  "teskooano-modal-manager": {
    path: "../plugins/shared/ModalManager.ts",
    className: "TeskooanoModalManager",
    isCustomElement: false,
  },
  "teskooano-output-display": {
    path: "../plugins/shared/OutputDisplay.ts",
    className: "TeskooanoOutputDisplay",
    isCustomElement: true,
  },
  "teskooano-select": {
    path: "../plugins/shared/Select.ts",
    className: "TeskooanoSelect",
    isCustomElement: true,
  },
  "teskooano-slider": {
    path: "../core/components/slider",
    className: "TeskooanoSlider",
    isCustomElement: true,
  },
  "teskooano-simulation-controls": {
    path: "../plugins/engine/main-toolbar/simulation-controls/SimulationControls.ts",
    className: "SimulationControls",
    isCustomElement: true,
  },
  "teskooano-system-controls": {
    path: "../plugins/engine/main-toolbar/system-controls/SystemControls.ts",
    className: "SystemControls",
    isCustomElement: true,
  },
  "teskooano-tooltip": {
    path: "../plugins/shared/Tooltip.ts",
    className: "TeskooanoTooltip",
    isCustomElement: true,
  },
};
