# notificationManager

A singleton instance of the `NotificationManager` class, providing global access to the notification system throughout the Open Space engine.

## Definition

```typescript
export const notificationManager = new NotificationManager();
```

## Overview

The `notificationManager` is a pre-instantiated singleton that provides convenient global access to the notification system. Instead of creating new `NotificationManager` instances throughout the application, components can import and use this shared instance to ensure consistent notification state across the entire application.

## Usage

### Basic Import and Usage

```typescript
import { notificationManager } from "@teskooano/notifications";

// Create a notification
const notification = notificationManager.addNotification({
  title: "System Status",
  message: "All systems operational",
  level: "info",
  source: "system-monitor",
});

// Subscribe to notifications
notificationManager.notifications$.subscribe((notifications) => {
  console.log(`Active notifications: ${notifications.length}`);
});
```

### Global Notification Management

```typescript
import { notificationManager } from "@teskooano/notifications";

// Global error handling
function handleGlobalError(error: Error, source: string) {
  notificationManager.addNotification({
    title: "System Error",
    message: error.message,
    level: "error",
    source: source,
  });
}

// Global success notifications
function notifySuccess(title: string, message: string, source: string) {
  notificationManager.addNotification({
    title,
    message,
    level: "success",
    source,
    duration: 5000,
  });
}

// Global warning notifications
function notifyWarning(title: string, message: string, source: string) {
  notificationManager.addNotification({
    title,
    message,
    level: "warning",
    source,
    duration: 10000,
  });
}
```

### Cross-Module Communication

```typescript
// In data-loader module
import { notificationManager } from "@teskooano/notifications";

export class DataLoader {
  async loadCelestialData() {
    try {
      notificationManager.addNotification({
        title: "Loading Data",
        message: "Loading celestial data from server...",
        level: "info",
        source: "data-loader",
      });

      const data = await fetchData();

      notificationManager.addNotification({
        title: "Data Loaded",
        message: "Celestial data loaded successfully",
        level: "success",
        source: "data-loader",
        duration: 5000,
      });

      return data;
    } catch (error) {
      notificationManager.addNotification({
        title: "Load Failed",
        message: `Failed to load data: ${error.message}`,
        level: "error",
        source: "data-loader",
      });
      throw error;
    }
  }
}
```

```typescript
// In physics-engine module
import { notificationManager } from "@teskooano/notifications";

export class PhysicsEngine {
  update() {
    const frameTime = this.calculateFrameTime();

    if (frameTime > 16.67) {
      // Below 60 FPS
      notificationManager.addNotification({
        title: "Performance Warning",
        message: `Frame time: ${frameTime.toFixed(2)}ms (target: 16.67ms)`,
        level: "warning",
        source: "physics-engine",
        duration: 10000,
      });
    }
  }
}
```

### UI Component Integration

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

  const handleMarkAsRead = (id: string) => {
    notificationManager.markAsRead(id);
  };

  const handleDismiss = (id: string) => {
    notificationManager.removeNotification(id);
  };

  const handleMarkAllAsRead = () => {
    notificationManager.markAllAsRead();
  };

  const handleClearAll = () => {
    notificationManager.clearAll();
  };

  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications ({notifications.filter(n => !n.isRead).length} unread)</h3>
        <div className="notification-actions">
          <button onClick={handleMarkAllAsRead}>Mark All Read</button>
          <button onClick={handleClearAll}>Clear All</button>
        </div>
      </div>

      <div className="notification-list">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`notification ${notification.level} ${notification.isRead ? 'read' : 'unread'}`}
          >
            <div className="notification-content">
              <h4>{notification.title}</h4>
              <p>{notification.message}</p>
              <span className="notification-source">{notification.source}</span>
              <span className="notification-time">
                {new Date(notification.timestamp).toLocaleTimeString()}
              </span>
            </div>

            <div className="notification-actions">
              {!notification.isRead && (
                <button onClick={() => handleMarkAsRead(notification.id)}>
                  Mark as Read
                </button>
              )}
              <button onClick={() => handleDismiss(notification.id)}>
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Application Lifecycle Management

```typescript
import { notificationManager } from "@teskooano/notifications";

// Application startup
function initializeApplication() {
  notificationManager.addNotification({
    title: "Application Starting",
    message: "Initializing Open Space engine...",
    level: "info",
    source: "application",
    duration: 3000,
  });
}

// Application shutdown
function shutdownApplication() {
  notificationManager.addNotification({
    title: "Application Shutting Down",
    message: "Saving state and cleaning up resources...",
    level: "info",
    source: "application",
    duration: 2000,
  });

  // Clean up notification manager
  setTimeout(() => {
    notificationManager.dispose();
  }, 3000);
}

// Error boundary
function handleApplicationError(error: Error) {
  notificationManager.addNotification({
    title: "Application Error",
    message: `An unexpected error occurred: ${error.message}`,
    level: "error",
    source: "application",
  });
}
```

### Testing with Global Instance

```typescript
import { notificationManager } from "@teskooano/notifications";

describe("Global Notification Manager", () => {
  beforeEach(() => {
    // Clear all notifications before each test
    notificationManager.clearAll();
  });

  afterAll(() => {
    // Clean up after all tests
    notificationManager.dispose();
  });

  it("should maintain state across different modules", () => {
    // Simulate notification from different modules
    const dataLoaderNotification = notificationManager.addNotification({
      title: "Data Loaded",
      message: "Data loaded successfully",
      level: "success",
      source: "data-loader",
    });

    const physicsNotification = notificationManager.addNotification({
      title: "Physics Update",
      message: "Physics calculations complete",
      level: "info",
      source: "physics-engine",
    });

    const notifications = notificationManager.notifications$.getValue();
    expect(notifications).toHaveLength(2);
    expect(notifications[0].source).toBe("data-loader");
    expect(notifications[1].source).toBe("physics-engine");
  });
});
```

## Benefits of Singleton Pattern

1. **Consistent State**: All parts of the application share the same notification state
2. **Simplified API**: No need to pass notification manager instances around
3. **Global Access**: Any module can easily access the notification system
4. **Memory Efficiency**: Single instance reduces memory overhead
5. **Centralized Management**: All notifications are managed in one place

## Best Practices

1. **Import Once**: Import the singleton at the module level, not inside functions
2. **Consistent Source Names**: Use consistent source identifiers across modules
3. **Appropriate Levels**: Choose the correct notification level for each situation
4. **Cleanup**: Ensure proper cleanup in application shutdown scenarios
5. **Testing**: Clear notifications between tests to avoid state pollution

## Related

- [[NotificationManager]] - The class that the singleton instance is based on
- [[Notification]] - Interface defining notification structure
- [[NotificationLevel]] - Type union for notification severity levels
