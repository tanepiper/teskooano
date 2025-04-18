# Navigation Controls

Teskooano offers comprehensive navigation controls for exploring celestial systems from any angle. This guide explains the navigation system in detail.

## Camera System

The camera system in Teskooano is based on Three.js OrbitControls, which provides a powerful yet intuitive way to navigate 3D space.

## Basic Camera Controls

### Orbit Mode (Default)

- **Rotate View**: Click and drag with the left mouse button
- **Zoom**: Scroll the mouse wheel up and down
- **Pan**: Click and drag with the middle mouse button (or hold Shift + left mouse button)

### Touch Controls

On touch devices:

- **Rotate**: One-finger drag
- **Pan**: Two-finger drag
- **Zoom**: Pinch gesture

## Focus System

The focus system allows you to center your view on specific celestial bodies and track them as they move.

### Setting Focus

- Select an object from the Focus Control panel
- The camera's orbit center will automatically set to the selected object
- The object's information will appear in the Celestial Info panel

### Focus Controls

- **Auto-Track**: When enabled, the camera will continuously update its position to follow the focused object
- **Lock Rotation**: Maintains the current viewing angle relative to the focused object
- **Reset Focus**: Returns focus to the primary star of the system

## Distance Controls

### Zoom Limits

- **Minimum Zoom**: Limited to prevent clipping through objects
- **Maximum Zoom**: Set to approximately 200 AU to prevent getting lost in space
- **Auto Adjust**: Zoom limits automatically adjust based on the size of the focused object

### Scale Awareness

- Zooming behavior is context-aware and scales appropriately:
  - Near planets: Slower zoom for precise control
  - In deep space: Faster zoom for covering large distances quickly

## Multiple View Navigation

With multiple engine views open:

### Independent Navigation

- Each view maintains its own camera position and focus
- Navigate in one view without affecting others
- Use this to observe the same system from different perspectives simultaneously

### Synchronized Views

- Option to synchronize time controls across all views
- Each view can have different visual settings (orbits, labels, grid)

## Advanced Navigation Features

### Quick Jump

- **Double-click**: Double-click on a visible celestial body to quickly focus on it
- **Navigation Bookmarks**: Save and restore specific view positions (coming soon)

### Orientation Aids

- **Reference Grid**: Toggle a reference grid to maintain orientation awareness
- **Directional Lighting**: Helps maintain orientation relative to the system's star
- **Coordinate Display**: Shows the current camera position in AU (Astronomical Units)

## Camera Settings

Adjustable camera properties:

- **Field of View**: Controls the viewing angle (default: 45°)
- **Damping Factor**: Smooths camera movement (adjustable for more precise or more responsive control)
- **Rotation Speed**: Adjusts sensitivity of rotation controls
- **Zoom Speed**: Controls how quickly zooming occurs

## Tips for Effective Navigation

- **Start Wide**: Begin with a wide view of the system to understand the overall structure
- **Multiple Views**: Use multiple views for different scales (system-wide, planetary, moon systems)
- **Follow Orbits**: Follow interesting objects through their orbits to observe interactions
- **Reset When Lost**: If you lose orientation, use the "Reset Camera" button
- **Keyboard + Mouse**: Combine keyboard shortcuts with mouse controls for more efficient navigation

## Keyboard Shortcuts

- **H**: Return to home position (system overview)
- **R**: Reset camera position relative to current focus
- **F**: Toggle free/locked camera mode
- **Arrow Keys**: Pan camera in corresponding direction
- **Page Up/Down**: Zoom in/out
- **Home**: Focus on the primary star
