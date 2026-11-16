import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ORIGINAL_ID, originalPlan } from '../lib/plan';
import { useWorkspace } from './useWorkspace';
import type { TripPlan } from '../lib/plan';

const ACTIVE_KEY = 'two-tickets:active-trip';
const chosen = ref(ORIGINAL_ID);
try { chosen.value = localStorage.getItem(ACTIVE_KEY) ?? ORIGINAL_ID; } catch { /* Use the bundled trip. */ }
const { records, put } = useWorkspace();
const plans = computed(() => [
  originalPlan,
  ...Object.entries(records.value).filter(([key, value]) => key.startsWith('plan:') && value).map(([, value]) => value as TripPlan)
]);
const activePlan = computed(() => plans.value.find(plan => plan.id === chosen.value) ?? originalPlan);

function selectPlan (id: string) {
  chosen.value = id;

  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    // Selection still works for this visit.
  }
}

function savePlan (plan: TripPlan) {
  put({ [`plan:${plan.id}`]: plan });
}

export function usePlans () {
  return { plans, activePlan, selectPlan, savePlan };
}

export function useRoutePlan () {
  const route = useRoute();
  return computed(() => typeof route.query.trip === 'string'
    ? plans.value.find(plan => plan.id === route.query.trip)
    : originalPlan);
}
