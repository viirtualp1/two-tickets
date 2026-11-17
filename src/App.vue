<template>
  <RouterView />
  <BottomNavigation v-if="showNavigation" />
  <ChecklistReminder />
</template>

<script setup lang="ts">
import { computed, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import BottomNavigation from './components/BottomNavigation.vue';
import ChecklistReminder from './components/ChecklistReminder.vue';
import { usePlans, useRoutePlan } from './composables/usePlans';
import { startTripSync } from './composables/useTripSync';
import { dayPosition } from './lib/plan';
import { useTripClock } from './composables/useTripClock';
import { findPlace } from './lib/route';
import type { Destination } from './lib/plan';

const route = useRoute();
const { activePlan } = usePlans();
const routePlan = useRoutePlan();
const clock = useTripClock(() => activePlan.value);
const showNavigation = computed(() => ['home', 'days', 'day'].includes(String(route.name)));
startTripSync();

const city = computed<Destination>(() => {
  if (route.name === 'day') {
    const plan = routePlan.value;
    return plan?.days[dayPosition(plan, String(route.params.number))]?.city ?? 'sh';
  }

  if (route.name === 'taxi') {
    const target = String(route.params.target);

    if (target.startsWith('hotel-day-')) {
      return routePlan.value?.days.find(day => day.id === target.slice(10))?.city ?? 'sh';
    }
    if (target.startsWith('hotel-')) {
      return target === 'hotel-hk' ? 'hk' : 'sh';
    }

    return (routePlan.value && findPlace(target, routePlan.value)?.city) || 'sh';
  }

  return activePlan.value.days[clock.value.dayIndex]?.city ?? activePlan.value.days[0]!.city;
});

watch(city, value => {
  document.documentElement.dataset.city = value;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', value === 'hk' ? '#f1f7f3' : '#fff6f3');
}, { immediate: true });
</script>
