# `@teskooano/notifications` Architecture

This package provides a centralized system for handling in-engine notifications.

## Core Concepts

- **`NotificationManager`**: A singleton class that manages the lifecycle of notifications. It provides an API to add, remove, and update notifications.
- **`Notification`**: A data interface representing a single notification, containing its content, level (info, warning, error), and other metadata.
- **Reactive State**: The `NotificationManager` exposes an RxJS `BehaviorSubject` (`notifications$`) which broadcasts the current list of active notifications. UI components can subscribe to this stream to display and update notifications in real-time.

## Data Flow

```mermaid
graph TD
    subgraph Other Modules
        A[Plugin Manager]
        B[Simulation Event]
        C[User Action]
    end

    subgraph @teskooano/notifications
        NM[NotificationManager]
        N_S[notifications$]
    end

    subgraph UI Layer
        UI[Notification Panel UI]
    end

    A -- "addNotification(...)" --> NM
    B -- "addNotification(...)" --> NM
    C -- "addNotification(...)" --> NM

    NM -- Pushes updated array --> N_S
    N_S -- Subscribes to --> UI

```
