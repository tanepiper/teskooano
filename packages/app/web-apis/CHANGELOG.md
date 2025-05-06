# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- Refactored various API utility modules for code clarity and conciseness, removing redundant comments and logging (including `idle-detection`, `invoker-commands`, `media-recorder`, `network`, `observers`, `popover`, `remote-playback`, `screen-capture`, `storage`, `workers`).
- Updated `resizeObserver.ts` to use `RxJS BehaviorSubject` for state management, replacing `nanostores`.
- Simplified type definitions and internal logic in several modules for better maintainability.

## [0.1.0] - 2025-04-24

### Added

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
