# Core Tooltip Component (`<teskooano-tooltip>`)

A flexible, low-level tooltip component. Its visibility and positioning are controlled via attributes and JavaScript methods.

This component is designed for two primary use cases:

1.  **Standalone**: Manually instantiated and controlled with JavaScript to provide a tooltip for any element.
2.  **Internal/Managed**: Used within the Shadow DOM of another component (like `<teskooano-button>`), where its lifecycle is managed automatically.

## Standalone Usage

This is the primary way to use the tooltip for custom scenarios. You must manage its visibility and positioning relative to a trigger element using JavaScript.

```html
<!-- Example Trigger Element -->
<button id="my-button">Hover Me</button>

<!-- Tooltip Definition -->
<teskooano-tooltip
  id="my-tooltip"
  vertical-align="below"
  horizontal-align="center"
>
  <svg slot="icon" width="16" height="16" viewBox="0 0 16 16">...</svg>
  <span slot="title">Info</span>
  This is the main tooltip text.
</teskooano-tooltip>

<script>
  const button = document.getElementById("my-button");
  const tooltip = document.getElementById("my-tooltip");

  button.addEventListener("mouseenter", () => {
    // Show the tooltip and anchor it to the button
    tooltip.show(button);
  });

  button.addEventListener("mouseleave", () => {
    tooltip.hide();
  });

  button.addEventListener("focus", () => tooltip.show(button));
  button.addEventListener("blur", () => tooltip.hide());
</script>
```

## Internal (Managed) Usage

Components like `<teskooano-button>` include a `<teskooano-tooltip>` in their Shadow DOM. In these cases, you do not need to manually control the tooltip. You can set its content via attributes on the parent component (e.g., `<teskooano-button tooltip-text="...">`).

## Attributes

- `visible`: (Read-only) Controls the visibility of the tooltip. Its presence makes the tooltip visible. This is managed primarily via the `show()`/`hide()` methods.
- `vertical-align`: Vertical alignment relative to the trigger.
  - **Values**: `above`, `below` (default)
- `horizontal-align`: Horizontal alignment relative to the trigger.
  - **Values**: `start`, `center` (default), `end`

## Slots

- `(default)`: The main text content of the tooltip.
- `icon`: An optional slot for an icon (e.g., an `<svg>` or `<img>` element).
- `title`: An optional slot for a title, displayed above the main text.

## Properties and Methods

### Methods

- `show(triggerElement: HTMLElement)`: Makes the tooltip visible and positions it relative to the provided `triggerElement`.
- `hide()`: Hides the tooltip.
- `setTriggerElement(triggerElement: HTMLElement)`: Sets the element the tooltip should be positioned against without showing it immediately.

### Properties

- `titleContent` (string): Programmatically sets the text of the `title` slot.
- `iconContent` (string): Programmatically sets the inner HTML of the `icon` slot. Useful for setting SVG content.
- `mainContent` (string): Programmatically sets the text of the default slot.

## Styling (CSS Parts)

You can style the tooltip from outside its Shadow DOM using the `::part()` pseudo-element.

- `part="tooltip"`: The main tooltip container `div`.
- `part="content"`: The `div` wrapping all content (icon and text).
- `part="icon"`: The container for the `icon` slot.
- `part="text-content"`: The container for the title and main text.
- `part="title"`: The container for the `title` slot.
- `part="main"`: The container for the default (main text) slot.

Example:

```css
teskooano-tooltip::part(tooltip) {
  background-color: navy;
  max-width: 300px;
}
```
