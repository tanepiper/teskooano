# What is Teskooano?

Teskooano is a powerful 3D N-Body simulation engine that accurately recreates celestial physics. It allows you to visualize and interact with star systems, planets, moons, and other celestial bodies in a realistic and immersive environment.

## Origin of the Name

The name **Teskooano** comes from Beelzebub's Tales to His Grandson by G.I. Gurdjieff. In the book, a "Teskooano" is a type of advanced telescope in Beelzebub's observatory on Mars - used to observe distant cosmic phenomena. It is designed to perceive both physical and non-physical aspects of the universe.

The simulation engine is named after this fictional observatory device because it similarly acts as a tool for observing and exploring complex celestial systems in motion.

## Core Philosophy

Teskooano was built with several guiding principles:

1. **Accuracy**: Physical simulations should be as accurate as possible within the constraints of real-time rendering
2. **Accessibility**: Complex orbital mechanics should be made intuitive and accessible
3. **Modularity**: The architecture should be modular and extensible
4. **Performance**: The simulation should run smoothly even with many celestial bodies
5. **Education**: The tool should serve as an educational platform for understanding celestial mechanics

## Key Features

- **Full N-Body Simulation**: Every object in the system exerts gravitational force on every other object
- **Multi-View Experience**: View the same simulation from multiple angles simultaneously
- **Procedural Generation**: Create unique star systems from random seeds
- **Interactive Controls**: Select and focus on any celestial body in the system
- **Dynamic Time Control**: Adjust simulation speed from real-time to 10 million times faster
- **Modular Architecture**: Easily extendable component-based design

## Technical Overview

Teskooano is built with modern web technologies:

- **Three.js** for 3D rendering
- **TypeScript** for type-safe code
- **Nanostores** for state management
- **Driver.js** for interactive tours
- **DockView** for multi-panel layouts
- **Vite** for fast development and building

The architecture follows a unidirectional data flow pattern, with clear separation of concerns between the physics engine, state management, and rendering pipeline. 