<script lang="ts">
  import { notificationManager, type Notification } from "@teskooano/notifications";

  let { notification }: { notification: Notification } = $props();

  function handleClose() {
    notificationManager.removeNotification(notification.id);
  }
</script>

<div class="notification-card {notification.level}">
  <div class="header">
    <span class="title">{notification.title}</span>
    <button class="close-button" aria-label="Close" onclick={handleClose}>&times;</button>
  </div>
  <div class="message">
    <!-- eslint-disable-next-line svelte/no-at-html-tags -->
    {@html notification.message}
  </div>
</div>

<style>
  .notification-card {
    display: block;
    margin-bottom: 0.75rem;
    border-radius: 0.5rem;
    background-color: rgba(30, 41, 59, 0.8);
    color: #f1f5f9;
    padding: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-left: 4px solid transparent;
    transition: transform 0.3s ease, opacity 0.3s ease;
    backdrop-filter: blur(5px);
    width: 350px;
    max-width: 90vw;
  }

  .notification-card.info    { border-left-color: #3b82f6; }
  .notification-card.success { border-left-color: #22c55e; }
  .notification-card.warning { border-left-color: #f97316; }
  .notification-card.error   { border-left-color: #ef4444; }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: 600;
  }

  .title {
    font-size: 1rem;
  }

  .close-button {
    background: none;
    border: none;
    color: #94a3b8;
    cursor: pointer;
    font-size: 1.5rem;
    line-height: 1;
    padding: 0.25rem;
  }
  .close-button:hover {
    color: #f1f5f9;
  }

  .message {
    margin-top: 0.5rem;
    font-size: 0.875rem;
    line-height: 1.4;
    color: #cbd5e1;
  }
</style>
