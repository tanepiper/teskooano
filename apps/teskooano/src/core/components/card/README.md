# Core Card Component (`<teskooano-card>`)

A container component with optional image, label, title, content, and call-to-action (CTA) slots, used for grouping related content.

## Usage

```html
<teskooano-card variant="fluid">
  <img
    slot="image"
    src="/path/to/your/image.jpg"
    alt="A descriptive alt text"
  />
  <span slot="label">Category</span>
  <span slot="title">Card Title</span>
  <p>This is the main content of the card. It can contain any HTML.</p>
  <div slot="cta">
    <teskooano-button variant="primary">Action 1</teskooano-button>
    <teskooano-button>Action 2</teskooano-button>
  </div>
</teskooano-card>
```

## Attributes

- `variant`: `fixed` (default), `fluid`, `full`. Controls the width behavior of the card.
  - `fixed`: A fixed width set by the `--card-fixed-width` CSS variable (default: 300px).
  - `fluid`: Width is determined by the content and the container.
  - `full`: Takes up 100% of the container's width.

## Slots

- `image`: (Optional) For an image, typically displayed at the top.
- `label`: (Optional) For a small category label above the title.
- `title`: The main title for the card.
- `(default)`: The primary content/body of the card.
- `cta`: (Optional) For call-to-action elements like buttons, displayed at the bottom with a separator.

## CSS Parts

- `container`: The main internal `div` of the card.
- `content-area`: The `div` wrapping the label, title, and default content.
- `cta-area`: The `div` wrapping the `cta` slot.

## CSS Custom Properties

- `--card-fixed-width`: (Default: `300px`) Sets the width when `variant="fixed"`.
