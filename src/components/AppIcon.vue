<!-- eslint-disable vue/no-v-html -- markup comes from the bundled icon map, never user input -->
<template>
  <svg
    :width="props.size"
    :height="props.size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="props.stroke"
    stroke-linecap="round"
    stroke-linejoin="round"
    :role="props.label ? 'img' : undefined"
    :aria-label="props.label || undefined"
    :aria-hidden="props.label ? undefined : 'true'"
    class="shrink-0"
    v-html="markup"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';

export type IconName = 'metro' | 'walk' | 'ferry' | 'flight' | 'transfer' | 'home' | 'back' | 'forward' | 'close' | 'check' | 'pin' | 'copy' | 'talk' | 'heart' | 'clock' | 'plus' | 'edit' | 'calendar' | 'settings' | 'sync';

const props = withDefaults(defineProps<{
  name: IconName
  size?: number
  stroke?: number
  label?: string
}>(), {
  size: 20,
  stroke: 1.9,
  label: ''
});

const PATHS: Record<IconName, string> = {
  metro: '<rect x="5" y="3" width="14" height="13" rx="3.5"/><path d="M5 10h14M9 16l-2 5M15 16l2 5"/>',
  walk: '<circle cx="13" cy="4.5" r="1.8"/><path d="M11 21l1.5-5.5L15 18v3M9 12.5l2.5-4 3 1.5 2 3M12.5 15.5 11.5 9"/>',
  ferry: '<path d="M3 18c2 1.4 4 1.4 6 0s4-1.4 6 0 4 1.4 6 0"/><path d="M5 15l-1-4h16l-1 4"/><path d="M8 11V7h8v4M12 7V4"/>',
  flight: '<path d="M21 4 3 11l7 2.5L12.5 21z"/><path d="M10 13.5 21 4"/>',
  transfer: '<path d="M5 16v-5l2-5h10l2 5v5M4 11h16M5 16h14M6 16v2.5M18 16v2.5"/>',
  home: '<path d="M4 11l8-7 8 7M6 9.5V20h12V9.5M10 20v-5h4v5"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  forward: '<path d="M9 5l7 7-7 7"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2.5"/><path d="M16 8V6.5A2.5 2.5 0 0 0 13.5 4h-7A2.5 2.5 0 0 0 4 6.5v7A2.5 2.5 0 0 0 6.5 16H8"/>',
  talk: '<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H9l-5 4z"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  clock: '<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="m13.5 6.5 4 4M4 20l4.5-1 11-11a2.8 2.8 0 0 0-4-4l-11 11L4 20z"/>',
  calendar: '<rect x="4" y="5.5" width="16" height="15" rx="3"/><path d="M8 3.5v4m8-4v4M4 10h16m-12 4h.01m4 0h.01m4 0h.01m-8 3h.01m4 0h.01"/>',
  settings: '<path d="M5 7h3m4 0h7M5 12h9m4 0h1M5 17h5m4 0h5"/><circle cx="10" cy="7" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="12" cy="17" r="2"/>',
  sync: '<path d="M19.5 8a8 8 0 0 0-13.4-2L4 8m0-4v4h4m-3.5 8a8 8 0 0 0 13.4 2l2.1-2m0 4v-4h-4"/>'
};

const markup = computed(() => PATHS[props.name]);
</script>
