<template>
  <nav
    ref="strip"
    aria-label="Trip days"
    class="relative flex gap-1 overflow-x-auto"
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
        class="text-[10px] font-bold tracking-wide uppercase"
        :class="index === props.activeIndex ? 'text-accent-ink' : 'text-muted'"
      >{{ day.weekday }}</span>
      <span class="text-lg leading-none font-bold tabular-nums">{{ day.date }}</span>
    </RouterLink>
  </nav>
</template>

<script setup lang="ts">
import { nextTick, onMounted, useTemplateRef, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { dayDate, dayLink } from '../lib/plan';
import type { TripPlan } from '../lib/plan';

const props = defineProps<{
  activeIndex: number
  plan: TripPlan
}>();

const strip = useTemplateRef<HTMLElement>('strip');

async function centreActiveDay (behavior: ScrollBehavior) {
  await nextTick();

  const active = strip.value?.querySelector<HTMLElement>('[aria-current="page"]');

  if (!strip.value || !active) {
    return;
  }

  strip.value.scrollTo({ left: active.offsetLeft - (strip.value.clientWidth - active.offsetWidth) / 2, behavior });
}

watch(() => props.activeIndex, () => {
  centreActiveDay('smooth');
});

onMounted(() => {
  centreActiveDay('instant');
});
</script>
