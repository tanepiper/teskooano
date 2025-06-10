# Core Slider Component (`<teskooano-slider>`)

A highly configurable range input slider component built with RxJS for robust state management. It can include a label, help text, and an optional numeric input for precise value entry.

## Usage

```html
<!-- Basic Slider -->
<teskooano-slider
  label="Adjust Speed"
  min="0"
  max="100"
  value="50"
  step="1"
></teskooano-slider>

<!-- Slider with editable number input and help text -->
<teskooano-slider
  label="Engine Power"
  min="10"
  max="110"
  value="95"
  step="0.5"
  editable-value
  help-text="Power output in gigawatts."
></teskooano-slider>
```

## Attributes

- `label`: Text label displayed above the slider. Can also be provided via a `label` slot.
- `min`: The minimum value of the slider (default: 0).
- `max`: The maximum value of the slider (default: 100).
- `step`: The step increment (default: 1).
- `value`: The current numeric value of the slider.
- `disabled`: Boolean attribute to disable the slider.
- `help-text`: Optional text displayed below the slider for guidance.
- `editable-value`: Boolean attribute. When present, it replaces the static value display with a numeric `<input>` field, allowing for direct text entry.

## Slots

- `label`: A slot to provide a custom element or rich text for the label. Overrides the `label` attribute.

## Events

The component fires a single custom event:

- `slider-change`: Fired when the value is committed. This happens immediately when the slider thumb is moved, and after a short debounce period when typing into the editable number input. The event `detail` object contains the new value: `{ value: number }`.
