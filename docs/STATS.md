# /stats — Matomo Stats Page

Public-facing analytics dashboard for The Wall Project. Two PHP backends
(`/dynamic/stats.php` for the marketing site and `/dynamic/addon-stats.php`
for the browser-addon telemetry) share a common library (`stats-common.php`)
to proxy the Matomo Reporting API server-side, validate every response
against a hand-rolled schema, and return one JSON blob per endpoint. The
React `/stats` route renders both as separate tabs (loading independent)
and hard-validates each with Zod (`.strict()` — unknown keys throw).

> **Design principle:** fail early and hard. Any shape mismatch between the
> Matomo API and the declared schema (PHP or TS) surfaces as an explicit error
> on both sides. No silent fallbacks, no partial rendering of unknown data.

---

## Architecture

```
┌──────────────┐  fetch /dynamic/stats.php      ┌──────────────────────┐  cURL  ┌────────────┐
│  React SPA   │  fetch /dynamic/addon-stats.php│  stats-common.php    │  HTTP  │  Matomo    │
│  /stats route│ ─────────────────────────────▶ │  (shared library)   │ ─────▶│  Reporting │
│              │                                 │  ▲ stats.php         │       │  API       │
│  Zod parse   │                                 │  ▲ addon-stats.php   │       │  (local)   │
│  (strict)    │                                 │  hand-rolled schema  │       └────────────┘
└──────────────┘                                 │  10-min file cache   │
                                                 └──────────────────────┘
```

Two thin sibling endpoints (`stats.php`, `addon-stats.php`) each `define` a
site ID, `require` the shared library, and call `runEndpoint()`. The library
holds the schema helpers, Matomo client, cache, and the shared parsers
(period summary, rankings, frequency, live, event-actions, donations). Only
addon-specific parsers (`parsePageTitleHits`, `parseEventNameGroupsDetailed`)
and the `ADDON_ACTION_GROUPS` map plus the `ADDON_*_ACTION_NAMES` lists live
in `addon-stats.php`.

### Why a PHP proxy (not direct Matomo calls from the browser)?

1. **Token privacy** — `token_auth` never leaves the server.
2. **Aggregation** — one fetch returns 18 Matomo API calls as a single blob.
3. **Server-side validation** — catches Matomo API drift before the client sees it.
4. **Caching** — 10-minute TTL keeps the dashboard snappy and off Matomo's back.

---

## Files

| File                              | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/dynamic/stats-common.php`    | Shared library: bootstrap, CORS/cache headers, primitive schema helpers, `MatomoStatsClient`, shared parsers (`parsePeriodSummary`, `parseRankingRows`, `parseFrequency`, `parseLiveCounters`, `parseEventActions`, `parseDonationsData`), cache layer, `runEndpoint()` driver. Required by both endpoints; never served directly (`.htaccess` denies it).                                                                                                       |
| `src/dynamic/stats.php`           | Marketing endpoint: `define`s site IDs + `MATOMO_STATS_SITE_ID = MATOMO_SITE_MARKETING`, requires `stats-common.php`, defines `fetchAllMarketing()`, calls `runEndpoint()`.                                                                                                                                                                                                                                                                                      |
| `src/dynamic/addon-stats.php`     | Addon endpoint: `MATOMO_STATS_SITE_ID = MATOMO_SITE_ADDON`, requires `stats-common.php`, defines addon-specific parsers (`parsePageTitleHits`, `parseEventNameGroupsDetailed`) + `ADDON_ACTION_GROUPS` map (donations+shares only) + `ADDON_BANNER_ACTION_NAMES`/`ADDON_HINT_ACTION_NAMES`/`ADDON_WHATSNEW_ACTION_NAMES` lists + `fetchAllAddon()`, calls `runEndpoint()`.                                                                                       |
| `src/dynamic/config.php`          | Server-only secrets (denied web access via `.htaccess`)                                                                                                                                                                                                                                                                                                                                                                                                          |
| `src/types/stats.ts`              | Zod strict schemas (`StatsResponseSchema`, `AddonStatsResponseSchema`, `AddonActionsSchema`, etc.)                                                                                                                                                                                                                                                                                                                                                               |
| `src/hooks/useStatsBase.ts`       | Generic fetch + hard-validate hook (`useStatsBase<T>(url, schema)`) shared by both tabs. Mirrors the old `useStats` body.                                                                                                                                                                                                                                                                                                                                        |
| `src/hooks/useStats.ts`           | Thin wrappers: `useStats()` (marketing) and `useAddonStats()` (addon). Loading stays independent per tab.                                                                                                                                                                                                                                                                                                                                                        |
| `src/components/Stats.tsx`        | Page shell with tab switcher (URL-hash-synced, lazy mount + `display:none` keep-alive). Extracts `WebsiteStatsTab` and `AddonStatsTab`. Shared `StatCard`, `RankingTable`, `EventsTable` subcomponents.                                                                                                                                                                                                                                                          |
| `src/components/Stats.module.css` | Scoped styles (dark theme, RTL, responsive) + `.tabs`/`.tab`/`.tabActive`/`.hidden`                                                                                                                                                                                                                                                                                                                                                                              |
| `.htaccess`                       | Denies web access to `config.php` / `donations_data.json` / `stats-common.php`; rewrites `stats.php` + `addon-stats.php` to `dist/dynamic/`.                                                                                                                                                                                                                                                                                                                     |
| `src/App.tsx`                     | Route `<Route path="/stats" element={<Stats />} />`                                                                                                                                                                                                                                                                                                                                                                                                              |
| `src/lib/matomo.ts`               | Event action `statsView: "stats_view"`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| `src/hooks/useMatomoTracking.ts`  | Tracks `/stats` pageview event                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| `src/components/Footer.tsx`       | Footer link to `/stats`                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| `src/locales/translations.ts`     | `stats.*` + `stat.*` keys (all 9 languages) — includes addon-tab keys (`stats.tab.*`, `stats.totalBlocks`, `stats.topBlockedSites`, `stats.addonActions`, `stat.donationClicks`, `stat.shares`, `stat.bannerEngagement`, `stat.hintEngagement`, `stat.whatsnewEngagement`, `stat.whatsnewViews`, `stat.blocks`, `stat.techForPalestine`, `stat.alternativesShown`, `stat.hintsClicked`, `stat.allTime`, `stat.thisWeek`, `stat.thisMonth`, `stats.whatsnewPage`) |

---

## Configuration

Constants are split between code (`stats.php`) and secrets (`dynamic/config.php`):

### Site IDs — in `src/dynamic/stats.php` (code, version-controlled)

```php
// Site IDs — named constants, not magic numbers.
// Adding a new tracked property = one constant here, no config changes.
define('MATOMO_SITE_MARKETING', 2); // the-wall.win marketing website
define('MATOMO_SITE_ADDON',     1); // browser addon

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

// Matomo API base URL.
define('MATOMO_STATS_API_URL', 'https://the-wall.win/matomo/index.php');
```

### Adding a third tracked property

Both endpoints follow the same pattern: copy `stats.php`, change the
`MATOMO_STATS_SITE_ID` constant, write a `fetchAll*()` callback that returns
the validated response array (using shared parsers or new ones), and call
`runEndpoint()`. Add a matching Zod schema in `src/types/stats.ts` and a
matching `use*Stats` hook via `useStatsBase<T>(url, schema)`. No changes to
`stats-common.php` are needed unless a new shared parser is required.

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
Events.getName(idSite, period, date, segment='', expanded, secondaryDimension, flat)
Actions.getPageTitles(idSite, period, date, segment='', flat, filter_limit, ...)
Live.getCounters(idSite, lastMinutes, segment='', showColumns, hideColumns)
```

All ranking endpoints are called with `filter_limit=10` (applied by slicing
the response array in PHP — `STATS_TOP_LIMIT`).

### Addon tab (`/dynamic/addon-stats.php`, `MATOMO_SITE_ADDON`)

The addon endpoint reuses every shared parser above (visitors, frequency,
rankings, live, donations) and adds three addon-specific Matomo calls plus
two more `Events.getName` snapshots for the period-aware breakdown tables:

| Stat block                 | Matomo method           | Extra params                     | PHP parser                                                                                    |
| -------------------------- | ----------------------- | -------------------------------- | --------------------------------------------------------------------------------------------- |
| Total blocks               | `Actions.getPageTitles` | `period=range&date=...&flat=1`   | `parsePageTitleHits(…, 'wall')` (reads `nb_hits`)                                             |
| Top blocked sites          | `Referrers.getWebsites` | `period=range&date=...`          | `parseRankingRows` (shared)                                                                   |
| Addon actions (all-time)   | `Events.getName`        | `period=range&date=...&flat=1`   | `parseEventNameGroupsDetailed` (sums `nb_events` per period; merges the 3 snapshots per name) |
| Addon actions (this week)  | `Events.getName`        | `period=week&date=today&flat=1`  | `parseEventNameGroupsDetailed`                                                                |
| Addon actions (this month) | `Events.getName`        | `period=month&date=today&flat=1` | `parseEventNameGroupsDetailed`                                                                |

`Actions.getPageTitles` returns one row per page title; we filter `label="wall"` and read `nb_hits` as the total-blocks proxy (the addon fires one anonymous page view named `wall` each time the flagging banner renders). The blocked host is captured by Matomo as the `bg.gif` referrer, so `Referrers.getWebsites` returns the top blocked sites.

`Events.getName` is used (not `Events.getAction`) because the addon varies events by name (`donation_bricks`, `share_fb`, `hint_link`, …) under a single category/action pair (`Button`/`Click`); `Events.getAction` would collapse to one row. `parseEventNameGroupsDetailed` merges the three snapshots (all-time / week / month) keyed by `Events_EventName`, then emits:

- **Period-aware headline aggregates** (each `={allTime, week, month}`):
  - `donationClicks` — sum of `donation_bricks`, `options_donate`, `support_ko_fi`, `whatsnew_donate_monthly`, `whatsnew_donation_image`
  - `shares` — sum of `share_*`, `options_share_*`, `whatsnew_share_*` (16 names)
  - `altClicks` — `show_alternatives` (banner alternatives dropdown opened)
  - `techForPalestine` — `support_pal` (Redirections to Tech for Palestine)
  - `hintClicks` — `hint_link` (opening a hint URL)
  - `whatsnewViewsTotal` — sum of every `whatsnew_update_*` row (prefix match)
  - `whatsnewEngagementTotal` — `whatsnew_youtube_telpshow` + `whatsnew_visit_website` + `whatsnew_contact` + `whatsnew_report`
- **Per-action breakdown tables** (`[{label, allTime, week, month}, ...]` sorted by `allTime` desc):
  - `bannerActions` — every `ADDON_BANNER_ACTION_NAMES` entry (`show_alternatives`, `show_bds_guide`, `support_pal`, `report_mistake`, `dismiss_close`)
  - `hintActions` — every `ADDON_HINT_ACTION_NAMES` entry (`hint_link`, `hint_expand`, `hint_dismiss_this`, `hint_disable_all`, `hint_toggle_system`, `hint_reset_dismissed`)
  - `whatsnewActions` — every `ADDON_WHATSNEW_ACTION_NAMES` entry
  - `whatsnewViews` — top `ADDON_WHATSNEW_VIEWS_LIMIT` `whatsnew_update_*` rows (one row per `<from>_to_<to>` version pair)

The breakdown tables deliberately include the negative events (`dismiss_close`, `hint_dismiss_this`, `hint_disable_all`) so investors see the full engagement funnel alongside the positive actions, while the headline aggregates exclude them so the trend signal stays positive.

---

## JSON Response Shape

### Website tab — `/dynamic/stats.php`

```jsonc
{
  "generatedAt": "2026-07-10T12:00:00Z",
  "site": "marketing",
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

### Addon tab — `/dynamic/addon-stats.php`

```jsonc
{
  "generatedAt": "2026-07-10T12:00:00Z",
  "site": "addon",
  "visitors":      { /* same six-period block as the marketing tab */ },
  "topCountries":  [ ... ],
  "topContinents": [ ... ],
  "topBrowsers":   [ ... ],
  "topOs":         [ ... ],
  "deviceTypes":   [ ... ],
  "visitFrequency":{ "newVisits": 0, "returningVisits": 0 },
  "referrerTypes":  [ ... ],
  "topBlockedSites": [ { "label": "example.com", "visits": 0 } ],
  "totalBlocks":     0,
  "addonActions": {
    // Period-aware headline aggregates — each { allTime, week, month }
    "donationClicks":         { "allTime": 0, "week": 0, "month": 0 },
    "shares":                 { "allTime": 0, "week": 0, "month": 0 },
    "altClicks":              { "allTime": 0, "week": 0, "month": 0 }, // show_alternatives
    "techForPalestine":       { "allTime": 0, "week": 0, "month": 0 }, // support_pal
    "hintClicks":             { "allTime": 0, "week": 0, "month": 0 }, // hint_link
    "whatsnewViewsTotal":     { "allTime": 0, "week": 0, "month": 0 },
    "whatsnewEngagementTotal":{ "allTime": 0, "week": 0, "month": 0 },
    // Per-action breakdown rows — each { label, allTime, week, month }, sorted by allTime desc
    "bannerActions":  [ { "label": "show_alternatives", "allTime": 0, "week": 0, "month": 0 } ],
    "hintActions":    [ { "label": "hint_link",        "allTime": 0, "week": 0, "month": 0 } ],
    "whatsnewActions":[ { "label": "whatsnew_visit_website", "allTime": 0, "week": 0, "month": 0 } ],
    "whatsnewViews":  [ { "label": "whatsnew_update_1_14_0_to_1_15_2", "allTime": 0, "week": 0, "month": 0 } ]
  },
  "liveNow":       { "visits": 0, "actions": 0 },
  "donationsData": { /* same shared block as the marketing tab */ }
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

| Zod schema (`src/types/stats.ts`)   | PHP validator                      | Fields                                                                                                                                                                                                                                      |
| ----------------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `PeriodSummarySchema` (strict)      | `parsePeriodSummary`               | visits, uniqueVisitors, actions, bounceRate, avgVisitDuration                                                                                                                                                                               |
| `RankingRowSchema` (strict)         | `parseRankingRows`                 | label, visits, logo?                                                                                                                                                                                                                        |
| `VisitFrequencySchema` (strict)     | `parseFrequency`                   | newVisits, returningVisits                                                                                                                                                                                                                  |
| `LiveNowSchema` (strict)            | `parseLiveCounters`                | visits, actions                                                                                                                                                                                                                             |
| `EventRowSchema` (strict)           | `parseEventActions`                | label, events                                                                                                                                                                                                                               |
| `DonationsDataSchema` (strict)      | `parseDonationsData`               | currentMonthly, donations[]                                                                                                                                                                                                                 |
| `StatsResponseSchema` (strict)      | `fetchAllMarketing` (return shape) | site + all of the above (marketing tab)                                                                                                                                                                                                     |
| `AddonActionsSchema` (strict)       | `parseEventNameGroupsDetailed`     | donationClicks, shares, altClicks, techForPalestine, hintClicks, whatsnewViewsTotal, whatsnewEngagementTotal (each `{allTime,week,month}`) + bannerActions/hintActions/whatsnewActions/whatsnewViews arrays of `{label,allTime,week,month}` |
| `AddonStatsResponseSchema` (strict) | `fetchAllAddon` (return shape)     | site + shared blocks + totalBlocks, topBlockedSites, addonActions                                                                                                                                                                           |

**`.strict()`** on every Zod object means unknown keys cause `parse()` to throw.
The PHP validators only extract declared keys (unknown extras are silently
ignored server-side but rejected client-side). This is intentional — the
server is lenient on input (Matomo adds fields over time) but strict on the
shape it outputs, and the client is strict on what it receives.

---

## Adding a New Stat

1. **`src/dynamic/stats.php`** (or `addon-stats.php`) — add a `$client->get(...)`
   call in `fetchAllMarketing()` (or `fetchAllAddon()`) and parse it with an
   existing shared `parse…()` from `stats-common.php` or a new one. Add the
   result to the return array. If the parser is `≥90 %` shared, put it in
   `stats-common.php`; otherwise keep it endpoint-local.
2. **`src/types/stats.ts`** — add a Zod schema (`.strict()`) for the new block
   and add the field to `StatsResponseSchema` and/or `AddonStatsResponseSchema`.
3. **`src/components/Stats.tsx`** — render the new data (card or table) in the
   relevant tab component.
4. **`src/locales/translations.ts`** — add i18n keys for labels (all 9 languages),
   then run `npm run generate-i18n`.
5. **`docs/STATS.md`** — add the new method to the table above (+ the
   `Addon` section if it's an addon stat).

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
