# Core Modal System

This system provides modal dialog components and managers for both overlay-based and DockView-based modals. The **DockView-based system is the recommended approach** as it provides better integration with the application's panel system.

## DockView Modal System (Recommended)

The `DockViewModalManager` creates modals as floating DockView panels, providing better integration with the application's layout system.

### Usage

```typescript
import { pluginManager } from "@teskooano/ui-plugin";
import { DockViewModalManager } from "path/to/core/components/modal";

// Get the DockView modal manager instance
const modalManager = pluginManager.getManagerInstance<DockViewModalManager>(
  "dockview-modal-manager",
);

// Show a confirmation modal
async function showConfirmation() {
  const result = await modalManager.show({
    title: "Confirm Deletion",
    content:
      "<p>Are you sure you want to delete this item? This action cannot be undone.</p>",
    confirmText: "Delete",
    closeText: "Cancel",
    hideSecondaryButton: true,
    width: 400,
    height: 200,
  });

  if (result === "confirm") {
    console.log("Item deleted!");
  } else {
    console.log("Deletion cancelled.");
  }
}

// Show a modal with custom positioning
async function showCustomPositionedModal() {
  const result = await modalManager.show({
    title: "Custom Modal",
    content: "<p>This modal appears at a specific position.</p>",
    position: {
      top: 100,
      left: 200,
      width: 500,
      height: 300,
    },
  });
}
```

### `DockViewModalManager.show()` Options

The `show` method accepts a `DockViewModalOptions` object with the following properties:

- `title: string`: The text displayed in the modal's header.
- `content: string | HTMLElement`: The content for the modal body. Can be an HTML string or a DOM element.
- `id?: string`: (Optional) A unique ID for the modal panel.
- `width?: number`: (Optional) Width of the modal in pixels (default: 450).
- `height?: number`: (Optional) Height of the modal in pixels (default: 300).
- `position?: { top: number; left: number; width: number; height: number }`: (Optional) Custom position for the floating panel.
- `confirmText?: string`: (Optional) Text for the primary confirmation button.
- `closeText?: string`: (Optional) Text for the close/cancel button.
- `secondaryText?: string`: (Optional) Text for the secondary action button.
- `hideCloseButton?: boolean`: (Optional) Set to true to hide the close button.
- `hideConfirmButton?: boolean`: (Optional) Set to true to hide the confirm button.
- `hideSecondaryButton?: boolean`: (Optional) Set to true to hide the secondary button (it is hidden by default).

The `show` method returns a `Promise<ModalResult>`, which resolves to one of the following strings when the modal is closed: `'confirm'`, `'close'`, `'secondary'`, or `'dismissed'`.

### CSS Targeting and Styling

Each modal instance is automatically assigned a unique panel ID from DockView. You can target specific modals with CSS using:

**1. Data Attribute Targeting:**

```css
/* Target any modal */
teskooano-modal-panel {
  border: 2px solid blue;
}

/* Target specific modal by panel ID */
teskooano-modal-panel[data-panel-id="panel-123"] {
  border: 2px solid red;
}
```

**2. CSS Class Targeting:**

```css
/* Target specific modal using generated class */
.modal-panel-panel-123 {
  background: rgba(0, 0, 0, 0.9);
}
```

**3. Getting Panel ID Programmatically:**

```typescript
// Method 1: Use showWithId() to get both result and panel ID
const { result, panelId } = await modalManager.showWithId({
  title: "Confirm Action",
  content: "<p>Are you sure?</p>",
});

console.log("Modal result:", result);
console.log("Panel ID for CSS:", panelId);

// Method 2: Access panel ID from modal element
const modalElement = document.querySelector("teskooano-modal-panel");
const panelId = modalElement?.getPanelId();

// Method 3: Use the panel ID for dynamic styling
const style = document.createElement("style");
style.textContent = `
  teskooano-modal-panel[data-panel-id="${panelId}"] {
    backdrop-filter: blur(10px);
  }
`;
document.head.appendChild(style);
```

**4. Advanced CSS Targeting:**

```typescript
// Show a modal with custom styling
async function showStyledModal() {
  const { result, panelId } = await modalManager.showWithId({
    title: "Special Modal",
    content: "<p>This modal has custom styling!</p>",
    confirmText: "Awesome!",
  });

  // Add custom CSS for this specific modal
  const customStyle = document.createElement("style");
  customStyle.textContent = `
    .modal-panel-${panelId} {
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
    }
    
    .modal-panel-${panelId} .modal-header {
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
    }
  `;
  document.head.appendChild(customStyle);

  return result;
}
```

## Legacy Overlay Modal System

The `TeskooanoModalManager` creates modals as overlays using the Dockview overlay system. This system is maintained for backward compatibility.

### Usage

```typescript
import { pluginManager } from "@teskooano/ui-plugin";
import { TeskooanoModalManager } from "path/to/core/components/modal";

// Get the legacy modal manager instance
const modalManager =
  pluginManager.getManagerInstance<TeskooanoModalManager>("modal-manager");

// Show a confirmation modal
async function showConfirmation() {
  const result = await modalManager.show({
    title: "Confirm Deletion",
    content:
      "<p>Are you sure you want to delete this item? This action cannot be undone.</p>",
    confirmText: "Delete",
    closeText: "Cancel",
    hideSecondaryButton: true,
  });

  if (result === "confirm") {
    console.log("Item deleted!");
  } else {
    console.log("Deletion cancelled.");
  }
}
```

## Components

### `<teskooano-modal-panel>` (DockView-based)

The `<teskooano-modal-panel>` custom element is the component rendered by the `DockViewModalManager`. It implements DockView's `IContentRenderer` interface and is designed to work as a floating panel.

### `<teskooano-modal>` (Legacy Overlay-based)

The `<teskooano-modal>` custom element is the component rendered by the `TeskooanoModalManager`. It is designed to work as an overlay and is maintained for backward compatibility.

## Migration Guide

To migrate from the legacy overlay system to the new DockView system:

1. **Update imports**: Change from `TeskooanoModalManager` to `DockViewModalManager`
2. **Update manager ID**: Change from `"modal-manager"` to `"dockview-modal-manager"`
3. **Add positioning options**: Consider adding `width`, `height`, or `position` options for better control
4. **Test behavior**: The new system integrates better with DockView's panel management

The new system provides:

- Better integration with DockView's panel system
- Improved positioning and sizing control
- Consistent behavior with other floating panels
- Better keyboard navigation support
