# Core Card Component (`<teskooano-card>`)

A container component with optional header and footer slots, used for grouping related content.

## Usage

```html
<teskooano-card>
  <span slot="header">Card Title</span>
  <p>This is the main content of the card.</p>
  <span slot="footer">Footer Information</span>
</teskooano-card>
```

## Slots

- `header`: (Optional) Content to display in the card's header section.
- `(default)`: The main content of the card.
- `footer`: (Optional) Content to display in the card's footer section.
