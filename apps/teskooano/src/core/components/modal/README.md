# Core Modal System (`<teskooano-modal>` & `ModalManager`)

Provides a modal dialog component (`<teskooano-modal>`) and a service (`ModalManager`) for controlling modal visibility and content programmatically.

## Usage

### Declarative Modal (`<teskooano-modal>`)

```html
<teskooano-modal open heading="My Modal">
  <p>Modal content goes here.</p>
  <teskooano-button
    slot="footer"
    onclick="this.closest('teskooano-modal').close()"
    >Close</teskooano-button
  >
</teskooano-modal>
```

### Programmatic Modal (`ModalManager`)

Requires the `ModalManager` instance from the plugin manager.

```typescript
import { pluginManager } from "@teskooano/core"; // Adjust import path

const modalManager = pluginManager.getManager("modal-manager");

// Show a simple message modal
modalManager.showMessage(
  "Operation Complete",
  "The task finished successfully.",
);

// Show a confirmation modal
const confirmed = await modalManager.showConfirm(
  "Delete Item?",
  "Are you sure you want to delete this?",
);
if (confirmed) {
  // ... delete the item
}

// Show a modal with custom content
modalManager.showModal({
  heading: "Custom Content",
  content: "<p>Render <em>any</em> HTML here.</p>",
  buttons: [
    { label: "OK", action: (modal) => modal.close(true) },
    { label: "Cancel", action: (modal) => modal.close(false) },
  ],
});
```

## `<teskooano-modal>` Attributes

- `open`: Boolean attribute to control visibility.
- `heading`: String attribute for the modal title.

## `<teskooano-modal>` Slots

- `(default)`: Main content of the modal.
- `footer`: Content for the modal footer (typically buttons).

## `ModalManager` Methods

- `showMessage(heading, message)`: Displays a simple informational modal.
- `showConfirm(heading, message)`: Displays a confirmation modal, returning a Promise<boolean>.
- `showModal(options)`: Displays a modal with custom heading, content (HTML string or Node), and buttons.
- `closeAll()`: Closes any open modals managed by the service.
