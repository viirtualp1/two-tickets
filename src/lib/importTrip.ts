import { dayDate, hotelFor, newId } from './plan';
import type { Destination, TripPlan } from './plan';
import type { LegMode } from '../data/trip';

export interface DraftItem {
  id: string;
  kind: string;
  mode: string;
  name: string;
  at: string;
  hours: string;
  localName: string;
  note: string;
  source: string;
  removed?: boolean;
}

export interface DraftDay {
  id: string;
  date: string;
  title: string;
  city: string;
  start: string;
  note: string;
  hotel: string;
  hotelLocalName: string;
  hotelAddress: string;
  items: DraftItem[];
  removed?: boolean;
}

export interface TripDraft {
  id: string;
  title: string;
  timeZone: string;
  days: DraftDay[];
}

export function newItem (item: Partial<DraftItem> = {}): DraftItem {
  return { id: newId(), kind: 'stop', mode: 'transfer', name: '', at: '', hours: '', localName: '', note: '', source: '', ...item };
}

export function newDay (day: Partial<DraftDay> = {}): DraftDay {
  return { id: newId(), date: '', title: '', city: '', start: '', note: '', hotel: '', hotelLocalName: '', hotelAddress: '', items: [], ...day };
}

export function parseNotes (text: string): TripDraft {
  const draft: TripDraft = { id: newId(), title: '', timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone, days: [] };
  let day: DraftDay | undefined;
  for (const original of text.split(/\r?\n/)) {
    const line = original.trim().replace(/^#+\s*/, '');
    if (!line) continue;
    const zone = line.match(/^time\s*zone:\s*(.+)$/i);
    const title = line.match(/^trip:\s*(.+)$/i);
    if (zone) { draft.timeZone = zone[1]!; continue; }
    if (title) { draft.title = title[1]!; continue; }

    const heading = line.match(/^(?:day\s+\d+\s*[:—–-]?\s*)?(\d{4}-\d{2}-\d{2})(?:\s*[|—–:-]\s*|\s+)?(.*)$/i);
    if (heading) {
      const [city = '', title = ''] = heading[2]!.split(/\s*[|—–]\s*/);
      day = newDay({ date: heading[1], city, title });
      draft.days.push(day);
      continue;
    }
    if (!day && !draft.title && !/^[-*•]|^\d{1,2}:\d{2}/.test(line)) {
      draft.title = line;
      continue;
    }
    if (!day) {
      day = newDay();
      draft.days.push(day);
    }
    const stop = line.replace(/^[-*•]\s*|^\d+\.\s*/, '');
    const time = stop.match(/^(\d{1,2}:\d{2})\s*[-—–]?\s*/);
    const [name = '', note = '', localName = '', hours = ''] = stop.slice(time?.[0].length ?? 0).split(/\s*\|\s*/);
    day.items.push(newItem({ name, note, localName, hours, at: time?.[1] ?? '', source: original.trim() }));
  }
  if (!draft.days.length) draft.days.push(newDay());
  return draft;
}

export function draftFromPlan (plan: TripPlan): TripDraft {
  return {
    id: plan.id, title: plan.title, timeZone: plan.timeZone,
    days: plan.days.map(day => {
      const hotel = hotelFor(plan, day);
      return newDay({
        id: day.id, title: day.title, city: day.cityName, date: day.isoDate, start: day.start, note: day.headsUp,
        hotel: hotel?.name, hotelLocalName: hotel?.zh, hotelAddress: hotel?.near,
        items: day.items.map(item => item.kind === 'leg'
          ? newItem({ id: item.id, kind: 'leg', mode: item.mode, name: item.text, at: item.at, note: item.detail })
          : item.kind === 'stop'
            ? newItem({ id: item.id, name: item.name, at: item.at, localName: item.zh, hours: item.hours, note: item.note })
            : newItem({ id: item.id, kind: 'hotel', name: item.note, at: item.at }))
      });
    })
  };
}

function destination (name: string): Destination {
  if (/^(shanghai|上海)$/i.test(name)) return 'sh';
  if (/^(hong\s*kong|香港)$/i.test(name)) return 'hk';
  return 'other';
}

const time = '(?:[01]?\\d|2[0-3]):[0-5]\\d';
const clock = new RegExp(`^${time}$`);
const hoursPattern = new RegExp(`^(?:24h|(?:${time})?-${time}(?:,(?:${time})?-${time})*)$`);
const modes: LegMode[] = ['transfer', 'metro', 'flight', 'walk'];

export function toPlan (draft: TripDraft): TripPlan {
  const title = draft.title.trim();
  const timeZone = draft.timeZone.trim();
  if (!title) throw new Error('Give this trip a name.');
  if (!timeZone) throw new Error('Enter a time zone, such as Asia/Tbilisi.');
  try { new Intl.DateTimeFormat('en', { timeZone }); } catch { throw new Error('Enter a valid time zone, such as Asia/Tbilisi.'); }

  const plan: TripPlan = { id: draft.id, title, timeZone, days: [], hotels: {} };
  const dates = new Set<string>();
  for (const [index, day] of draft.days.filter(day => !day.removed).entries()) {
    const label = `Day ${index + 1}`;
    const date = new Date(day.date + 'T00:00Z');
    const cityName = day.city.trim();
    const city = destination(cityName);
    const start = day.start.trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day.date) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== day.date || dates.has(day.date)) {
      throw new Error(`${label} needs a valid date that appears only once.`);
    }
    if (!cityName) throw new Error(`${label} needs a city.`);
    if (start && !clock.test(start)) throw new Error(`${label} needs a start time like 08:30.`);
    dates.add(day.date);
    const items = day.items.filter(item => !item.removed).map(item => {
      const name = item.name.trim();
      const at = item.at.trim();
      const note = item.note.trim();
      const hours = item.hours.trim().replace(/[–—]/g, '-').replace(/\s/g, '');
      if (!name) throw new Error(`${label} has a stop or travel leg without a name.`);
      if (at && !clock.test(at) && !new RegExp(`^${time}\\s*[–—-]\\s*${time}$`).test(at)) {
        throw new Error(`Check the time for ${name}. Use a time like 08:30.`);
      }
      if (hours && !hoursPattern.test(hours)) throw new Error(`Check the opening hours for ${name}. Use 09:00-18:00, or leave them blank.`);
      if (item.kind === 'leg') {
        const mode = modes.find(mode => mode === item.mode) ?? 'transfer';
        return { id: item.id, kind: 'leg' as const, mode, text: name, at, detail: note };
      }
      if (item.kind === 'hotel') return { id: item.id, kind: 'hotel' as const, note: name, at };
      return { id: item.id, kind: 'stop' as const, name, at, note, hours, zh: item.localName.trim(), city: null };
    });
    const hotel = day.hotel?.trim()
      ? { name: day.hotel.trim(), short: day.hotel.trim(), zh: day.hotelLocalName?.trim() ?? '', near: day.hotelAddress?.trim() ?? '', nights: cityName }
      : undefined;
    plan.days.push({
      id: day.id, isoDate: day.date, date: date.getUTCDate(), weekday: dayDate(day.date, { weekday: 'short' }),
      city, cityName, title: day.title.trim() || cityName, areas: cityName, start: start || items.find(item => clock.test(item.at))?.at || '08:00',
      headsUp: day.note.trim(), items, ...(hotel ? { hotel } : {})
    });
  }
  if (!plan.days.length) throw new Error('Keep at least one day in the trip.');
  plan.days.sort((a, b) => a.isoDate.localeCompare(b.isoDate));
  return plan;
}
