# Core Select Component (`<teskooano-select>`)

A custom select dropdown component.

## Usage

```html
<teskooano-select label="Choose Option">
  <option value="1">Option 1</option>
  <option value="2" selected>Option 2</option>
  <option value="3">Option 3</option>
</teskooano-select>
```

## Attributes

- `label`: (Optional) Text label displayed above the select.
- `value`: The currently selected value (read-only, reflects the chosen `<option>`).
- `disabled`: (Optional) Standard boolean attribute to disable the select.

## Slots

- `(default)`: Standard HTML `<option>` elements.

## Events

- `change`: Fired when the selected value changes. The event `detail` contains the new `value`.
