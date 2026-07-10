declare global {
  interface Window {
    _mtm: unknown[];
    _paq: unknown[];
  }
}

// Self-hosted Matomo instance at https://the-wall.win/matomo/
// Site ID 2 — Default Container "Live" environment.
// Container URL is protocol-relative so it works on both http (localhost testing
// of the container itself) and https (production).
const MATOMO_CONTAINER_URL = "//the-wall.win/matomo/js/container_MG7eAHG2.js";

// Disable tracking in local development to keep analytics clean.
const isTrackingEnabled = (): boolean => {
  if (typeof window === "undefined") return false;
  const host = window.location.hostname;
  return host !== "localhost" && host !== "127.0.0.1" && host !== "0.0.0.0";
};

let initialized = false;

// ---------------------------------------------------------------------------
// initMatomo — embeds the Matomo Tag Manager container script.
// Per the official React guide:
//   https://matomo.org/faq/new-to-piwik/how-do-i-start-tracking-data-with-matomo-on-websites-that-use-react/
// The MTM container bootstraps window._paq and fires trackPageView/enableLinkTracking
// through triggers configured in the MTM dashboard. We only inject the container
// once on the client; subsequent calls are no-ops.
// ---------------------------------------------------------------------------
export function initMatomo(): void {
  if (initialized || !isTrackingEnabled()) return;
  initialized = true;

  const w = window as Window;
  w._mtm = w._mtm || [];
  w._mtm.push({ "mtm.startTime": new Date().getTime(), event: "mtm.Start" });

  const d = document;
  const g = d.createElement("script");
  const s = d.getElementsByTagName("script")[0];
  g.async = true;
  g.src = MATOMO_CONTAINER_URL;
  if (s && s.parentNode) {
    s.parentNode.insertBefore(g, s);
  } else {
    d.head.appendChild(g);
  }
}

// ---------------------------------------------------------------------------
// trackEvent — fire a Matomo custom event via the JS tracker.
//   _paq.push(['trackEvent', category, action, name, value])
// The _paq queue is created by the MTM container; if tracking is disabled or
// the container has not yet loaded, commands are safely buffered and replayed.
// ---------------------------------------------------------------------------
export function trackEvent(category: string, action: string, name?: string, value?: number): void {
  if (!isTrackingEnabled()) return;
  const w = window as Window;
  w._paq = w._paq || [];
  if (value !== undefined && !Number.isNaN(value)) {
    w._paq.push(["trackEvent", category, action, name ?? "", value]);
  } else if (name) {
    w._paq.push(["trackEvent", category, action, name]);
  } else {
    w._paq.push(["trackEvent", category, action]);
  }
}

// ---------------------------------------------------------------------------
// trackPageView — for SPA route changes.
//   1. _paq.push(['trackPageView']) — records the new pageview using the
//      current location (setCustomUrl is left to the MTM History Change trigger)
//      and the current document.title (set by the caller per route).
//   2. window._mtm.push({event:'mtm.PageView'}) — informs the MTM container,
//      firing any tags attached to a Custom Event trigger for 'mtm.PageView'.
//      See: https://developer.matomo.org/guides/spa-tracking (Solution 1).
// ---------------------------------------------------------------------------
export function trackPageView(): void {
  if (!isTrackingEnabled()) return;
  const w = window as Window;
  w._paq = w._paq || [];
  w._paq.push(["trackPageView"]);
  w._mtm = w._mtm || [];
  w._mtm.push({ event: "mtm.PageView" });
}

// ---------------------------------------------------------------------------
// Event category/action constants — keep analytics consistent.
// ---------------------------------------------------------------------------
export const MatomoEvent = {
  category: {
    engagement: "engagement",
  },
  action: {
    sectionView: "section_view_",
    downloadClick: "download_click",
    languageSwitch: "language_switch",
    donationClick: "donation_click",
    socialClick: "social_click",
    privacyView: "privacy_policy_view",
    statsView: "stats_view",
  },
} as const;
