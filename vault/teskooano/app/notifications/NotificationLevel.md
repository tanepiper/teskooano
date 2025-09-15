# NotificationLevel

Type union defining the severity levels for notifications in the Open Space engine notification system.

## Type Definition

```typescript
export type NotificationLevel = "info" | "success" | "warning" | "error";
```

## Values

### `"info"`

General information messages that provide status updates or non-critical information.

**Usage**: System status updates, progress notifications, general announcements

**Visual Characteristics**:

- Typically displayed with blue or neutral colors
- Lower priority in notification queues
- Often auto-dismiss after a short duration

**Examples**:

```typescript
notificationManager.addNotification({
  title: "System Update",
  message: "New version available for download",
  level: "info",
  source: "updater",
});

notificationManager.addNotification({
  title: "Progress Update",
  message: "Loading celestial data... 75% complete",
  level: "info",
  source: "data-loader",
});
```

### `"success"`

Positive outcomes and successful operations that confirm something has completed successfully.

**Usage**: Successful saves, completed operations, positive confirmations

**Visual Characteristics**:

- Typically displayed with green colors
- Medium priority in notification queues
- Often auto-dismiss after a moderate duration

**Examples**:

```typescript
notificationManager.addNotification({
  title: "Save Complete",
  message: "Simulation state saved successfully",
  level: "success",
  source: "save-manager",
});

notificationManager.addNotification({
  title: "Connection Established",
  message: "Successfully connected to simulation server",
  level: "success",
  source: "network-manager",
});
```

### `"warning"`

Cautionary messages that indicate potential issues or situations requiring attention.

**Usage**: Performance warnings, degraded functionality, attention-required situations

**Visual Characteristics**:

- Typically displayed with yellow or orange colors
- Higher priority in notification queues
- May persist longer or require user acknowledgment

**Examples**:

```typescript
notificationManager.addNotification({
  title: "Performance Warning",
  message: "Frame rate is below optimal levels",
  level: "warning",
  source: "performance-monitor",
});

notificationManager.addNotification({
  title: "Low Memory",
  message: "Available memory is below 20%",
  level: "warning",
  source: "system-monitor",
});
```

### `"error"`

Error conditions that indicate failures or critical issues requiring immediate attention.

**Usage**: Failed operations, critical errors, system failures

**Visual Characteristics**:

- Typically displayed with red colors
- Highest priority in notification queues
- Usually persistent until manually dismissed
- May include error sounds or visual emphasis

**Examples**:

```typescript
notificationManager.addNotification({
  title: "Load Failed",
  message: "Unable to load celestial data from server",
  level: "error",
  source: "data-loader",
});

notificationManager.addNotification({
  title: "Critical Error",
  message: "Rendering engine initialization failed",
  level: "error",
  source: "renderer",
});
```

## Usage Patterns

### Level-Based Filtering

```typescript
import { notificationManager } from "@teskooano/notifications";

// Filter notifications by level
function getNotificationsByLevel(level: NotificationLevel) {
  return notificationManager.notifications$
    .getValue()
    .filter((notification) => notification.level === level);
}

// Get all error notifications
const errorNotifications = getNotificationsByLevel("error");

// Get all warning notifications
const warningNotifications = getNotificationsByLevel("warning");
```

### Priority-Based Sorting

```typescript
import { notificationManager } from "@teskooano/notifications";

// Define priority order
const levelPriority: Record<NotificationLevel, number> = {
  error: 4,
  warning: 3,
  success: 2,
  info: 1,
};

// Sort notifications by priority
function sortNotificationsByPriority(notifications: Notification[]) {
  return notifications.sort(
    (a, b) => levelPriority[b.level] - levelPriority[a.level],
  );
}

// Usage
notificationManager.notifications$.subscribe((notifications) => {
  const sorted = sortNotificationsByPriority(notifications);
  // Display sorted notifications in UI
});
```

### Level-Based Styling

```typescript
// CSS classes based on notification level
function getNotificationClass(level: NotificationLevel): string {
  switch (level) {
    case 'error':
      return 'notification notification--error';
    case 'warning':
      return 'notification notification--warning';
    case 'success':
      return 'notification notification--success';
    case 'info':
      return 'notification notification--info';
    default:
      return 'notification';
  }
}

// Usage in React component
function NotificationItem({ notification }: { notification: Notification }) {
  return (
    <div className={getNotificationClass(notification.level)}>
      <h4>{notification.title}</h4>
      <p>{notification.message}</p>
    </div>
  );
}
```

### Level-Based Auto-Dismiss Behavior

```typescript
import { notificationManager } from "@teskooano/notifications";

// Default durations based on level
const defaultDurations: Record<NotificationLevel, number> = {
  info: 5000, // 5 seconds
  success: 8000, // 8 seconds
  warning: 15000, // 15 seconds
  error: 0, // No auto-dismiss
};

// Create notification with level-appropriate duration
function createNotification(
  title: string,
  message: string,
  level: NotificationLevel,
  source: string,
  customDuration?: number,
) {
  const duration = customDuration ?? defaultDurations[level];

  return notificationManager.addNotification({
    title,
    message,
    level,
    source,
    duration: duration > 0 ? duration : undefined,
  });
}

// Usage
createNotification(
  "System Status",
  "All systems operational",
  "info",
  "system-monitor",
);
createNotification(
  "Save Complete",
  "Data saved successfully",
  "success",
  "save-manager",
);
createNotification(
  "Low Memory",
  "Memory usage is high",
  "warning",
  "system-monitor",
);
createNotification(
  "Critical Error",
  "System failure",
  "error",
  "system-monitor",
);
```

### Level-Based Sound and Visual Effects

```typescript
// Sound effects based on notification level
function playNotificationSound(level: NotificationLevel) {
  const sounds = {
    info: "notification-info.wav",
    success: "notification-success.wav",
    warning: "notification-warning.wav",
    error: "notification-error.wav",
  };

  const audio = new Audio(sounds[level]);
  audio.play().catch(console.error);
}

// Visual effects based on notification level
function addNotificationEffect(level: NotificationLevel) {
  switch (level) {
    case "error":
      // Flash screen or show error overlay
      document.body.classList.add("error-flash");
      setTimeout(() => document.body.classList.remove("error-flash"), 500);
      break;
    case "warning":
      // Subtle pulse effect
      document.body.classList.add("warning-pulse");
      setTimeout(() => document.body.classList.remove("warning-pulse"), 1000);
      break;
    case "success":
      // Success animation
      document.body.classList.add("success-animation");
      setTimeout(
        () => document.body.classList.remove("success-animation"),
        800,
      );
      break;
    case "info":
      // No special effects for info notifications
      break;
  }
}
```

## Best Practices

1. **Appropriate Level Selection**: Choose the correct level based on the actual impact and urgency
2. **Consistent Usage**: Use the same level for similar types of notifications across the application
3. **Visual Hierarchy**: Ensure error notifications are most prominent, followed by warnings, then success, then info
4. **Auto-Dismiss Behavior**: Consider the level when setting auto-dismiss durations
5. **User Experience**: Provide clear visual and audio cues that match the notification level
6. **Accessibility**: Ensure notification levels are accessible to screen readers and other assistive technologies

## Related

- [[Notification]] - Interface that uses NotificationLevel
- [[NotificationManager]] - Class that manages notifications with different levels
- [[notificationManager]] - Singleton instance for global access
