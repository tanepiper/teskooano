---
aliases: [AuMarkerLabelComponent, au-marker-label, distance-label, au-label]
tags:
  [renderer, threejs, labels, web-component, au-markers, distance, html, css]
type: Class
package: "@teskooano/renderer-threejs-labels"
name: AuMarkerLabelComponent
dependencies: ["three"]
classes: ["HTMLElement", "ShadowRoot", "HTMLSpanElement", "CSS2DObject"]
functions: []
constants: ["TAG_NAME"]
types: []
status: active
---

# AuMarkerLabelComponent

A custom web component for rendering AU (Astronomical Unit) distance marker labels, displaying distance values with configurable colors and smooth transitions.

## 🎯 Purpose

The `AuMarkerLabelComponent` is a custom HTML element that provides styled labels for AU distance markers. It displays distance values in AU units with configurable colors and a consistent visual design that integrates with the distance marker system.

## 🏗️ Architecture

### Core Components

- **Shadow DOM**: Encapsulated styling and structure
- **Attribute Observer**: Reactive updates based on data attributes
- **Performance Caching**: Prevents unnecessary DOM updates
- **Color Configuration**: Dynamic color application

### Component Structure

```typescript
export class AuMarkerLabelComponent extends HTMLElement {
  static TAG_NAME = "teskooano-au-marker";

  private textSpan!: HTMLSpanElement;
  private lastValues = {
    auValue: "",
    color: "",
  };
  private isInitialized = false;
}
```

### Observed Attributes

```typescript
static get observedAttributes() {
  return ["data-au-display-value", "data-color"];
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
- **Structure**: Creates span for AU value display
- **References**: Stores element references for updates

## 🎨 Styling System

### Base Styling

```css
:host {
  display: block;
  color: #ffa500;
  background-color: #444;
  border: 1px solid #000;
  opacity: 0.5;
  padding: 2px 5px;
  border-radius: 1rem;
  font-size: 0.6rem;
  user-select: none;
  transition: opacity 0.3s ease-in-out;
}
```

### Visibility Transitions

```css
:host(:not([visible])) {
  opacity: 0;
  pointer-events: none;
}
```

### Design Features

- **Rounded Corners**: Border radius for modern appearance
- **Transparency**: Semi-transparent background for subtle effect
- **Border**: Dark border for definition
- **Small Font**: Compact font size for distance markers
- **Smooth Transitions**: Opacity transitions for visibility changes

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
private updateAuValue(auValue: string): void
private updateColor(color: string): void
```

### Performance Optimization

```typescript
// Only update if value has actually changed
if (this.lastValues.auValue !== auValue) {
  this.textSpan.textContent = `${auValue} AU`;
  this.lastValues.auValue = auValue;
}
```

## 📊 Data Display

### AU Value Display

```typescript
private updateAuValue(auValue: string) {
  if (this.lastValues.auValue !== auValue) {
    this.textSpan.textContent = `${auValue} AU`;
    this.lastValues.auValue = auValue;
  }
}
```

### Color Configuration

```typescript
private updateColor(color: string) {
  if (this.lastValues.color !== color) {
    this.style.color = color;
    this.lastValues.color = color;
  }
}
```

### Display Format

- **Value + Unit**: Displays as "1 AU", "10 AU", "100 AU", etc.
- **Dynamic Color**: Color applied to text based on configuration
- **Consistent Format**: Always includes "AU" unit suffix

## 🚀 Usage Example

```typescript
// Create AU marker label element
const labelElement = document.createElement("teskooano-au-marker");

// Set attributes
labelElement.setAttribute("data-au-display-value", "1");
labelElement.setAttribute("data-color", "#00ff00");
labelElement.setAttribute("visible", "true");

// Add to CSS2DObject
const css2dObject = new CSS2DObject(labelElement);
scene.add(css2dObject);

// Update attributes dynamically
labelElement.setAttribute("data-au-display-value", "10");
labelElement.setAttribute("data-color", "#FFA500");
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
- **Color Changes**: Monitor color application and transitions
- **Layout Issues**: Debug positioning and layout problems

## 📚 Related Components

- **[[AuMarkerLabelLayer]]** - Manages AU marker labels with this component
- **[[AuMarkerManager]]** - Manages AU distance rings and groups
- **[[BaseLabelLayer]]** - Abstract base class for label layers
- **[[Layer2DManager]]** - Manages all CSS2D layers
- **[[CelestialLabelComponent]]** - Celestial body label component

## 🏛️ Architecture Patterns

- **Web Component Pattern**: Custom HTML element with shadow DOM
- **Observer Pattern**: Attribute change observation and reaction
- **Caching Pattern**: Value caching for performance optimization
- **Lifecycle Pattern**: Component lifecycle management
- **Encapsulation Pattern**: Shadow DOM for style and structure isolation
- **Performance Pattern**: Lazy initialization and change detection

---
