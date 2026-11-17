<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-(--tab-bottom) z-30 mx-auto flex w-fit max-w-[calc(100%-24px)] items-center gap-2">
    <nav
      aria-label="Main navigation"
      class="pointer-events-auto grid grid-cols-2 gap-0.5 rounded-full p-1 nav-glass"
    >
      <RouterLink
        :to="{ name: 'home' }"
        class="flex min-h-[50px] min-w-22 flex-col items-center justify-center gap-0.5 rounded-full text-xs leading-label font-[750] text-muted data-[active=true]:bg-[color-mix(in_srgb,var(--tint)_86%,transparent)] data-[active=true]:text-accent-ink data-[active=true]:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.6)]"
        :data-active="route.name === 'home'"
      >
        <AppIcon
          name="home"
          :size="21"
        />
        <span>Home</span>
      </RouterLink>
      <RouterLink
        :to="{ name: 'days' }"
        class="flex min-h-[50px] min-w-22 flex-col items-center justify-center gap-0.5 rounded-full text-xs leading-label font-[750] text-muted data-[active=true]:bg-[color-mix(in_srgb,var(--tint)_86%,transparent)] data-[active=true]:text-accent-ink data-[active=true]:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.6)]"
        :data-active="daysActive"
      >
        <AppIcon
          name="calendar"
          :size="21"
        />
        <span>Days</span>
      </RouterLink>
    </nav>
    <button
      type="button"
      class="pointer-events-auto grid size-[60px] shrink-0 place-items-center rounded-full text-accent-ink nav-glass"
      aria-label="Settings"
      aria-haspopup="dialog"
      aria-controls="settings-sheet"
      :aria-expanded="expanded"
      @click="openSettings"
    >
      <AppIcon
        name="settings"
        :size="23"
      />
    </button>
  </div>

  <dialog
    id="settings-sheet"
    ref="settings"
    aria-labelledby="settings-title"
    class="fixed inset-x-0 top-auto bottom-0 mx-auto my-0 max-h-[85dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-[32px] bg-paper px-5 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] text-ink backdrop:bg-ink/40"
    @click.self="closeSettings"
    @cancel="expanded = false"
    @close="expanded = false"
  >
    <div class="flex flex-col gap-3">
      <span
        aria-hidden="true"
        class="mx-auto h-1 w-10 rounded-full bg-line"
      />
      <header class="flex items-center justify-between">
        <h2
          id="settings-title"
          class="text-[28px] leading-tight font-extrabold tracking-tight"
        >
          Settings
        </h2>
        <button
          type="button"
          autofocus
          class="grid size-11 place-items-center rounded-full"
          aria-label="Close settings"
          @click="closeSettings"
        >
          <AppIcon name="close" />
        </button>
      </header>

      <label
        v-if="plans.length > 1"
        class="grid gap-1 px-1 text-sm font-bold"
      >
        Current trip
        <select
          :value="activePlan.id"
          class="min-h-11 w-full rounded-2xl border border-line bg-card px-3 text-base"
          @change="selectPlan(($event.target as HTMLSelectElement).value)"
        >
          <option
            v-for="trip in plans"
            :key="trip.id"
            :value="trip.id"
          >{{ trip.title }}</option>
        </select>
      </label>

      <ul class="divide-y divide-line rounded-3xl bg-card px-4">
        <li>
          <RouterLink
            :to="{ name: 'import' }"
            class="flex min-h-[54px] items-center gap-3 font-bold"
            @click="closeSettings"
          >
            <AppIcon
              name="plus"
              class="text-accent-ink"
            />
            <span class="flex-1">Import trip</span>
            <AppIcon
              name="forward"
              :size="16"
              class="text-muted"
            />
          </RouterLink>
        </li>
        <li v-if="activePlan.id !== ORIGINAL_ID">
          <RouterLink
            :to="editLink"
            class="flex min-h-[54px] items-center gap-3 font-bold"
            @click="closeSettings"
          >
            <AppIcon
              name="edit"
              class="text-accent-ink"
            />
            <span class="flex-1">Edit trip</span>
            <AppIcon
              name="forward"
              :size="16"
              class="text-muted"
            />
          </RouterLink>
        </li>
        <li>
          <RouterLink
            :to="{ name: 'sync' }"
            class="flex min-h-[54px] items-center gap-3 font-bold"
            @click="closeSettings"
          >
            <AppIcon
              name="sync"
              class="text-accent-ink"
            />
            <span class="flex-1">Sync devices</span>
            <AppIcon
              name="forward"
              :size="16"
              class="text-muted"
            />
          </RouterLink>
        </li>
      </ul>
    </div>
  </dialog>
</template>

<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue';
import { RouterLink, useRoute } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { usePlans } from '../composables/usePlans';
import { ORIGINAL_ID } from '../lib/plan';

const route = useRoute();
const { activePlan, plans, selectPlan } = usePlans();
const dialog = useTemplateRef<HTMLDialogElement>('settings');
const expanded = ref(false);
const daysActive = computed(() => route.name === 'days' || route.name === 'day');
const editLink = computed(() => ({ name: 'import', query: { trip: activePlan.value.id } }));

function openSettings () {
  dialog.value?.showModal();
  expanded.value = true;
}

function closeSettings () {
  dialog.value?.close();
  expanded.value = false;
}

watch(() => route.path, closeSettings);
</script>
