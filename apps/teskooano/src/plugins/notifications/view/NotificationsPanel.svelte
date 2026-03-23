<script lang="ts">
  import { notificationManager } from "@teskooano/notifications";
  import { fromObservable } from "@core/utils/svelte-rxjs.svelte.js";
  import NotificationCard from "../components/notification-card/NotificationCard.svelte";

  const notificationsState = fromObservable(notificationManager.notifications$, []);
</script>

<div class="notifications-overlay">
  {#each notificationsState.value as notification (notification.id)}
    <NotificationCard {notification} />
  {/each}
</div>

<style>
  .notifications-overlay {
    position: absolute;
    top: 1rem;
    left: 50%;
    transform: translateX(-50%);
    z-index: 10000;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding: 1rem;
    pointer-events: none;
  }

  /* Re-enable pointer events on cards so close button works */
  .notifications-overlay :global(.notification-card) {
    pointer-events: all;
  }
</style>
