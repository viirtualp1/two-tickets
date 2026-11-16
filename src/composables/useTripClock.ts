import { readonly, ref } from 'vue';

export interface TripClock {
  dayIndex: number;
  minutes: number;
  isPreview: boolean;
}

const TRIP_START_UTC = Date.UTC(2026, 11, 6);
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;
const NIGHT_OWL_CUTOFF_MINUTES = 5 * 60;
const TICK_MS = 30_000;
const previewAt = readPreview();
const clock = ref(readClock());
let ticker: ReturnType<typeof setInterval> | null = null;

// `?preview=2026-12-08T11:20` (Shanghai time) shows the app as it will look on that moment of the trip.
function readPreview () {
  const value = new URLSearchParams(window.location.search).get('preview');

  if (!value) {
    return null;
  }

  const ms = Date.parse(`${value}+08:00`);

  return Number.isNaN(ms) ? null : ms;
}

function readClock (): TripClock {
  const local = new Date((previewAt ?? Date.now()) + SHANGHAI_OFFSET_MS);
  const midnight = Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate());
  let dayIndex = Math.floor((midnight - TRIP_START_UTC) / DAY_MS);
  let minutes = local.getUTCHours() * 60 + local.getUTCMinutes();

  // At 1 am we are still out on yesterday's plan, not starting tomorrow's.
  if (minutes < NIGHT_OWL_CUTOFF_MINUTES) {
    dayIndex -= 1;
    minutes += 24 * 60;
  }

  return { dayIndex, minutes, isPreview: previewAt !== null };
}

function tick () {
  clock.value = readClock();
}

export function useTripClock () {
  if (!ticker && previewAt === null) {
    ticker = setInterval(tick, TICK_MS);
  }

  return readonly(clock);
}
