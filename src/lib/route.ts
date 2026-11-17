import { hotelFor, ORIGINAL_ID } from './plan';
import type { Destination, PlanDay, TripPlan } from './plan';
import { hoursLabel, openStatus } from './hours';
import type { Leg, LegMode, RouteItem } from '../data/trip';
import type { OpenStatus } from './hours';

export interface Place {
  name: string
  zh: string
  city: Destination
  cityName: string
}

export interface LegRow {
  kind: 'leg'
  id: string
  mode: LegMode
  text: string
  detail: string
  at: string
}

export interface StopRow {
  kind: 'stop'
  id: string
  name: string
  zh: string
  note: string
  at: string
  hours: string
  status: OpenStatus | null
  via: string
  visited: boolean
  isNext: boolean
  isHotel: boolean
  place: Place
}

export type RouteRow = LegRow | StopRow;

export interface DayRoute {
  rows: RouteRow[]
  next: StopRow | null
  counts: Record<OpenStatus['tone'], number>
  withHours: number
}

export interface DayProgress {
  done: number
  total: number
}

export function legSummary (item: Leg) {
  return item.detail ? `${item.text} · ${item.detail}` : item.text;
}

export function placeFor (item: Exclude<RouteItem, Leg>, day: PlanDay, plan: TripPlan): Place {
  const hotel = item.kind === 'hotel' ? hotelFor(plan, day) : undefined;
  if (item.kind === 'hotel') {
    return { name: hotel?.name ?? item.note, zh: hotel?.zh ?? '', city: day.city, cityName: day.cityName };
  }
  return { name: item.name, zh: item.zh, city: item.city ?? day.city, cityName: item.city ? item.city === 'hk' ? 'Hong Kong' : 'Shanghai' : day.cityName };
}

export function findPlace (id: string, plan: TripPlan) {
  for (const day of plan.days) {
    const item = day.items.find(row => row.id === id);
    if (item && item.kind !== 'leg') {
      return placeFor(item, day, plan);
    }
  }
  return null;
}

export function dayProgress (day: PlanDay, visited: Record<string, boolean>): DayProgress {
  let done = 0;
  let total = 0;

  day?.items.forEach(item => {
    if (item.kind !== 'stop') {
      return;
    }

    total += 1;

    if (visited[item.id]) {
      done += 1;
    }
  });

  return { done, total };
}

export function buildRoute (plan: TripPlan, day: PlanDay, minutes: number, visited: Record<string, boolean>): DayRoute {
  const counts: DayRoute['counts'] = { open: 0, soon: 0, later: 0, closed: 0 };
  let next: StopRow | null = null;

  const rows = day.items.map((item, index): RouteRow => {
    const { id } = item;

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
      name: item.kind === 'hotel' ? (hotelFor(plan, day)?.short ?? item.note) : item.name,
      zh: item.kind === 'stop' ? item.zh : (hotelFor(plan, day)?.zh ?? ''),
      note: item.note,
      at: item.at,
      hours: hoursLabel(hours),
      status,
      via: previous?.kind === 'leg' ? legSummary(previous) : (plan.id === ORIGINAL_ID && index > 0 ? 'Right by the last stop' : ''),
      visited: isVisited,
      isNext: false,
      isHotel: item.kind === 'hotel',
      place: placeFor(item, day, plan)
    };

    if (!isVisited && !next) {
      row.isNext = true;
      next = row;
    }

    return row;
  });

  return { rows, next, counts, withHours: counts.open + counts.soon + counts.later + counts.closed };
}
