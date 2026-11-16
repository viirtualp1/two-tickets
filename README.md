# two tickets

Our pocket navigator for Shanghai & Hong Kong, 6–13 December 2026. Vue 3 + Vite + Tailwind 4.

```bash
npm install
npm run dev      # also reachable from a phone on the same Wi-Fi
npm run build    # static site in dist/, works from any folder or host
```

- The whole plan lives in `src/data/trip.ts`: days, stops, hours (`'9:00-21:00'`, `'8:00-14:00,15:00-20:00'`, `'24h'`, `'-22:00'`), hotels and the "Before we go" list.
- Add the Shanghai hotel's Chinese name in `HOTELS.sh.zh` to fill in its taxi card.
- Add `?preview=2026-12-08T11:20` before the `#` to see the app as it will look at that moment of the trip (Shanghai time).
- It is a PWA: open it once with signal and everything (code, fonts, art) is cached on the phone, so it opens offline and on networks that block Google or vercel.app. Fonts are bundled, nothing loads from a third party. Map buttons still need signal.
- Ticks are saved on each phone (localStorage), not shared between phones.
- Watercolour art in `src/assets/art` comes from the original itinerary PDFs.
