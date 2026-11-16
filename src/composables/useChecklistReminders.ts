import { computed, onBeforeUnmount, onMounted, readonly, ref, watch } from 'vue';
import { useChecklist } from './useChecklist';

const browserNotifications = 'Notification' in window && 'serviceWorker' in navigator;
const permission = ref<NotificationPermission>(browserNotifications ? Notification.permission : 'denied');

function readPermission () {
  if (browserNotifications) {
    permission.value = Notification.permission;
  }
}

export function useNotificationPermission () {
  async function enableNotifications () {
    try {
      permission.value = await Notification.requestPermission();
    } catch {
      readPermission();
    }
  }

  return { browserNotifications, permission: readonly(permission), enableNotifications };
}

export function useChecklistReminders (tripId: () => string) {
  const { items, markReminder } = useChecklist(tripId);
  const now = ref(Date.now());
  const pending = computed(() => items.value.filter(item => !item.done && !item.dismissed && item.reminderAt !== null));
  const due = computed(() => pending.value.filter(item => Date.parse(item.reminderAt!) <= now.value));
  let timer: ReturnType<typeof setTimeout> | undefined;
  let notifying = false;
  let active = true;

  async function notify () {
    if (notifying || permission.value !== 'granted' || !due.value.some(item => !item.notified)) {
      return;
    }

    notifying = true;

    try {
      const registration = await navigator.serviceWorker.getRegistration();

      if (!registration?.active || !active) {
        return;
      }

      for (const item of due.value) {
        if (item.notified || !item.reminderAt) {
          continue;
        }

        await registration.showNotification(item.title, {
          body: item.why || 'A checklist reminder from Two Tickets.',
          tag: `two-tickets:${item.id}:${item.reminderAt}`,
          icon: new URL('icon-192.png', registration.scope).href
        });
        markReminder(item.id, item.reminderAt, 'notified');
      }
    } catch {
      // Due reminders remain visible in the app if the browser declines delivery.
    } finally {
      notifying = false;
    }
  }

  function refresh () {
    clearTimeout(timer);
    now.value = Date.now();
    readPermission();
    void notify();

    const nearest = pending.value.reduce((next, item) => {
      const timestamp = Date.parse(item.reminderAt!);
      return timestamp > now.value ? Math.min(next, timestamp) : next;
    }, Infinity);

    if (pending.value.length) {
      timer = setTimeout(refresh, Math.min(nearest - now.value, 30_000));
    }
  }

  onMounted(() => {
    refresh();
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);

    if (browserNotifications) {
      void navigator.serviceWorker.ready.then(() => {
        if (active) {
          refresh();
        }
      });
    }
  });

  onBeforeUnmount(() => {
    active = false;
    clearTimeout(timer);
    window.removeEventListener('focus', refresh);
    document.removeEventListener('visibilitychange', refresh);
  });

  watch([items, permission], refresh);

  function dismiss (id: string, reminderAt: string) {
    markReminder(id, reminderAt, 'dismissed');
  }

  return { due, dismiss };
}
