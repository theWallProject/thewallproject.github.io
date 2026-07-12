import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useStats, useAddonStats } from "../hooks/useStats";
import type { RankingRow, EventRow } from "../types/stats";
import Header from "./Header";
import Footer from "./Footer";
import styles from "./Stats.module.css";

const formatNum = (n: number): string => n.toLocaleString();

const StatCard: React.FC<{ label: string; value: string; accent?: boolean; sub?: string }> = ({
  label,
  value,
  accent,
  sub,
}) => (
  <div className={`${styles.card} ${accent ? styles.cardAccent : ""}`}>
    <p className={styles.cardLabel}>{label}</p>
    <p className={styles.cardValue}>{value}</p>
    {sub && <p className={styles.cardSub}>{sub}</p>}
  </div>
);

const RankingTable: React.FC<{ rows: RankingRow[]; visitsLabel: string }> = ({ rows, visitsLabel }) => (
  <table>
    <thead>
      <tr>
        <th></th>
        <th className={styles.visits}>{visitsLabel}</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => (
        <tr key={`${row.label}-${i}`}>
          <td>
            <span className={styles.trackedLabel}>
              {row.logo && <img src={row.logo} alt="" loading="lazy" />}
              <span>{row.label}</span>
            </span>
          </td>
          <td className={styles.visits}>{formatNum(row.visits)}</td>
        </tr>
      ))}
    </tbody>
  </table>
);

// Maps the per-platform download event name (e.g. "download.android") to a
// cleaned display label and one of our own platform SVG icons. Falls back to
// the raw label and no icon for unmapped platforms so future download events
// still surface in the table without breaking the layout.
const DOWNLOAD_ROW_META: Record<string, { label: string; icon: string }> = {
  "download.android": { label: "Android", icon: "./files/common/google-play-store-icon.svg" },
  "download.chrome": { label: "Chrome", icon: "./files/common/icon-chrome.svg" },
  "download.firefox": { label: "Firefox", icon: "./files/common/icon-firefox.svg" },
  "download.ios": { label: "iOS", icon: "./files/common/icon-safari.svg" },
};

const DownloadEventsTable: React.FC<{ rows: EventRow[]; eventsLabel: string }> = ({ rows, eventsLabel }) => (
  <table>
    <thead>
      <tr>
        <th></th>
        <th className={styles.visits}>{eventsLabel}</th>
      </tr>
    </thead>
    <tbody>
      {rows.map((row, i) => {
        const meta = DOWNLOAD_ROW_META[row.label];
        const label = meta?.label ?? row.label;
        const icon = meta?.icon;
        return (
          <tr key={`${row.label}-${i}`}>
            <td>
              <span className={styles.trackedLabel}>
                {icon && <img src={icon} alt="" loading="lazy" />}
                <span>{label}</span>
              </span>
            </td>
            <td className={styles.visits}>{formatNum(row.events)}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
);

// Tab identifier. Persisted to URL hash so links open a specific tab.
type TabId = "website" | "addon";

const isTabId = (s: string | null): s is TabId => s === "website" || s === "addon";

const readTabFromHash = (): TabId => {
  const hash = typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "";
  return isTabId(hash) ? hash : "addon";
};

// ---------------------------------------------------------------------------
// Loading / Error fallbacks (shared chrome — full-page wraps are handled
// by the parent, but each tab shows inline loading/error when it has no
// data yet).
// ---------------------------------------------------------------------------

const TabLoading: React.FC = () => (
  <div className={styles.loading}>
    <div className={styles.spinner} />
    <span>Loading…</span>
  </div>
);

const TabError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <>
    <p className={styles.error}>Failed to load stats: {message}</p>
    <button type="button" className={styles.hrefButton} onClick={onRetry}>
      Retry
    </button>
  </>
);

// ---------------------------------------------------------------------------
// WebsiteStatsTab — existing marketing site body (unchanged behaviour)
// ---------------------------------------------------------------------------

const WebsiteStatsTab: React.FC = () => {
  const { t } = useTranslation();
  const { data, error, loading, refetch } = useStats();

  if (loading && !data) return <TabLoading />;
  if (error && !data) return <TabError message={error} onRetry={refetch} />;
  if (!data) return null;

  const v = data.visitors;

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.visitors")}</h2>
        <p className={styles.dataHint}>Data collection started 11.7.2026</p>
        <div className={styles.cards}>
          <StatCard label={t("stats.allTime")} value={formatNum(v.allTime.visits)} accent />
          <StatCard
            label={t("stats.today")}
            value={formatNum(v.today.visits)}
            accent
            sub={`${formatNum(v.today.uniqueVisitors)} ${t("stat.uniqueVisitors").toLowerCase()}`}
          />
          <StatCard
            label={t("stats.liveNow")}
            value={formatNum(data.liveNow.visits)}
            accent
            sub={`${formatNum(data.liveNow.actions)} ${t("stat.actions").toLowerCase()}`}
          />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.topCountries")}</h2>
        <div className={styles.tables}>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topCountries")}</h3>
            <RankingTable rows={data.topCountries} visitsLabel={t("stat.visits").toLowerCase()} />
          </div>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topContinents")}</h3>
            <RankingTable rows={data.topContinents} visitsLabel={t("stat.visits").toLowerCase()} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.topBrowsers")}</h2>
        <div className={styles.tables}>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topBrowsers")}</h3>
            <RankingTable rows={data.topBrowsers} visitsLabel={t("stat.visits").toLowerCase()} />
          </div>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topOs")}</h3>
            <RankingTable rows={data.topOs} visitsLabel={t("stat.visits").toLowerCase()} />
          </div>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.deviceTypes")}</h3>
            <RankingTable rows={data.deviceTypes} visitsLabel={t("stat.visits").toLowerCase()} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.visitFrequency")}</h2>
        <div className={styles.cards}>
          <StatCard label={t("stat.newVisits")} value={formatNum(data.visitFrequency.newVisits)} accent />
          <StatCard label={t("stat.returningVisits")} value={formatNum(data.visitFrequency.returningVisits)} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.referrerTypes")}</h2>
        <div className={styles.tables}>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.referrerTypes")}</h3>
            <RankingTable rows={data.referrerTypes} visitsLabel={t("stat.visits").toLowerCase()} />
          </div>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topWebsites")}</h3>
            <RankingTable rows={data.topWebsites} visitsLabel={t("stat.visits").toLowerCase()} />
          </div>
        </div>
      </section>

      {data.downloads.length > 0 && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>{t("stats.downloads")}</h2>
          <div className={styles.tables}>
            <div className={styles.tableBlock}>
              <DownloadEventsTable rows={data.downloads} eventsLabel={t("stats.downloads").toLowerCase()} />
            </div>
          </div>
        </section>
      )}

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.donations")}</h2>
        <div className={styles.cards}>
          <StatCard
            label={t("stats.currentMonthly")}
            value={`$${formatNum(data.donationsData.currentMonthly)}`}
            accent
          />
          <StatCard label={t("stats.totalDonations")} value={formatNum(data.donationsData.donations.length)} />
        </div>
      </section>

      <p className={styles.meta}>
        {t("stats.generatedAt")}: {new Date(data.generatedAt).toLocaleString()}
      </p>
    </>
  );
};

// ---------------------------------------------------------------------------
// AddonStatsTab — same structure as WebsiteStatsTab + 3 addon-specific
// blocks (totalBlocks, topBlockedSites, grouped addonActions). Fetches
// /dynamic/addon-stats.php independently of the website tab.
// ---------------------------------------------------------------------------

const AddonStatsTab: React.FC = () => {
  const { t } = useTranslation();
  const { data, error, loading, refetch } = useAddonStats();

  if (loading && !data) return <TabLoading />;
  if (error && !data) return <TabError message={error} onRetry={refetch} />;
  if (!data) return null;

  const v = data.visitors;
  const a = data.addonActions;
  const desktopMobile = data.deviceTypes.filter((d) => /desktop|smartphone/i.test(d.label));
  const blocksLabel = t("stat.blocks").toLowerCase();

  return (
    <>
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.totalBlocks")}</h2>
        <div className={styles.cards}>
          <StatCard label={t("stats.totalBlocks")} value={formatNum(data.totalBlocks)} accent sub={t("stat.blocks")} />
          <StatCard
            label={t("stats.liveNow")}
            value={formatNum(data.liveNow.visits)}
            accent
            sub={`${formatNum(data.liveNow.actions)} ${t("stat.actions").toLowerCase()}`}
          />
          <StatCard label={t("stats.today")} value={formatNum(v.today.visits)} accent />
          <StatCard label={t("stats.yesterday")} value={formatNum(v.yesterday.visits)} />
          <StatCard label={t("stats.thisWeek")} value={formatNum(v.thisWeek.visits)} />
          <StatCard label={t("stats.thisMonth")} value={formatNum(v.thisMonth.visits)} />
          <StatCard label={t("stats.lastMonth")} value={formatNum(v.lastMonth.visits)} />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>User engagement</h2>
        <div className={styles.cards}>
          <StatCard label={t("stat.shares")} value={formatNum(a.shares)} />
          <StatCard label={t("stat.bannerEngagement")} value={formatNum(a.bannerEngagement)} />
          <StatCard label={t("stat.hintEngagement")} value={formatNum(a.hintEngagement)} />
          <StatCard
            label={t("stat.whatsnewEngagement")}
            value={formatNum(a.whatsnewEngagement)}
            accent
            sub="WhatsNew release page"
          />
          <StatCard label={t("stat.whatsnewViews")} value={formatNum(a.whatsnewViews)} sub="WhatsNew release page" />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.donations")}</h2>
        <div className={styles.cards}>
          <StatCard label="Monthly" value={`$${formatNum(data.donationsData.currentMonthly)}`} accent />
          <StatCard label={t("stats.totalDonations")} value={formatNum(data.donationsData.donations.length)} />
          <StatCard label={t("stat.donationClicks")} value={formatNum(a.donationClicks)} accent />
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.topCountries")}</h2>
        <div className={styles.tables}>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topCountries")}</h3>
            <RankingTable rows={data.topCountries} visitsLabel={blocksLabel} />
          </div>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topContinents")}</h3>
            <RankingTable rows={data.topContinents} visitsLabel={blocksLabel} />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>{t("stats.topBrowsers")}</h2>
        <div className={styles.tables}>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topBrowsers")}</h3>
            <RankingTable rows={data.topBrowsers} visitsLabel={blocksLabel} />
          </div>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.topOs")}</h3>
            <RankingTable rows={data.topOs} visitsLabel={blocksLabel} />
          </div>
          <div className={styles.tableBlock}>
            <h3 className={styles.tableTitle}>{t("stats.deviceTypes")}</h3>
            <RankingTable rows={desktopMobile} visitsLabel={blocksLabel} />
          </div>
        </div>
      </section>

      <p className={styles.meta}>
        {t("stats.generatedAt")}: {new Date(data.generatedAt).toLocaleString()}
      </p>
    </>
  );
};

// ---------------------------------------------------------------------------
// Stats — page shell with two tabs. Each tab mounts once on first visit
// and stays mounted (hidden) so the second activation is instant and no
// refetch happens on tab switch. Tab state is mirrored to location.hash.
// ---------------------------------------------------------------------------

const Stats: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabId>(readTabFromHash);
  // Tabs that have ever been activated — used to lazy-mount each tab's
  // body exactly once (then keep it mounted, hidden when inactive).
  const [visited, setVisited] = useState<Set<TabId>>(() => new Set([readTabFromHash()]));

  useEffect(() => {
    document.title = "The Wall Project - Stats";
  }, []);

  // Sync hash so investors can deep-link to a specific tab.
  useEffect(() => {
    if (window.location.hash.replace(/^#/, "") !== activeTab) {
      window.history.replaceState(null, "", `#${activeTab}`);
    }
    setVisited((prev) => {
      if (prev.has(activeTab)) return prev;
      const next = new Set(prev);
      next.add(activeTab);
      return next;
    });
  }, [activeTab]);

  // React to back/forward navigation.
  useEffect(() => {
    const onHashChange = () => {
      const next = readTabFromHash();
      setActiveTab(next);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const selectTab = (tab: TabId) => {
    setActiveTab(tab);
  };

  return (
    <div className={styles.stats}>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.title}>Wall of Fame</h1>
        <p className={styles.subtitle}>{t("stats.subtitle")}</p>

        <div className={styles.tabs} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "addon"}
            className={`${styles.tab} ${activeTab === "addon" ? styles.tabActive : ""}`}
            onClick={() => selectTab("addon")}
          >
            {t("stats.tab.addon")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "website"}
            className={`${styles.tab} ${activeTab === "website" ? styles.tabActive : ""}`}
            onClick={() => selectTab("website")}
          >
            {t("stats.tab.website")}
          </button>
        </div>

        <div className={activeTab === "addon" ? "" : styles.hidden} role="tabpanel">
          <AddonStatsTab />
        </div>
        {visited.has("website") && (
          <div className={activeTab === "website" ? "" : styles.hidden} role="tabpanel">
            <WebsiteStatsTab />
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};

export default Stats;
