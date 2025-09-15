# Notifications (`@teskooano/notifications`)

A reactive notification management system for the Open Space engine, providing centralized notification handling with automatic dismissal, read status tracking, and real-time updates through RxJS observables.

## Overview

The `@teskooano/notifications` package provides a comprehensive notification management system for the Open Space engine. Built on RxJS for reactive programming, it offers a centralized way to create, manage, and observe notifications throughout the application. The system supports different notification levels, automatic dismissal, read status tracking, and provides a clean API for UI components to consume notifications.

## Key Features

- **Reactive Notifications**: Built on RxJS `BehaviorSubject` for real-time notification updates
- **Multiple Severity Levels**: Support for info, success, warning, and error notifications
- **Automatic Dismissal**: Configurable auto-dismiss timers for temporary notifications
- **Read Status Tracking**: Mark notifications as read individually or all at once
- **Source Tracking**: Track which module or system generated each notification
- **Memory Management**: Automatic cleanup of timeouts and resources
- **TypeScript Support**: Full type safety with comprehensive interfaces
- **Singleton Pattern**: Global notification manager instance for easy access

## Architecture

### Core Components

- **[[NotificationManager]]**: Main class managing notification state and lifecycle
- **[[Notification]]**: Interface defining notification structure and properties
- **[[NotificationLevel]]**: Type union for notification severity levels
- **[[notificationManager]]**: Singleton instance for global access

### Design Principles

- **Reactive Programming**: Uses RxJS for state management and real-time updates
- **Immutable State**: Notifications are treated as immutable objects
- **Automatic Cleanup**: Timeouts and resources are automatically managed
- **Type Safety**: Full TypeScript support with strict typing
- **Performance**: Efficient state updates with minimal re-renders

## Usage Examples

### Basic Notification Creation

```typescript
import { notificationManager } from "@teskooano/notifications";

// Create an info notification
const infoNotification = notificationManager.addNotification({
  title: "System Status",
  message: "All systems operational",
  level: "info",
  source: "system-monitor",
  duration: 5000, // Auto-dismiss after 5 seconds
});

// Create a permanent error notification
const errorNotification = notificationManager.addNotification({
  title: "Critical Error",
  message: "Failed to load celestial data",
  level: "error",
  source: "data-loader",
  // No duration = permanent until manually dismissed
});
```

### Reactive Notification Consumption

```typescript
import { notificationManager } from "@teskooano/notifications";

// Subscribe to notification updates
notificationManager.notifications$.subscribe((notifications) => {
  console.log(`Active notifications: ${notifications.length}`);

  notifications.forEach((notification) => {
    if (!notification.isRead) {
      console.log(`Unread: ${notification.title}`);
    }
  });
});
```

### Notification Management

```typescript
import { notificationManager } from "@teskooano/notifications";

// Update an existing notification
notificationManager.updateNotification(notificationId, {
  message: "Updated message content",
  level: "warning",
});

// Mark specific notification as read
notificationManager.markAsRead(notificationId);

// Mark all notifications as read
notificationManager.markAllAsRead();

// Remove a specific notification
notificationManager.removeNotification(notificationId);

// Clear all notifications
notificationManager.clearAll();
```

### UI Integration Example

```typescript
import { notificationManager } from '@teskooano/notifications';
import { useEffect, useState } from 'react';

function NotificationPanel() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const subscription = notificationManager.notifications$.subscribe(
      setNotifications
    );

    return () => subscription.unsubscribe();
  }, []);

  return (
    <div className="notification-panel">
      {notifications.map(notification => (
        <div
          key={notification.id}
          className={`notification ${notification.level} ${notification.isRead ? 'read' : 'unread'}`}
        >
          <h4>{notification.title}</h4>
          <p>{notification.message}</p>
          <span className="source">{notification.source}</span>
          <button onClick={() => notificationManager.markAsRead(notification.id)}>
            Mark as Read
          </button>
          <button onClick={() => notificationManager.removeNotification(notification.id)}>
            Dismiss
          </button>
        </div>
      ))}
    </div>
  );
}
```

## Performance Characteristics

- **Memory Efficient**: Automatic cleanup of timeouts and completed observables
- **Reactive Updates**: Only re-renders when notification state actually changes
- **Minimal Overhead**: Lightweight notification objects with essential properties only
- **Timeout Management**: Efficient timeout tracking with automatic cleanup

## Testing

The notification system is designed to be easily testable:

```typescript
import { NotificationManager } from "@teskooano/notifications";

describe("NotificationManager", () => {
  let manager: NotificationManager;

  beforeEach(() => {
    manager = new NotificationManager();
  });

  afterEach(() => {
    manager.dispose();
  });

  it("should create notifications with correct properties", () => {
    const notification = manager.addNotification({
      title: "Test",
      message: "Test message",
      level: "info",
      source: "test",
    });

    expect(notification.id).toBeDefined();
    expect(notification.timestamp).toBeCloseTo(Date.now(), -2);
    expect(notification.isRead).toBe(false);
  });

  it("should auto-dismiss notifications after duration", (done) => {
    const notification = manager.addNotification({
      title: "Test",
      message: "Test message",
      level: "info",
      source: "test",
      duration: 100,
    });

    setTimeout(() => {
      const notifications = manager.notifications$.getValue();
      expect(
        notifications.find((n) => n.id === notification.id),
      ).toBeUndefined();
      done();
    }, 150);
  });
});
```

## Dependencies

- **RxJS**: Reactive programming library for state management
- **TypeScript**: Type safety and development experience

## Related

- [[@teskooano/app-simulation]] - Uses notifications for simulation events
- [[@teskooano/core-math]] - Provides mathematical utilities for timestamps
- [[@teskooano/data-types]] - Defines notification-related data structures
