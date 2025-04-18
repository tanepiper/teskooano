# Simulation Controls

Teskooano provides comprehensive controls for managing the physics simulation and celestial system generation. This guide explains how to use these features to explore different celestial scenarios.

## Time Controls

The simulation time controls allow you to manage how quickly the simulation runs.

### Basic Time Controls

- **Play/Pause Button**: Toggles the simulation between running and paused states
- **Time Scale Slider**: Adjusts the speed of the simulation, from 1x (real-time) to 10,000,000x
- **Time Display**: Shows the current simulation date and time

### Time Scale Presets

Quickly set common time scales:

- **1x**: Slow time
- **16x**: Real-time (1 second tick)
- **100x**: 100 seconds per second
- **1,000x**: Good for observing moon orbits
- **10,000x**: Good for observing planetary orbits
- **100,000x**: Good for observing outer planet orbits
- **1,000,000x**: Good for observing long-term system evolution
- **10,000,000x**: Maximum speed (for very long-term observations)

### Time Management Tips

- Use slower speeds for accurate observation of close approaches and interactions
- Use higher speeds to observe complete orbital cycles
- Pause the simulation for detailed examination of specific moments

## System Generation

Teskooano uses procedural generation to create realistic star systems based on seed values.

### Seed Generator

- **Seed Input**: Enter any text to serve as the generation seed
- **Generate Button**: Creates a new system based on the current seed
- **Random Button**: Generates a random seed and creates a new system

### Generation Options

- **System Type**: Choose from different system templates:
  - **Solar System**: Similar to our own system
  - **Binary Star**: Two stars orbiting each other with planets
  - **Compact System**: Many planets in close orbits
  - **Giant System**: Gas giant dominated system
  - **Chaotic System**: Unusual and unstable configurations
- **Star Class**: Configure the main star's spectral class
- **Planet Count**: Set approximate number of planets to generate

## Physics Engine Settings

Teskooano allows you to adjust the underlying physics simulation parameters.

### Physics Model Selection

- **Newtonian Gravity**: Standard gravitational simulation (default)
- **Point Mass**: Simplified model treating objects as point masses
- **N-Body Full**: Complete N-body simulation (more accurate but computationally intensive)

### Integration Methods

Select the mathematical method used to calculate object positions:

- **Euler**: Basic integration (fastest, less accurate)
- **Symplectic Euler**: Better energy conservation for orbital mechanics (default)
- **Verlet**: More accurate for complex gravitational interactions (slower)

### Physics Parameters

- **Gravitational Constant**: Fine-tune the strength of gravity (default: actual G value)
- **Time Step**: Adjust simulation accuracy vs. performance
- **Collision Detection**: Enable/disable collision physics

## Object Creation & Modification

### Adding New Objects

- **Add Object Button**: Opens dialog to create a new celestial body
- **Object Type**: Select from Star, Planet, Moon, Asteroid, or Comet
- **Starting Position**: Set initial coordinates
- **Starting Velocity**: Configure initial velocity vector
- **Physical Properties**: Set mass, radius, and other physical attributes

### Modifying Existing Objects

- **Select an object**: Choose it from the Focus Control panel
- **Edit Button**: Opens properties editor for the selected object
- **Delete Button**: Removes the selected object from the simulation

## Saving & Loading

- **Save System**: Save the current system configuration
- **Load System**: Load a previously saved system
- **Export/Import**: Share system configurations with others

## Realistic Mode vs. Sandbox Mode

- **Realistic Mode**: Enforces physical laws and realistic constraints
- **Sandbox Mode**: Allows "impossible" configurations for experimental purposes

## System Stability Analysis

- **Stability Indicator**: Shows whether the current system is stable in the long term
- **Orbit Prediction**: Projects the future paths of celestial bodies
- **Collision Warning**: Highlights potential future collisions

## Simulation Performance

- **Physics Detail Level**: Adjust simulation complexity for better performance
- **Object Count Limit**: Set maximum number of simulated objects
- **Performance Stats**: Monitor FPS and physics calculation time

## Tips for Interesting Simulations

- **Binary Star Systems**: Create dramatic orbital patterns
- **Resonant Orbits**: Set up planets in orbital resonance (like 2:1 or 3:2 ratios)
- **Transfer Orbits**: Create objects on transfer orbits between planets
- **Retrograde Orbits**: Set up moons or planets with orbits opposite to the system trend
- **Rogue Planet Encounters**: Send a massive object through an established system
- **L4/L5 Points**: Place objects at Lagrange points to observe stability
