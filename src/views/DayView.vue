<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { RouterLink, useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import DayStrip from '../components/DayStrip.vue';
import NextUpBar from '../components/NextUpBar.vue';
import PlaceSheet from '../components/PlaceSheet.vue';
import RouteLegRow from '../components/RouteLegRow.vue';
import RouteStopRow from '../components/RouteStopRow.vue';
import TimeControl from '../components/TimeControl.vue';
import { useRoutePlan } from '../composables/usePlans';
import { dayDate, dayPosition, hotelFor, hotelTarget, originalPlan, taxiLink } from '../lib/plan';
import { toMinutes } from '../lib/hours';
import { useProgress } from '../composables/useProgress';
import { useTripClock } from '../composables/useTripClock';
import { hasBackEntry } from '../lib/history';
import { buildRoute } from '../lib/route';
import type { StopRow } from '../lib/route';
import skylineShanghai from '../assets/art/skyline-shanghai.png';
import skylineHongKong from '../assets/art/skyline-hongkong.png';
import eggTart from '../assets/art/eggtart.png';
import dimSum from '../assets/art/dimsum.png';
import eggWaffle from '../assets/art/eggwaffle.png';

const SKYLINES = {
  sh: skylineShanghai,
  hk: skylineHongKong
};

const route = useRoute();
const router = useRouter();
const resolved = useRoutePlan();
const plan = computed(() => resolved.value ?? originalPlan);
const clock = useTripClock(() => plan.value);
const { visited, toggleVisited } = useProgress(() => resolved.value);

const manualMinutes = ref<number | null>(null);

const dayIndex = computed(() => dayPosition(plan.value, String(route.params.number)));
const day = computed(() => plan.value.days[dayIndex.value]!);
const cityName = computed(() => day.value.cityName);
const isLive = computed(() => clock.value.dayIndex === dayIndex.value);
const minutes = computed(() => manualMinutes.value ?? (isLive.value ? clock.value.minutes : toMinutes(day.value.start)));
const dayRoute = computed(() => buildRoute(plan.value, day.value, minutes.value, visited.value));
const homeTarget = computed(() => hotelFor(plan.value, day.value) ? taxiLink(plan.value, hotelTarget(day.value)) : null);

const summary = computed(() => {
  const { counts, withHours } = dayRoute.value;

  if (!withHours) {
    return 'No opening hours in the plan for today.';
  }

  const parts = [
    counts.open ? `${counts.open} open` : '',
    counts.soon ? `${counts.soon} closing soon` : '',
    counts.later ? `${counts.later} not open yet` : '',
    counts.closed ? `${counts.closed} closed` : ''
  ];

  return `${parts.filter(Boolean).join(' · ')} (places with hours in the plan)`;
});

const openRow = computed(() => {
  const id = route.query.stop;

  if (typeof id !== 'string') {
    return null;
  }

  return dayRoute.value.rows.find((row): row is StopRow => row.kind === 'stop' && row.id === id) ?? null;
});

const sheetKicker = computed(() => {
  const at = openRow.value?.at;
  const base = `day ${dayIndex.value + 1} · ${dayDate(day.value.isoDate, { weekday: 'short', day: 'numeric', month: 'short' })}`;

  return at ? `${base} · ${at}` : base;
});

function openStop (id: string) {
  router.push({ query: { ...route.query, stop: id } });
}

function closeStop () {
  if (hasBackEntry()) {
    router.back();
    return;
  }

  const query = { ...route.query };
  delete query.stop;
  router.replace({ query });
}

function setMinutes (value: number) {
  manualMinutes.value = value;
}

watch(day, () => {
  manualMinutes.value = null;
});
</script>

<template>
  <main v-if="resolved && day.id === String(route.params.number)" class="mx-auto max-w-md px-4 pb-[calc(var(--tab-clearance)+88px)]">
    <header class="sticky top-0 z-20 -mx-4 flex items-center justify-between bg-paper/90 px-2 pb-2 pt-[max(8px,env(safe-area-inset-top))] backdrop-blur-md">
      <RouterLink
        :to="{ name: 'days' }"
        class="flex h-11 items-center gap-1 rounded-full pl-1 pr-3 font-semibold"
      >
        <AppIcon name="back" />
        All days
      </RouterLink>
      <RouterLink
        v-if="homeTarget"
        :to="homeTarget"
        class="flex h-11 items-center gap-2 rounded-full bg-card px-4 text-sm font-semibold"
      >
        <AppIcon
          name="home"
          :size="18"
          class="text-accent-ink"
        />
        Our hotel
      </RouterLink>
    </header>

    <section class="pt-2">
      <img
        v-if="day.city !== 'other'"
        :src="SKYLINES[day.city]"
        alt=""
        class="-mb-3 ml-auto block w-52"
      >
      <p class="font-hand text-[26px] leading-none text-accent-ink">
        day {{ dayIndex + 1 }} · {{ dayDate(day.isoDate, { weekday: 'short', day: 'numeric', month: 'short' }) }}
      </p>
      <h1 class="mt-2 text-[40px] font-extrabold leading-[1.02] tracking-tight">{{ day.title }}</h1>
      <p class="mt-2 text-[15px] leading-snug text-muted">{{ day.areas }}</p>
    </section>

    <DayStrip
      class="mt-6"
      :active-index="dayIndex"
      :plan="plan"
    />

    <TimeControl
      class="mt-4"
      :minutes="minutes"
      :live="isLive"
      :manual="manualMinutes !== null"
      :city-name="cityName"
      :summary="summary"
      @change="setMinutes"
      @reset="manualMinutes = null"
    />

    <p
      v-if="day.headsUp"
      class="mt-5 flex gap-3 rounded-3xl bg-tint/70 px-5 py-4"
    >
      <span class="sr-only">Heads up:</span>
      <span class="font-hand text-[23px] leading-[1.15]">{{ day.headsUp }}</span>
    </p>

    <ol
      class="mt-6"
      aria-label="Today’s route"
    >
      <template
        v-for="row in dayRoute.rows"
        :key="row.id"
      >
        <RouteLegRow
          v-if="row.kind === 'leg'"
          :row="row"
        />
        <RouteStopRow
          v-else
          :row="row"
          @toggle="toggleVisited(row.id)"
          @open="openStop(row.id)"
        />
      </template>
    </ol>

    <div
      v-if="day.city === 'hk'"
      class="mt-8 flex items-end justify-center gap-4"
      aria-hidden="true"
    >
      <img
        :src="eggTart"
        alt=""
        class="w-20"
      >
      <img
        :src="dimSum"
        alt=""
        class="w-28"
      >
      <img
        :src="eggWaffle"
        alt=""
        class="w-12"
      >
    </div>
  </main>

  <main v-else class="mx-auto max-w-md p-6"><RouterLink :to="{ name: 'days' }">‹ All days</RouterLink><p class="mt-4">This day is unavailable on this device.</p></main>

  <NextUpBar
    v-if="resolved && day.id === String(route.params.number)"
    :next="dayRoute.next"
    :home-target="homeTarget"
    @tick="toggleVisited"
    @open="openStop"
  />

  <Transition name="sheet">
    <PlaceSheet
      v-if="resolved && openRow"
      :plan="plan"
      :day="day"
      :row="openRow"
      :kicker="sheetKicker"
      @close="closeStop"
      @toggle="toggleVisited(openRow.id)"
    />
  </Transition>
</template>
