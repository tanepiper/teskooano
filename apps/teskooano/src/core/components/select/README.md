# Core Select Component (`<teskooano-select>`)

A custom select dropdown component that wraps a native `<select>` element, providing styling, a label, help text, and accessibility enhancements. It seamlessly integrates with declaratively provided `<option>` elements.

## Usage

```html
<teskooano-select
  label="Choose Destination"
  help-text="Select from the list of available planets."
>
  <option value="earth">Earth</option>
  <option value="mars" selected>Mars</option>
  <option value="jupiter" disabled>Jupiter (Out of range)</option>
</teskooano-select>

<!-- You can also provide the label via a slot -->
<teskooano-select>
  <span slot="label">Assign Pilot</span>
  <option value="1">Ripley</option>
  <option value="2">Hicks</option>
</teskooano-select>
```

## Attributes

- `label`: The text label displayed above the select input. This is ignored if the `label` slot is used.
- `value`: Gets or sets the currently selected value. It reflects the chosen `<option>`'s value.
- `disabled`: Standard boolean attribute to disable the select.
- `help-text`: Optional text displayed below the select to provide guidance or additional information.

## Slots

- `(default)`: The content of the select, intended for standard HTML `<option>` elements.
- `label`: A slot to provide a custom element or rich text for the label.

## Events

- `select-change`: Fired when the selected value changes. The event `detail` object contains the new value: `{ value: string }`.
