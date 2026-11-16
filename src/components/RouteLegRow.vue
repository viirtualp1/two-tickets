<script setup lang="ts">
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import type { LegMode } from '../data/trip';
import type { LegRow } from '../lib/route';

const props = defineProps<{
  row: LegRow;
}>();

const RAILS: Record<LegMode, string> = {
  metro: 'w-[3px] bg-accent',
  walk: 'border-l-[3px] border-dotted border-accent/60',
  flight: 'border-l-2 border-dashed border-muted/50',
  transfer: 'border-l-[3px] border-dotted border-muted/50'
};

const LABELS: Record<LegMode, string> = {
  metro: 'Metro',
  walk: 'Walk',
  flight: 'Flight',
  transfer: 'Transfer'
};

const rail = computed(() => RAILS[props.row.mode]);
const iconTone = computed(() => (props.row.mode === 'metro' || props.row.mode === 'walk' ? 'text-accent-ink' : 'text-muted'));
</script>

<template>
  <li class="grid grid-cols-[44px_1fr_auto] items-center gap-3">
    <span class="relative flex min-h-14 justify-center self-stretch">
      <span
        class="absolute inset-y-0 left-1/2 -translate-x-1/2"
        :class="rail"
        aria-hidden="true"
      />
      <span
        class="relative z-10 grid size-9 place-items-center self-center rounded-full bg-paper"
        :class="iconTone"
      >
        <AppIcon
          :name="props.row.mode"
          :label="LABELS[props.row.mode]"
          :size="19"
        />
      </span>
    </span>
    <span class="py-2 text-sm leading-snug text-muted">
      <span class="font-bold text-ink">{{ props.row.text }}</span>
      <template v-if="props.row.detail"> · {{ props.row.detail }}</template>
    </span>
    <span
      v-if="props.row.at"
      class="font-hand text-[22px] leading-none"
    >{{ props.row.at }}</span>
  </li>
</template>
