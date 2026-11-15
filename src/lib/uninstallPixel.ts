import { isTrackingEnabled } from "./matomo";

/**
 * The addon's uninstall pixel.
 *
 * Uninstalls are reported through the same /bg.gif endpoint the extension
 * itself uses, so they land in the addon's Matomo site (idsite 1) next to the
 * install events instead of in a second, separate pipeline.
 *
 * The endpoint is a 1x1 gif, so the browser does the work and no response has
 * to be read.
 */

const PIXEL_ENDPOINT = "https://the-wall.win/bg.gif";

/**
 * Builds the pixel URL, or null when there is nothing to report.
 *
 * `uid` is the addon's random local id. It is the only identifier in the URL
 * and it is not derived from the user, the device or the browser — a missing
 * uid means the visit did not come from the extension, so nothing is sent.
 *
 * Pure on purpose: the URL shape is the contract with Matomo, and it is worth
 * pinning in a test that needs no browser and no network.
 */
export function buildUninstallPixelUrl(uid: string, version: string): string | null {
  if (uid === "") return null;

  const params = new URLSearchParams({
    rec: "1",
    e_c: "Page",
    e_a: "View",
    e_n: "uninstall",
    u: uid,
  });
  if (version !== "") {
    params.set("v", version);
  }

  return `${PIXEL_ENDPOINT}?${params.toString()}`;
}

/**
 * Reports one uninstall.
 *
 * Guarded three ways, each for a different failure:
 *  - `isTrackingEnabled()` keeps local dev, preview builds and automated tests
 *    out of the production numbers — the same gate every other tracker uses.
 *  - sessionStorage dedupes per uid, because a refresh of this page is the
 *    same uninstall and counting it twice would corrupt the number this whole
 *    feature exists to produce.
 *  - the empty-uid case is handled by the builder returning null.
 */
export function reportUninstall(uid: string, version: string): void {
  if (!isTrackingEnabled()) return;

  const url = buildUninstallPixelUrl(uid, version);
  if (url === null) return;

  const dedupeKey = `uninstall_reported_${uid}`;
  try {
    if (window.sessionStorage.getItem(dedupeKey) !== null) return;
    window.sessionStorage.setItem(dedupeKey, "1");
  } catch {
    // Storage can be refused (private mode, hardened settings). Reporting an
    // uninstall twice is better than not reporting it at all, so fall through
    // rather than returning.
  }

  const img = new Image();
  img.src = url;
}
