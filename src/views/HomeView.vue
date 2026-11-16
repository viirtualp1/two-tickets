<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import DayTicket from '../components/DayTicket.vue';
import { CITY_NAMES, HOTELS, PREP, TRIP_DAYS } from '../data/trip';
import { useProgress } from '../composables/useProgress';
import { useTripClock } from '../composables/useTripClock';
import { buildRoute, dayProgress } from '../lib/route';
import type { City } from '../data/trip';
import appIcon from '../assets/icon.svg';
import skylineShanghai from '../assets/art/skyline-shanghai.png';
import skylineHongKong from '../assets/art/skyline-hongkong.png';

const HOTEL_CITIES: City[] = ['sh', 'hk'];
const FLIGHT_DAY_INDEX = 6;

const clock = useTripClock();
const { visited, prep, togglePrep } = useProgress();

const phase = computed(() => {
  if (clock.value.dayIndex < 0) {
    return 'before';
  }

  return clock.value.dayIndex < TRIP_DAYS.length ? 'during' : 'after';
});

const daysToGo = computed(() => -clock.value.dayIndex);
const today = computed(() => (phase.value === 'during' ? TRIP_DAYS[clock.value.dayIndex] ?? null : null));
const todayNext = computed(() => (today.value ? buildRoute(clock.value.dayIndex, clock.value.minutes, visited.value).next : null));
const progress = computed(() => TRIP_DAYS.map((_, index) => dayProgress(index, visited.value)));
const placesTogether = computed(() => progress.value.reduce((sum, day) => sum + day.done, 0));
const prepDone = computed(() => PREP.filter(item => prep.value[item.id]).length);
const skyline = computed(() => (today.value?.city === 'hk' ? skylineHongKong : skylineShanghai));
</script>

<template>
  <main class="mx-auto flex max-w-md flex-col gap-10 px-4 pb-16 pt-[max(20px,env(safe-area-inset-top))]">
    <header class="flex items-center justify-between px-1">
      <p class="flex items-center gap-2 text-lg font-extrabold tracking-tight">
        <img
          :src="appIcon"
          alt=""
          class="size-8"
        >
        two tickets
      </p>
      <p class="text-sm font-semibold text-muted">6–13 Dec 2026</p>
    </header>

    <div class="lift">
      <section
        class="ticket-tall relative overflow-hidden rounded-[32px] bg-card"
        style="--cut: 252px"
        aria-labelledby="hero-title"
      >
        <div class="relative flex h-[252px] flex-col px-6 pt-6">
          <img
            :src="skyline"
            alt=""
            class="pointer-events-none absolute inset-x-0 bottom-1 w-full opacity-80"
          >
          <template v-if="phase === 'before'">
            <p class="relative font-hand text-2xl leading-none text-accent-ink">our anniversary trip</p>
            <h1
              id="hero-title"
              class="relative mt-2"
            >
              <span class="align-baseline text-[88px] font-extrabold leading-[0.85] tracking-tighter text-accent-ink tabular-nums">{{ daysToGo }}</span>
              <span class="ml-3 inline-block align-baseline text-xl font-bold leading-tight">{{ daysToGo === 1 ? 'sleep' : 'sleeps' }} till<br>Shanghai</span>
            </h1>
          </template>
          <template v-else-if="phase === 'during' && today">
            <p class="relative font-hand text-2xl leading-none text-accent-ink">day {{ clock.dayIndex + 1 }} of {{ TRIP_DAYS.length }}</p>
            <h1
              id="hero-title"
              class="relative mt-2 text-[34px] font-extrabold leading-[1.02] tracking-tight"
            >
              {{ today.title }}
            </h1>
            <p
              v-if="todayNext"
              class="relative mt-2 text-[15px] text-muted"
            >
              Next: <span class="font-semibold text-ink">{{ todayNext.name }}</span>
            </p>
          </template>
          <template v-else>
            <p class="relative font-hand text-2xl leading-none text-accent-ink">we did it</p>
            <h1
              id="hero-title"
              class="relative mt-2 text-[34px] font-extrabold leading-[1.02] tracking-tight"
            >
              8 days, {{ placesTogether }} places, one us.
            </h1>
          </template>
        </div>

        <span
          class="absolute inset-x-5 top-[252px] border-t-2 border-dashed border-line"
          aria-hidden="true"
        />

        <div class="relative px-6 pb-6 pt-5">
          <dl
            v-if="phase !== 'during'"
            class="grid grid-cols-2 gap-3"
          >
            <div>
              <dt class="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Route</dt>
              <dd class="mt-0.5 font-bold">SHA → HKG</dd>
            </div>
            <div>
              <dt class="text-[11px] font-bold uppercase tracking-[0.12em] text-muted">Lands</dt>
              <dd class="mt-0.5 font-bold">Sun 18:45</dd>
            </div>
          </dl>
          <RouterLink
            v-else
            :to="`/day/${clock.dayIndex + 1}`"
            class="flex h-13 items-center justify-center gap-2 rounded-full bg-accent font-bold text-white"
          >
            Open today
            <AppIcon
              name="forward"
              :size="18"
            />
          </RouterLink>
        </div>
      </section>
    </div>

    <section
      v-if="phase === 'before'"
      aria-labelledby="prep-title"
    >
      <div class="flex items-baseline justify-between px-1">
        <h2
          id="prep-title"
          class="text-2xl font-extrabold tracking-tight"
        >
          Before we go
        </h2>
        <p class="text-sm text-muted">{{ prepDone }} of {{ PREP.length }} sorted</p>
      </div>
      <ul class="mt-3 divide-y divide-line rounded-3xl bg-card px-2">
        <li
          v-for="item in PREP"
          :key="item.id"
        >
          <button
            type="button"
            class="flex w-full items-start gap-3 px-2 py-3.5 text-left"
            :aria-pressed="Boolean(prep[item.id])"
            @click="togglePrep(item.id)"
          >
            <span
              class="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border-2 transition"
              :class="prep[item.id] ? 'border-accent bg-accent text-white' : 'border-muted/60 text-transparent'"
            >
              <AppIcon
                name="check"
                :size="14"
                :stroke="3"
              />
            </span>
            <span class="flex flex-col gap-0.5">
              <span
                class="font-bold leading-snug"
                :class="prep[item.id] ? 'text-muted line-through decoration-muted/50' : ''"
              >{{ item.title }}</span>
              <span class="text-[13px] leading-snug text-muted">{{ item.why }}</span>
            </span>
          </button>
        </li>
      </ul>
    </section>

    <section aria-labelledby="days-title">
      <h2
        id="days-title"
        class="px-1 text-2xl font-extrabold tracking-tight"
      >
        Eight days
      </h2>
      <ol class="mt-3 flex flex-col gap-3">
        <template
          v-for="(day, index) in TRIP_DAYS"
          :key="day.date"
        >
          <li
            v-if="index === FLIGHT_DAY_INDEX"
            class="flex items-center gap-3 px-2 pt-3 text-muted"
            aria-hidden="true"
          >
            <span class="h-0 flex-1 border-t-2 border-dotted border-muted/40" />
            <AppIcon
              name="flight"
              :size="18"
            />
            <span class="font-hand text-2xl leading-none">then Hong Kong</span>
            <span class="h-0 flex-1 border-t-2 border-dotted border-muted/40" />
          </li>
          <li>
            <DayTicket
              :number="index + 1"
              :day="day"
              :progress="progress[index]!"
              :is-today="clock.dayIndex === index"
            />
          </li>
        </template>
      </ol>
    </section>

    <section aria-labelledby="taxi-title">
      <h2
        id="taxi-title"
        class="px-1 text-2xl font-extrabold tracking-tight"
      >
        Taxi cards
      </h2>
      <p class="mt-1 px-1 text-sm text-muted">Our hotels in big Chinese letters, to show a driver.</p>
      <ul class="mt-3 flex flex-col gap-3">
        <li
          v-for="city in HOTEL_CITIES"
          :key="city"
        >
          <RouterLink
            :to="`/taxi/hotel-${city}`"
            class="flex min-h-16 items-center gap-4 rounded-3xl bg-card px-5 py-4"
          >
            <AppIcon
              name="home"
              :size="22"
              class="text-accent-ink"
            />
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="font-bold">{{ HOTELS[city].short }}</span>
              <span class="text-[13px] text-muted">{{ CITY_NAMES[city] }} · {{ HOTELS[city].nights }}</span>
            </span>
            <AppIcon
              name="forward"
              :size="18"
              class="text-muted"
            />
          </RouterLink>
        </li>
      </ul>
    </section>

    <p class="text-center font-hand text-2xl text-muted">two tickets, one us</p>
  </main>
</template>
