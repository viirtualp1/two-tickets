import { CITY_NAMES, HOTELS, TRIP_DAYS } from '../data/trip';
import type { City, Hotel, RouteItem, TripDay } from '../data/trip';

export type Destination = City | 'other';
export type PlanItem = RouteItem & { id: string };
export type PlanDay = Omit<TripDay, 'city' | 'items'> & {
  id: string
  isoDate: string
  city: Destination
  cityName: string
  hotel?: Hotel
  items: PlanItem[]
};
export interface TripPlan {
  id: string
  title: string
  timeZone: string
  days: PlanDay[]
  hotels: Partial<Record<Destination, Hotel>>
}

export const ORIGINAL_ID = 'shanghai-hong-kong-2026';
export const originalPlan: TripPlan = {
  id: ORIGINAL_ID,
  title: 'Shanghai & Hong Kong',
  timeZone: 'Asia/Shanghai',
  hotels: HOTELS,
  days: TRIP_DAYS.map((day, index) => ({
    ...day,
    id: String(index + 1),
    isoDate: `2026-12-${String(day.date).padStart(2, '0')}`,
    cityName: CITY_NAMES[day.city],
    items: day.items.map((item, position) => ({ ...item, id: `${index}-${position}` }))
  }))
};

export function newId () {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)), byte => byte.toString(16).padStart(2, '0')).join('');
}

export function dayDate (isoDate: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('en-GB', { ...options, timeZone: 'UTC' }).format(new Date(isoDate + 'T00:00Z'));
}

export function planQuery (plan: TripPlan) {
  return plan.id === ORIGINAL_ID ? {} : { trip: plan.id };
}

export function dayLink (plan: TripPlan, day: PlanDay) {
  return { name: 'day', params: { number: day.id }, query: planQuery(plan) };
}

export function taxiLink (plan: TripPlan, target: string) {
  return { name: 'taxi', params: { target }, query: planQuery(plan) };
}

export function dayPosition (plan: TripPlan, key: string) {
  const index = plan.days.findIndex(day => day.id === key);
  return index < 0 ? 0 : index;
}

export function hotelFor (plan: TripPlan, day: PlanDay) {
  return day.hotel ?? plan.hotels[day.city];
}

export function hotelTarget (day: PlanDay) {
  return day.hotel ? `hotel-day-${day.id}` : `hotel-${day.city}`;
}
