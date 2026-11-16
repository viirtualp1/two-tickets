<script setup lang="ts">
import { computed, watch } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import ChecklistReminder from './components/ChecklistReminder.vue';
import { TRIP_DAYS } from './data/trip';
import { useTripClock } from './composables/useTripClock';
import { clampDayIndex, findPlace } from './lib/route';
import type { City } from './data/trip';

const route = useRoute();
const clock = useTripClock();

const city = computed<City>(() => {
  if (route.name === 'day') {
    return TRIP_DAYS[clampDayIndex(Number(route.params.number) - 1)]?.city ?? 'sh';
  }

  if (route.name === 'taxi') {
    const target = String(route.params.target);

    if (target.startsWith('hotel-')) {
      return target === 'hotel-hk' ? 'hk' : 'sh';
    }

    return findPlace(target)?.city ?? 'sh';
  }

  return clock.value.dayIndex >= 6 && clock.value.dayIndex <= 7 ? 'hk' : 'sh';
});

watch(city, value => {
  document.documentElement.dataset.city = value;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', value === 'hk' ? '#f1f7f3' : '#fff6f3');
}, { immediate: true });
</script>

<template>
  <RouterView />
  <ChecklistReminder />
</template>
