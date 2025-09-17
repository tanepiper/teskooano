---
aliases: [UIComponentType]
tags: [data, types, ui, components]
type: Enum
package: "@teskooano/data-types"
file: "src/ui.ts"
status: active
---

# UIComponentType

Enumeration of UI component types available in the Teskooano UI framework.

## Overview

The `UIComponentType` enum defines all available UI component types in the Teskooano engine. It provides a comprehensive set of UI building blocks for creating interactive interfaces, control panels, and user interactions.

## Enum Definition

```typescript
export enum UIComponentType {
  PANEL = "panel",
  FOLDER = "folder",
  BUTTON = "button",
  SLIDER = "slider",
  CHECKBOX = "checkbox",
  DROPDOWN = "dropdown",
  COLOR = "color",
  TEXT = "text",
  NUMBER = "number",
  LABEL = "label",
  TOOLBAR = "toolbar",
  WINDOW = "window",
}
```

## Component Types

### Layout Components

#### PANEL

```typescript
PANEL = "panel";
```

Container component for organizing related UI elements.

**Characteristics:**

- Groups related controls
- Can be collapsible
- Supports nested components
- Title bar and content area

**Usage:**

- Settings panels
- Information displays
- Control groupings

#### FOLDER

```typescript
FOLDER = "folder";
```

Collapsible container for organizing controls hierarchically.

**Characteristics:**

- Collapsible/expandable
- Hierarchical organization
- Nested folder support
- State persistence

**Usage:**

- Nested settings
- Hierarchical data
- Space-efficient organization

#### WINDOW

```typescript
WINDOW = "window";
```

Top-level window container with full window management.

**Characteristics:**

- Movable and resizable
- Title bar with controls
- Modal or modeless
- Z-index management

**Usage:**

- Dialog boxes
- Floating panels
- Modal windows

#### TOOLBAR

```typescript
TOOLBAR = "toolbar";
```

Horizontal or vertical toolbar for action buttons.

**Characteristics:**

- Button container
- Horizontal or vertical layout
- Icon and text support
- Grouping and separators

**Usage:**

- Action toolbars
- Quick access controls
- Menu bars

### Input Components

#### BUTTON

```typescript
BUTTON = "button";
```

Clickable button for triggering actions.

**Characteristics:**

- Click event handling
- Visual feedback
- Icon and text support
- State management (enabled/disabled)

**Usage:**

- Action triggers
- Form submission
- Navigation

#### SLIDER

```typescript
SLIDER = "slider";
```

Slider control for numeric value input within a range.

**Characteristics:**

- Range-based input
- Continuous or discrete values
- Visual feedback
- Value display

**Usage:**

- Numeric parameters
- Volume controls
- Progress indicators

#### CHECKBOX

```typescript
CHECKBOX = "checkbox";
```

Boolean toggle control for on/off states.

**Characteristics:**

- Boolean state
- Visual toggle feedback
- Label support
- Group behavior

**Usage:**

- Feature toggles
- Boolean options
- Multi-selection

#### DROPDOWN

```typescript
DROPDOWN = "dropdown";
```

Dropdown menu for selecting from multiple options.

**Characteristics:**

- Option list
- Single or multi-select
- Search/filter capability
- Custom option rendering

**Usage:**

- Option selection
- Enumeration values
- Category selection

#### COLOR

```typescript
COLOR = "color";
```

Color picker control for color selection.

**Characteristics:**

- Color palette
- RGB/HSV input
- Hex value display
- Alpha channel support

**Usage:**

- Color customization
- Theme selection
- Visual property editing

#### TEXT

```typescript
TEXT = "text";
```

Text input field for string values.

**Characteristics:**

- String input
- Validation support
- Placeholder text
- Multi-line support

**Usage:**

- Name input
- Description fields
- Search boxes

#### NUMBER

```typescript
NUMBER = "number";
```

Numeric input field for number values.

**Characteristics:**

- Numeric validation
- Min/max constraints
- Step increment
- Format control

**Usage:**

- Numeric parameters
- Coordinates
- Physical properties

### Display Components

#### LABEL

```typescript
LABEL = "label";
```

Text label for displaying information or labeling other components.

**Characteristics:**

- Text display
- Formatting support
- Dynamic content
- Styling options

**Usage:**

- Component labels
- Information display
- Status indicators

## Usage Examples

### Creating UI Components

```typescript
import { UIComponentType, BaseUIComponent } from "@teskooano/data-types";

// Panel for celestial object settings
const celestialPanel: BaseUIComponent = {
  id: "celestial-settings",
  type: UIComponentType.PANEL,
  parent: undefined,
  children: [],
  visible: true,
  disabled: false,
  layer: UILayer.CONTENT,
};

// Slider for controlling time scale
const timeScaleSlider: BaseUIComponent = {
  id: "time-scale-slider",
  type: UIComponentType.SLIDER,
  parent: celestialPanel,
  children: [],
  visible: true,
  disabled: false,
};

// Button for resetting simulation
const resetButton: BaseUIComponent = {
  id: "reset-button",
  type: UIComponentType.BUTTON,
  parent: celestialPanel,
  children: [],
  visible: true,
  disabled: false,
};
```

### Type-Based Component Factory

```typescript
function createUIComponent(
  type: UIComponentType,
  config: any,
): BaseUIComponent {
  const baseComponent = {
    id: config.id || generateId(),
    type,
    parent: config.parent,
    children: [],
    visible: config.visible ?? true,
    disabled: config.disabled ?? false,
    layer: config.layer ?? UILayer.CONTENT,
  };

  switch (type) {
    case UIComponentType.PANEL:
      return createPanel(baseComponent, config);
    case UIComponentType.BUTTON:
      return createButton(baseComponent, config);
    case UIComponentType.SLIDER:
      return createSlider(baseComponent, config);
    case UIComponentType.CHECKBOX:
      return createCheckbox(baseComponent, config);
    case UIComponentType.DROPDOWN:
      return createDropdown(baseComponent, config);
    case UIComponentType.COLOR:
      return createColorPicker(baseComponent, config);
    case UIComponentType.TEXT:
      return createTextInput(baseComponent, config);
    case UIComponentType.NUMBER:
      return createNumberInput(baseComponent, config);
    case UIComponentType.LABEL:
      return createLabel(baseComponent, config);
    default:
      return baseComponent;
  }
}
```

### Component Type Filtering

```typescript
function filterComponentsByType(
  components: BaseUIComponent[],
  type: UIComponentType,
): BaseUIComponent[] {
  return components.filter((component) => component.type === type);
}

function getInputComponents(components: BaseUIComponent[]): BaseUIComponent[] {
  const inputTypes = [
    UIComponentType.BUTTON,
    UIComponentType.SLIDER,
    UIComponentType.CHECKBOX,
    UIComponentType.DROPDOWN,
    UIComponentType.COLOR,
    UIComponentType.TEXT,
    UIComponentType.NUMBER,
  ];
  return components.filter((component) => inputTypes.includes(component.type));
}

function getLayoutComponents(components: BaseUIComponent[]): BaseUIComponent[] {
  const layoutTypes = [
    UIComponentType.PANEL,
    UIComponentType.FOLDER,
    UIComponentType.WINDOW,
    UIComponentType.TOOLBAR,
  ];
  return components.filter((component) => layoutTypes.includes(component.type));
}
```

## Component Hierarchy

### Container Components

- **WINDOW** - Top-level containers
- **PANEL** - Mid-level containers
- **FOLDER** - Collapsible containers
- **TOOLBAR** - Action containers

### Control Components

- **BUTTON** - Action triggers
- **SLIDER** - Range inputs
- **CHECKBOX** - Boolean inputs
- **DROPDOWN** - Selection inputs
- **COLOR** - Color inputs
- **TEXT** - String inputs
- **NUMBER** - Numeric inputs

### Display Components

- **LABEL** - Text display

## Integration Points

### Component Creation

- Type determines component factory selection
- Enables polymorphic component creation
- Supports type-safe component hierarchies

### Event Handling

- Type-specific event handling
- Component behavior determination
- Interaction pattern selection

### Styling System

- Type-based styling rules
- Theme application
- Visual consistency

### State Management

- Type-specific state structures
- Validation rules
- Persistence strategies

## 🔗 Related

- [[BaseUIComponent]] - Base UI component interface
- [[UILayer]] - UI layer enumeration
- [[UIEventType]] - UI event types
- [[BaseController]] - Controller interface for input components
- [[@teskooano/app-ui-plugin]] - UI plugin system
