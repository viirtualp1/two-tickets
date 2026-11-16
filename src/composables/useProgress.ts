import { computed } from 'vue';
import { ORIGINAL_ID } from '../lib/plan';
import { useWorkspace } from './useWorkspace';
import type { TripPlan } from '../lib/plan';
import type { SharedRecords } from './useWorkspace';

const { records, put } = useWorkspace();
const legacy = readLegacy();

function readLegacy (): { visited?: Record<string, boolean>; prep?: Record<string, boolean> } {
  try {
    return JSON.parse(localStorage.getItem('two-tickets:v1') ?? '{}') ?? {};
  } catch {
    return {};
  }
}

const migration: SharedRecords = {};
for (const [id, visited] of Object.entries(legacy.visited ?? {})) {
  const key = `visit:${ORIGINAL_ID}:${id}`;
  if (visited === true && records.value[key] === undefined) migration[key] = true;
}
if (Object.keys(migration).length) put(migration);

export function useProgress (plan: () => TripPlan | undefined) {
  const visited = computed(() => {
    const prefix = `visit:${plan()?.id}:`;
    return Object.fromEntries(Object.entries(records.value).filter(([key, value]) => key.startsWith(prefix) && value === true)
      .map(([key]) => [key.slice(prefix.length), true]));
  });
  function toggleVisited (id: string) {
    const trip = plan();
    if (trip) put({ [`visit:${trip.id}:${id}`]: !visited.value[id] });
  }
  return { visited, toggleVisited };
}

export const legacyPrep = legacy.prep ?? {};
