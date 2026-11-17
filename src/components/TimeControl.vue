<template>
  <div class="rounded-3xl bg-card px-5 pt-4 pb-2">
    <div class="flex items-end justify-between gap-3">
      <div>
        <p class="text-xs font-bold text-muted">{{ caption }}</p>
        <p class="mt-1 text-[40px] leading-none font-extrabold tracking-tight tabular-nums">{{ label }}</p>
      </div>
      <button
        v-if="props.live && props.manual"
        type="button"
        class="h-11 rounded-full border-2 border-line px-4 text-sm font-bold"
        @click="emit('reset')"
      >
        Back to now
      </button>
    </div>
    <p class="mt-2 text-[13px] text-muted">{{ props.summary }}</p>
    <label
      for="time-of-day"
      class="sr-only"
    >Time of day</label>
    <input
      id="time-of-day"
      type="range"
      class="range-slider mt-1"
      :min="EARLIEST"
      :max="LATEST"
      :step="STEP"
      :value="props.minutes"
      :aria-valuetext="label"
      @input="onInput"
    >
    <div
      class="-mt-1 flex justify-between pb-1 text-[11px] font-semibold text-muted"
      aria-hidden="true"
    >
      <span>5:00</span>
      <span>noon</span>
      <span>18:00</span>
      <span>2:00</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { formatMinutes } from '../lib/hours';

const props = defineProps<{
  minutes: number
  live: boolean
  manual: boolean
  cityName: string
  summary: string
}>();

const emit = defineEmits<{
  change: [minutes: number]
  reset: []
}>();

const EARLIEST = 5 * 60;
const LATEST = 26 * 60;
const STEP = 15;

const label = computed(() => formatMinutes(props.minutes));
const caption = computed(() => (props.live && !props.manual ? `Right now in ${props.cityName}` : 'What’s open at'));

function onInput (event: Event) {
  if (event.target instanceof HTMLInputElement) {
    emit('change', Number(event.target.value));
  }
}
</script>
