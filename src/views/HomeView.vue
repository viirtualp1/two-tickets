<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import DayTicket from '../components/DayTicket.vue';
import TripChecklist from '../components/TripChecklist.vue';
import { usePlans } from '../composables/usePlans';
import { dayDate, dayLink, hotelFor, hotelTarget, ORIGINAL_ID, taxiLink } from '../lib/plan';
import { useProgress } from '../composables/useProgress';
import { useTripClock } from '../composables/useTripClock';
import { buildRoute, dayProgress } from '../lib/route';
import appIcon from '../assets/icon.svg';
import skylineShanghai from '../assets/art/skyline-shanghai.png';
import skylineHongKong from '../assets/art/skyline-hongkong.png';

const { activePlan: plan, plans, selectPlan } = usePlans();
const clock = useTripClock(() => plan.value);
const { visited } = useProgress(() => plan.value);
const phase = computed(() => clock.value.phase);
const daysToGo = computed(() => clock.value.daysToGo);
const today = computed(() => plan.value.days[clock.value.dayIndex]);
const todayNext = computed(() => today.value ? buildRoute(plan.value, today.value, clock.value.minutes, visited.value).next : null);
const progress = computed(() => plan.value.days.map(day => dayProgress(day, visited.value)));
const placesTogether = computed(() => progress.value.reduce((sum, day) => sum + day.done, 0));
const heroCity = computed(() => today.value?.city ?? plan.value.days[0]!.city);
const skyline = computed(() => heroCity.value === 'hk' ? skylineHongKong : heroCity.value === 'sh' ? skylineShanghai : '');
const hotels = computed(() => {
  const unique = new Map();
  for (const day of plan.value.days) {
    const hotel = hotelFor(plan.value, day);
    const key = `${day.cityName}:${hotel?.name}:${hotel?.near}`;
    if (hotel && !unique.has(key)) unique.set(key, { hotel, target: hotelTarget(day), city: day.cityName });
  }
  return [...unique.values()];
});
const original = computed(() => plan.value.id === ORIGINAL_ID);
const dateRange = computed(() => {
  if (original.value) return '6–13 Dec 2026';
  const start = plan.value.days[0]!.isoDate;
  const end = plan.value.days.at(-1)!.isoDate;
  const label = (date: string) => dayDate(date, { day: 'numeric', month: 'short', year: 'numeric' });
  return start === end ? label(start) : `${label(start)} – ${label(end)}`;
});
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
      <p class="text-sm font-semibold text-muted">{{ dateRange }}</p>
    </header>

    <div class="flex flex-wrap gap-2">
      <select v-if="plans.length > 1" :value="plan.id" aria-label="Current trip"
        class="min-h-11 min-w-0 flex-1 rounded-full bg-card px-4 font-bold"
        @change="selectPlan(($event.target as HTMLSelectElement).value)">
        <option v-for="trip in plans" :key="trip.id" :value="trip.id">{{ trip.title }}</option>
      </select>
      <RouterLink to="/import" class="inline-flex min-h-11 items-center rounded-full bg-tint px-4 font-bold text-accent-ink">Import trip</RouterLink>
      <RouterLink v-if="!original" :to="{ name: 'import', query: { trip: plan.id } }"
        class="inline-flex min-h-11 items-center rounded-full bg-card px-4 font-bold">Edit trip</RouterLink>
      <RouterLink to="/sync" class="inline-flex min-h-11 items-center rounded-full bg-card px-4 font-bold">Sync devices</RouterLink>
    </div>
    <div class="lift">
      <section
        class="ticket-tall relative overflow-hidden rounded-[32px] bg-card"
        style="--cut: 252px"
        aria-labelledby="hero-title"
      >
        <div class="relative flex h-[252px] flex-col px-6 pt-6">
          <img
            v-if="skyline"
            :src="skyline"
            alt=""
            class="pointer-events-none absolute inset-x-0 bottom-1 w-full opacity-80"
          >
          <template v-if="phase === 'before'">
            <h1
              id="hero-title"
              class="relative mt-3"
            >
              <span class="align-baseline text-[88px] font-extrabold leading-[0.85] tracking-tighter text-accent-ink tabular-nums">{{ daysToGo }}</span>
              <span class="ml-3 inline-block align-baseline text-xl font-bold leading-tight">{{ daysToGo === 1 ? 'sleep' : 'sleeps' }} till<br>{{ plan.days[0]!.cityName }}</span>
            </h1>
          </template>
          <template v-else-if="phase === 'during' && today">
            <p class="relative font-hand text-2xl leading-none text-accent-ink">day {{ clock.dayIndex + 1 }} of {{ plan.days.length }}</p>
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
          <h1 v-else-if="phase === 'during'" id="hero-title" class="text-[34px] font-extrabold">{{ plan.title }}</h1>
          <template v-else>
            <p class="relative font-hand text-2xl leading-none text-accent-ink">we did it</p>
            <h1
              id="hero-title"
              class="relative mt-2 text-[34px] font-extrabold leading-[1.02] tracking-tight"
            >
              {{ plan.days.length }} {{ plan.days.length === 1 ? 'day' : 'days' }}, {{ placesTogether }} places, one us.
            </h1>
          </template>
        </div>

        <span
          class="absolute inset-x-5 top-[252px] border-t-2 border-dashed border-line"
          aria-hidden="true"
        />

        <div class="relative px-6 pb-6 pt-5">
          <dl
            v-if="original && phase !== 'during'"
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
            v-else-if="today"
            :to="dayLink(plan, today)"
            class="flex h-13 items-center justify-center gap-2 rounded-full bg-accent font-bold text-white"
          >
            Open today
            <AppIcon
              name="forward"
              :size="18"
            />
          </RouterLink>
          <p v-else class="font-bold">{{ plan.title }}</p>
        </div>
      </section>
    </div>

    <TripChecklist :key="plan.id" :trip-id="plan.id" :heading="phase === 'before' ? 'Before we go' : 'Trip checklist'" />

    <section aria-labelledby="days-title">
      <h2
        id="days-title"
        class="px-1 text-2xl font-extrabold tracking-tight"
      >
        {{ original ? 'Eight days' : 'Trip days' }}
      </h2>
      <ol class="mt-3 flex flex-col gap-3">
        <template
          v-for="(day, index) in plan.days"
          :key="day.id"
        >
          <li
            v-if="original && index === 6"
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
              :plan="plan"
              :day="day"
              :progress="progress[index]!"
              :is-today="clock.dayIndex === index"
            />
          </li>
        </template>
      </ol>
    </section>

    <section v-if="hotels.length" aria-labelledby="taxi-title">
      <h2
        id="taxi-title"
        class="px-1 text-2xl font-extrabold tracking-tight"
      >
        Taxi cards
      </h2>
      <p class="mt-1 px-1 text-sm text-muted">Our hotels in big Chinese letters, to show a driver.</p>
      <ul class="mt-3 flex flex-col gap-3">
        <li
          v-for="{ hotel, city, target } in hotels"
          :key="target"
        >
          <RouterLink
            :to="taxiLink(plan, target)"
            class="flex min-h-16 items-center gap-4 rounded-3xl bg-card px-5 py-4"
          >
            <AppIcon
              name="home"
              :size="22"
              class="text-accent-ink"
            />
            <span class="flex min-w-0 flex-1 flex-col">
              <span class="font-bold">{{ hotel?.short }}</span>
              <span class="text-[13px] text-muted">{{ original ? `${city} · ${hotel.nights}` : city }}</span>
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
