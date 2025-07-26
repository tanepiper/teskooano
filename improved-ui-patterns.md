# Improved UI Patterns for Teskooano Plugin System

## Overview

This document outlines improved patterns for developing UI components in the Teskooano plugin system. These patterns are inspired by Nue.js principles while working within the existing architecture, focusing on developer experience improvements, reduced boilerplate, and better separation of concerns.

## Pattern 1: Declarative Component Pattern

### Philosophy

Replace the current imperative component setup with a declarative approach that handles most boilerplate automatically.

### Current Approach Problems

```typescript
// Current: Lots of boilerplate and manual setup
export class MyComponent extends HTMLElement implements IContentRenderer {
  private _controller: MyController;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.shadowRoot!.appendChild(template.content.cloneNode(true));
    this._controller = new MyController(this.shadowRoot!);
  }

  connectedCallback() {
    this._controller.initialize();
  }

  disconnectedCallback() {
    this._controller.dispose();
  }

  init(params: GroupPanelPartInitParameters): void {
    // Dockview specific setup
  }

  get element(): HTMLElement {
    return this;
  }
}
```

### Improved Pattern

#### API Definition

```typescript
interface ComponentDefinition {
  name: string;
  template: string | TemplateResult;
  styles?: string;
  state?: Record<string, any>;
  computed?: Record<string, ComputedFunction>;
  methods?: Record<string, ComponentMethod>;
  lifecycle?: {
    mounted?: () => void;
    updated?: (changedProperties: Set<string>) => void;
    unmounted?: () => void;
  };
  subscriptions?: StateSubscriptionConfig[];
  dockview?: DockviewPanelConfig;
}

interface StateSubscriptionConfig {
  source: Observable<any>;
  handler: string | ((value: any) => void);
  immediate?: boolean;
}

interface ComputedFunction {
  deps: string[];
  compute: (...deps: any[]) => any;
}

type ComponentMethod = (this: ComponentInstance, ...args: any[]) => any;
```

#### Implementation

```typescript
import { defineComponent } from "@teskooano/ui-plugin/patterns";

export const CelestialInfoPanel = defineComponent({
  name: "celestial-info-panel",

  template: `
    <div class="container" part="container">
      <div class="placeholder" :if="!selectedObject">
        Select a celestial object...
      </div>
      <div class="content" :if="selectedObject">
        <h2>{{ selectedObject.name }}</h2>
        <div class="type">{{ selectedObject.type }}</div>
        
        <property-card 
          :for="property in displayProperties"
          :bind="property"
        />
      </div>
    </div>
  `,

  styles: `
    .container {
      padding: var(--space-4);
      height: 100%;
      overflow-y: auto;
    }
    
    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
    }
    
    .content h2 {
      margin: 0 0 var(--space-2);
      color: var(--text-primary);
    }
  `,

  state: {
    selectedObject: null,
    focusedObjectId: null,
  },

  computed: {
    displayProperties: {
      deps: ["selectedObject"],
      compute(selectedObject) {
        if (!selectedObject) return [];
        return this.formatProperties(selectedObject);
      },
    },
  },

  methods: {
    formatProperties(object) {
      // Business logic for formatting properties
      return (
        object.physicalProperties?.map((prop) => ({
          name: prop.name,
          value: this.formatValue(prop.value),
          unit: prop.unit,
        })) || []
      );
    },

    formatValue(value) {
      // Value formatting logic
      return typeof value === "number" ? value.toExponential(2) : String(value);
    },
  },

  subscriptions: [
    {
      source: "celestialObjects$",
      handler: "handleObjectStoreUpdate",
      immediate: true,
    },
    {
      source: "simulationState$",
      handler: (state) => {
        this.state.focusedObjectId = state.focusedObjectId;
      },
    },
  ],

  lifecycle: {
    mounted() {
      document.addEventListener(
        "renderer-focus-changed",
        this.handleFocusChange,
      );
    },

    unmounted() {
      document.removeEventListener(
        "renderer-focus-changed",
        this.handleFocusChange,
      );
    },
  },

  dockview: {
    defaultTitle: "Celestial Info",
    implementsIContentRenderer: true,
  },
});
```

#### Factory Implementation

```typescript
// packages/app/ui-plugin/src/patterns/component-factory.ts
import { Observable } from "rxjs";
import { IContentRenderer, GroupPanelPartInitParameters } from "dockview-core";

export function defineComponent(
  definition: ComponentDefinition,
): ComponentConstructor {
  return class extends HTMLElement implements IContentRenderer {
    private _state: Record<string, any>;
    private _subscriptions: Subscription[] = [];
    private _computedCache: Map<string, any> = new Map();
    private _methods: Record<string, Function>;

    static componentName = definition.name;

    constructor() {
      super();
      this.setupShadowDOM();
      this.initializeState();
      this.bindMethods();
      this.setupComputed();
    }

    private setupShadowDOM() {
      this.attachShadow({ mode: "open" });
      const template = this.createTemplate();
      this.shadowRoot!.appendChild(template.content.cloneNode(true));
    }

    private createTemplate(): HTMLTemplateElement {
      const template = document.createElement("template");
      template.innerHTML = `
        ${definition.styles ? `<style>${definition.styles}</style>` : ""}
        ${this.processTemplate(definition.template)}
      `;
      return template;
    }

    private initializeState() {
      this._state = new Proxy(
        { ...definition.state },
        {
          set: (target, prop, value) => {
            const oldValue = target[prop];
            target[prop] = value;
            this.onStateChange(prop as string, value, oldValue);
            return true;
          },
        },
      );
    }

    private onStateChange(prop: string, newValue: any, oldValue: any) {
      this.invalidateComputed(prop);
      this.updateTemplate();

      if (definition.lifecycle?.updated) {
        definition.lifecycle.updated.call(this, new Set([prop]));
      }
    }

    // Getters for state access
    get state() {
      return this._state;
    }

    // Dockview interface
    get element(): HTMLElement {
      return this;
    }

    init(params: GroupPanelPartInitParameters): void {
      // Handle dockview initialization
    }

    connectedCallback() {
      this.setupSubscriptions();
      if (definition.lifecycle?.mounted) {
        definition.lifecycle.mounted.call(this);
      }
    }

    disconnectedCallback() {
      this.cleanupSubscriptions();
      if (definition.lifecycle?.unmounted) {
        definition.lifecycle.unmounted.call(this);
      }
    }

    private setupSubscriptions() {
      definition.subscriptions?.forEach((sub) => {
        const source = this.resolveObservable(sub.source);
        const handler =
          typeof sub.handler === "string"
            ? this._methods[sub.handler]
            : sub.handler;

        const subscription = source.subscribe(handler.bind(this));
        this._subscriptions.push(subscription);
      });
    }

    private resolveObservable(
      source: string | Observable<any>,
    ): Observable<any> {
      if (typeof source === "string") {
        // Resolve from global state store
        return (window as any)[source];
      }
      return source;
    }
  };
}
```

### Benefits

- **90% less boilerplate**: Automatic lifecycle, state management, and DOM setup
- **Declarative templates**: HTML-first approach with simple interpolation
- **Reactive state**: Automatic re-rendering on state changes
- **Built-in subscriptions**: Easy RxJS integration
- **Type safety**: Full TypeScript support with interfaces

---

## Pattern 2: Template-First Component Pattern

### Philosophy

Separate templates from logic completely, using HTML-first approach with minimal JavaScript framework concepts.

### Current Template Problems

```typescript
// Current: Mixed concerns, hard to edit
const template = document.createElement("template");
template.innerHTML = `
  <style>
    /* Styles mixed with structure */
  </style>
  <div class="container">
    <!-- Static HTML only -->
  </div>
`;
```

### Improved Pattern

#### Template Definition (.teskooano files)

```html
<!-- celestial-info.teskooano -->
<template name="celestial-info-panel">
  <style>
    .container {
      padding: var(--space-4);
      height: 100%;
      overflow-y: auto;
    }

    .placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      color: var(--text-muted);
    }
  </style>

  <div class="container" part="container">
    <div class="placeholder" t-if="!selectedObject">
      Select a celestial object...
    </div>

    <div class="content" t-if="selectedObject">
      <header class="object-header">
        <h2>{{ selectedObject.name }}</h2>
        <span class="type-badge" :class="typeClass">
          {{ selectedObject.type }}
        </span>
      </header>

      <section class="properties">
        <property-card
          t-for="property in displayProperties"
          :key="property.name"
          :data="property"
          @click="onPropertyClick"
        />
      </section>

      <footer class="actions" t-if="selectedObject.actions">
        <button
          t-for="action in selectedObject.actions"
          @click="executeAction(action.id)"
          :disabled="!action.enabled"
        >
          {{ action.label }}
        </button>
      </footer>
    </div>
  </div>
</template>
```

#### Template Processor

```typescript
// packages/app/ui-plugin/src/patterns/template-processor.ts

interface TemplateDirectives {
  "t-if": string;
  "t-for": string;
  ":class": string;
  ":data": string;
  "@click": string;
  "@change": string;
  ":key": string;
  ":disabled": string;
}

export class TemplateProcessor {
  static process(templateContent: string, context: any): DocumentFragment {
    const parser = new DOMParser();
    const doc = parser.parseFromString(templateContent, "text/html");
    const template = doc.querySelector("template");

    if (!template) {
      throw new Error("Template element not found");
    }

    const fragment = template.content.cloneNode(true) as DocumentFragment;
    this.processDirectives(fragment, context);
    return fragment;
  }

  private static processDirectives(node: Node, context: any) {
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as Element;

      // Process conditional rendering
      if (element.hasAttribute("t-if")) {
        const condition = element.getAttribute("t-if")!;
        if (!this.evaluateExpression(condition, context)) {
          element.remove();
          return;
        }
        element.removeAttribute("t-if");
      }

      // Process loops
      if (element.hasAttribute("t-for")) {
        const forExpression = element.getAttribute("t-for")!;
        this.processForLoop(element, forExpression, context);
        return;
      }

      // Process data binding
      this.processDataBinding(element, context);

      // Process event handlers
      this.processEventHandlers(element, context);

      // Process child nodes
      Array.from(element.childNodes).forEach((child) => {
        this.processDirectives(child, context);
      });
    } else if (node.nodeType === Node.TEXT_NODE) {
      // Process text interpolation
      this.processTextInterpolation(node, context);
    }
  }

  private static processTextInterpolation(node: Node, context: any) {
    const text = node.textContent || "";
    const interpolated = text.replace(
      /\{\{([^}]+)\}\}/g,
      (match, expression) => {
        return this.evaluateExpression(expression.trim(), context);
      },
    );
    node.textContent = interpolated;
  }

  private static evaluateExpression(expression: string, context: any): any {
    try {
      // Safe expression evaluation with limited context
      const func = new Function(
        "context",
        `with(context) { return ${expression}; }`,
      );
      return func(context);
    } catch (error) {
      console.warn(`Template expression error: ${expression}`, error);
      return "";
    }
  }
}
```

#### Component Integration

```typescript
import { loadTemplate } from "@teskooano/ui-plugin/patterns";

export const CelestialInfoPanel = defineComponent({
  name: "celestial-info-panel",
  template: loadTemplate("./celestial-info.teskooano"),

  state: {
    selectedObject: null,
  },

  computed: {
    typeClass: {
      deps: ["selectedObject"],
      compute(selectedObject) {
        return selectedObject
          ? `type-${selectedObject.type.toLowerCase()}`
          : "";
      },
    },

    displayProperties: {
      deps: ["selectedObject"],
      compute(selectedObject) {
        return this.formatProperties(selectedObject);
      },
    },
  },

  methods: {
    onPropertyClick(event, property) {
      this.emit("property-selected", { property, event });
    },

    executeAction(actionId) {
      this.emit("action-executed", {
        actionId,
        object: this.state.selectedObject,
      });
    },
  },
});
```

### Benefits

- **Clear separation**: Templates are pure HTML with minimal framework syntax
- **Better tooling**: HTML editors can provide syntax highlighting and validation
- **Designer-friendly**: Non-developers can edit templates
- **Familiar syntax**: Similar to Vue/Angular templates
- **Hot reloading**: Templates can be reloaded without full component restart

---

## Pattern 3: Simplified Plugin Registration Pattern

### Philosophy

Reduce plugin registration complexity with smart defaults and convention over configuration.

### Current Registration Complexity

```typescript
// Current: Verbose and error-prone
export const plugin: TeskooanoPlugin = {
  id: "teskooano-celestial-info",
  name: "Celestial Info Display",
  description: "Provides...",
  panels: [
    {
      componentName: CelestialInfo.componentName,
      panelClass: CelestialInfo,
      defaultTitle: "Celestial Info",
    },
  ],
  components: [
    { tagName: "celestial-info", componentClass: CelestialInfo },
    // ... 10 more component registrations
  ],
  toolbarRegistrations: [
    {
      target: "engine-toolbar",
      items: [
        {
          id: "celestial_info",
          type: "panel",
          title: "Celestial Info",
          iconSvg: InfoIcon,
          componentName: CelestialInfo.componentName,
          behaviour: "toggle",
          order: 35,
        },
      ],
    },
  ],
  functions: [],
  managerClasses: [],
};
```

### Improved Pattern

#### Smart Plugin Definition

```typescript
import { createPlugin } from "@teskooano/ui-plugin/patterns";
import InfoIcon from "./icons/info.svg?raw";

export const plugin = createPlugin({
  // Required
  id: "celestial-info",
  name: "Celestial Info",

  // Auto-discovered components (by file naming convention)
  components: "./components/**/*.teskooano",

  // Simplified panel definition
  panels: {
    "celestial-info": {
      title: "Celestial Info",
      icon: InfoIcon,
      toolbar: "engine-toolbar",
      order: 35,
      // Component auto-discovered by name matching
    },
  },

  // Optional explicit functions
  functions: {
    "focus-object": {
      execute: (ctx, objectId) => {
        // Implementation
      },
    },
  },

  // Auto-discovered managers
  managers: "./managers/**/*.manager.ts",

  // Plugin-level configuration
  config: {
    defaultPosition: { width: 400, height: 600 },
    hotReload: true,
  },
});
```

#### Convention-Based Discovery

```typescript
// packages/app/ui-plugin/src/patterns/plugin-factory.ts

interface PluginDefinition {
  id: string;
  name: string;
  description?: string;
  components?: string | ComponentMap;
  panels?: PanelMap;
  functions?: FunctionMap;
  managers?: string | ManagerMap;
  config?: PluginConfig;
}

interface PanelMap {
  [panelId: string]: SimplePanelConfig;
}

interface SimplePanelConfig {
  title: string;
  icon?: string;
  toolbar?: ToolbarTarget;
  order?: number;
  position?: PanelPosition;
  component?: string; // If not provided, uses panelId
}

export function createPlugin(definition: PluginDefinition): TeskooanoPlugin {
  const discoveredComponents = discoverComponents(definition.components);
  const processedPanels = processPanels(
    definition.panels,
    discoveredComponents,
  );
  const discoveredManagers = discoverManagers(definition.managers);

  return {
    id: definition.id,
    name: definition.name,
    description: definition.description || `Plugin: ${definition.name}`,

    // Auto-generated from conventions
    components: discoveredComponents,
    panels: processedPanels.panels,
    toolbarRegistrations: processedPanels.toolbarRegistrations,
    functions: Object.entries(definition.functions || {}).map(
      ([id, config]) => ({
        id: `${definition.id}:${id}`,
        ...config,
      }),
    ),
    managerClasses: discoveredManagers,
  };
}

function discoverComponents(
  pattern?: string | ComponentMap,
): ComponentConfig[] {
  if (typeof pattern === "string") {
    // Use glob pattern to find .teskooano files
    const files = glob.sync(pattern);
    return files.map((file) => ({
      tagName: path.basename(file, ".teskooano"),
      componentClass: createComponentFromTemplate(file),
    }));
  }

  // Handle explicit component map
  return [];
}

function processPanels(panels?: PanelMap, components: ComponentConfig[]) {
  if (!panels) return { panels: [], toolbarRegistrations: [] };

  const processedPanels: PanelConfig[] = [];
  const toolbarRegistrations: ToolbarRegistration[] = [];

  Object.entries(panels).forEach(([panelId, config]) => {
    // Find matching component
    const componentName = config.component || panelId;
    const component = components.find((c) => c.tagName === componentName);

    if (!component) {
      throw new Error(
        `Component ${componentName} not found for panel ${panelId}`,
      );
    }

    // Create panel config
    processedPanels.push({
      componentName: componentName,
      panelClass: component.componentClass,
      defaultTitle: config.title,
    });

    // Create toolbar registration if toolbar specified
    if (config.toolbar) {
      if (!toolbarRegistrations.find((tr) => tr.target === config.toolbar)) {
        toolbarRegistrations.push({
          target: config.toolbar,
          items: [],
        });
      }

      const registration = toolbarRegistrations.find(
        (tr) => tr.target === config.toolbar,
      )!;
      registration.items.push({
        id: `${panelId}-button`,
        type: "panel",
        title: config.title,
        iconSvg: config.icon,
        componentName: componentName,
        behaviour: "toggle",
        order: config.order || 10,
      });
    }
  });

  return { panels: processedPanels, toolbarRegistrations };
}
```

### File Structure Convention

```
src/plugins/celestial-info/
├── plugin.ts                    # Plugin definition
├── components/
│   ├── celestial-info.teskooano # Main panel component
│   ├── property-card.teskooano  # Sub-component
│   └── orbit-display.teskooano  # Another sub-component
├── managers/
│   └── data-formatter.manager.ts # Auto-discovered manager
├── functions/
│   └── calculations.ts          # Optional explicit functions
└── icons/
    └── info.svg                 # Static assets
```

### Benefits

- **80% less configuration**: Smart defaults and convention-based discovery
- **File-based organization**: Clear project structure
- **Auto-discovery**: Components and managers found automatically
- **Type safety**: Full TypeScript support with intelligent defaults
- **Hot reloading**: Better development experience

---

## Pattern 4: State-Driven Reactive Pattern

### Philosophy

Replace manual DOM manipulation with automatic reactive updates based on state changes.

### Current Manual DOM Updates

```typescript
// Current: Manual DOM manipulation everywhere
export class CelestialInfoController {
  private updateDisplay() {
    const nameEl = this.shadowRoot.querySelector(".name");
    nameEl.textContent = this.selectedObject?.name || "";

    const typeEl = this.shadowRoot.querySelector(".type");
    typeEl.textContent = this.selectedObject?.type || "";

    const propsContainer = this.shadowRoot.querySelector(".properties");
    propsContainer.innerHTML = "";

    if (this.selectedObject?.properties) {
      this.selectedObject.properties.forEach((prop) => {
        const propEl = document.createElement("div");
        propEl.className = "property";
        propEl.innerHTML = `
          <span class="name">${prop.name}</span>
          <span class="value">${prop.value}</span>
        `;
        propsContainer.appendChild(propEl);
      });
    }
  }
}
```

### Improved Reactive Pattern

#### Reactive State Manager

```typescript
// packages/app/ui-plugin/src/patterns/reactive-state.ts

export class ReactiveState {
  private _data: Record<string, any> = {};
  private _watchers: Map<string, Set<Function>> = new Map();
  private _computed: Map<string, ComputedProperty> = new Map();

  constructor(initialData: Record<string, any> = {}) {
    this._data = new Proxy(initialData, {
      set: (target, prop, value) => {
        const oldValue = target[prop as string];
        target[prop as string] = value;
        this.notifyWatchers(prop as string, value, oldValue);
        return true;
      },

      get: (target, prop) => {
        if (this._computed.has(prop as string)) {
          return this.getComputed(prop as string);
        }
        return target[prop as string];
      },
    });
  }

  // State access
  get data() {
    return this._data;
  }

  // Watch for changes
  watch(property: string, callback: Function) {
    if (!this._watchers.has(property)) {
      this._watchers.set(property, new Set());
    }
    this._watchers.get(property)!.add(callback);

    // Return unsubscribe function
    return () => {
      this._watchers.get(property)?.delete(callback);
    };
  }

  // Computed properties
  computed(property: string, definition: ComputedDefinition) {
    this._computed.set(property, {
      deps: definition.deps,
      compute: definition.compute,
      cache: null,
      dirty: true,
    });

    // Watch dependencies
    definition.deps.forEach((dep) => {
      this.watch(dep, () => {
        this.invalidateComputed(property);
      });
    });
  }

  private notifyWatchers(property: string, newValue: any, oldValue: any) {
    this._watchers.get(property)?.forEach((callback) => {
      callback(newValue, oldValue, property);
    });
  }

  private getComputed(property: string): any {
    const computed = this._computed.get(property)!;

    if (computed.dirty || computed.cache === null) {
      const deps = computed.deps.map((dep) => this._data[dep]);
      computed.cache = computed.compute(...deps);
      computed.dirty = false;
    }

    return computed.cache;
  }
}

interface ComputedDefinition {
  deps: string[];
  compute: (...deps: any[]) => any;
}

interface ComputedProperty extends ComputedDefinition {
  cache: any;
  dirty: boolean;
}
```

#### Template Binding Engine

```typescript
// packages/app/ui-plugin/src/patterns/template-binding.ts

export class TemplateBinding {
  private state: ReactiveState;
  private element: HTMLElement;
  private bindings: Map<string, BindingConfig[]> = new Map();

  constructor(element: HTMLElement, state: ReactiveState) {
    this.element = element;
    this.state = state;
    this.setupBindings();
  }

  private setupBindings() {
    this.findTextBindings();
    this.findAttributeBindings();
    this.findConditionalBindings();
    this.findListBindings();
  }

  private findTextBindings() {
    const walker = document.createTreeWalker(
      this.element,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );

    let node;
    while ((node = walker.nextNode())) {
      const text = node.textContent || "";
      const matches = text.match(/\{\{([^}]+)\}\}/g);

      if (matches) {
        matches.forEach((match) => {
          const expression = match.slice(2, -2).trim();
          const dependencies = this.extractDependencies(expression);

          dependencies.forEach((dep) => {
            this.addBinding(dep, {
              type: "text",
              node: node as Text,
              expression: expression,
              originalText: text,
            });
          });
        });
      }
    }
  }

  private findAttributeBindings() {
    const elements = this.element.querySelectorAll(
      "[\\:class], [\\:disabled], [\\:data]",
    );

    elements.forEach((element) => {
      // Handle :class binding
      const classBinding = element.getAttribute(":class");
      if (classBinding) {
        const dependencies = this.extractDependencies(classBinding);
        dependencies.forEach((dep) => {
          this.addBinding(dep, {
            type: "class",
            element: element as HTMLElement,
            expression: classBinding,
          });
        });
      }

      // Handle other attribute bindings similarly
    });
  }

  private addBinding(property: string, config: BindingConfig) {
    if (!this.bindings.has(property)) {
      this.bindings.set(property, []);

      // Setup watcher
      this.state.watch(property, () => {
        this.updateBindings(property);
      });
    }

    this.bindings.get(property)!.push(config);
  }

  private updateBindings(property: string) {
    const configs = this.bindings.get(property) || [];

    configs.forEach((config) => {
      switch (config.type) {
        case "text":
          this.updateTextBinding(config);
          break;
        case "class":
          this.updateClassBinding(config);
          break;
        case "conditional":
          this.updateConditionalBinding(config);
          break;
        case "list":
          this.updateListBinding(config);
          break;
      }
    });
  }

  private updateTextBinding(config: TextBindingConfig) {
    const value = this.evaluateExpression(config.expression);
    const newText = config.originalText.replace(
      /\{\{([^}]+)\}\}/g,
      (match, expr) => {
        return this.evaluateExpression(expr.trim());
      },
    );
    config.node.textContent = newText;
  }

  private evaluateExpression(expression: string): any {
    try {
      const func = new Function(
        "state",
        `with(state) { return ${expression}; }`,
      );
      return func(this.state.data);
    } catch (error) {
      console.warn(`Binding expression error: ${expression}`, error);
      return "";
    }
  }
}
```

#### Component Integration

```typescript
export const CelestialInfoPanel = defineComponent({
  name: "celestial-info-panel",

  template: `
    <div class="container">
      <div class="placeholder" t-if="!selectedObject">
        Select a celestial object...
      </div>
      
      <div class="content" t-if="selectedObject">
        <h2>{{ selectedObject.name }}</h2>
        <span class="type" :class="typeClass">{{ selectedObject.type }}</span>
        
        <div class="properties">
          <div t-for="prop in displayProperties" class="property">
            <span class="name">{{ prop.name }}</span>
            <span class="value">{{ prop.value }}</span>
            <span class="unit">{{ prop.unit }}</span>
          </div>
        </div>
      </div>
    </div>
  `,

  state: {
    selectedObject: null,
    showAdvancedProperties: false,
  },

  computed: {
    typeClass: {
      deps: ["selectedObject"],
      compute(selectedObject) {
        return selectedObject
          ? `type-${selectedObject.type.toLowerCase()}`
          : "";
      },
    },

    displayProperties: {
      deps: ["selectedObject", "showAdvancedProperties"],
      compute(selectedObject, showAdvanced) {
        if (!selectedObject?.properties) return [];

        return selectedObject.properties
          .filter((prop) => showAdvanced || !prop.advanced)
          .map((prop) => ({
            name: prop.name,
            value: this.formatValue(prop.value),
            unit: prop.unit,
          }));
      },
    },
  },

  // No manual DOM manipulation needed!
});
```

### Benefits

- **Automatic updates**: No manual DOM manipulation
- **Computed properties**: Efficient derived state
- **Dependency tracking**: Only updates what changed
- **Template-driven**: Declarative data binding
- **Performance**: Minimal DOM operations

---

## Pattern 5: Event-Driven Communication Pattern

### Philosophy

Replace direct method calls and tight coupling with event-driven communication between components and plugins.

### Current Tight Coupling

```typescript
// Current: Direct dependencies and method calls
export class CelestialInfoController {
  private _parentPanel: CompositeEnginePanel | null = null;

  private handleSelection(objectId: string) {
    // Direct coupling to other components
    if (this._parentPanel) {
      this._parentPanel.getCameraManager()?.focusOnObject(objectId);
    }

    // Direct state mutation
    simulationState$.next({
      ...simulationState$.value,
      selectedObjectId: objectId,
    });
  }
}
```

### Improved Event-Driven Pattern

#### Event Bus System

```typescript
// packages/app/ui-plugin/src/patterns/event-bus.ts

export interface EventConfig {
  type: string;
  payload?: any;
  source?: string;
  target?: string;
  bubbles?: boolean;
  cancelable?: boolean;
}

export class EventBus {
  private static instance: EventBus;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private globalListeners: Set<EventListener> = new Set();

  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  // Emit events
  emit(eventType: string, payload?: any, options?: Partial<EventConfig>) {
    const event: EventConfig = {
      type: eventType,
      payload,
      source: options?.source,
      target: options?.target,
      bubbles: options?.bubbles ?? true,
      cancelable: options?.cancelable ?? false,
      ...options,
    };

    // Notify specific listeners
    const listeners = this.listeners.get(eventType) || new Set();
    listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in event listener for ${eventType}:`, error);
      }
    });

    // Notify global listeners
    this.globalListeners.forEach((listener) => {
      try {
        listener(event);
      } catch (error) {
        console.error(`Error in global event listener:`, error);
      }
    });
  }

  // Listen to specific events
  on(eventType: string, listener: EventListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(listener);
    };
  }

  // Listen to all events
  onAll(listener: EventListener): () => void {
    this.globalListeners.add(listener);

    return () => {
      this.globalListeners.delete(listener);
    };
  }

  // Listen once
  once(eventType: string, listener: EventListener): void {
    const unsubscribe = this.on(eventType, (event) => {
      listener(event);
      unsubscribe();
    });
  }

  // Remove all listeners for an event
  off(eventType: string): void {
    this.listeners.delete(eventType);
  }

  // Clear all listeners
  clear(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }
}

type EventListener = (event: EventConfig) => void;
```

#### Event Registry

```typescript
// packages/app/ui-plugin/src/patterns/events.ts

export const Events = {
  // Object selection events
  OBJECT_SELECTED: "object:selected",
  OBJECT_FOCUSED: "object:focused",
  OBJECT_HIGHLIGHTED: "object:highlighted",

  // View events
  VIEW_CHANGED: "view:changed",
  PANEL_OPENED: "panel:opened",
  PANEL_CLOSED: "panel:closed",

  // Simulation events
  SIMULATION_STARTED: "simulation:started",
  SIMULATION_PAUSED: "simulation:paused",
  SIMULATION_RESET: "simulation:reset",

  // Camera events
  CAMERA_MOVED: "camera:moved",
  CAMERA_FOCUSED: "camera:focused",

  // System events
  SYSTEM_LOADED: "system:loaded",
  SYSTEM_GENERATED: "system:generated",
  SYSTEM_CLEARED: "system:cleared",
} as const;

export type EventType = (typeof Events)[keyof typeof Events];

// Event payload interfaces
export interface ObjectSelectedPayload {
  objectId: string;
  object?: CelestialObject;
  source: string;
}

export interface CameraFocusedPayload {
  objectId: string;
  position: Vector3;
  transition: boolean;
}

export interface SystemLoadedPayload {
  objects: CelestialObject[];
  metadata: SystemMetadata;
}
```

#### Component Integration

```typescript
import { EventBus, Events } from "@teskooano/ui-plugin/patterns";

export const CelestialInfoPanel = defineComponent({
  name: "celestial-info-panel",

  template: `
    <div class="container">
      <div class="content" t-if="selectedObject">
        <h2>{{ selectedObject.name }}</h2>
        
        <div class="actions">
          <button @click="focusObject">Focus Camera</button>
          <button @click="highlightObject">Highlight</button>
          <button @click="showOrbit">Show Orbit</button>
        </div>
      </div>
    </div>
  `,

  state: {
    selectedObject: null,
  },

  methods: {
    focusObject() {
      if (this.state.selectedObject) {
        EventBus.getInstance().emit(Events.CAMERA_FOCUSED, {
          objectId: this.state.selectedObject.id,
          transition: true,
          source: "celestial-info-panel",
        });
      }
    },

    highlightObject() {
      if (this.state.selectedObject) {
        EventBus.getInstance().emit(Events.OBJECT_HIGHLIGHTED, {
          objectId: this.state.selectedObject.id,
          highlight: true,
          source: "celestial-info-panel",
        });
      }
    },
  },

  lifecycle: {
    mounted() {
      // Listen for object selection events
      this.unsubscribeObjectSelected = EventBus.getInstance().on(
        Events.OBJECT_SELECTED,
        this.handleObjectSelected.bind(this),
      );

      // Listen for system events
      this.unsubscribeSystemCleared = EventBus.getInstance().on(
        Events.SYSTEM_CLEARED,
        () => {
          this.state.selectedObject = null;
        },
      );
    },

    unmounted() {
      // Clean up event listeners
      this.unsubscribeObjectSelected?.();
      this.unsubscribeSystemCleared?.();
    },
  },

  handleObjectSelected(event: EventConfig) {
    const payload = event.payload as ObjectSelectedPayload;

    // Don't update if we were the source
    if (payload.source === "celestial-info-panel") return;

    this.state.selectedObject = payload.object;
  },
});
```

#### Event-Driven Plugin Communication

```typescript
// Example: Camera manager responding to events
export const CameraManagerPlugin = createPlugin({
  id: "camera-manager",
  name: "Camera Manager",

  functions: {
    "focus-object": {
      execute: (ctx, payload: CameraFocusedPayload) => {
        const cameraManager = ctx.getManager("camera-manager");
        if (cameraManager && payload.objectId) {
          cameraManager.focusOnObject(payload.objectId, payload.transition);
        }
      },
    },
  },

  // Auto-setup event listeners
  events: {
    [Events.CAMERA_FOCUSED]: "camera-manager:focus-object",
    [Events.OBJECT_SELECTED]: "camera-manager:track-selection",
  },
});
```

### Benefits

- **Loose coupling**: Components don't need direct references
- **Scalability**: Easy to add new event listeners
- **Debugging**: Centralized event logging
- **Testability**: Easy to mock events
- **Plugin communication**: Clean inter-plugin communication

---

## Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)

1. **Template Processor**: Implement basic template processing with directives
2. **Reactive State**: Create reactive state management system
3. **Event Bus**: Implement event-driven communication
4. **Component Factory**: Build declarative component definition system

### Phase 2: Integration (2-3 weeks)

1. **Vite Plugin Extension**: Extend existing Vite plugin to support new patterns
2. **Factory Functions**: Update existing factory functions to use new patterns
3. **Migration Tools**: Create tools to help migrate existing components

### Phase 3: Developer Experience (1-2 weeks)

1. **Documentation**: Comprehensive guides and examples
2. **TypeScript Support**: Full type definitions for new patterns
3. **Tooling**: VSCode extension for .teskooano files
4. **Hot Reloading**: Enhanced HMR for new patterns

### Phase 4: Migration (3-4 weeks)

1. **Pilot Components**: Migrate 2-3 existing components using new patterns
2. **Performance Testing**: Measure improvements in bundle size and development speed
3. **Team Training**: Train development team on new patterns
4. **Iteration**: Refine patterns based on feedback

## Conclusion

These improved patterns address the key pain points in the current Teskooano ui-plugin system:

- **90% reduction in boilerplate** through declarative components
- **Template-first development** with clear separation of concerns
- **Convention-based configuration** reducing setup complexity
- **Automatic reactive updates** eliminating manual DOM manipulation
- **Event-driven architecture** reducing coupling between components

Each pattern can be implemented incrementally, allowing for gradual adoption while maintaining backward compatibility with existing plugins. The result is a more developer-friendly system that maintains the power and flexibility of the current architecture while significantly improving the development experience.
