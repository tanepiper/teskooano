# Getting Started with Teskooano

This guide will help you set up and run Teskooano on your local machine.

## Prerequisites

Teskooano uses [moon](https://moonrepo.dev/) and [proto](https://moonrepo.dev/proto) for dependency management:

- Node.js 18+
- Git
- Basic familiarity with the command line

## Installation

1. Clone the repository:

```bash
git clone https://github.com/tanepiper/teskooano.git
cd teskooano
```

2. Install proto if you don't have it already:

```bash
curl -fsSL https://moonrepo.dev/install/proto.sh | bash
```

3. Set up the local development environment:

```bash
proto use
moon run teskooano:dev
```

The application will be available at http://localhost:3000.

## Your First Celestial System

When you first launch Teskooano, you'll be greeted with an empty engine view and an interactive tour to guide you through the interface.

1. **Generate a Star System**:
   - Look for the Seed Generator in the toolbar
   - Enter a seed value (or use the default)
   - Click "Generate"

2. **Explore the System**:
   - Use the Focus Control panel to select celestial bodies
   - Click and drag to orbit around the selected body
   - Use the mouse wheel to zoom in and out
   - Use the time controls to adjust simulation speed

3. **Add Multiple Views**:
   - Click the "Add Teskooano" button in the toolbar to create a new view
   - Each view maintains its own camera position and focus
   - Try focusing on different objects in different views

## Understanding the Interface

Teskooano consists of several key interface elements:

### Toolbar

The toolbar at the top of the screen contains:

- **App Logo**: Information about Teskooano
- **GitHub Button**: Link to the repository
- **Settings Button**: Access application settings
- **Tour Button**: Restart the guided tour
- **Add View Button**: Create additional engine views
- **Simulation Controls**: Play, pause, and adjust simulation speed
- **Seed Generator**: Create new star systems

### Engine View

The main 3D viewport where celestial bodies are displayed.

### UI Panel

The panel to the right of the engine view contains:

- **Focus Control**: Select and focus on celestial bodies
- **Celestial Info**: Information about the selected body
- **Renderer Info**: Statistics about the renderer
- **View Settings**: Customize the current view

## What's Next?

After getting familiar with the basic interface, you might want to:

- Experiment with different seed values to generate varied star systems
- Create multiple views to observe the same system from different angles
- Try focusing on different celestial bodies to observe their orbits
- Adjust the simulation speed to observe long-term orbital behavior

Check out the [Basic Usage](/docs/basic-usage) guide for more detailed information about Teskooano's features. 