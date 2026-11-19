<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-card px-6 pt-[max(12px,env(safe-area-inset-top))] pb-[max(24px,env(safe-area-inset-bottom))]">
    <button
      type="button"
      class="-ml-2 flex h-11 items-center gap-1 self-start rounded-full pr-3 font-semibold"
      @click="goBack"
    >
      <AppIcon name="back" />
      Back
    </button>

    <template v-if="card">
      <p class="font-hand text-[28px] leading-none text-accent-ink">{{ card.kicker }}</p>

      <div class="flex flex-1 flex-col justify-center gap-5">
        <p
          v-if="card.place.zh"
          :lang="lang"
          class="text-[54px] leading-hand font-extrabold tracking-wide"
        >
          {{ card.place.zh }}
        </p>
        <p
          v-else
          class="rounded-3xl border-2 border-dashed border-muted/50 px-5 py-6 text-lg leading-snug text-muted"
        >
          No local-language name in the plan.
        </p>
        <p class="text-xl leading-snug font-bold">{{ card.place.name }}</p>
        <p
          v-if="card.detail"
          class="text-[15px] text-muted"
        >
          {{ card.detail }}
        </p>
      </div>

      <div
        v-if="phrase"
        class="border-t-2 border-dashed border-line pt-5"
      >
        <p
          :lang="lang"
          class="text-[30px] leading-tight font-extrabold"
        >
          {{ phrase.zh }}
        </p>
        <p class="mt-1 text-[15px] text-muted">{{ phrase.en }}</p>
      </div>

      <div class="flex gap-2">
        <a
          :href="directionsUrl(card.place)"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex h-13 flex-1 items-center justify-center gap-2 rounded-full bg-accent font-bold text-white"
        >
          <AppIcon
            name="pin"
            :size="18"
          />
          {{ directionsLabel(card.place) }}
        </a>
        <button
          v-if="card.place.zh"
          type="button"
          class="inline-flex h-13 items-center justify-center gap-2 rounded-full border-2 border-line px-5 font-bold"
          @click="copyLocalName"
        >
          <AppIcon
            name="copy"
            :size="18"
          />
          {{ copied ? 'Copied' : 'Copy' }}
        </button>
      </div>
    </template>

    <p
      v-else
      class="flex-1 text-lg text-muted"
    >
      We couldn’t find that place in the plan.
    </p>
  </main>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import { LOCAL_LANG, TAXI_PHRASES } from '../data/trip';
import { useRoutePlan } from '../composables/usePlans';
import type { Destination } from '../lib/plan';
import { hasBackEntry } from '../lib/history';
import { directionsLabel, directionsUrl } from '../lib/maps';
import { findPlace } from '../lib/route';
import type { Place } from '../lib/route';

interface TaxiCard {
  kicker: string
  place: Place
  detail: string
}

const COPIED_MS = 1800;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const route = useRoute();
const plan = useRoutePlan();
const router = useRouter();

const copied = ref(false);

const card = computed<TaxiCard | null>(() => {
  const target = String(route.params.target);

  if (!plan.value) {
    return null;
  }
  if (target.startsWith('hotel-')) {
    const day = target.startsWith('hotel-day-') ? plan.value.days.find(day => day.id === target.slice(10)) : undefined;
    const city = day?.city ?? target.slice(6) as Destination;
    const hotel = day?.hotel ?? plan.value.hotels[city];
    if (!hotel) {
      return null;
    }

    return { kicker: 'tonight we sleep at', place: { name: hotel.name, zh: hotel.zh, city, cityName: day?.cityName ?? plan.value.days.find(day => day.city === city)?.cityName ?? '' }, detail: hotel.near };
  }

  const place = findPlace(target, plan.value);

  return place ? { kicker: 'please take us here', place, detail: '' } : null;
});

const phrase = computed(() => card.value?.place.city === 'other' ? null : TAXI_PHRASES[card.value?.place.city ?? 'sh']);
const lang = computed(() => (!card.value || card.value.place.city === 'other' ? undefined : LOCAL_LANG[card.value.place.city]));

function goBack () {
  if (hasBackEntry()) {
    router.back();
    return;
  }

  router.push('/');
}

async function copyLocalName () {
  if (!card.value?.place.zh) {
    return;
  }

  try {
    await navigator.clipboard.writeText(card.value.place.zh);
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

onBeforeUnmount(() => {
  if (copiedTimer) {
    clearTimeout(copiedTimer);
  }
});
</script>
