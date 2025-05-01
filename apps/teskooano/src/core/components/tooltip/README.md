# Core Tooltip Component (`<teskooano-tooltip>`)

Provides a flexible tooltip element. Its visibility and positioning are controlled via attributes and JavaScript methods.

## Usage

The tooltip content is placed inside the `<teskooano-tooltip>` tags using slots. You need to manage its visibility and positioning relative to a trigger element using JavaScript.

```html
<!-- Example Trigger Element -->
<button id="my-button">Hover Me</button>

<!-- Tooltip definition -->
<teskooano-tooltip
  id="my-tooltip"
  vertical-align="below"
  horizontal-align="center"
>
  <span slot="title">Optional Title</span>
  <svg slot="icon" width="16" height="16" viewBox="0 0 16 16">...</svg>
  <!-- Optional Icon -->
  Main tooltip text goes here.
</teskooano-tooltip>

<script>
  const button = document.getElementById("my-button");
  const tooltip = document.getElementById("my-tooltip");

  button.addEventListener("mouseenter", () => {
    tooltip.show(button); // Show tooltip relative to the button
  });

  button.addEventListener("mouseleave", () => {
    tooltip.hide();
  });
</script>
```

## Attributes

- `visible`: (Optional) Controls the visibility of the tooltip. Presence of the attribute makes it visible. Managed primarily via `show()`/`hide()` methods.
- `vertical-align`: (Optional) Vertical alignment relative to the trigger element. Values: `above` (default), `below`.
- `horizontal-align`: (Optional) Horizontal alignment relative to the trigger element. Values: `start`, `center` (default), `end`.
- `id`: Required if you intend to control the tooltip via JavaScript.

## Slots

- `(default)`: The main text content of the tooltip.
- `icon`: An optional slot for an icon (e.g., an `<svg>` element) displayed before the text.
- `title`: An optional slot for a title displayed above the main text.

## Methods

- `show(triggerElement?: HTMLElement | null)`: Makes the tooltip visible and positions it relative to the provided `triggerElement`. If no element is provided, it attempts to use a previously set one or the parent element (with a warning).
- `hide()`: Hides the tooltip.
- `setTriggerElement(triggerElement: HTMLElement | null)`: Sets the element the tooltip should position relative to, without immediately showing it.

## Styling

Refer to the JSDoc comments in `Tooltip.ts` for available CSS parts (`::part(tooltip)`) and CSS custom properties (`--color-tooltip-background`, etc.) for styling.
