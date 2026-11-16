import { HOTELS, TRIP_DAYS } from '../data/trip';
import { hoursLabel, openStatus, toMinutes } from './hours';
import type { City, Leg, LegMode, RouteItem, TripDay } from '../data/trip';
import type { OpenStatus } from './hours';

export interface Place {
  name: string;
  zh: string;
  city: City;
}

export interface LegRow {
  kind: 'leg';
  id: string;
  mode: LegMode;
  text: string;
  detail: string;
  at: string;
}

export interface StopRow {
  kind: 'stop';
  id: string;
  name: string;
  zh: string;
  note: string;
  at: string;
  hours: string;
  status: OpenStatus | null;
  via: string;
  visited: boolean;
  isNext: boolean;
  isHotel: boolean;
  place: Place;
}

export type RouteRow = LegRow | StopRow;

export interface DayRoute {
  rows: RouteRow[];
  next: StopRow | null;
  counts: Record<OpenStatus['tone'], number>;
  withHours: number;
}

export interface DayProgress {
  done: number;
  total: number;
}

export function clampDayIndex (value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(Math.max(Math.round(value), 0), TRIP_DAYS.length - 1);
}

export function stopId (dayIndex: number, itemIndex: number) {
  return `${dayIndex}-${itemIndex}`;
}

export function legSummary (item: Leg) {
  return item.detail ? `${item.text} · ${item.detail}` : item.text;
}

export function placeFor (item: Exclude<RouteItem, Leg>, day: TripDay): Place {
  if (item.kind === 'hotel') {
    const hotel = HOTELS[day.city];

    return { name: hotel.name, zh: hotel.zh, city: day.city };
  }

  return { name: item.name, zh: item.zh, city: item.city ?? day.city };
}

export function findPlace (id: string) {
  const [dayPart = '', itemPart = ''] = id.split('-');
  const day = TRIP_DAYS[Number(dayPart)];
  const item = day?.items[Number(itemPart)];

  if (!day || !item || item.kind === 'leg') {
    return null;
  }

  return placeFor(item, day);
}

export function dayProgress (dayIndex: number, visited: Record<string, boolean>): DayProgress {
  const day = TRIP_DAYS[dayIndex];
  let done = 0;
  let total = 0;

  day?.items.forEach((item, index) => {
    if (item.kind !== 'stop') {
      return;
    }

    total += 1;

    if (visited[stopId(dayIndex, index)]) {
      done += 1;
    }
  });

  return { done, total };
}

export function buildRoute (dayIndex: number, minutes: number, visited: Record<string, boolean>): DayRoute {
  const day = TRIP_DAYS[clampDayIndex(dayIndex)]!;
  const counts: DayRoute['counts'] = { open: 0, soon: 0, later: 0, closed: 0 };
  let next: StopRow | null = null;

  const rows = day.items.map((item, index): RouteRow => {
    const id = stopId(dayIndex, index);

    if (item.kind === 'leg') {
      return { kind: 'leg', id, mode: item.mode, text: item.text, detail: item.detail, at: item.at };
    }

    const previous = day.items[index - 1];
    const hours = item.kind === 'stop' ? item.hours : '';
    const status = openStatus(hours, minutes);
    const isVisited = Boolean(visited[id]);

    if (status) {
      counts[status.tone] += 1;
    }

    const row: StopRow = {
      kind: 'stop',
      id,
      name: item.kind === 'hotel' ? HOTELS[day.city].short : item.name,
      zh: item.kind === 'stop' ? item.zh : HOTELS[day.city].zh,
      note: item.note,
      at: item.at,
      hours: hoursLabel(hours),
      status,
      via: previous?.kind === 'leg' ? legSummary(previous) : (index > 0 ? 'Right by the last stop' : ''),
      visited: isVisited,
      isNext: false,
      isHotel: item.kind === 'hotel',
      place: placeFor(item, day)
    };

    if (!isVisited && !next) {
      row.isNext = true;
      next = row;
    }

    return row;
  });

  return { rows, next, counts, withHours: counts.open + counts.soon + counts.later + counts.closed };
}

export function dayStartMinutes (dayIndex: number) {
  return toMinutes(TRIP_DAYS[clampDayIndex(dayIndex)]!.start);
}
