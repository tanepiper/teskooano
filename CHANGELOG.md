# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- JSDoc documentation for `ControlsManager`.
- README.md and ARCHITECTURE.md for `@teskooano/renderer-threejs-interaction` package.
- Helper functions (`startRecording`, `stopRecording`, `requestMediaPermissions`) and Observable (`mediaRecorderState$`) for the MediaRecorder API.
- Helper functions (`requestRemotePlayback`, `watchAvailability`) and Observable (`remotePlaybackAvailability$`) for the Remote Playback API.
- Helper functions (`startScreenCapture`, `stopScreenCapture`) and Observable (`screenCaptureState$`) for the Screen Capture API.
- Helper functions for `ResizeObserver` (`observeResize`) and `IntersectionObserver` (`observeIntersection`).
- Wrapper classes (`safeLocalStorage`, `safeSessionStorage`) for `localStorage` and `sessionStorage` with automatic JSON serialization/parsing.
- Basic `enhancedFetch` wrapper for the native Fetch API.
- Helper function `createWorker` for managing Web Workers.
- Helper function `createAnimationLoop` for managing `requestAnimationFrame` loops.
- Helper function `observePerformance` for `PerformanceObserver`.
- Helper function `observeMutations` for `MutationObserver`.
- Helper functions for Fullscreen API (`requestFullscreen`, `exitFullscreen`, `toggleFullscreen`, etc.).
- Helper functions for Clipboard API (`writeTextToClipboard`, `readTextFromClipboard`).
- Reactive Nanostore (`batteryStore`) for Battery Status API.
- RxJS Observable (`deviceOrientation$`) for Device Orientation Events, including permission handling for iOS 13+.
- Helper functions (`observeIdleState`, `requestIdleDetectionPermission`) and Observable (`idleState$`) for the experimental Idle Detection API.
- RxJS Observable (`animationFrames$`) for `requestAnimationFrame` timestamps.
- RxJS Observable (`fullscreenChange$`) for fullscreen state changes.
- RxJS Observable factories (`observeIntersection$`, `observeMutations$`, `observePerformance$`, `observeResize$`) as alternatives for Observer APIs.

### Changed

- Refactored modal dialogs (`ModalManager`) to utilize Dockview's overlay system instead of floating panels, managed via `DockviewController`.
- Refactored `CSS2DManager` to remove unused methods.
- Updated dependencies (visible in package.json/lock).
- style: fixes for mobile (eab8a93)
- docs: improve tour (a4fd682)
- docs: improve site and tour (c8b14cb)
- docs: fix some broken links (f74cfc8)
- docs: improve tour. run formatting (a1c2824)
- site: fix path (28b504f)
- site: update urls (aae7961)
- fix: update paths (707ff44)
- docs: update docs site (7a3d0bf)
- docs: add homepage and link to app (4f5b4ff)
- add tour and homepage (900ebf4)
- docs: update readme (1a678a1)
- feat: add driver.js dependency (8dec960)
- trigger build (a818fa3)
- fix: camera now chases planets again (ee27291)
- fix: fix loading paths (df62a84)
- build: fix base path for gh pages (f7f064f)
- ci: fix upload path (6c5de99)
- ci: fix project path (eff704e)
- fix: correct name of .prototools file (2b24053)
- add build and deploy (437d82c)
- chore: initial commit (505ad11)

### Fixed

- Corrected positioning for modal dialogs, ensuring they appear centered within the application window.
- Ensured modal dialogs display the correct title in their header/tab.
- Corrected camera transition animation logic in `ControlsManager`.
- Fixed camera following logic to correctly track moving objects while allowing free orbit controls.
- Prevented user interaction (zoom/pan) from incorrectly cancelling the camera follow lock.

### Removed

- Unused cloud fragment shader (`packages/renderer/threejs/src/shaders/cloud.frag`).

These are the changes since the first release - they will be gathered here until I'm ready to release a first minor release
