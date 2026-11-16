<script setup lang="ts">
import { computed } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import DayTicket from '../components/DayTicket.vue';
import { usePlans } from '../composables/usePlans';
import { useProgress } from '../composables/useProgress';
import { useTripClock } from '../composables/useTripClock';
import { hotelFor, hotelTarget, ORIGINAL_ID, taxiLink } from '../lib/plan';
import { dayProgress } from '../lib/route';
import type { Hotel } from '../data/trip';

const { activePlan: plan } = usePlans();
const { visited } = useProgress(() => plan.value);
const clock = useTripClock(() => plan.value);
const original = computed(() => plan.value.id === ORIGINAL_ID);
const progress = computed(() => plan.value.days.map(day => dayProgress(day, visited.value)));
const hotels = computed(() => {
  const unique = new Map<string, { hotel: Hotel; target: string; city: string }>();
  for (const day of plan.value.days) {
    const hotel = hotelFor(plan.value, day);
    if (!hotel) continue;

    const key = `${day.cityName}:${hotel.name}:${hotel.near}`;
    if (!unique.has(key)) unique.set(key, { hotel, target: hotelTarget(day), city: day.cityName });
  }
  return [...unique.values()];
});
</script>

<template>
  <main class="mx-auto flex max-w-md flex-col gap-7 px-4 pb-[var(--tab-clearance)] pt-[max(18px,env(safe-area-inset-top))]">
    <header class="px-1">
      <h1 class="text-[36px] font-extrabold leading-tight tracking-tight">Days</h1>
      <p class="mt-0.5 text-sm font-semibold text-muted">{{ plan.title }}</p>
    </header>

    <section aria-label="Trip itinerary">
      <ol class="flex flex-col gap-3">
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
      <p class="mt-1 px-1 text-sm text-muted">Hotel names and addresses to show a driver.</p>
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
              <span class="font-bold">{{ hotel.short }}</span>
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

  </main>
</template>
