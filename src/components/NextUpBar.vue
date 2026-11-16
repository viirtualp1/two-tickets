<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import type { RouteLocationRaw } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { directionsUrl } from '../lib/maps';
import type { StopRow } from '../lib/route';

const props = defineProps<{
  next: StopRow | null;
  homeTarget: RouteLocationRaw | null;
}>();

const emit = defineEmits<{
  tick: [id: string];
  open: [id: string];
}>();

const goUrl = computed(() => (props.next ? directionsUrl(props.next.place) : ''));
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(12px,env(safe-area-inset-bottom))]">
    <div class="pointer-events-auto mx-auto flex max-w-md items-center gap-2 rounded-[30px] bg-card p-2.5 shadow-[0_14px_34px_rgb(60_30_30/0.18)]">
      <template v-if="props.next">
        <button
          type="button"
          class="grid size-12 shrink-0 place-items-center rounded-full border-2 border-accent text-accent-ink"
          :aria-label="`We’ve been to ${props.next.name}`"
          @click="emit('tick', props.next.id)"
        >
          <AppIcon
            name="check"
            :size="20"
            :stroke="2.6"
          />
        </button>
        <button
          type="button"
          class="min-w-0 flex-1 px-1 text-left"
          @click="emit('open', props.next.id)"
        >
          <span class="block font-hand text-xl leading-none text-accent-ink">next up</span>
          <span class="block truncate font-bold">{{ props.next.name }}</span>
          <span
            v-if="props.next.via"
            class="block truncate text-xs text-muted"
          >{{ props.next.via }}</span>
        </button>
        <a
          :href="goUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-full bg-accent px-5 font-bold text-white"
        >
          <AppIcon
            name="pin"
            :size="18"
          />
          Go
        </a>
      </template>
      <template v-else>
        <p class="flex-1 px-3 font-hand text-2xl leading-tight text-accent-ink">that was the whole day</p>
        <RouterLink
          v-if="props.homeTarget"
          :to="props.homeTarget"
          class="inline-flex h-12 shrink-0 items-center gap-2 rounded-full bg-accent px-5 font-bold text-white"
        >
          <AppIcon
            name="home"
            :size="18"
          />
          Take us home
        </RouterLink>
      </template>
    </div>
  </div>
</template>
