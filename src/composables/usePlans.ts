import { computed } from 'vue';
import { originalPlan } from '../lib/plan';

const activePlan = computed(() => originalPlan);

export function usePlans () {
  return { activePlan };
}

export function useRoutePlan () {
  return activePlan;
}
