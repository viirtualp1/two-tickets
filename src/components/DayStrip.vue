<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { TRIP_DAYS } from '../data/trip';

const props = defineProps<{
  activeIndex: number;
}>();
</script>

<template>
  <nav
    aria-label="Trip days"
    class="flex justify-between"
  >
    <RouterLink
      v-for="(day, index) in TRIP_DAYS"
      :key="day.date"
      :to="`/day/${index + 1}`"
      replace
      class="flex h-14 w-[42px] flex-col items-center justify-center rounded-full border-2 transition"
      :class="index === props.activeIndex ? 'border-accent bg-card' : 'border-transparent'"
      :aria-current="index === props.activeIndex ? 'page' : undefined"
      :aria-label="`${day.weekday} ${day.date} December`"
    >
      <span
        class="text-[10px] font-bold uppercase tracking-wide"
        :class="index === props.activeIndex ? 'text-accent-ink' : 'text-muted'"
      >{{ day.weekday }}</span>
      <span class="text-lg font-bold leading-none tabular-nums">{{ day.date }}</span>
    </RouterLink>
  </nav>
</template>
