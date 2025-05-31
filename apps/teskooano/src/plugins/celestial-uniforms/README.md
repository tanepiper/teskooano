# Celestial Uniforms Editor Plugin

**ID:** `teskooano-celestial-uniforms`
**Name:** Celestial Uniforms

## Description

The Celestial Uniforms Editor is a UI plugin for the Teskooano application. It provides a dedicated panel that allows for real-time viewing and modification of shader uniforms and other rendering-related properties of selected celestial objects.

This plugin aims to give developers and advanced users fine-grained control over the visual appearance of stars, planets, and other celestial bodies directly within the application, facilitating easier debugging, tweaking, and experimentation with rendering parameters.

## Features

- **Dynamic UI Generation:** The editor panel dynamically generates controls (sliders, color pickers, text inputs) based on the type and properties of the currently selected celestial object.
- **Real-time Updates:** Changes made in the editor are dispatched to the core application state, allowing for immediate visual feedback in the 3D renderer.
- **Extensible Design:** The plugin is structured to easily support new types of celestial objects and their specific uniforms by adding new UI component definitions.
  - Currently supports:
    - **Main Sequence Stars:** Editing of base material properties (color, corona intensity, pulse speed, glow, temperature variation, metallic effect, noise evolution) and corona material properties (opacity, pulse speed, noise scale, noise evolution).
    - **Planets/Moons (with Procedural Surfaces):** Editing of terrain generation parameters (type, amplitude, sharpness, offset, undulation) and noise parameters (persistence, lacunarity, octaves, scale, evolution, noise type), as well as surface colors (ground, slope, rock, snow, water, atmosphere).
- **Dockview Integration:** Seamlessly integrates as a panel within the Dockview layout system used by Teskooano.
- **Toolbar Button:** Registers a button in the `engine-toolbar` for easy access to toggle the editor panel's visibility.

## How It Works

1.  **Selection Listener:** The plugin listens for focus changes within the main renderer or explicit focus requests.
2.  **Object Data Retrieval:** When a celestial object is selected, its data (including `type` and `properties`) is retrieved from the `celestialObjects$` observable in `@teskooano/core-state`.
3.  **UI Rendering:**
    - Based on the `celestial.type` and specific sub-types (e.g., `stellarType` for stars), the appropriate UI component is instantiated (e.g., `MainSequenceStarUniforms` for main sequence stars, or generic procedural surface controls for planets).
    - These components render a set of controls tailored to the editable properties of the selected object.
4.  **Control Interaction & State Update:**
    - Each control (e.g., a `teskooano-slider` or an HTML `input[type="color"]`) is associated with a specific property path within the celestial object's `properties` (e.g., `["shaderUniforms", "baseStar", "glowIntensity"]` for a star's glow).
    - When a control's value changes, an RxJS subscription triggers an update.
    - The `UniformControlUtils.updatePropertyPath` function is used to create a deep clone of the object's properties, update the value at the specified path, and then dispatch an `actions.updateCelestialObject` action to the core state.
5.  **Renderer Update:** The rendering engine (e.g., `MainSequenceStarRenderer`) subscribes to changes in `celestialObjects$`. When an object's properties are updated (e.g., by this plugin), the renderer receives the new properties and updates its materials and uniforms accordingly, causing the visual representation to change.

## Structure

- `index.ts`: Plugin definition, registers the panel and toolbar button.
- `CelestialUniforms.ts`: The main custom element (`celestial-uniforms-editor`) that acts as the Dockview panel content. Manages object selection and delegates UI rendering to specific body type components.
- `CelestialUniforms.template.ts`: HTML template for the main panel.
- `utils/`: Utility functions and shared resources.
  - `UniformControlUtils.ts`: Core helper class for creating UI controls (sliders, color pickers) and managing the logic for updating object properties via RxJS and state actions.
  - `CelestialStyles.ts`: Shared CSS styles for the UI components.
  - `formatters.ts`: (If any specific formatting is needed beyond what the controls provide).
- `bodies/`: Directory containing UI components for specific celestial body types.
  - `stars/`:
    - `StarUniformsBase.ts`: Abstract base class for star uniform editor components.
    - `MainSequenceStarUniforms.ts`: UI for editing main sequence star uniforms.
    - `(Other star types)...`
  - `(Other body types like planets, nebulae, etc.)...`

## Usage

1.  Ensure the Teskooano application is running.
2.  Locate the "Celestial Uniforms Editor" button in the `engine-toolbar` (often found in a group with other engine/renderer related tools).
3.  Click the button to open the Celestial Uniforms Editor panel.
4.  Select a celestial object in the main 3D view (e.g., by clicking on it or using other selection mechanisms provided by the application).
5.  The editor panel will populate with controls relevant to the selected object.
6.  Modify the values using the controls to see real-time changes in the object's appearance.

## Future Enhancements

- Support for more celestial types and their specific uniforms (e.g., gas giants, black holes, neutron stars, planetary atmospheres without procedural surfaces).
- Grouping and organization of uniforms within the panel, especially for objects with many editable properties.
- Ability to save/load uniform presets.
- More sophisticated controls for complex uniform types (e.g., gradient editors, curve editors).
- Visual feedback within the editor itself (e.g., a small preview sphere that updates with color changes).
