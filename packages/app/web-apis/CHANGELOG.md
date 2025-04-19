# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   Initial package setup.
-   Helper functions for `ResizeObserver` (`observeResize`) and `IntersectionObserver` (`observeIntersection`).
-   Wrapper classes (`safeLocalStorage`, `safeSessionStorage`) for `localStorage` and `sessionStorage` with automatic JSON serialization/parsing.
-   Basic `enhancedFetch` wrapper for the native Fetch API.
-   Helper function `createWorker` for managing Web Workers.
-   Helper function `createAnimationLoop` for managing `requestAnimationFrame` loops. 