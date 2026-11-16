<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { dayDate, dayLink } from '../lib/plan';
import type { TripPlan } from '../lib/plan';

const props = defineProps<{
  activeIndex: number;
  plan: TripPlan;
}>();
</script>

<template>
  <nav
    aria-label="Trip days"
    class="flex gap-1 overflow-x-auto"
  >
    <RouterLink
      v-for="(day, index) in props.plan.days"
      :key="day.id"
      :to="dayLink(props.plan, day)"
      replace
      class="flex h-14 w-[42px] shrink-0 flex-col items-center justify-center rounded-full border-2 transition"
      :class="index === props.activeIndex ? 'border-accent bg-card' : 'border-transparent'"
      :aria-current="index === props.activeIndex ? 'page' : undefined"
      :aria-label="dayDate(day.isoDate, { weekday: 'long', day: 'numeric', month: 'long' })"
    >
      <span
        class="text-[10px] font-bold uppercase tracking-wide"
        :class="index === props.activeIndex ? 'text-accent-ink' : 'text-muted'"
      >{{ day.weekday }}</span>
      <span class="text-lg font-bold leading-none tabular-nums">{{ day.date }}</span>
    </RouterLink>
  </nav>
</template>
