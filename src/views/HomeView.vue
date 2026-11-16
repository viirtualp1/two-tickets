<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import TripChecklist from '../components/TripChecklist.vue';
import LiveStopCard from '../components/LiveStopCard.vue';
import { usePlans } from '../composables/usePlans';
import { useProgress } from '../composables/useProgress';
import { useTripClock } from '../composables/useTripClock';
import { dayDate, ORIGINAL_ID } from '../lib/plan';
import { dayProgress } from '../lib/route';
import appIcon from '../assets/icon.svg';
import skylineShanghai from '../assets/art/skyline-shanghai.png';
import skylineHongKong from '../assets/art/skyline-hongkong.png';

const { activePlan: plan } = usePlans();
const clock = useTripClock(() => plan.value);
const { visited } = useProgress(() => plan.value);
const today = computed(() => plan.value.days[clock.value.dayIndex]);
const firstDay = computed(() => plan.value.days[0]!);
const lastDay = computed(() => plan.value.days.at(-1)!);
const original = computed(() => plan.value.id === ORIGINAL_ID);
const skyline = computed(() => {
  const city = clock.value.phase === 'after' ? lastDay.value.city : firstDay.value.city;
  return city === 'hk' ? skylineHongKong : city === 'sh' ? skylineShanghai : '';
});
const placesTogether = computed(() => plan.value.days.reduce((sum, day) => sum + dayProgress(day, visited.value).done, 0));
const dateRange = computed(() => {
  const start = firstDay.value.isoDate;
  const end = lastDay.value.isoDate;
  const label = (date: string) => dayDate(date, { day: 'numeric', month: 'short' });
  const year = end.slice(0, 4);

  if (start === end) return `${label(start)} ${year}`;
  if (start.slice(0, 7) === end.slice(0, 7)) return `${firstDay.value.date}–${label(end)} ${year}`;
  return `${label(start)}${start.slice(0, 4) === year ? '' : ' ' + start.slice(0, 4)} – ${label(end)} ${year}`;
});
</script>

<template>
  <main class="home-layout mx-auto grid h-dvh max-w-md grid-rows-[auto_auto_minmax(0,1fr)] gap-3 px-4 pb-[var(--tab-clearance)] pt-[max(16px,env(safe-area-inset-top))]">
    <header class="flex min-w-0 items-center justify-between gap-3 px-1">
      <p class="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight">
        <img :src="appIcon" alt="" class="size-8">
        two tickets
      </p>
      <p class="text-right text-sm font-semibold leading-tight text-muted">{{ dateRange }}</p>
    </header>

    <LiveStopCard
      v-if="today"
      :key="`${plan.id}:${today.id}`"
      :plan="plan"
      :day="today"
      :day-number="clock.dayIndex + 1"
      :minutes="clock.minutes"
    />

    <div v-else class="lift">
      <section class="countdown-ticket ticket-tall relative overflow-hidden rounded-[28px] bg-card" aria-labelledby="hero-title">
        <div class="relative flex h-[var(--cut)] flex-col px-5 pt-4">
          <img v-if="skyline" :src="skyline" alt="" class="countdown-art pointer-events-none absolute inset-x-0 bottom-0 h-full w-full object-contain object-bottom">
          <h1 v-if="clock.phase === 'before'" id="hero-title" class="relative flex items-center gap-3">
            <span class="countdown-number shrink-0 font-extrabold leading-none tracking-tighter text-accent-ink tabular-nums">{{ clock.daysToGo }}</span>
            <span class="min-w-0 text-xl font-bold leading-tight wrap-break-word">
              {{ clock.daysToGo === 1 ? 'sleep' : 'sleeps' }} till<br>{{ firstDay.cityName }}
            </span>
          </h1>
          <template v-else-if="clock.phase === 'after'">
            <p class="relative font-hand text-2xl leading-none text-accent-ink">we did it</p>
            <h1 id="hero-title" class="relative mt-1 text-[28px] font-extrabold leading-none tracking-tight">
              {{ plan.days.length }} {{ plan.days.length === 1 ? 'day' : 'days' }}, {{ placesTogether }} places, one us.
            </h1>
          </template>
          <div v-else class="relative">
            <p class="font-hand text-2xl leading-none text-accent-ink">a day to explore</p>
            <h1 id="hero-title" class="mt-1 text-[30px] font-extrabold leading-none tracking-tight">No stops planned today</h1>
          </div>
        </div>
        <div class="relative mx-5 border-t-2 border-dashed border-line py-3">
          <dl v-if="original && clock.phase === 'before'" class="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt class="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Route</dt>
              <dd class="font-bold">SHA → HKG</dd>
            </div>
            <div>
              <dt class="text-[10px] font-bold uppercase tracking-[0.12em] text-muted">Lands</dt>
              <dd class="font-bold">Sun 18:45</dd>
            </div>
          </dl>
          <RouterLink v-else :to="{ name: 'days' }" class="flex min-h-11 items-center justify-between gap-3 font-bold">
            <span class="truncate">{{ plan.title }}</span>
            <span class="shrink-0 text-sm text-accent-ink">View days</span>
          </RouterLink>
        </div>
      </section>
    </div>

    <TripChecklist class="home-checklist" :key="plan.id" :trip-id="plan.id" :heading="clock.phase === 'before' ? 'Before we go' : 'Trip checklist'" />
  </main>
</template>

<style scoped>
.home-layout {
  box-sizing: border-box;
  height: 100dvh;
  min-height: 0;
  grid-template-rows: auto auto minmax(0, 1fr);
  overflow: clip;
}

.home-checklist :deep(ul) {
  flex: 1 1 0;
}

@media (max-height: 420px) {
  .countdown-ticket {
    --cut: 72px;
  }

  .countdown-number {
    font-size: 46px;
  }
}
</style>
