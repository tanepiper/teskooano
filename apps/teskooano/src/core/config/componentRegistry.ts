import type { ComponentRegistryConfig } from "@teskooano/ui-plugin";

export const componentConfig: ComponentRegistryConfig = {
  "teskooano-button": {
    path: "../components/button/Button.ts",
    className: "TeskooanoButton",
    isCustomElement: true,
  },
  "teskooano-card": {
    path: "../components/card",
    className: "TeskooanoCard",
    isCustomElement: true,
  },
  "teskooano-labeled-value": {
    path: "../components/LabeledValue.ts",
    className: "TeskooanoLabeledValue",
    isCustomElement: true,
  },
  "teskooano-modal": {
    path: "../components/Modal.ts",
    className: "TeskooanoModal",
    isCustomElement: true,
  },
  "teskooano-modal-manager": {
    path: "../components/ModalManager.ts",
    className: "TeskooanoModalManager",
    isCustomElement: false,
  },
  "teskooano-output-display": {
    path: "../components/OutputDisplay.ts",
    className: "TeskooanoOutputDisplay",
    isCustomElement: true,
  },
  "teskooano-select": {
    path: "../components/Select.ts",
    className: "TeskooanoSelect",
    isCustomElement: true,
  },
  "teskooano-slider": {
    path: "../components/slider",
    className: "TeskooanoSlider",
    isCustomElement: true,
  },
  "teskooano-tooltip": {
    path: "../components/Tooltip.ts",
    className: "TeskooanoTooltip",
    isCustomElement: true,
  },
};
