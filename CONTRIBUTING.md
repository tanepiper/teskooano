# Contributing to Teskooano

Thank you for your interest in contributing to Teskooano! This guide will help you get started with the development environment and explain our contribution workflow.

## Development Environment Setup

### Prerequisites

- **Node.js**: Version 18.x or higher
- **Git**: For version control
- **proto**: For dependency management
- **moon**: For monorepo management

### Getting Started

1. **Fork the repository** on GitHub

2. **Clone your fork**:

   ```bash
   git clone https://github.com/YOUR_USERNAME/teskooano.git
   cd teskooano
   ```

3. **Set up proto and moon**:

   ```bash
   # Install proto if you don't have it
   curl -fsSL https://moonrepo.dev/install/proto.sh | bash

   # Use proto to set up the local development environment
   proto use
   ```

4. **Install dependencies and start the development server**:
   ```bash
   moon run teskooano:dev
   ```

The application will be available at http://localhost:3000.

## Project Structure

Teskooano is organized as a monorepo with the following structure:

```
teskooano/
├── apps/                 # Frontend applications
│   ├── teskooano/        # Main simulation application
│   └── homepage/         # Documentation website
├── packages/             # Shared libraries
│   ├── core/             # Core engine components
│   │   ├── math/         # Mathematical utilities
│   │   ├── physics/      # Physics simulation
│   │   └── state/        # State management
│   ├── data/             # Data definitions
│   │   └── types/        # TypeScript types
│   ├── systems/          # Domain-specific systems
│   │   ├── celestial/    # Celestial object definitions
│   │   └── procedural-generation/ # Procedural generation
│   └── renderer/         # Rendering libraries
│       ├── threejs/      # Main Three.js renderer
│       ├── threejs-core/ # Core Three.js setup
│       └── ...           # Other renderer packages
└── services/             # Backend services (if any)
```

## Development Workflow

### Creating a New Feature

1. **Create a branch** for your feature:

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Implement your changes** following the code style and architectural guidelines

3. **Write tests** for your changes (we follow a TDD approach)

4. **Run tests** to ensure everything works:

   ```bash
   moon run :test
   ```

5. **Commit your changes** using the [Conventional Commits](https://www.conventionalcommits.org/) format:

   ```bash
   git commit -m "feat: add new celestial body type"
   ```

6. **Push your branch** to your fork:

   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request** on GitHub

### Code Style Guidelines

We follow strict TypeScript coding standards:

- Use TypeScript's strict mode
- Write proper JSDoc comments for public APIs
- Follow consistent naming conventions:
  - `PascalCase` for classes, interfaces, and types
  - `camelCase` for variables, properties, and functions
  - `UPPER_CASE` for constants
- Keep files focused on a single responsibility
- Aim for files to be under 300-400 lines
- Use proper import ordering
- Use meaningful variable and function names

### Testing Guidelines

We use a Test-Driven Development (TDD) approach:

1. Write a test that defines the expected behavior
2. Run the test to see it fail
3. Implement the minimal code needed to make the test pass
4. Refactor while keeping the test passing

All major functionality should have corresponding tests:

- **Unit Tests**: For individual functions and classes
- **Integration Tests**: For checking how components work together
- **Visual Regression Tests**: For UI components (when applicable)

## Package Development

When developing packages within the monorepo:

1. **Follow the modular architecture** - respect separation of concerns
2. **Export types** - ensure proper TypeScript type definitions
3. **Minimize external dependencies** - think carefully before adding new dependencies
4. **Document public APIs** - use JSDoc comments
5. **Consider performance** - Teskooano handles complex physics calculations

### Adding a New Package

1. Use the provided templates or copy an existing package structure
2. Update the `package.json` with appropriate dependencies
3. Create a `moon.yml` file with the required tasks
4. Add proper TypeScript configuration
5. Document the package purpose in a README.md file

## Core Concepts to Understand

Before contributing, familiarize yourself with these core concepts:

- **N-Body Physics**: How gravitational interactions are calculated between multiple bodies
- **Orbital Mechanics**: Kepler's laws, orbital elements, and trajectory calculations
- **ThreeJS Rendering**: How 3D rendering works with Three.js
- **State Management**: How Nanostores are used for application state
- **Scaling and Units**: How real-world physical units are scaled for visualization

## Pull Request Process

1. Update documentation if you're changing behavior
2. Add or update tests for your changes
3. Ensure all tests pass before submitting
4. Make sure the code builds without errors
5. Fill out the PR template completely
6. Request a review from maintainers

## Need Help?

- **GitHub Issues**: For bug reports and feature requests
- **Discussions**: For general questions and discussions

Thank you for contributing to Teskooano! Together, we can create an amazing tool for exploring and understanding celestial physics.
