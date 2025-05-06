# `teskooano-button`

A custom button element with different variants (text, icon, image) and built-in tooltip integration.

## Usage

```html
<teskooano-button>Default</teskooano-button>

<teskooano-button variant="icon" title="Settings" tooltip-text="Open Settings">
  <span slot="icon">[Settings SVG code here]</span>
</teskooano-button>

<teskooano-button
  variant="primary"
  size="lg"
  tooltip-text="Click to proceed"
  tooltip-title="Next Step"
  tooltip-icon="[SVG code here]"
>
  Proceed
</teskooano-button>
```

## Attributes

- `variant`: `text` (default), `icon`, `image`, `primary`, `secondary`, etc. (Based on design system)
- `size`: `xs`, `sm`, `md` (default), `lg`, `xl`
- `disabled`: Boolean attribute to disable the button.
- `fullwidth`: Boolean attribute to make the button take full container width.
- `type`: Standard button type (`button`, `submit`, `reset`). Default is `button`.
- `title`: Standard title attribute (used as fallback tooltip if `tooltip-text` is not provided).
- `tooltip-text`: The main text content for the tooltip.
- `tooltip-title`: An optional title for the tooltip.
- `tooltip-icon`: (Optional) A string containing SVG markup for an icon within the tooltip. If omitted, the tooltip will attempt to use the button's main icon (from `<slot name="icon">`) by default.

## Tooltip Integration

The button integrates with `<teskooano-tooltip>`. Attributes like `tooltip-text`, `tooltip-title`, and `tooltip-icon` are used to populate the content of the corresponding named slots (`<slot name="tooltip-text">`, etc.) within the button's shadow DOM.

**Default Icon Behavior:** If the `tooltip-icon` attribute is _not_ provided, and no content is slotted into `<slot name="tooltip-icon">`, the component will automatically use the content of the main button icon slot (`<slot name="icon">`) for the tooltip's icon.

These slots project the content into the `<teskooano-tooltip>` component when the button is hovered or focused.

Alternatively, you can provide tooltip content directly using slotted elements:

```html
<teskooano-button>
  My Button
  <span slot="tooltip-title">Custom Title</span>
  <span slot="tooltip-text">More detailed explanation.</span>
  <span slot="tooltip-icon">[Specific Tooltip SVG code here]</span>
</teskooano-button>
```

When slotted content is provided for a tooltip part (e.g., `<span slot="tooltip-icon">`), the corresponding attribute (e.g., `tooltip-icon`) and the default icon behavior will be ignored for that part.
