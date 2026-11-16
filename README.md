# two tickets

Our pocket navigator for Shanghai & Hong Kong, 6–13 December 2026. Vue 3 + Vite + Tailwind 4.

```bash
npm install
npm run dev      # also reachable from a phone on the same Wi-Fi
npm run build    # static site in dist/, works from any folder or host
```

- The bundled itinerary lives in `src/data/trip.ts`. It contains days, stops, hours (`'9:00-21:00'`, `'8:00-14:00,15:00-20:00'`, `'24h'`, `'-22:00'`), hotels and the initial checklist.
- Add the Shanghai hotel's Chinese name in `HOTELS.sh.zh` to fill in its taxi card.
- Add `?preview=2026-12-08T11:20` before the `#` to see the app as it will look at that moment of the trip (Shanghai time).
- It is a PWA: open it once with signal and everything (code, fonts, art) is cached on the phone, so it opens offline and on networks that block Google or vercel.app. Fonts are bundled, nothing loads from a third party. Map buttons still need signal.
- The checklist and visit ticks are saved on this device. Existing checklist ticks carry over on the same browser and app URL. Reminder times are stored as absolute timestamps and displayed in the current device time zone.
- While the app is running, a due reminder appears above any screen. Enable device notifications in the editor on a supported browser and HTTPS site. To get an alert while the app is closed, save the to-do, open it again, download its `.ics` file, and import the event into your calendar. Check that the imported event has an alert. Manage changes to imported events in your calendar.
- Watercolour art in `src/assets/art` comes from the original itinerary PDFs.

## UI conventions

- Keep pages phone-first with the `max-w-md` column and safe-area spacing. Use Bricolage Grotesque for headings and controls, and Caveat for short handwritten notes.
- Reuse the semantic colors in `src/style.css`. `App.vue` switches the Shanghai coral palette (`#fff6f3` paper, `#c53a30` accent) and Hong Kong green palette (`#f1f7f3` paper, `#1d7563` accent). Use `bg-paper`, `bg-tint`, `bg-card`, `text-accent-ink` and `border-line` in components.
- Use white rounded cards for lists, pill actions, and 44px or larger touch targets. `DayTicket.vue` and the home hero use perforated ticket masks. `PlaceSheet.vue` and `TripChecklist.vue` show the bottom-sheet layout. Add small line icons through `AppIcon.vue`.

## Two-device sync and new trips

For automatic sync, pair both installs to one private trip through an expiring QR code or link and issue each install its own credential. Store a revision per task on the server. Queue edits locally with mutation IDs and sync on startup, foreground and reconnect. Send each edit with its base revision so the app can surface conflicting changes to the same task. Keep deletions as tombstones until both installs have received them. This is enough for two devices without a permanent realtime connection. Test the deployed API from the networks both phones will use during the trip. The cached itinerary and queued edits should remain usable offline.

For imports, move the bundled itinerary into a versioned trip model with a trip ID, ISO dates, a time zone, hotels, and stable day and stop IDs. Keep the current itinerary as the first stored trip and migrate its positional IDs so checkmarks and taxi links still point to the right stops. Use each trip’s dates and time zone for the countdown and live route clock. Accept pasted notes, extract text from PDFs with a text layer, and use OCR on images or scanned pages. Preserve the source page or excerpt for each proposal. Flag unclear dates, opening hours and Chinese place names for review. Let the user edit, exclude or reorder days and stops before first save, and remove them with Undo after save. When removing a stop, flag its incoming and outgoing travel legs for review. Keep prior trips available when saving a new one.
