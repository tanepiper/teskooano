---
aliases: [CelestialLabelComponent, celestial-label, planet-label, star-label]
tags: [renderer, threejs, labels, web-component, celestial, html, css]
type: Class
package: "@teskooano/renderer-threejs-labels"
name: CelestialLabelComponent
dependencies: ["three"]
classes: ["HTMLElement", "ShadowRoot", "HTMLSpanElement", "CSS2DObject"]
functions: []
constants: ["CELESTIAL_LABEL_TAG"]
types: []
status: active
---

# CelestialLabelComponent

A custom web component for rendering celestial body labels, displaying object names, distances, and speeds with rich styling and smooth transitions.

## 🎯 Purpose

The `CelestialLabelComponent` is a custom HTML element that provides rich, styled labels for celestial objects. It displays object names, formatted distances, and speeds with a consistent visual design that integrates seamlessly with the 3D space simulation.

## 🏗️ Architecture

### Core Components

- **Shadow DOM**: Encapsulated styling and structure
- **Attribute Observer**: Reactive updates based on data attributes
- **Performance Caching**: Prevents unnecessary DOM updates
- **Smooth Transitions**: CSS transitions for visibility changes

### Component Structure

```typescript
export class CelestialLabelComponent extends HTMLElement {
  private nameSpan!: HTMLSpanElement;
  private distanceSpan!: HTMLSpanElement;
  private speedSpan!: HTMLSpanElement;
  private lastValues = {
    name: "",
    distance: "",
    speed: "",
  };
  private isInitialized = false;
}
```

### Observed Attributes

```typescript
static get observedAttributes() {
  return [
    "data-name",
    "data-distance-formatted",
    "data-speed-formatted",
    "visible",
  ];
}
```

## 🔧 Core Methods

### Constructor

```typescript
constructor();
```

- **Shadow DOM**: Creates open shadow DOM for encapsulation
- **Initialization**: Sets up component state without rendering
- **Performance**: Defers rendering until connected to DOM

### Lifecycle Management

```typescript
connectedCallback();
```

- **Lazy Initialization**: Only initializes once when connected
- **Element Creation**: Creates internal DOM structure
- **Initial Render**: Renders with current attribute values
- **State Management**: Sets initialization flag

### Element Creation

```typescript
private createElements()
```

- **Shadow DOM**: Creates elements within shadow root
- **Styling**: Injects CSS styles for component appearance
- **Structure**: Creates spans for name, distance, and speed
- **References**: Stores element references for updates

## 🎨 Styling System

### Base Styling

```css
:host {
  position: relative;
  font-family: monospace;
  left: 50px;
  top: -20px;
  display: block;
  color: white;
  background-color: rgba(0, 0, 0, 0.5);
  padding: 2px 5px;
  border-radius: 3px;
  font-size: 0.8rem;
  font-weight: bold;
  user-select: none;
  pointer-events: none;
  opacity: 1;
  transition: opacity 0.3s ease-in-out;
}
```

### Content Styling

```css
.distance {
  font-size: 0.8rem;
  color: #ccc;
  margin-left: 8px;
}

.speed {
  font-size: 0.8rem;
  color: #aaf;
  margin-left: 8px;
}
```

### Visibility Transitions

```css
:host(:not([visible])) {
  opacity: 0;
}
```

## 🔄 Update System

### Attribute Change Handling

```typescript
attributeChangedCallback(name: string, oldValue: string, newValue: string)
```

- **Change Detection**: Only processes actual value changes
- **Initialization Check**: Skips updates before initialization
- **Attribute Routing**: Routes changes to appropriate update methods

### Update Methods

```typescript
private updateName(name: string): void
private updateDistance(distance: string): void
private updateSpeed(speed: string): void
```

### Performance Optimization

```typescript
// Only update if value has actually changed
if (this.lastValues.name !== name) {
  this.nameSpan.textContent = name;
  this.lastValues.name = name;
}
```

## 📊 Data Display

### Name Display

```typescript
private updateName(name: string) {
  if (this.lastValues.name !== name) {
    this.nameSpan.textContent = name;
    this.lastValues.name = name;
  }
}
```

### Distance Display

```typescript
private updateDistance(distance: string) {
  if (this.lastValues.distance !== distance) {
    if (distance) {
      this.distanceSpan.textContent = `⎊ ${distance}`;
      this.distanceSpan.style.display = "inline";
    } else {
      this.distanceSpan.style.display = "none";
    }
    this.lastValues.distance = distance;
  }
}
```

### Speed Display

```typescript
private updateSpeed(speed: string) {
  if (this.lastValues.speed !== speed) {
    if (speed) {
      this.speedSpan.textContent = `⟐ ${speed}`;
      this.speedSpan.style.display = "inline";
    } else {
      this.speedSpan.style.display = "none";
    }
    this.lastValues.speed = speed;
  }
}
```

## 🚀 Usage Example

```typescript
// Create celestial label element
const labelElement = document.createElement("celestial-label");

// Set attributes
labelElement.setAttribute("data-name", "Earth");
labelElement.setAttribute("data-distance-formatted", "1.5 AU");
labelElement.setAttribute("data-speed-formatted", "30.5 km/s");
labelElement.setAttribute("visible", "true");

// Add to CSS2DObject
const css2dObject = new CSS2DObject(labelElement);
scene.add(css2dObject);

// Update attributes dynamically
labelElement.setAttribute("data-distance-formatted", "1.6 AU");
labelElement.toggleAttribute("visible", false);
```

## 🎯 Performance Considerations

### Lazy Initialization

- **Deferred Rendering**: No rendering until connected to DOM
- **Single Initialization**: Component only initializes once
- **Memory Efficiency**: Minimal memory usage before initialization

### Change Detection

- **Value Comparison**: Only updates when values actually change
- **DOM Efficiency**: Minimizes unnecessary DOM manipulations
- **Caching**: Caches last values to prevent redundant updates

### Shadow DOM Benefits

- **Style Encapsulation**: Prevents style conflicts
- **Performance**: Efficient style application
- **Isolation**: Component styles don't affect other elements

## 🔍 Debug Features

### Attribute Debugging

- **Attribute Monitoring**: Track attribute changes and values
- **Update Performance**: Monitor update frequency and efficiency
- **Initialization State**: Debug component initialization process
- **Value Caching**: Inspect cached value comparisons

### Styling Debugging

- **Shadow DOM Inspection**: Examine shadow DOM structure
- **Style Application**: Debug CSS style application
- **Transition Effects**: Monitor visibility transition performance
- **Layout Issues**: Debug positioning and layout problems

## 📚 Related Components

- **[[CelestialLabelLayer]]** - Manages celestial labels with this component
- **[[BaseLabelLayer]]** - Abstract base class for label layers
- **[[Layer2DManager]]** - Manages all CSS2D layers
- **[[AuMarkerLabelComponent]]** - AU marker label component
- **[[PredictionLabel]]** - Prediction label component

## 🏛️ Architecture Patterns

- **Web Component Pattern**: Custom HTML element with shadow DOM
- **Observer Pattern**: Attribute change observation and reaction
- **Caching Pattern**: Value caching for performance optimization
- **Lifecycle Pattern**: Component lifecycle management
- **Encapsulation Pattern**: Shadow DOM for style and structure isolation
- **Performance Pattern**: Lazy initialization and change detection

---
