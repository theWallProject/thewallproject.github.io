# /stats — Matomo Stats Page

Public-facing analytics dashboard for The Wall Project. A single PHP backend
proxies the Matomo Reporting API server-side, validates every response against
a hand-rolled schema, and returns one JSON blob. The React `/stats` route
fetches it and hard-validates with Zod (`.strict()` — unknown keys throw).

> **Design principle:** fail early and hard. Any shape mismatch between the
> Matomo API and the declared schema (PHP or TS) surfaces as an explicit error
> on both sides. No silent fallbacks, no partial rendering of unknown data.

---

## Architecture

```
┌──────────────┐    fetch      ┌────────────────────┐    cURL    ┌────────────┐
│  React SPA   │  /stats.php   │  stats.php         │  HTTP API  │  Matomo     │
│  /stats route│ ────────────▶ │  (dynamic backend) │ ─────────▶ │  Reporting  │
│              │               │                     │            │  API        │
│  Zod parse  │               │  hand-rolled schema │            │  (local)    │
│  (strict)   │               │  validation         │            └────────────┘
└──────────────┘               │  10-min file cache  │
                               └────────────────────┘
```

### Why a PHP proxy (not direct Matomo calls from the browser)?

1. **Token privacy** — `token_auth` never leaves the server.
2. **Aggregation** — one fetch returns 18 Matomo API calls as a single blob.
3. **Server-side validation** — catches Matomo API drift before the client sees it.
4. **Caching** — 10-minute TTL keeps the dashboard snappy and off Matomo's back.

---

## Files

| File                              | Purpose                                                                                           |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/dynamic/stats.php`           | Backend proxy + aggregator (single file, no deps)                                                 |
| `src/dynamic/config.php`          | Server-only secrets (denied web access via `.htaccess`)                                           |
| `src/types/stats.ts`              | Zod strict schemas (`StatsResponseSchema`, etc.)                                                  |
| `src/hooks/useStats.ts`           | Fetch hook with `StatsResponseSchema.parse()`                                                     |
| `src/components/Stats.tsx`        | Page component (large numbers + tables, no graphs)                                                |
| `src/components/Stats.module.css` | Scoped styles (dark theme, RTL, responsive)                                                       |
| `.htaccess`                       | Denies web access to `config.php` / `donations_data.json` (existing rules cover `stats.php` path) |
| `src/App.tsx`                     | Route `<Route path="/stats" element={<Stats />} />`                                               |
| `src/lib/matomo.ts`               | Event action `statsView: "stats_view"`                                                            |
| `src/hooks/useMatomoTracking.ts`  | Tracks `/stats` pageview event                                                                    |
| `src/components/Footer.tsx`       | Footer link to `/stats`                                                                           |
| `src/locales/translations.ts`     | `stats.*` + `stat.*` keys (all 9 languages)                                                       |

---

## Configuration

Constants are split between code (`stats.php`) and secrets (`dynamic/config.php`):

### Site IDs — in `src/dynamic/stats.php` (code, version-controlled)

```php
// Site IDs — named constants, not magic numbers.
// Adding a new tracked property = one constant here, no config changes.
define('MATOMO_SITE_MARKETING', 2); // the-wall.win marketing website
define('MATOMO_SITE_ADDON',     1); // browser addon / app telemetry (future)

// Default site for /stats endpoint.
define('MATOMO_STATS_SITE_ID', MATOMO_SITE_MARKETING);
```

### Secrets — in `dynamic/config.php` (server-only, gitignored)

The config file is loaded by `stats.php` via `require_once`. It is denied
direct web access by `.htaccess` `<FilesMatch>` rules. Required constants:

```php
// Read-only auth token (Matomo Admin → Personal → Security → Auth tokens).
// Create a view-only user. Do NOT reuse an admin token.
define('MATOMO_STATS_TOKEN', '');

// Matomo API base URL (localhost keeps the request in-box).
define('MATOMO_STATS_API_URL', 'http://127.0.0.1/matomo/index.php');
```

### Switching to addon stats later

Change one line in `src/dynamic/stats.php`:

```php
define('MATOMO_STATS_SITE_ID', MATOMO_SITE_ADDON);
```

Or clone `stats.php` as `addon-stats.php` with a different default to expose a
separate `/addon-stats` endpoint.

---

## Matomo API Methods Called

All calls use `module=API&format=JSON&format_metrics=0&idSite=<MATOMO_STATS_SITE_ID>&token_auth=<MATOMO_STATS_TOKEN>`.

| Stat block        | Matomo method                      | Extra params                                                    | PHP parser                               |
| ----------------- | ---------------------------------- | --------------------------------------------------------------- | ---------------------------------------- |
| Today             | `VisitsSummary.get`                | `period=day&date=today`                                         | `parsePeriodSummary`                     |
| Yesterday         | `VisitsSummary.get`                | `period=day&date=yesterday`                                     | `parsePeriodSummary`                     |
| This week         | `VisitsSummary.get`                | `period=week&date=today`                                        | `parsePeriodSummary`                     |
| This month        | `VisitsSummary.get`                | `period=month&date=today`                                       | `parsePeriodSummary`                     |
| Last month        | `VisitsSummary.get`                | `period=month&date=lastMonth`                                   | `parsePeriodSummary`                     |
| All-time          | `VisitsSummary.get`                | `period=range&date=2000-01-01,today`                            | `parsePeriodSummary`                     |
| Top 10 countries  | `UserCountry.getCountry`           | `period=range&date=...`                                         | `parseRankingRows`                       |
| Top 10 continents | `UserCountry.getContinent`         | `period=range&date=...`                                         | `parseRankingRows`                       |
| Top 10 browsers   | `DevicesDetection.getBrowsers`     | `period=range&date=...`                                         | `parseRankingRows`                       |
| Top 10 OS         | `DevicesDetection.getOsVersions`   | `period=range&date=...`                                         | `parseRankingRows`                       |
| Device types      | `DevicesDetection.getType`         | `period=range&date=...`                                         | `parseRankingRows`                       |
| New vs returning  | `VisitFrequency.get`               | `period=range&date=...`                                         | `parseFrequency`                         |
| Referrer types    | `Referrers.getReferrerType`        | `period=range&date=...`                                         | `parseRankingRows`                       |
| Top websites      | `Referrers.getWebsites`            | `period=range&date=...`                                         | `parseRankingRows`                       |
| Download clicks   | `Events.getAction`                 | `period=range&date=...&secondaryDimension=eventCategory&flat=1` | `parseEventActions(…, 'download_click')` |
| Donation clicks   | `Events.getAction`                 | (same call, filtered to `donation_click`)                       | `parseEventActions(…, 'donation_click')` |
| Live now          | `Live.getCounters`                 | `lastMinutes=30`                                                | `parseLiveCounters`                      |
| Funding traction  | (local file `donations_data.json`) | —                                                               | `parseDonationsData`                     |

### Method signatures (from Matomo Reporting API reference)

```
VisitsSummary.get(idSite, period, date, segment='', columns='')
VisitFrequency.get(idSite, period, date, segment='', columns='')
UserCountry.getCountry(idSite, period, date, segment='')
UserCountry.getContinent(idSite, period, date, segment='')
DevicesDetection.getBrowsers(idSite, period, date, segment='')
DevicesDetection.getOsVersions(idSite, period, date, segment='')
DevicesDetection.getType(idSite, period, date, segment='')
Referrers.getReferrerType(idSite, period, date, segment='', typeReferrer='', idSubtable, expanded)
Referrers.getWebsites(idSite, period, date, segment='', expanded, flat)
Events.getAction(idSite, period, date, segment='', expanded, secondaryDimension, flat)
Live.getCounters(idSite, lastMinutes, segment='', showColumns, hideColumns)
```

All ranking endpoints are called with `filter_limit=10` (applied by slicing
the response array in PHP — `STATS_TOP_LIMIT`).

---

## JSON Response Shape

```jsonc
{
  "generatedAt": "2026-07-10T12:00:00Z",
  "visitors": {
    "today":     { "visits": 0, "uniqueVisitors": 0, "actions": 0, "bounceRate": 0, "avgVisitDuration": 0 },
    "yesterday": { ... },
    "thisWeek":  { ... },
    "thisMonth": { ... },
    "lastMonth": { ... },
    "allTime":   { ... }
  },
  "topCountries":  [ { "label": "Egypt", "visits": 0, "logo": "..." } ],
  "topContinents": [ ... ],
  "topBrowsers":   [ ... ],
  "topOs":         [ ... ],
  "deviceTypes":   [ ... ],
  "visitFrequency":{ "newVisits": 0, "returningVisits": 0 },
  "referrerTypes": [ ... ],
  "topWebsites":   [ ... ],
  "downloads":     [ { "label": "chrome", "events": 0 } ],
  "donations":     [ { "label": "kofi", "events": 0 } ],
  "liveNow":       { "visits": 0, "actions": 0 },
  "donationsData": { "currentMonthly": 0, "donations": [ { "amount": 0, "currency": "USD", "timestamp": "", "type": "Donation" } ] }
}
```

### Error envelope (HTTP 500)

```jsonc
{ "error": true, "message": "Stats schema violation: ...", "code": 500 }
```

---

## Schema Contracts (PHP ↔ Zod mirror)

The PHP hand-rolled validators and the Zod schemas describe the **exact same
shapes**. They are intentionally redundant — server-side catches drift before
the client fetches; client-side catches drift if the server is bypassed or
modified incorrectly.

| Zod schema (`src/types/stats.ts`) | PHP validator (`stats.php`) | Fields                                                        |
| --------------------------------- | --------------------------- | ------------------------------------------------------------- |
| `PeriodSummarySchema` (strict)    | `parsePeriodSummary`        | visits, uniqueVisitors, actions, bounceRate, avgVisitDuration |
| `RankingRowSchema` (strict)       | `parseRankingRows`          | label, visits, logo?                                          |
| `VisitFrequencySchema` (strict)   | `parseFrequency`            | newVisits, returningVisits                                    |
| `LiveNowSchema` (strict)          | `parseLiveCounters`         | visits, actions                                               |
| `EventRowSchema` (strict)         | `parseEventActions`         | label, events                                                 |
| `DonationsDataSchema` (strict)    | `parseDonationsData`        | currentMonthly, donations[]                                   |
| `StatsResponseSchema` (strict)    | `fetchAll` (return shape)   | all of the above                                              |

**`.strict()`** on every Zod object means unknown keys cause `parse()` to throw.
The PHP validators only extract declared keys (unknown extras are silently
ignored server-side but rejected client-side). This is intentional — the
server is lenient on input (Matomo adds fields over time) but strict on the
shape it outputs, and the client is strict on what it receives.

---

## Adding a New Stat

1. **`src/dynamic/stats.php`** — add a `$client->get(...)` call in `fetchAll()`
   and parse it with an existing or new `parse…()` function. Add the result
   to the return array.
2. **`src/types/stats.ts`** — add a Zod schema (`.strict()`) for the new block
   and add the field to `StatsResponseSchema`.
3. **`src/components/Stats.tsx`** — render the new data (card or table).
4. **`src/locales/translations.ts`** — add i18n keys for labels (all 9 languages).
5. **`docs/STATS.md`** — add the new method to the table above.

The TypeScript compiler (`tsc -b`) will catch missing schema fields, missing
translation keys, and type mismatches at build time.

---

## Caching

All caching is controlled by a **single constant** in `src/dynamic/stats.php`:

```php
define('STATS_CACHE_TTL', 0); // seconds; 0 = disabled, 600 = 10-min cache
```

This one value drives three layers:

| Layer                       | Behavior when `STATS_CACHE_TTL > 0`                                  | Behavior when `= 0`                                 |
| --------------------------- | -------------------------------------------------------------------- | --------------------------------------------------- |
| Server file cache           | Reads/writes `sys_get_temp_dir()/stats_cache/stats_v1_<siteId>.json` | Skipped — every request hits Matomo live            |
| HTTP `Cache-Control` header | `public, max-age=<ttl>`                                              | `no-store, no-cache, must-revalidate`               |
| Client refetch interval     | `setInterval(fetch, ttl * 1000)`                                     | No polling — fetches only on mount / manual refetch |

The server communicates the TTL to the client via the `X-Stats-Cache-Ttl`
response header. The client reads it and sets (or clears) its polling
interval accordingly — no hardcoded client-side constant.

**To enable caching in production:** set `STATS_CACHE_TTL` to `600` (10 min)
or your preferred interval. Set to `0` while debugging.

---

## Security

- `MATOMO_STATS_TOKEN` lives in `dynamic/config.php`, which is denied web
  access via `.htaccess` `<FilesMatch>`. Never commit a real token to git.
- The endpoint raises `Access-Control-Allow-Origin: *` because the data is
  public read-only (no PII, no secrets in the response). The token only
  proxies read requests server-side.
- Create a **read-only** Matomo user for the token. Do not reuse an admin token.
- `donations_data.json` is also denied web access — `stats.php` reads it
  server-side and only exposes aggregate numbers.

---

## Troubleshooting

| Symptom                                       | Likely cause                              | Fix                                                        |
| --------------------------------------------- | ----------------------------------------- | ---------------------------------------------------------- |
| `HTTP 500: config.php missing`                | `dynamic/config.php` not deployed         | Create it (see Configuration above)                        |
| `HTTP 500: MATOMO_STATS_TOKEN not configured` | Token empty in config                     | Generate a read-only token in Matomo admin                 |
| `HTTP 500: Stats schema violation: ...`       | Matomo API response shape changed         | Update the PHP parser + Zod schema to match                |
| Zod error on client: `Unknown key 'X'`        | Server returned a field not in the schema | Add the field to the Zod schema (or remove it server-side) |
| Empty rankings                                | No data for that period                   | Check Matomo dashboard — make sure site ID is correct      |
| `HTTP 500: Matomo curl error`                 | Matomo unreachable                        | Check `MATOMO_STATS_API_URL` and that Matomo is running    |
| Donations card shows 0                        | `donations_data.json` missing             | Create it (schema: `{"currentMonthly":0,"donations":[]}`)  |

---

## Local Testing

```bash
# 1. Build + copy dynamic files to dist/
npm run build

# 2. Serve dist/ with PHP (or your usual dev server)
php -S localhost:3000 -t dist

# 3. Visit the stats endpoint directly to inspect raw JSON
curl http://localhost:3000/dynamic/stats.php | jq .

# 4. Visit the page
open http://localhost:3000/stats
```

The React dev server (`npm run dev`) proxies unknown routes to `dist/` via
Vite — but `stats.php` requires PHP execution, so test the full build with
`php -S` or your production-like server.

---

## Build Verification

```bash
npm run build
```

Runs: `eslint && prettier --check && tsc -b && vite build && node scripts/copy-dynamic.js`

`tsc -b` catches:

- Missing Zod schema fields
- Missing translation keys
- Type mismatches between `StatsResponse` and component usage
- Unused imports

`copy-dynamic.js` copies `src/dynamic/` → `dist/dynamic/` so `stats.php`
lands in the deployable output.
