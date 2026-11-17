<template>
  <RouterLink
    :to="dayLink(props.plan, props.day)"
    class="block rounded-3xl lift"
  >
    <span
      class="relative grid min-h-24 grid-cols-[88px_1fr] rounded-3xl bg-card ticket"
      :class="props.isToday ? 'ring-2 ring-inset ring-accent' : ''"
    >
      <span class="flex flex-col items-center justify-center py-3">
        <span class="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">{{ props.day.weekday }}</span>
        <span class="text-[34px] leading-none font-extrabold tabular-nums">{{ props.day.date }}</span>
        <span class="text-[11px] font-bold tracking-[0.12em] text-muted uppercase">{{ dayDate(props.day.isoDate, { month: 'short' }) }}</span>
      </span>
      <span
        class="absolute inset-y-3 left-[87px] border-l-2 border-dashed border-line"
        aria-hidden="true"
      />
      <span class="flex min-w-0 flex-col gap-1 py-3.5 pr-5 pl-4">
        <span class="flex items-baseline justify-between gap-3">
          <span class="text-[17px] leading-snug font-bold">{{ props.day.title }}</span>
          <span class="shrink-0 text-xs text-muted">{{ progressText }}</span>
        </span>
        <span class="text-[13px] leading-snug text-muted">{{ props.day.areas }}</span>
        <span
          v-if="props.isToday"
          class="font-hand text-xl leading-none text-accent-ink"
        >today</span>
        <span
          v-if="props.progress.done"
          class="mt-1.5 block h-1 overflow-hidden rounded-full bg-tint"
          aria-hidden="true"
        >
          <span
            class="block h-full rounded-full bg-accent"
            :style="{ width: progressWidth }"
          />
        </span>
      </span>
    </span>
  </RouterLink>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import { dayDate, dayLink } from '../lib/plan';
import type { PlanDay, TripPlan } from '../lib/plan';
import type { DayProgress } from '../lib/route';

const props = defineProps<{
  plan: TripPlan
  day: PlanDay
  progress: DayProgress
  isToday: boolean
}>();

const progressText = computed(() => {
  const { done, total } = props.progress;

  if (done) {
    return `${done} of ${total}`;
  }

  return total === 1 ? '1 place' : `${total} places`;
});

const progressWidth = computed(() => `${props.progress.total ? (props.progress.done / props.progress.total) * 100 : 0}%`);
</script>
