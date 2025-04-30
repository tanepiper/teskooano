# Core Output Components (`<teskooano-output-display>` & `<teskooano-labeled-value>`)

Provides components for displaying formatted output and simple label-value pairs.

## Usage

### Output Display (`<teskooano-output-display>`)

Displays structured data (like JSON) in a formatted, readable way. Usually populated programmatically.

```html
<teskooano-output-display></teskooano-output-display>
```

```typescript
const outputElement = document.querySelector("teskooano-output-display");
outputElement.displayData({
  name: "Example",
  value: 123,
  nested: { active: true },
});
```

### Labeled Value (`<teskooano-labeled-value>`)

Displays a simple label and its corresponding value.

```html
<teskooano-labeled-value
  label="Object Name"
  value="Planet X"
></teskooano-labeled-value>
<teskooano-labeled-value
  label="Velocity"
  value="15.3 km/s"
></teskooano-labeled-value>
```

## `<teskooano-output-display>` Methods

- `displayData(data: any)`: Sets the data to be displayed.
- `clear()`: Clears the displayed data.

## `<teskooano-labeled-value>` Attributes

- `label`: The text label.
- `value`: The value to display.
