# Core Output Components (`<teskooano-output-display>` & `<teskooano-labeled-value>`)

Provides components for displaying formatted output and simple label-value pairs.

## `teskooano-output-display`

A component for displaying read-only text, such as code snippets or formatted data, with an optional copy button.

### Usage

The content can be set either by populating the default slot or by setting the `value` attribute/property.

```html
<!-- Using the value attribute -->
<teskooano-output-display
  value="This is some text from an attribute."
  copy-enabled
></teskooano-output-display>

<!-- With monospace font for code -->
<teskooano-output-display monospace copy-enabled>
  { "key": "value", "isJSON": true }
</teskooano-output-display>
```

### Attributes

- `value`: The text content to display.
- `monospace`: Boolean attribute to apply a monospace font, ideal for code.
- `copy-enabled`: Boolean attribute to show a "Copy" button.

### Properties & Methods

- `.value` (string): Gets or sets the text content.
- `.copyToClipboard()` (Promise<boolean>): Programmatically copies the content to the clipboard.
- `.clear()`: Clears the content of the display.

## `teskooano-labeled-value`

Displays a simple, neatly aligned label and its corresponding value.

### Usage

```html
<!-- Using attributes -->
<teskooano-labeled-value
  label="Object Name"
  value="Planet X"
></teskooano-labeled-value>

<!-- Using slots -->
<teskooano-labeled-value>
  <span slot="label">Velocity</span>
  <span>15.3 km/s</span>
</teskooano-labeled-value>
```

### Attributes

- `label`: The text for the label portion.
- `value`: The text for the value portion.

### Slots

- `label`: Used to provide a node for the label. Overrides the `label` attribute.
- `(default)`: Used to provide a node for the value. Overrides the `value` attribute.
