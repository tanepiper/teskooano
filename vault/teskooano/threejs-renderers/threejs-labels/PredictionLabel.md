---
aliases: [PredictionLabel, prediction-label, trajectory-label, time-marker]
tags:
  [
    renderer,
    threejs,
    labels,
    web-component,
    predictions,
    trajectory,
    time,
    html,
    css,
  ]
type: component
package: "@teskooano/renderer-threejs-labels"
component: PredictionLabel
dependencies: ["three"]
classes: ["HTMLElement", "ShadowRoot", "HTMLSpanElement", "CSS2DObject"]
functions: ["setText", "setTimeCategory"]
constants: ["PREDICTION_LABEL_TAG"]
types: []
status: active
---

# PredictionLabel

A custom web component for rendering trajectory prediction labels, displaying time-based markers with color-coded styling based on prediction time distance.

## 🎯 Purpose

The `PredictionLabel` is a custom HTML element that provides styled labels for trajectory predictions. It displays time-based markers with color-coded styling that indicates the time distance of predictions (short-term, medium-term, long-term), helping users understand the temporal context of trajectory predictions.

## 🏗️ Architecture

### Core Components

- **Shadow DOM**: Encapsulated styling and structure
- **Time Category System**: Color-coded styling based on time distance
- **Dynamic Styling**: CSS custom properties for time-based appearance
- **Smooth Transitions**: CSS transitions for style changes

### Component Structure

```typescript
export class PredictionLabel extends HTMLElement {
  private shadow: ShadowRoot;
  private textSpan: HTMLSpanElement;
}
```

### Time Categories

- **Short-term**: < 1 day (green styling)
- **Medium-term**: 1 day to 90 days (yellow styling)
- **Long-term**: > 90 days (red styling)

## 🔧 Core Methods

### Constructor

```typescript
constructor();
```

- **Shadow DOM**: Creates open shadow DOM for encapsulation
- **Style Injection**: Injects CSS styles for time-based appearance
- **Element Creation**: Creates text span for content display
- **Structure Setup**: Sets up component structure

### Content Management

```typescript
setText(text: string): void
```

- **Text Content**: Sets the display text for the prediction label
- **Dynamic Updates**: Updates text content dynamically
- **Performance**: Direct text content assignment

### Time Category Management

```typescript
setTimeCategory(timeInSeconds: number): void
```

- **Time Analysis**: Analyzes time distance and assigns category
- **Style Application**: Applies appropriate CSS styling
- **Category Assignment**: Sets data attribute for CSS targeting

## 🎨 Styling System

### Base Styling

```css
:host {
  display: block;
  position: relative;
  top: -1rem;
  padding: 0.25rem 0.5rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-family: sans-serif;
  white-space: nowrap;
  pointer-events: none;
  user-select: none;
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease,
    color 0.3s ease;
  border: 1px solid #000000;
  opacity: 0.5;
}
```

### Time Category Styling

#### Short-term Predictions (Green)

```css
:host([data-time-category="short"]) {
  background-color: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.8);
  color: rgba(204, 235, 206, 1);
}
```

#### Medium-term Predictions (Yellow)

```css
:host([data-time-category="medium"]) {
  background-color: rgba(255, 235, 59, 0.2);
  border-color: rgba(255, 235, 59, 0.8);
  color: rgba(255, 249, 196, 1);
}
```

#### Long-term Predictions (Red)

```css
:host([data-time-category="long"]) {
  background-color: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.8);
  color: rgba(251, 204, 201, 1);
}
```

### Design Features

- **Rounded Corners**: Border radius for modern appearance
- **Transparency**: Semi-transparent backgrounds for subtle effect
- **Color Coding**: Intuitive color scheme for time categories
- **Smooth Transitions**: CSS transitions for style changes
- **Positioning**: Offset positioning for better visibility

## 🔄 Time Category System

### Category Assignment Logic

```typescript
setTimeCategory(timeInSeconds: number) {
  const ONE_DAY = 86400;
  const NINETY_DAYS = ONE_DAY * 90;

  if (timeInSeconds < ONE_DAY) {
    this.dataset.timeCategory = "short";
  } else if (timeInSeconds < NINETY_DAYS) {
    this.dataset.timeCategory = "medium";
  } else {
    this.dataset.timeCategory = "long";
  }
}
```

### Time Thresholds

- **Short-term**: 0 to 86,400 seconds (0 to 1 day)
- **Medium-term**: 86,400 to 7,776,000 seconds (1 day to 90 days)
- **Long-term**: 7,776,000+ seconds (90+ days)

### Visual Indicators

- **Green**: Immediate predictions (hours, minutes)
- **Yellow**: Near-term predictions (days, weeks, months)
- **Red**: Long-term predictions (months, years)

## 🚀 Usage Example

```typescript
// Create prediction label element
const labelElement = document.createElement("prediction-label");

// Set text content
labelElement.setText("1 hour");

// Set time category (automatically applies styling)
labelElement.setTimeCategory(3600); // 1 hour in seconds

// Add to CSS2DObject
const css2dObject = new CSS2DObject(labelElement);
scene.add(css2dObject);

// Update dynamically
labelElement.setText("1 day");
labelElement.setTimeCategory(86400); // 1 day in seconds
```

## 🎯 Performance Considerations

### Shadow DOM Benefits

- **Style Encapsulation**: Prevents style conflicts
- **Performance**: Efficient style application
- **Isolation**: Component styles don't affect other elements

### CSS Transitions

- **Hardware Acceleration**: GPU-accelerated transitions
- **Smooth Changes**: Gradual style transitions for better UX
- **Performance**: Efficient transition handling

### Memory Management

- **Minimal DOM**: Simple structure with single text span
- **Efficient Updates**: Direct text content assignment
- **No Caching**: Simple component without complex state

## 🔍 Debug Features

### Time Category Debugging

- **Category Assignment**: Debug time category assignment logic
- **Style Application**: Monitor CSS style application
- **Threshold Testing**: Test different time thresholds
- **Visual Verification**: Verify color coding effectiveness

### Styling Debugging

- **Shadow DOM Inspection**: Examine shadow DOM structure
- **Style Application**: Debug CSS style application
- **Transition Effects**: Monitor transition performance
- **Layout Issues**: Debug positioning and layout problems

## 📚 Related Components

- **[[PredictionLabelLayer]]** - Manages prediction labels with this component
- **[[BaseLabelLayer]]** - Abstract base class for label layers
- **[[Layer2DManager]]** - Manages all CSS2D layers
- **[[CelestialLabelComponent]]** - Celestial body label component
- **[[AuMarkerLabelComponent]]** - AU marker label component

## 🏛️ Architecture Patterns

- **Web Component Pattern**: Custom HTML element with shadow DOM
- **Category Pattern**: Time-based categorization system
- **Style Pattern**: CSS-based styling with data attributes
- **Transition Pattern**: Smooth style transitions
- **Encapsulation Pattern**: Shadow DOM for style and structure isolation
- **Performance Pattern**: Simple and efficient component design

---
