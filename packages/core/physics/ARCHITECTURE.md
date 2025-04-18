## Core Physics Package Architecture (`core/physics`)

**Purpose**: This package implements the core physics simulation engine for Open Space. It handles the calculation of forces (primarily gravity), integrates the motion of celestial bodies over time using numerical methods, and provides optimizations like spatial partitioning via the Barnes-Hut algorithm.

**Key Components:**

1. **`index.ts`**: Exports the primary types, constants, and functions from sub-modules. Exports specific integrators (`verlet`, `standardEuler`, `symplecticEuler`) and other core functionality.

2. **`types.ts`**: Defines core function signatures and the primary data structure:
   * `PhysicsStateReal`: The state representation (ID, `mass_kg`, `position_m: OSVector3`, `velocity_mps: OSVector3`). Crucially, uses REAL-WORLD units (kg, m, m/s).
   * `NetForceCalculator`: Signature for a function that calculates the total force on one body from all others.
   * `PairForceCalculator`: Signature for calculating the force between two specific bodies.
   * `Integrator`: Signature for numerical integration functions that advance a `PhysicsStateReal` forward in time given an acceleration and timestep (`dt`).

3. **`simulation/simulation.ts`**: Contains the main simulation loop logic with the following key functions:
   * `calculateAccelerationForBody`: Helper that calculates acceleration on a body using the Octree.
   * `updateSimulation`: Performs one step of the simulation:
     1. Builds an Octree from the current body positions.
     2. Calculates net forces on all bodies using the Octree's `calculateForceOn` method.
     3. Calculates acceleration for each body (`a = F/m`).
     4. Updates the state (position and velocity) of each body using the Velocity Verlet integrator.
     5. Handles collisions between bodies based on their radii and types.
     6. Returns the array of new `PhysicsStateReal` objects, accelerations, and any destroyed body IDs.
   * `runSimulation`: A helper function to run the `updateSimulation` loop for a specified number of steps.

4. **`forces/`**: Implements various force calculation methods:
   * `gravity.ts`: Implements Newtonian gravitational force calculation.
   * `relativistic.ts`: Provides relativistic gravity calculations (not yet fully integrated).
   * `non-gravitational.ts`: Implements non-gravitational forces (thrust, drag, etc.).

5. **`integrators/`**: Contains different numerical integration methods:
   * `verlet.ts`:
     * `verletIntegrate`: Implements the basic position Verlet algorithm.
     * `velocityVerletIntegrate`: Implements the Velocity Verlet algorithm (used by default in simulation).
   * `euler.ts`:
     * `standardEuler`: Implements the standard Euler method.
   * `symplecticEuler.ts`:
     * `symplecticEuler`: Implements the symplectic Euler method for better energy conservation.

6. **`spatial/octree.ts`**: Implements the Barnes-Hut algorithm for optimizing force calculations:
   * `OctreeNode`: Interface defining the structure of a node (center, size, bodies, children, total mass, center of mass).
   * Helper functions: `createNode`, `isInBounds`, `subdivide`, `updateMassProperties`, `insertBody`.
   * `Octree` class:
     * `constructor(size, maxDepth)`: Initializes the tree.
     * `insert(body)`: Inserts a `PhysicsStateReal` body into the tree.
     * `calculateForceOn(body, theta)`: Calculates the approximate gravitational force on a target body using the Barnes-Hut method, with `theta` controlling the approximation threshold.

7. **`collision/collision.ts`**: Handles collision detection and resolution:
   * Uses body radii and types to detect collisions.
   * Implements conservation of momentum and energy in collision resolution.
   * Returns both updated states and IDs of destroyed bodies.

8. **`orbital/`**: Provides orbital mechanics calculations:
   * Converts between state vectors and Keplerian orbital elements.
   * Calculates orbital parameters (period, semi-major axis, etc.).

9. **`units/`**: Contains constants and conversion functions:
   * `constants.ts`: Defines physical constants (`GRAVITATIONAL_CONSTANT`, `AU_METERS`, etc.).
   * `units.ts`: Provides conversion functions between different unit systems.

10. **`utils/vectorPool.ts`**: Implements a pool of reusable vector objects to reduce garbage collection overhead during intensive vector calculations.

**Key Characteristics & Design:**

* **Real Units**: All core calculations are performed using real-world physical units (meters, kilograms, seconds) defined in `PhysicsStateReal`.
* **Pluggable Integrators**: Different integration methods are implemented and can be swapped, with Velocity Verlet being the current default due to its stability and energy conservation properties.
* **Optimized Force Calculation**: Uses the Barnes-Hut algorithm (Octree) for approximating gravitational forces, reducing complexity from O(N²) to O(N log N).
* **Collision Handling**: Detects and handles collisions between celestial bodies, including destruction of smaller bodies.
* **Modularity**: Functionality is cleanly separated into forces, integrators, simulation loop, and spatial partitioning.
* **Testing**: Comprehensive unit tests ensure the accuracy of physics calculations and integrators.

**Dependencies**: 
* `@teskooano/core-math`: Provides the `OSVector3` class for vector operations.
* `@teskooano/data-types`: Provides celestial object type definitions.
* `three`: Used for specific 3D math operations.

**Performance Considerations:**
* The Barnes-Hut algorithm significantly improves performance for large numbers of bodies.
* The Vector Pool reduces memory allocation overhead during intensive calculations.
* The configurable `theta` parameter allows balancing between accuracy and performance in the Barnes-Hut approximation. 