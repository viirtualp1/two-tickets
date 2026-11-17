<template>
  <main class="mx-auto box-border grid h-dvh min-h-0 max-w-md grid-rows-[auto_auto_minmax(0,1fr)] gap-3 overflow-clip px-4 pt-[max(16px,env(safe-area-inset-top))] pb-(--tab-clearance)">
    <header class="flex min-w-0 items-center justify-between gap-3 px-1">
      <p class="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight">
        <img
          :src="appIcon"
          alt=""
          class="size-8"
        >
        two tickets
      </p>
      <p class="text-right text-sm leading-tight font-semibold text-muted">{{ dateRange }}</p>
    </header>

    <LiveStopCard
      v-if="today"
      :key="`${plan.id}:${today.id}`"
      :plan="plan"
      :day="today"
      :day-number="clock.dayIndex + 1"
      :minutes="clock.minutes"
    />

    <div
      v-else
      class="lift"
    >
      <section
        class="relative overflow-hidden rounded-[28px] bg-card ticket-tall [--cut:clamp(102px,19dvh,158px)] [--notch:10px] short:[--cut:72px]"
        aria-labelledby="hero-title"
      >
        <div class="relative flex h-(--cut) flex-col px-5 pt-4">
          <img
            v-if="skyline"
            :src="skyline"
            alt=""
            class="pointer-events-none absolute inset-x-0 bottom-0 size-full mask-[linear-gradient(to_bottom,transparent_3%,#000_86%)] object-contain object-bottom"
          >
          <h1
            v-if="clock.phase === 'before'"
            id="hero-title"
            class="relative flex items-center gap-3"
          >
            <span class="shrink-0 text-[clamp(58px,10dvh,82px)] leading-none font-extrabold tracking-tighter text-accent-ink tabular-nums short:text-[46px]">{{ clock.daysToGo }}</span>
            <span class="min-w-0 text-xl leading-tight font-bold wrap-break-word">
              {{ clock.daysToGo === 1 ? 'sleep' : 'sleeps' }} till<br>{{ firstDay.cityName }}
            </span>
          </h1>
          <template v-else-if="clock.phase === 'after'">
            <p class="relative font-hand text-2xl leading-none text-accent-ink">we did it</p>
            <h1
              id="hero-title"
              class="relative mt-1 text-[28px] leading-none font-extrabold tracking-tight"
            >
              {{ plan.days.length }} {{ plan.days.length === 1 ? 'day' : 'days' }}, {{ placesTogether }} places, one us.
            </h1>
          </template>
          <div
            v-else
            class="relative"
          >
            <p class="font-hand text-2xl leading-none text-accent-ink">a day to explore</p>
            <h1
              id="hero-title"
              class="mt-1 text-[30px] leading-none font-extrabold tracking-tight"
            >
              No stops planned today
            </h1>
          </div>
        </div>
        <div class="relative mx-5 border-t-2 border-dashed border-line py-3">
          <dl
            v-if="original && clock.phase === 'before'"
            class="grid grid-cols-2 gap-3 text-sm"
          >
            <div>
              <dt class="text-[10px] font-bold tracking-[0.12em] text-muted uppercase">Route</dt>
              <dd class="font-bold">SHA → HKG</dd>
            </div>
            <div>
              <dt class="text-[10px] font-bold tracking-[0.12em] text-muted uppercase">Lands</dt>
              <dd class="font-bold">Sun 18:45</dd>
            </div>
          </dl>
          <RouterLink
            v-else
            :to="{ name: 'days' }"
            class="flex min-h-11 items-center justify-between gap-3 font-bold"
          >
            <span class="truncate">{{ plan.title }}</span>
            <span class="shrink-0 text-sm text-accent-ink">View days</span>
          </RouterLink>
        </div>
      </section>
    </div>

    <TripChecklist
      :key="plan.id"
      class="[&_ul]:flex-1"
      :trip-id="plan.id"
      :heading="clock.phase === 'before' ? 'Before we go' : 'Trip checklist'"
    />
  </main>
</template>

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

  if (start === end) {
    return `${label(start)} ${year}`;
  }
  if (start.slice(0, 7) === end.slice(0, 7)) {
    return `${firstDay.value.date}–${label(end)} ${year}`;
  }
  return `${label(start)}${start.slice(0, 4) === year ? '' : ' ' + start.slice(0, 4)} – ${label(end)} ${year}`;
});
</script>
