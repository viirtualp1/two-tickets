import { computed, ref } from 'vue';
import type { TripPlan } from '../lib/plan';

const DAY_MS = 86_400_000;
const preview = new URLSearchParams(location.search).get('preview');
const candidate = preview?.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/);
const previewMatch = candidate && Number.isFinite(Date.parse(`${candidate[1]}T${candidate[2]}:${candidate[3]}Z`)) ? candidate : null;
const now = ref(Date.now());
let ticking = false;

export function useTripClock (trip: () => TripPlan) {
  if (!ticking && !previewMatch) {
    ticking = true;
    window.setInterval(() => { now.value = Date.now(); }, 30_000);
    document.addEventListener('visibilitychange', () => { now.value = Date.now(); });
  }

  return computed(() => {
    const plan = trip();
    const date = new Date(now.value);
    const fields = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: plan.timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
    }).formatToParts(date).map(({ type, value }) => [type, value]));
    const iso = previewMatch?.[1] ?? `${fields.year}-${fields.month}-${fields.day}`;
    let midnight = Date.parse(iso + 'T00:00Z');
    let minutes = Number(previewMatch?.[2] ?? fields.hour) * 60 + Number(previewMatch?.[3] ?? fields.minute);
    if (minutes < 300) {
      midnight -= DAY_MS;
      minutes += 1440;
    }
    const today = new Date(midnight).toISOString().slice(0, 10);
    const start = plan.days[0]!.isoDate;
    const end = plan.days.at(-1)!.isoDate;
    const phase = today < start ? 'before' : today > end ? 'after' : 'during';
    return {
      dayIndex: plan.days.findIndex(day => day.isoDate === today),
      daysToGo: (Date.parse(start + 'T00:00Z') - midnight) / DAY_MS,
      minutes, phase, isPreview: Boolean(previewMatch)
    };
  });
}
