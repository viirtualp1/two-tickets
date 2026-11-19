import type { Place } from './route';

const SHANGHAI_CITY_CODE = '310000';
const CITY_CENTRES = {
  sh: '31.2304,121.4737',
  hk: '22.2800,114.1700',
  bkk: '13.7563,100.5018'
};

export function directionsUrl (place: Place) {
  const keyword = place.zh || place.name;

  if (place.city === 'sh') {
    const query = new URLSearchParams({ keyword, city: SHANGHAI_CITY_CODE, callnative: '1' });

    return `https://uri.amap.com/search?${query}`;
  }

  const query = new URLSearchParams({ api: '1', query: `${keyword} ${place.cityName}` });

  return `https://www.google.com/maps/search/?${query}`;
}

export function appleMapsUrl (place: Place) {
  const query = new URLSearchParams({ q: place.zh || place.name, ...(place.city === 'other' ? {} : { sll: CITY_CENTRES[place.city] }) });

  return `https://maps.apple.com/?${query}`;
}

export function directionsLabel (place: Place) {
  return place.city === 'sh' ? 'Amap' : 'Google Maps';
}
