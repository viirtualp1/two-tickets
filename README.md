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
- The checklist and visit ticks work offline. Existing checklist ticks carry over on the same browser and app URL. Reminder times are stored as absolute timestamps and displayed in the current device time zone.
- While the app is running, a due reminder appears above any screen. Enable device notifications in the editor on a supported browser and HTTPS site. To get an alert while the app is closed, save the to-do, open it again, download its `.ics` file, and import the event into your calendar. Check that the imported event has an alert. Manage changes to imported events in your calendar.
- Watercolour art in `src/assets/art` comes from the original itinerary PDFs.

## UI conventions

- Keep pages phone-first with the `max-w-md` column and safe-area spacing. Use Bricolage Grotesque for headings and controls, and Caveat for short handwritten notes.
- Reuse the semantic colors in `src/style.css`. `App.vue` switches the Shanghai coral palette (`#fff6f3` paper, `#c53a30` accent) and Hong Kong green palette (`#f1f7f3` paper, `#1d7563` accent). Use `bg-paper`, `bg-tint`, `bg-card`, `text-accent-ink` and `border-line` in components.
- Use white rounded cards for lists, pill actions, and 44px or larger touch targets. `DayTicket.vue` and the home hero use perforated ticket masks. `PlaceSheet.vue` and `TripChecklist.vue` show the bottom-sheet layout. Add small line icons through `AppIcon.vue`.

## Two-device sync

On the first device, open **Sync devices**, enter the setup code and create a link. Open it on the second device and choose **Pair this device**. If you use the home-screen app on the second device, open it, choose **Join with a link**, and paste the link there. A link works once and expires in 15 minutes. The first device can remove the other one.

Both devices share imported trips, checklist items, reminder times, and visited places. Each device keeps its own active-trip selection, notification permission, and reminder dismissals. Changes sync on launch, foreground, reconnect, and periodically while the app is open. If both devices edit the same item while offline, open **Sync devices** to choose which version to keep. When joining, this also applies to edits already made independently on the second device.

## Import a trip

- **Paste notes** works offline. Start each day with an ISO date and city. Put each stop on its own line. Use `|` to separate a stop name, note, local name and opening hours. Use the review screen to fill missing dates or correct the extracted entries.
- **PDF or photo** analyzes a PDF, JPEG, PNG, or WebP up to 4 MB with OpenAI. It presents the extracted facts and short source excerpts for review. For larger PDFs, export just the itinerary pages or paste their text.
- Edit day dates, the trip-wide time zone, places, hours, travel legs and hotel cards in the draft. Remove days or entries and use Undo before saving. After saving, open **Edit trip** to make further changes. Existing trips stay available in the trip picker, and checkmarks follow each stop if it moves.

```text
Trip: Weekend in Tbilisi
Time zone: Asia/Tbilisi
2026-12-21 | Tbilisi | Old Town
09:00 Narikala | Wear comfortable shoes
11:00 Dry Bridge | Flea market | მშრალი ხიდი | 9:00-17:00
```

## Server setup

Deploy the Vite project and its `api/` functions together on Vercel. For local API development, use `vercel dev`. Set these server-side environment variables in the project and for local API development.

| Variable | Purpose |
| --- | --- |
| `TRIP_SETUP_CODE` | Private code for creating a sync workspace and analyzing PDFs or photos. Generate a random value and enter it only on the first device or in the file import form. |
| `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` | Persistent sync storage for both devices. |
| `OPENAI_API_KEY` | Enables PDF and photo import. |
| `TRIP_IMPORT_MODEL` | Optional override for the vision model. Defaults to `gpt-4.1-mini`. |

Plain Vite dev or a static build still supports existing trips, checklists, visit ticks, and pasted-note imports. Test the deployed sync endpoint from the connection each device will use.
