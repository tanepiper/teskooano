---
aliases: [Web Component Pattern, web-components, custom-elements, shadow-dom]
tags: [architecture, pattern, web-components, html, css, ui, labels]
type: pattern
status: active
---

# Web Component Pattern

The Web Component Pattern is extensively used in the Teskooano renderer system to create reusable, encapsulated UI components that integrate seamlessly with the CSS2D rendering system and provide rich, interactive user interfaces.

## 🎯 Purpose

The Web Component Pattern provides:

- **Encapsulation**: Isolated styling and behavior through Shadow DOM
- **Reusability**: Custom elements that can be used throughout the application
- **Integration**: Seamless integration with Three.js CSS2D rendering
- **Performance**: Efficient DOM updates with attribute-based reactivity
- **Maintainability**: Clear separation of concerns and modular design

## 🏗️ Pattern Structure

### Core Components

**Custom Element Class**
A class that extends HTMLElement to create a custom HTML element.

**Key Characteristics:**

- **Shadow DOM**: Encapsulated styling and structure
- **Attribute Observer**: Reactive updates based on data attributes
- **Lifecycle Management**: Proper initialization and cleanup
- **Performance Optimization**: Efficient updates and caching

**Shadow DOM**
Encapsulated DOM tree that provides style isolation.

**Key Features:**

- **Style Encapsulation**: Prevents style conflicts with other components
- **Structure Isolation**: Isolated internal structure
- **Performance**: Efficient style application
- **Security**: Prevents external manipulation

**Attribute Observer**
System for reacting to attribute changes.

**Key Features:**

- **Reactive Updates**: Automatic updates when attributes change
- **Change Detection**: Only updates when values actually change
- **Performance Caching**: Caches values to prevent redundant updates
- **Type Safety**: TypeScript integration for attribute types

## 📦 Web Component Examples

### CelestialLabelComponent

A custom element for rendering celestial body labels with rich information display.

**Component Structure:**

```typescript
export class CelestialLabelComponent extends HTMLElement {
  static get observedAttributes() {
    return [
      "data-name",
      "data-distance-formatted",
      "data-speed-formatted",
      "visible",
    ];
  }

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

**Shadow DOM Structure:**

```typescript
private createElements() {
  if (!this.shadowRoot) return;

  this.shadowRoot.innerHTML = `
    <style>
      :host {
        position: relative;
        font-family: monospace;
        left: 50px;
        top: -20px;
        display: block;
        color: white;
        background-color: rgba(0,0,0,0.5);
        padding: 2px 5px;
        border-radius: 3px;
        font-size: 0.8rem;
        font-weight: bold;
        user-select: none;
        pointer-events: none;
        opacity: 1;
        transition: opacity 0.3s ease-in-out;
      }

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

      :host(:not([visible])) {
        opacity: 0;
      }
    </style>
    <span class="name"></span>
    <span class="distance"></span>
    <br />
    <span class="speed"></span>
  `;

  this.nameSpan = this.shadowRoot.querySelector(".name") as HTMLSpanElement;
  this.distanceSpan = this.shadowRoot.querySelector(".distance") as HTMLSpanElement;
  this.speedSpan = this.shadowRoot.querySelector(".speed") as HTMLSpanElement;
}
```

**Attribute Change Handling:**

```typescript
attributeChangedCallback(name: string, oldValue: string, newValue: string) {
  if (oldValue === newValue) return; // Skip if no change
  if (!this.isInitialized) return; // Skip if not yet initialized

  switch (name) {
    case "data-name":
      this.updateName(newValue || "Unknown");
      break;
    case "data-distance-formatted":
      this.updateDistance(newValue || "");
      break;
    case "data-speed-formatted":
      this.updateSpeed(newValue || "");
      break;
  }
}
```

**Performance Optimization:**

```typescript
private updateName(name: string) {
  if (this.lastValues.name !== name) {
    this.nameSpan.textContent = name;
    this.lastValues.name = name;
  }
}

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

### AuMarkerLabelComponent

A custom element for AU distance markers with configurable colors.

**Component Structure:**

```typescript
export class AuMarkerLabelComponent extends HTMLElement {
  static TAG_NAME = "teskooano-au-marker";

  static get observedAttributes() {
    return ["data-au-display-value", "data-color"];
  }

  private textSpan!: HTMLSpanElement;
  private lastValues = {
    auValue: "",
    color: "",
  };
  private isInitialized = false;
}
```

**Styling System:**

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

:host(:not([visible])) {
  opacity: 0;
  pointer-events: none;
}
```

### PredictionLabel

A custom element for trajectory predictions with time-based styling.

**Component Structure:**

```typescript
export class PredictionLabel extends HTMLElement {
  private shadow: ShadowRoot;
  private textSpan: HTMLSpanElement;

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: "open" });

    const style = document.createElement("style");
    style.textContent = styles;
    this.shadow.appendChild(style);

    this.textSpan = document.createElement("span");
    this.shadow.appendChild(this.textSpan);
  }
}
```

**Time-based Styling:**

```css
:host([data-time-category="short"]) {
  background-color: rgba(76, 175, 80, 0.2);
  border-color: rgba(76, 175, 80, 0.8);
  color: rgba(204, 235, 206, 1);
}

:host([data-time-category="medium"]) {
  background-color: rgba(255, 235, 59, 0.2);
  border-color: rgba(255, 235, 59, 0.8);
  color: rgba(255, 249, 196, 1);
}

:host([data-time-category="long"]) {
  background-color: rgba(244, 67, 54, 0.2);
  border-color: rgba(244, 67, 54, 0.8);
  color: rgba(251, 204, 201, 1);
}
```

## 🔄 Integration with CSS2D System

### Component Registration

```typescript
// Layer registers required components
public override getRequiredComponents(): UIRegistryComponent[] {
  return [{
    tagName: CELESTIAL_LABEL_TAG,
    componentClass: CelestialLabelComponent,
  }];
}

// Layer2DManager automatically registers components
layer.getRequiredComponents().forEach(({ tagName, componentClass }) => {
  if (!customElements.get(tagName)) {
    customElements.define(tagName, componentClass);
  }
});
```

### Element Creation

```typescript
// Create custom element
const labelElement = document.createElement("celestial-label");

// Set attributes
labelElement.setAttribute("data-name", "Earth");
labelElement.setAttribute("data-distance-formatted", "1.5 AU");
labelElement.setAttribute("data-speed-formatted", "30.5 km/s");

// Create CSS2DObject
const css2dObject = new CSS2DObject(labelElement);
scene.add(css2dObject);
```

### Dynamic Updates

```typescript
// Update attributes dynamically
labelElement.setAttribute("data-distance-formatted", "1.6 AU");
labelElement.toggleAttribute("visible", false);
```

## 🎨 Pattern Benefits

### Encapsulation

- **Style Isolation**: Shadow DOM prevents style conflicts
- **Structure Isolation**: Internal structure is hidden from external code
- **Behavior Isolation**: Component behavior is self-contained
- **Security**: Prevents external manipulation of component internals

### Reusability

- **Custom Elements**: Can be used anywhere in the application
- **Consistent Interface**: Standardized attribute-based API
- **Composition**: Components can be composed together
- **Extensibility**: Easy to extend with new features

### Performance

- **Efficient Updates**: Only updates when attributes change
- **Caching**: Caches values to prevent redundant updates
- **Lazy Initialization**: Components initialize only when needed
- **Memory Management**: Proper cleanup and disposal

### Maintainability

- **Clear Separation**: Each component has a single responsibility
- **Modular Design**: Components can be developed independently
- **Type Safety**: TypeScript integration for better development experience
- **Testing**: Components can be tested in isolation

## 🚀 Implementation Guidelines

### Component Structure

```typescript
export class CustomComponent extends HTMLElement {
  // Static properties
  static get observedAttributes() {
    return ["data-value", "data-color", "visible"];
  }

  // Private properties
  private elements = {
    container: null as HTMLElement | null,
    text: null as HTMLSpanElement | null,
  };
  private lastValues = {
    value: "",
    color: "",
    visible: true,
  };
  private isInitialized = false;

  // Lifecycle methods
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    if (!this.isInitialized) {
      this.createElements();
      this.render();
      this.isInitialized = true;
    }
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue === newValue || !this.isInitialized) return;

    switch (name) {
      case "data-value":
        this.updateValue(newValue);
        break;
      case "data-color":
        this.updateColor(newValue);
        break;
      case "visible":
        this.updateVisibility(newValue !== null);
        break;
    }
  }

  // Private methods
  private createElements() {
    if (!this.shadowRoot) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          /* Component styles */
        }
      </style>
      <div class="container">
        <span class="text"></span>
      </div>
    `;

    this.elements.container = this.shadowRoot.querySelector(
      ".container",
    ) as HTMLElement;
    this.elements.text = this.shadowRoot.querySelector(
      ".text",
    ) as HTMLSpanElement;
  }

  private render() {
    // Initialize with current attribute values
    const value = this.getAttribute("data-value") || "";
    const color = this.getAttribute("data-color") || "#000";
    const visible = this.hasAttribute("visible");

    this.updateValue(value);
    this.updateColor(color);
    this.updateVisibility(visible);
  }

  private updateValue(value: string) {
    if (this.lastValues.value !== value) {
      this.elements.text!.textContent = value;
      this.lastValues.value = value;
    }
  }

  private updateColor(color: string) {
    if (this.lastValues.color !== color) {
      this.elements.container!.style.color = color;
      this.lastValues.color = color;
    }
  }

  private updateVisibility(visible: boolean) {
    if (this.lastValues.visible !== visible) {
      this.elements.container!.style.display = visible ? "block" : "none";
      this.lastValues.visible = visible;
    }
  }
}
```

### Component Factory

```typescript
class ComponentFactory {
  static createLabelComponent(
    type: "celestial" | "au-marker" | "prediction",
  ): HTMLElement {
    switch (type) {
      case "celestial":
        return document.createElement("celestial-label");
      case "au-marker":
        return document.createElement("teskooano-au-marker");
      case "prediction":
        return document.createElement("prediction-label");
      default:
        throw new Error(`Unknown component type: ${type}`);
    }
  }
}
```

### Component Registry

```typescript
class ComponentRegistry {
  private static components = new Map<string, CustomElementConstructor>();

  static register(
    name: string,
    componentClass: CustomElementConstructor,
  ): void {
    if (this.components.has(name)) {
      console.warn(`Component ${name} already registered. Overwriting.`);
    }

    this.components.set(name, componentClass);
    customElements.define(name, componentClass);
  }

  static get(name: string): CustomElementConstructor | undefined {
    return this.components.get(name);
  }

  static create(name: string): HTMLElement | null {
    const ComponentClass = this.get(name);
    if (!ComponentClass) {
      console.error(`Component ${name} not found`);
      return null;
    }

    return new ComponentClass();
  }
}
```

## 🔗 Related Patterns

- **[[Layer Pattern]]**: Web components are used within specialized layers
- **[[Observer Pattern]]**: Attribute observers react to changes
- **[[Factory Pattern]]**: Component factories for creating elements
- **[[Registry Pattern]]**: Component registries for management
- **[[Template Method Pattern]]**: Base component classes define structure

## 🎯 Performance Considerations

### Component Optimization

- **Lazy Initialization**: Initialize components only when needed
- **Change Detection**: Only update when values actually change
- **Caching**: Cache values to prevent redundant updates
- **Memory Management**: Proper cleanup of event listeners and references

### Shadow DOM Performance

- **Style Encapsulation**: Efficient style application
- **DOM Isolation**: Prevents external style interference
- **Rendering Optimization**: Optimized rendering within shadow DOM
- **Memory Efficiency**: Minimal memory overhead

### Update Performance

- **Attribute-based Updates**: Efficient attribute change detection
- **Batch Updates**: Group related updates together
- **Throttling**: Throttle frequent updates for performance
- **Debouncing**: Debounce rapid attribute changes

---

_The Web Component Pattern provides the foundation for creating rich, interactive UI components that integrate seamlessly with the Teskooano renderer system._
