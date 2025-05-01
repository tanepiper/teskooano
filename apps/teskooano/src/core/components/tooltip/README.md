# Core Tooltip Component (`<teskooano-tooltip>`)

Provides a tooltip that appears when hovering over its target element.

## Usage

The tooltip content is placed inside the `<teskooano-tooltip>` tags. The element immediately preceding the tooltip will be its target.

```html
<teskooano-button>Hover Me</teskooano-button>
<teskooano-tooltip>This is the tooltip text.</teskooano-tooltip>

<span>Another target</span>
<teskooano-tooltip position="bottom"
  >Tooltip below the target.</teskooano-tooltip
>
```

## Attributes

- `position`: (Optional) Where the tooltip appears relative to the target. Values: `top` (default), `bottom`, `left`, `right`.
- `delay`: (Optional) Delay in milliseconds before the tooltip appears (default: 300).

## Slots

- `(default)`: The content of the tooltip (can be text or HTML).
