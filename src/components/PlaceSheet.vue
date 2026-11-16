<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from 'vue';
import { RouterLink } from 'vue-router';
import AppIcon from './AppIcon.vue';
import { appleMapsUrl, directionsLabel, directionsUrl } from '../lib/maps';
import type { OpenTone } from '../lib/hours';
import { hotelFor, hotelTarget, taxiLink } from '../lib/plan';
import type { PlanDay, TripPlan } from '../lib/plan';
import type { StopRow } from '../lib/route';

const props = defineProps<{
  row: StopRow;
  plan: TripPlan;
  day: PlanDay;
  kicker: string;
}>();

const emit = defineEmits<{
  close: [];
  toggle: [];
}>();

const TONES: Record<OpenTone, string> = {
  open: 'text-open',
  soon: 'text-soon',
  later: 'text-ink',
  closed: 'text-ink'
};
const COPIED_MS = 1800;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const copied = ref(false);
const closeButton = useTemplateRef<HTMLButtonElement>('closeButton');

const lang = computed(() => (props.row.place.city === 'hk' ? 'zh-Hant' : 'zh-Hans'));
const showZh = computed(() => Boolean(props.row.zh) && props.row.zh !== props.row.name);
const taxiTarget = computed(() => (props.row.isHotel ? hotelTarget(props.day) : props.row.id));
const canShowDriver = computed(() => Boolean(props.row.zh) || (props.row.isHotel && Boolean(hotelFor(props.plan, props.day))));

async function copyChinese () {
  try {
    await navigator.clipboard.writeText(props.row.zh);
    copied.value = true;

    if (copiedTimer) {
      clearTimeout(copiedTimer);
    }

    copiedTimer = setTimeout(() => {
      copied.value = false;
    }, COPIED_MS);
  } catch {
    // Clipboard can be refused outside a secure context; the name stays on screen to copy by hand.
    copied.value = false;
  }
}

function onKeydown (event: KeyboardEvent) {
  if (event.key === 'Escape') {
    emit('close');
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown);
  closeButton.value?.focus();
});

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);

  if (copiedTimer) {
    clearTimeout(copiedTimer);
  }
});
</script>

<template>
  <div
    class="fixed inset-0 z-40 flex items-end justify-center bg-ink/40"
    @click.self="emit('close')"
  >
    <div
      class="sheet-panel flex max-h-[90dvh] w-full max-w-md flex-col gap-4 overflow-y-auto rounded-t-[32px] bg-paper px-5 pb-[max(24px,env(safe-area-inset-bottom))] pt-3"
      role="dialog"
      aria-modal="true"
      aria-labelledby="place-title"
    >
      <span
        class="mx-auto h-1 w-10 rounded-full bg-line"
        aria-hidden="true"
      />
      <div class="flex items-center justify-between">
        <p class="font-hand text-[22px] leading-none text-accent-ink">{{ props.kicker }}</p>
        <button
          ref="closeButton"
          type="button"
          class="-mr-2 grid size-11 place-items-center rounded-full"
          aria-label="Close"
          @click="emit('close')"
        >
          <AppIcon name="close" />
        </button>
      </div>

      <div>
        <h2
          id="place-title"
          class="text-[26px] font-extrabold leading-tight tracking-tight"
        >
          {{ props.row.isHotel ? props.row.place.name : props.row.name }}
        </h2>
        <div
          v-if="showZh"
          class="mt-2 flex items-center justify-between gap-3"
        >
          <p
            :lang="lang"
            class="text-[30px] font-bold leading-tight"
          >
            {{ props.row.zh }}
          </p>
          <button
            type="button"
            class="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full border-2 border-line px-4 text-sm font-bold"
            @click="copyChinese"
          >
            <AppIcon
              name="copy"
              :size="16"
            />
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
      </div>

      <dl class="divide-y divide-line rounded-3xl bg-card px-4">
        <div
          v-if="props.row.status"
          class="flex justify-between gap-4 py-3"
        >
          <dt class="text-[13px] text-muted">Hours</dt>
          <dd class="text-right text-sm">
            <span
              class="block font-bold"
              :class="TONES[props.row.status.tone]"
            >{{ props.row.status.text }}</span>
            <span class="text-muted">{{ props.row.hours }}</span>
          </dd>
        </div>
        <div
          v-if="props.row.via"
          class="flex justify-between gap-4 py-3"
        >
          <dt class="shrink-0 text-[13px] text-muted">Getting there</dt>
          <dd class="text-right text-sm font-semibold">{{ props.row.via }}</dd>
        </div>
        <div
          v-if="props.row.note"
          class="flex justify-between gap-4 py-3"
        >
          <dt class="shrink-0 text-[13px] text-muted">Our note</dt>
          <dd class="text-right text-sm">{{ props.row.note }}</dd>
        </div>
      </dl>

      <div class="flex gap-2">
        <a
          :href="directionsUrl(props.row.place)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-accent font-bold text-white"
        >
          <AppIcon
            name="pin"
            :size="18"
          />
          Directions
          <span class="sr-only">in {{ directionsLabel(props.row.place) }}</span>
        </a>
        <a
          :href="appleMapsUrl(props.row.place)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-13 items-center justify-center rounded-full border-2 border-line px-4 text-sm font-bold"
        >
          Apple Maps
        </a>
      </div>

      <RouterLink
        v-if="canShowDriver"
        :to="taxiLink(props.plan, taxiTarget)"
        class="inline-flex h-13 items-center justify-center gap-2 rounded-full bg-card font-bold"
      >
        <AppIcon
          name="talk"
          :size="18"
        />
        Show the driver
      </RouterLink>

      <button
        type="button"
        class="inline-flex h-12 items-center justify-center gap-3 rounded-full font-bold"
        :aria-pressed="props.row.visited"
        @click="emit('toggle')"
      >
        <span
          class="grid size-7 place-items-center rounded-full border-2"
          :class="props.row.visited ? 'border-accent bg-accent text-white' : 'border-muted/60 text-transparent'"
        >
          <AppIcon
            name="check"
            :size="15"
            :stroke="3"
          />
        </span>
        {{ props.row.visited ? 'We’ve been here' : 'Tick it off' }}
      </button>
    </div>
  </div>
</template>
