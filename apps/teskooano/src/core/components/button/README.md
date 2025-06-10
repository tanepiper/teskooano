# `teskooano-button`

A versatile custom button element with multiple variants, sizes, and deeply integrated tooltip functionality managed by a `ButtonTooltipManager`.

## Usage

```html
<!-- Standard Button -->
<teskooano-button>Default</teskooano-button>

<!-- Primary action button -->
<teskooano-button variant="primary" size="lg">Submit</teskooano-button>

<!-- Icon-only button with a tooltip -->
<teskooano-button variant="ghost" tooltip-text="Open Settings">
  <span slot="icon">[SVG for settings icon]</span>
</teskooano-button>

<!-- Image button -->
<teskooano-button variant="image" tooltip-text="View Profile">
  <span slot="icon"><img src="/path/to/avatar.png" alt="User Avatar" /></span>
</teskooano-button>
```

## Attributes

- `variant`: `primary` | `ghost` | `image`. Sets the visual style. Defaults to a standard bordered button.
- `size`: `xs` | `sm` | `md` (default) | `lg` | `xl`.
- `disabled`: Boolean attribute to disable the button.
- `fullwidth`: Boolean attribute to make the button span the full width of its container.
- `active`: Boolean attribute to give the button a visual "active" or "toggled on" state.
- `mobile`: Boolean attribute that hides the button's text label, leaving only the icon visible.
- `type`: Standard button type: `button` (default), `submit`, `reset`.

## Tooltip Integration

The button has a powerful, built-in tooltip system. You can provide content via attributes or slots.

### Tooltip Attributes

- `title`: Standard HTML attribute. Used as the tooltip's main text if `tooltip-text` is not set.
- `tooltip-text`: The main text content for the tooltip.
- `tooltip-title`: An optional title for the tooltip.
- `tooltip-icon`: An SVG string for an icon within the tooltip.

### Tooltip Slots

You can also provide rich content using slots, which will take priority over attributes.

- `tooltip-icon`: For an element (like an `<img>` or `<svg>`) to use as the tooltip's icon.
- `tooltip-title`: For text or elements to use as the tooltip's title.
- `tooltip-text`: For text or elements to use as the tooltip's main body.

### Automatic Icon Fallback

If no `tooltip-icon` attribute or `tooltip-icon` slot is provided, the tooltip will automatically use the content from the button's main `icon` slot.
