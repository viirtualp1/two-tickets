<template>
  <li class="grid grid-cols-[44px_1fr] gap-3">
    <span class="relative flex justify-center">
      <span
        class="absolute inset-y-0 left-1/2 w-0.5 -translate-x-1/2 bg-line"
        aria-hidden="true"
      />
      <button
        type="button"
        class="relative z-10 mt-2.5 grid size-11 place-items-center"
        :aria-pressed="props.row.visited"
        :aria-label="`We’ve been to ${props.row.name}`"
        @click="emit('toggle')"
      >
        <span
          class="grid size-7 place-items-center rounded-full border-2 transition"
          :class="ring"
        >
          <AppIcon
            name="check"
            :size="15"
            :stroke="3"
          />
        </span>
      </button>
    </span>
    <button
      type="button"
      class="my-1.5 flex w-full flex-col gap-1 rounded-[22px] px-4 py-3 text-left transition"
      :class="card"
      @click="emit('open')"
    >
      <span
        v-if="props.row.isNext"
        class="font-hand text-[22px] leading-none text-accent-ink"
      >next up</span>
      <span class="flex items-baseline justify-between gap-3">
        <span
          class="flex items-baseline gap-1.5 text-base leading-snug font-bold"
          :class="props.row.visited ? 'text-muted line-through decoration-muted/40' : ''"
        >
          <AppIcon
            v-if="props.row.isHotel"
            name="home"
            :size="16"
            class="translate-y-0.5 text-accent-ink"
          />
          {{ props.row.name }}
        </span>
        <span
          v-if="props.row.at"
          class="font-hand text-[22px] leading-none whitespace-nowrap"
        >{{ props.row.at }}</span>
      </span>
      <span
        v-if="showZh"
        class="text-sm text-muted"
      >{{ props.row.zh }}</span>
      <span
        v-if="props.row.status"
        class="text-[13px]"
      >
        <span
          class="font-bold"
          :class="TONES[props.row.status.tone]"
        >{{ props.row.status.text }}</span>
        <span class="text-muted"> · {{ props.row.hours }}</span>
      </span>
      <span
        v-if="props.row.note"
        class="text-[13px] leading-snug text-muted"
      >{{ props.row.note }}</span>
    </button>
  </li>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import type { OpenTone } from '../lib/hours';
import type { StopRow } from '../lib/route';

const props = defineProps<{
  row: StopRow
}>();

const emit = defineEmits<{
  toggle: []
  open: []
}>();

const TONES: Record<OpenTone, string> = {
  open: 'text-open',
  soon: 'text-soon',
  later: 'text-muted',
  closed: 'text-muted'
};

const ring = computed(() => {
  if (props.row.visited) {
    return 'border-accent bg-accent text-white';
  }

  return props.row.isNext ? 'animate-breathe border-accent bg-card text-transparent' : 'border-muted/60 bg-card text-transparent';
});

const card = computed(() => {
  if (props.row.isNext) {
    return 'bg-card ring-2 ring-accent shadow-[0_6px_18px_rgb(120_70_60/0.10)]';
  }

  return props.row.visited ? 'bg-transparent' : 'bg-card/70';
});

const showZh = computed(() => Boolean(props.row.zh) && props.row.zh !== props.row.name);
</script>
