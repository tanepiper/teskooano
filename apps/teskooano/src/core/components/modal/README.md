# Core Modal System (`<teskooano-modal>` & `ModalManager`)

This system provides a modal dialog component (`<teskooano-modal>`) and a service (`TeskooanoModalManager`) for controlling modal visibility and content programmatically. The primary and intended way to create modals is through the `ModalManager`.

## `TeskooanoModalManager`

The `ModalManager` is a service that integrates with the application's `DockviewController` to display modals as managed overlays. This is the recommended way to create all modal dialogs.

### Usage

First, get the manager instance from the central plugin manager, then call the `.show()` method.

```typescript
import { pluginManager } from "@teskooano/ui-plugin";
import { TeskooanoModalManager } from "path/to/core/components/modal"; // Adjust import path

// Get the manager instance from the plugin system
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

// Show a modal with a custom element
async function showCustomContentModal() {
  const myCustomElement = document.createElement("my-custom-form");
  // ... configure myCustomElement ...

  await modalManager.show({
    title: "Custom Form",
    content: myCustomElement,
    hideConfirmButton: true,
    closeText: "Done",
  });
}
```

### `ModalManager.show()` Options

The `show` method accepts an `ModalOptions` object with the following properties:

- `title: string`: The text displayed in the modal's header.
- `content: string | HTMLElement`: The content for the modal body. Can be an HTML string or a DOM element.
- `id?: string`: (Optional) A unique ID for the modal overlay.
- `width?: number`: (Optional) Width of the modal in pixels (default: 450).
- `height?: number`: (Optional) Height of the modal in pixels (default: 250).
- `confirmText?: string`: (Optional) Text for the primary confirmation button.
- `closeText?: string`: (Optional) Text for the close/cancel button.
- `secondaryText?: string`: (Optional) Text for the secondary action button.
- `hideCloseButton?: boolean`: (Optional) Set to true to hide the close button.
- `hideConfirmButton?: boolean`: (Optional) Set to true to hide the confirm button.
- `hideSecondaryButton?: boolean`: (Optional) Set to true to hide the secondary button (it is hidden by default).

The `show` method returns a `Promise<ModalResult>`, which resolves to one of the following strings when the modal is closed: `'confirm'`, `'close'`, `'secondary'`, or `'dismissed'`.

## `<teskooano-modal>` (Implementation Detail)

The `<teskooano-modal>` custom element is the component rendered by the `ModalManager`. It is not intended for direct declarative use in HTML. Its attributes (`title`, `confirm-text`, etc.) are set programmatically by the manager.
