<script setup lang="ts">
import { computed, ref } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { useProgress } from '../composables/useProgress';
import { directionsUrl } from '../lib/maps';
import { dayLink } from '../lib/plan';
import type { PlanDay, TripPlan } from '../lib/plan';
import { buildRoute } from '../lib/route';
import type { StopRow } from '../lib/route';

const props = defineProps<{ plan: TripPlan; day: PlanDay; dayNumber: number; minutes: number }>();
const { visited, toggleVisited } = useProgress(() => props.plan);
const selectedId = ref<string | null>(null);
const route = computed(() => buildRoute(props.plan, props.day, props.minutes, visited.value));
const stops = computed(() => route.value.rows.filter((row): row is StopRow => row.kind === 'stop'));
const current = computed(() => stops.value.find(stop => stop.id === selectedId.value) ?? route.value.next);
const position = computed(() => current.value ? stops.value.findIndex(stop => stop.id === current.value?.id) : stops.value.length);
const previous = computed(() => stops.value[position.value - 1]);
const next = computed(() => stops.value[position.value + 1]);
const planLink = computed(() => dayLink(props.plan, props.day));

function goBack () {
  if (previous.value) selectedId.value = previous.value.id;
}

function goNext () {
  const stop = current.value;
  if (!stop) return;

  if (stop.visited) {
    selectedId.value = next.value?.id === route.value.next?.id ? null : next.value?.id ?? null;
    return;
  }

  toggleVisited(stop.id);
  selectedId.value = null;
}
</script>

<template>
  <section class="relative overflow-hidden rounded-[28px] border border-line bg-card shadow-[0_8px_24px_color-mix(in_srgb,var(--accent)_8%,transparent)]" aria-labelledby="hero-title">
    <div class="px-5 pb-2.5 pt-3.5">
      <div class="flex items-baseline justify-between gap-2">
        <p class="font-hand text-[22px] leading-none text-accent-ink">day {{ dayNumber }} · {{ day.cityName }}</p>
        <p class="shrink-0 text-xs font-bold text-muted">{{ stops.filter(stop => stop.visited).length }} / {{ stops.length }} visited</p>
      </div>
      <div class="mt-2" aria-live="polite" aria-atomic="true">
        <p class="text-[10px] font-extrabold uppercase tracking-[0.14em] text-muted">
          {{ current ? (current.visited ? 'Visited stop' : 'Current stop') : 'Today’s route' }}
        </p>
        <h1 id="hero-title" class="mt-0.5 line-clamp-2 text-[clamp(23px,6.3vw,31px)] font-extrabold leading-[1.05] tracking-tight">
          {{ current?.name ?? (stops.length ? 'All stops checked off' : 'No stops planned today') }}
        </h1>
        <p v-if="current?.at || current?.status" class="mt-1 truncate text-xs font-semibold text-muted">
          {{ [current.at, current.status?.text].filter(Boolean).join(' · ') }}
        </p>
      </div>
    </div>

    <div class="mx-5 grid grid-cols-2 gap-2 pb-2.5">
      <RouterLink :to="planLink" class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-tint px-2 text-sm font-bold text-accent-ink">
        <AppIcon name="calendar" :size="16" /> Open plan
      </RouterLink>
      <a v-if="current" :href="directionsUrl(current.place)" target="_blank" rel="noopener noreferrer"
        class="inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full border border-line px-2 text-sm font-bold">
        <AppIcon name="pin" :size="16" /> Map
      </a>
    </div>

    <div v-if="stops.length" class="mx-5 flex gap-2 border-t-2 border-dashed border-line py-2.5">
      <button type="button" :disabled="!previous" class="inline-flex min-h-11 flex-1 items-center justify-center gap-1 rounded-full px-2 text-sm font-bold text-accent-ink disabled:opacity-40" @click="goBack">
        <AppIcon name="back" :size="15" /> Previous
      </button>
      <button type="button" :disabled="!current" class="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-2 text-sm font-bold text-white disabled:opacity-40" @click="goNext">
        <AppIcon :name="current?.visited ? 'forward' : 'check'" :size="17" /> Next place
      </button>
    </div>
  </section>
</template>
