import { test, expect } from "@playwright/test";
import { buildUninstallPixelUrl } from "../../src/lib/uninstallPixel";

/**
 * The pixel URL is the contract with the addon's Matomo site (idsite 1).
 * Pinned here because a renamed query parameter does not fail loudly — it
 * silently reports an event Matomo stores under a different name, and the
 * install/uninstall numbers drift apart with no error anywhere.
 */
test.describe("uninstall pixel URL", () => {
  test("carries the event name and the uid", () => {
    const url = buildUninstallPixelUrl("abc-123", "1.16.0");
    expect(url).not.toBeNull();

    const parsed = new URL(url!);
    expect(parsed.origin).toBe("https://the-wall.win");
    expect(parsed.pathname).toBe("/bg.gif");
    expect(parsed.searchParams.get("rec")).toBe("1");
    expect(parsed.searchParams.get("e_c")).toBe("Page");
    expect(parsed.searchParams.get("e_a")).toBe("View");
    expect(parsed.searchParams.get("e_n")).toBe("uninstall");
    expect(parsed.searchParams.get("u")).toBe("abc-123");
    expect(parsed.searchParams.get("v")).toBe("1.16.0");
  });

  test("omits the version when it is unknown", () => {
    const url = buildUninstallPixelUrl("abc-123", "");
    const parsed = new URL(url!);

    expect(parsed.searchParams.has("v")).toBe(false);
    expect(parsed.searchParams.get("u")).toBe("abc-123");
  });

  test("returns null without a uid, so nothing is reported", () => {
    expect(buildUninstallPixelUrl("", "1.16.0")).toBeNull();
  });
});
