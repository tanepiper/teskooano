# Core Slider Component (`<teskooano-slider>`)

A range input slider component.

## Usage

```html
<teskooano-slider
  label="Adjust Value"
  min="0"
  max="100"
  value="50"
  step="1"
></teskooano-slider>
```

## Attributes

- `label`: (Optional) Text label displayed above the slider.
- `min`: Minimum value (default: 0).
- `max`: Maximum value (default: 100).
- `step`: Step increment (default: 1).
- `value`: Current value (default: 0 or min).
- `disabled`: (Optional) Standard boolean attribute to disable the slider.

## Events

- `input`: Fired continuously while the slider handle is being dragged. The event `detail` contains the current `value`.
- `change`: Fired when the slider value is committed (e.g., on mouse up). The event `detail` contains the final `value`.
