<script setup lang="ts">
import { computed, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import AppIcon from '../components/AppIcon.vue';
import { HOTELS, TAXI_PHRASES } from '../data/trip';
import { hasBackEntry } from '../lib/history';
import { directionsLabel, directionsUrl } from '../lib/maps';
import { findPlace } from '../lib/route';
import type { Place } from '../lib/route';

interface TaxiCard {
  kicker: string;
  place: Place;
  detail: string;
}

const COPIED_MS = 1800;
let copiedTimer: ReturnType<typeof setTimeout> | null = null;

const route = useRoute();
const router = useRouter();

const copied = ref(false);

const card = computed<TaxiCard | null>(() => {
  const target = String(route.params.target);

  if (target === 'hotel-sh' || target === 'hotel-hk') {
    const city = target === 'hotel-hk' ? 'hk' : 'sh';
    const hotel = HOTELS[city];

    return { kicker: 'tonight we sleep at', place: { name: hotel.name, zh: hotel.zh, city }, detail: hotel.near };
  }

  const place = findPlace(target);

  return place ? { kicker: 'please take us here', place, detail: '' } : null;
});

const phrase = computed(() => TAXI_PHRASES[card.value?.place.city ?? 'sh']);
const lang = computed(() => (card.value?.place.city === 'hk' ? 'zh-Hant' : 'zh-Hans'));

function goBack () {
  if (hasBackEntry()) {
    router.back();
    return;
  }

  router.push('/');
}

async function copyChinese () {
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

<template>
  <main class="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-card px-6 pb-[max(24px,env(safe-area-inset-bottom))] pt-[max(12px,env(safe-area-inset-top))]">
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
          class="text-[54px] font-extrabold leading-[1.15] tracking-wide"
        >
          {{ card.place.zh }}
        </p>
        <p
          v-else
          class="rounded-3xl border-2 border-dashed border-muted/50 px-5 py-6 text-lg leading-snug text-muted"
        >
          [Our hotel’s name &amp; address in Chinese — copy it from the booking into <code class="text-sm">src/data/trip.ts</code>]
        </p>
        <p class="text-xl font-bold leading-snug">{{ card.place.name }}</p>
        <p
          v-if="card.detail"
          class="text-[15px] text-muted"
        >
          {{ card.detail }}
        </p>
      </div>

      <div class="border-t-2 border-dashed border-line pt-5">
        <p
          :lang="lang"
          class="text-[30px] font-extrabold leading-tight"
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
          @click="copyChinese"
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
