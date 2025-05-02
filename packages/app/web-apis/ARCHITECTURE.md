## Architecture: `@teskooano/app-web-apis`

**Purpose**: This package aims to provide consistent, reusable, and often reactive interfaces for interacting with various browser Web APIs within the Teskooano project.

**Core Concepts**:

1.  **Modularity**: Each distinct Web API (or closely related group of APIs) is generally contained within its own directory (e.g., `src/observers/`, `src/storage/`, `src/gamepad/`).
2.  **Re-exporting**: The main entry point (`src/index.ts`) re-exports the contents of these individual modules, often namespaced (e.g., `export * as StorageAPI from './storage';`). This allows consumers to import only the modules they need, potentially aiding tree-shaking.
3.  **Interface Consistency**: Where applicable, the package attempts to provide consistent patterns:
    - **Helper Functions**: Simple wrappers for direct API calls (e.g., `requestFullscreen`, `writeTextToClipboard`).
    - **RxJS Observables**: For event-based APIs or asynchronous operations, providing streams of data/events (e.g., `observeResize$`, `deviceOrientation$`, `gamepadConnection$`).
    - **RxJS**: For stateful APIs where a reactive store makes sense (e.g., `batteryStore`, `gamepadStateStore`, `deviceMemoryStore`).
4.  **Abstraction**: The wrappers hide some of the browser API inconsistencies or boilerplate (e.g., permission handling for Device Orientation, JSON parsing for Storage).
5.  **Dependency Management**: Relies on `rxjs` for observables and reactive state management.

**Structure**:

```
packages/app/web-apis/
├── src/
│   ├── animation/
│   │   └── index.ts         # requestAnimationFrame helpers/observable
│   ├── battery/
│   │   └── index.ts         # Battery Status API store
│   ├── clipboard/
│   │   └── index.ts         # Clipboard API helpers
│   ├── device-memory/
│   │   └── index.ts         # Device Memory API store
│   ├── device-orientation/
│   │   └── index.ts         # Device Orientation API observable + permission
│   ├── drag-and-drop/
│   │   └── index.ts         # HTML Drag and Drop helpers
│   ├── fullscreen/
│   │   └── index.ts         # Fullscreen API helpers/observable
│   ├── gamepad/
│   │   └── index.ts         # Gamepad API observable/store
│   ├── idle-detection/
│   │   └── index.ts         # Idle Detection API helpers/observable
│   ├── invoker-commands/
│   │   └── index.ts         # Invoker API helpers
│   ├── media-recorder/
│   │   └── index.ts         # MediaRecorder API helpers/observable
│   ├── network/
│   │   └── index.ts         # Fetch wrapper
│   ├── observers/
│   │   └── index.ts         # Resize, Intersection, Mutation, Performance observers (callbacks/observables)
│   ├── popover/
│   │   └── index.ts         # Popover API helpers
│   ├── remote-playback/
│   │   └── index.ts         # Remote Playback API helpers/observable
│   ├── screen-capture/
│   │   └── index.ts         # Screen Capture API helpers/observable
│   ├── storage/
│   │   └── index.ts         # localStorage/sessionStorage wrappers
│   ├── workers/
│   │   └── index.ts         # Web Worker helper
│   └── index.ts             # Main entry point, re-exports all modules
├── package.json
├── tsconfig.json
├── moon.yml
├── README.md
└── CHANGELOG.md
```

**Data Flow**: Consumers import specific modules (e.g., `AnimationAPI`) from the main package entry point. They then use the exported functions, subscribe to observables, or read from stores provided by that module. Internally, these modules interact directly with the corresponding browser Web APIs.

**Dependencies**: `rxjs`, `@types/web`.
