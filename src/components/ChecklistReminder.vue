<script setup lang="ts">
import { computed } from 'vue';
import { usePlans } from '../composables/usePlans';
import { useRouter } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { useChecklistReminders } from '../composables/useChecklistReminders';

const router = useRouter();
const { activePlan } = usePlans();
const { due, dismiss } = useChecklistReminders(() => activePlan.value.id);
const reminder = computed(() => due.value[0]);

function dismissCurrent () {
  const item = reminder.value;

  if (item?.reminderAt) {
    dismiss(item.id, item.reminderAt);
  }
}

async function openChecklist () {
  dismissCurrent();

  if (router.currentRoute.value.name !== 'home') {
    await router.push({ name: 'home' });
  }

  const heading = document.getElementById('prep-title');
  heading?.focus({ preventScroll: true });
  heading?.scrollIntoView({ block: 'start' });
}
</script>

<template>
  <div
    v-if="reminder"
    class="pointer-events-none fixed inset-x-0 top-0 z-30 px-4 pt-[max(12px,env(safe-area-inset-top))]"
  >
    <div class="lift pointer-events-auto mx-auto flex max-w-md items-center gap-3 rounded-3xl border border-line bg-card py-2 pl-4 pr-2">
      <AppIcon
        name="clock"
        class="text-accent-ink"
      />
      <p
        class="min-w-0 flex-1"
        role="status"
      >
        <span class="block text-xs font-bold text-accent-ink">Reminder due</span>
        <span class="block truncate text-sm font-bold">{{ reminder.title }}</span>
      </p>
      <button
        type="button"
        class="min-h-11 rounded-full bg-tint px-3 text-sm font-bold text-accent-ink"
        @click="openChecklist"
      >
        View list
      </button>
      <button
        type="button"
        class="grid size-11 shrink-0 place-items-center rounded-full"
        aria-label="Dismiss reminder"
        @click="dismissCurrent"
      >
        <AppIcon name="close" />
      </button>
    </div>
  </div>
</template>
