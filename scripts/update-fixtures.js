#!/usr/bin/env node

/**
 * update-fixtures.js — refresh tests/fixtures/ with live Matomo API snapshots.
 *
 * Hits the Matomo Reporting API directly (using a debug auth token from the
 * environment) for every method the stats endpoints call, and writes each raw
 * response to tests/fixtures/<siteId>_<method>.json — the same filename the
 * STATS_DEBUG dump mechanism in stats-common.php produces.
 *
 * Prerequisites:
 *   - MATOMO_DEBUG_TOKEN env var (a Matomo read-only auth token). It is read
 *     from process.env first, then .env.local, then .env. The script fails
 *     hard if no token is found — there is no default and no fallback.
 *   - Optional: MATOMO_DEBUG_API_URL (defaults to the production Matomo URL).
 *
 * Run via:  npm run update_fixtures
 * (the package.json script chains `npm run format` after this, so the new
 * JSON files are prettier-formatted on disk.)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, "..");
const FIXTURES_DIR = path.join(ROOT, "tests", "fixtures");

const DEFAULT_API_URL = "https://the-wall.win/matomo/index.php";
const ALL_TIME_RANGE = "2000-01-01,today";

// -------------------------------------------------------------------------
// Env loading — process.env wins, then .env.local, then .env.
// -------------------------------------------------------------------------

function parseEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  const raw = fs.readFileSync(file, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function loadEnv() {
  const merged = {};
  Object.assign(merged, parseEnvFile(path.join(ROOT, ".env")));
  Object.assign(merged, parseEnvFile(path.join(ROOT, ".env.local")));
  return new Proxy(merged, {
    get(target, prop) {
      if (typeof prop !== "string") return undefined;
      if (process.env[prop] && process.env[prop] !== "") return process.env[prop];
      return target[prop];
    },
  });
}

const env = loadEnv();

const TOKEN = env.MATOMO_DEBUG_TOKEN;
const API_URL = env.MATOMO_DEBUG_API_URL || DEFAULT_API_URL;

if (!TOKEN) {
  console.error(
    "✗ MATOMO_DEBUG_TOKEN is not set.\n" +
      "  Provide it via process.env, .env, or .env.local (gitignored via *.local).\n" +
      "  Example .env.local:\n" +
      "    MATOMO_DEBUG_TOKEN=abc123token\n" +
      "    MATOMO_DEBUG_API_URL=https://the-wall.win/matomo/index.php\n" +
      "  Generate a read-only token in Matomo admin → Personal → Security."
  );
  process.exit(1);
}

// -------------------------------------------------------------------------
// Fixture calls — mirror the exact Matomo API calls stats.php /
// addon-stats.php make. VisitsSummary.get is called several times per
// endpoint with different periods, but the STATS_DEBUG dump filename is
// `<siteId>_VisitsSummary_get.json` (method-only), so the last call wins.
// We only need the all-time range call here (also what the unit tests parse
// as the "allTime" period).
//
// Site IDs:
//   1 = MATOMO_SITE_ADDON   (browser add-on telemetry)
//   2 = MATOMO_SITE_MARKETING (the-wall.win marketing site)
// -------------------------------------------------------------------------

const RANGE_PARAMS = { period: "range", date: ALL_TIME_RANGE };

/**
 * @typedef {{ siteId: number, method: string, extraParams?: Record<string,string>, suffix?: string }} Call
 */

/** @type {Call[]} */
const CALLS = [
  // Shared calls — addon (site 1)
  { siteId: 1, method: "VisitsSummary.get", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "UserCountry.getCountry", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "UserCountry.getContinent", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "DevicesDetection.getBrowsers", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "DevicesDetection.getOsVersions", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "DevicesDetection.getType", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "VisitFrequency.get", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "Referrers.getReferrerType", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "Referrers.getWebsites", extraParams: RANGE_PARAMS },
  { siteId: 1, method: "Live.getCounters", extraParams: { lastMinutes: "30" } },
  // Addon-specific
  { siteId: 1, method: "Actions.getPageTitles", extraParams: { ...RANGE_PARAMS, flat: "1" } },
  // Events.getName — all-time + this-week + this-month. The engagement
  // breakdown tables on the stats page need per-period counts for every
  // banner/hint action name, so we fetch three snapshots. The suffix
  // disambiguates the fixture files (the all-time call keeps the legacy
  // unsuffixed name for backwards compatibility with existing tests).
  { siteId: 1, method: "Events.getName", extraParams: { ...RANGE_PARAMS, flat: "1" } },
  { siteId: 1, method: "Events.getName", extraParams: { period: "week", date: "today", flat: "1" }, suffix: "week" },
  { siteId: 1, method: "Events.getName", extraParams: { period: "month", date: "today", flat: "1" }, suffix: "month" },

  // Shared calls — marketing (site 2)
  { siteId: 2, method: "VisitsSummary.get", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "UserCountry.getCountry", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "UserCountry.getContinent", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "DevicesDetection.getBrowsers", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "DevicesDetection.getOsVersions", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "DevicesDetection.getType", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "VisitFrequency.get", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "Referrers.getReferrerType", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "Referrers.getWebsites", extraParams: RANGE_PARAMS },
  { siteId: 2, method: "Live.getCounters", extraParams: { lastMinutes: "30" } },
  // Marketing-specific
  {
    siteId: 2,
    method: "Events.getAction",
    extraParams: { ...RANGE_PARAMS, secondaryDimension: "eventName", flat: "1" },
  },
];

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

function fixtureFilename(siteId, method, suffix) {
  const base = `${siteId}_${method.replace(/\./g, "_")}`;
  return suffix ? `${base}_${suffix}.json` : `${base}.json`;
}

function clearFixtures() {
  if (!fs.existsSync(FIXTURES_DIR)) {
    fs.mkdirSync(FIXTURES_DIR, { recursive: true });
    return;
  }
  const entries = fs.readdirSync(FIXTURES_DIR);
  for (const entry of entries) {
    if (!entry.endsWith(".json")) continue;
    fs.unlinkSync(path.join(FIXTURES_DIR, entry));
  }
}

/**
 * Call one Matomo Reporting API method. Mirrors MatomoStatsClient::get() in
 * stats-common.php: method/idSite/period/date/format go in the query string,
 * token_auth goes in the POST body only (POST-only tokens reject auth if the
 * token appears in the URL).
 */
async function callMatomo(call) {
  const urlParams = new URLSearchParams({
    module: "API",
    method: call.method,
    idSite: String(call.siteId),
    format: "JSON",
    format_metrics: "0",
    ...call.extraParams,
  });
  const url = `${API_URL}?${urlParams.toString()}`;
  const postBody = new URLSearchParams({ token_auth: TOKEN });

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: postBody.toString(),
  });

  const rawText = await res.text();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${call.method} (site ${call.siteId}): ${rawText.slice(0, 500)}`);
  }

  let decoded;
  try {
    decoded = JSON.parse(rawText);
  } catch {
    throw new Error(`Non-JSON response for ${call.method} (site ${call.siteId}): ${rawText.slice(0, 500)}`);
  }

  if (decoded && typeof decoded === "object" && decoded.result === "error") {
    const msg = decoded.message || "unknown error";
    throw new Error(`Matomo API error for ${call.method} (site ${call.siteId}): ${msg}`);
  }

  return decoded;
}

// -------------------------------------------------------------------------
// Main
// -------------------------------------------------------------------------

async function main() {
  console.log(`Update fixtures — Matomo API: ${API_URL}`);
  console.log(`Clearing tests/fixtures/ ...`);
  clearFixtures();

  let ok = 0;
  let failed = 0;
  for (const call of CALLS) {
    const filename = fixtureFilename(call.siteId, call.method, call.suffix);
    const dest = path.join(FIXTURES_DIR, filename);
    process.stdout.write(`  ${filename.padEnd(42)} ... `);
    try {
      const data = await callMatomo(call);
      fs.writeFileSync(dest, JSON.stringify(data, null, 2) + "\n", "utf8");
      const rows = Array.isArray(data) ? `array[${data.length}]` : typeof data;
      console.log(`ok (${rows})`);
      ok++;
    } catch (err) {
      console.log(`FAILED`);
      console.error(`    ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone — ${ok} written, ${failed} failed.`);
  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("✗ Unhandled error:", err);
  process.exit(1);
});
