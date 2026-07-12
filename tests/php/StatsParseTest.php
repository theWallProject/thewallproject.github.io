<?php

declare(strict_types=1);

use PHPUnit\Framework\TestCase;

/**
 * Tests that every parse function in stats-common.php and addon-stats.php
 * produces correct output against frozen fixture snapshots
 * (tests/fixtures/ — committed, never overwritten at runtime).
 *
 * Exact expected values are hardcoded so any regression in field mapping,
 * type coercion, or group membership surfaces as a test failure.
 */

final class StatsParseTest extends TestCase
{
    // -----------------------------------------------------------------------
    // VisitsSummary.get → parsePeriodSummary
    // -----------------------------------------------------------------------

    public function testPeriodSummaryMapsFieldsCorrectly(): void
    {
        $raw = loadFixture('1_VisitsSummary_get.json');
        $parsed = parsePeriodSummary($raw, 'allTime');

        $this->assertSame(88854, $parsed['visits']);
        $this->assertSame(181790, $parsed['actions']);
        $this->assertSame(0, $parsed['uniqueVisitors'], 'Matomo omits nb_uniq_visitors for range periods');
        $this->assertSame(81, $parsed['avgVisitDuration']);
    }

    // -----------------------------------------------------------------------
    // Actions.getPageTitles → parsePageTitleHits (total blocks proxy)
    // -----------------------------------------------------------------------

    public function testPageTitleWallReturnsExactHitCount(): void
    {
        $raw = loadFixture('1_Actions_getPageTitles.json');

        $hits = parsePageTitleHits($raw, 'wall');

        $this->assertSame(95145, $hits);
    }

    public function testPageTitleUnknownReturnsZero(): void
    {
        $raw = loadFixture('1_Actions_getPageTitles.json');

        $this->assertSame(0, parsePageTitleHits($raw, 'nonexistent_title'));
        $this->assertSame(0, parsePageTitleHits([], 'wall'));
    }

    // -----------------------------------------------------------------------
    // Events.getName → parseEventNameRows (reads Events_EventName, not label)
    // -----------------------------------------------------------------------

    public function testEventNameRowsUsesEventsEventNameField(): void
    {
        $raw = loadFixture('1_Events_getName.json');
        $rows = parseEventNameRows($raw);

        $names = array_map(fn(array $r): string => $r['name'], $rows);

        $this->assertContains('allow_month', $names);
        $this->assertContains('dismiss_close', $names);
        $this->assertNotContains('allow_month - Click', $names);
    }

    public function testEventNameRowsIndividualCounts(): void
    {
        $raw = loadFixture('1_Events_getName.json');
        $rows = parseEventNameRows($raw);

        $byName = [];
        foreach ($rows as $r) {
            $byName[$r['name']] = $r['events'];
        }

        // Exact counts from refreshed server snapshot
        $this->assertSame(34493, $byName['allow_month']);
        $this->assertSame(20541, $byName['dismiss_close']);
        $this->assertSame(9391, $byName['hint_expand']);
        $this->assertSame(3986, $byName['support_pal']);
        $this->assertSame(2454, $byName['hint_link']);
        $this->assertSame(2153, $byName['whatsnew_update_1_14_0_to_1_15_2']);
        $this->assertSame(842, $byName['show_bds_guide']);
        $this->assertSame(828, $byName['show_alternatives']);
        $this->assertSame(587, $byName['options_vote_sadaqah']);
        $this->assertSame(63, $byName['donation_bricks']);
        $this->assertSame(227, $byName['options_donate']);
        $this->assertSame(225, $byName['support_ko_fi']);
        $this->assertSame(23, $byName['whatsnew_donate_monthly']);
        $this->assertSame(56, $byName['whatsnew_donation_image']);
        $this->assertSame(97, $byName['share_li']);
        $this->assertSame(47, $byName['share_fb']);
        $this->assertSame(39, $byName['share_tw']);
        $this->assertSame(60, $byName['whatsnew_youtube_telpshow']);
        $this->assertSame(21, $byName['whatsnew_visit_website']);
        $this->assertSame(4, $byName['whatsnew_contact']);
        $this->assertSame(3, $byName['whatsnew_report']);
    }

    // -----------------------------------------------------------------------
    // Events.getName → parseEventNameGroupsDetailed (period-aware
    // per-action breakdown — replaces the legacy parseEventNameGroups)
    // -----------------------------------------------------------------------

    public function testEventNameGroupsDetailedPeriodSums(): void
    {
        $rawAll = loadFixture('1_Events_getName.json');
        $rawWeek = loadFixture('1_Events_getName_week.json');
        $rawMonth = loadFixture('1_Events_getName_month.json');
        $parsed = parseEventNameGroupsDetailed($rawAll, $rawWeek, $rawMonth);

        // Headline period-aware aggregates — REPLACE the legacy single-int
        // bannerEngagement / hintEngagement / whatsnewEngagement / whatsnewViews fields.
        $this->assertSame(['allTime' => 594, 'week' => 7, 'month' => 9], $parsed['donationClicks']);
        $this->assertSame(['allTime' => 463, 'week' => 6, 'month' => 7], $parsed['shares']);
        // altClicks = show_alternatives (banner alternatives dropdown opened).
        $this->assertSame(['allTime' => 828, 'week' => 11, 'month' => 17], $parsed['altClicks']);
        // techForPalestine = support_pal button.
        $this->assertSame(['allTime' => 3986, 'week' => 41, 'month' => 65], $parsed['techForPalestine']);
        // hintClicks = hint_link (opening the hint URL).
        $this->assertSame(['allTime' => 2454, 'week' => 45, 'month' => 81], $parsed['hintClicks']);
        // whatsnewViewsTotal = sum of all whatsnew_update_* rows across the 3 periods.
        $this->assertGreaterThan(0, $parsed['whatsnewViewsTotal']['allTime']);
        $this->assertGreaterThanOrEqual(0, $parsed['whatsnewViewsTotal']['week']);
        $this->assertGreaterThanOrEqual(0, $parsed['whatsnewViewsTotal']['month']);
        // whatsnewEngagementTotal = whatsnew_youtube_telpshow + visit_website + contact + report.
        $this->assertSame(88, $parsed['whatsnewEngagementTotal']['allTime']);
        $this->assertSame(2, $parsed['whatsnewEngagementTotal']['week']);
        $this->assertSame(5, $parsed['whatsnewEngagementTotal']['month']);
    }

    public function testEventNameGroupsDetailedBannerActionsRows(): void
    {
        $rawAll = loadFixture('1_Events_getName.json');
        $rawWeek = loadFixture('1_Events_getName_week.json');
        $rawMonth = loadFixture('1_Events_getName_month.json');
        $parsed = parseEventNameGroupsDetailed($rawAll, $rawWeek, $rawMonth);

        $rows = $parsed['bannerActions'];
        $byName = [];
        foreach ($rows as $r) {
            $byName[$r['label']] = $r;
        }

        // The banner breakdown table carries every ADDON_BANNER_ACTION_NAMES
        // entry with all-time + this-week + this-month counts.
        $this->assertSame(count(\ADDON_BANNER_ACTION_NAMES), count($rows));
        $this->assertContains('show_alternatives', array_keys($byName));
        $this->assertContains('show_bds_guide', array_keys($byName));
        $this->assertContains('support_pal', array_keys($byName));
        $this->assertContains('report_mistake', array_keys($byName));
        $this->assertContains('dismiss_close', array_keys($byName));

        $this->assertSame(
            ['label' => 'show_alternatives', 'allTime' => 828, 'week' => 11, 'month' => 17],
            $byName['show_alternatives'],
        );
        $this->assertSame(
            ['label' => 'support_pal', 'allTime' => 3986, 'week' => 41, 'month' => 65],
            $byName['support_pal'],
        );
        $this->assertSame(
            ['label' => 'show_bds_guide', 'allTime' => 842, 'week' => 16, 'month' => 33],
            $byName['show_bds_guide'],
        );
        $this->assertSame(
            ['label' => 'report_mistake', 'allTime' => 398, 'week' => 3, 'month' => 5],
            $byName['report_mistake'],
        );

        // Rows must be sorted by allTime desc.
        for ($i = 1; $i < count($rows); $i++) {
            $this->assertGreaterThanOrEqual($rows[$i]['allTime'], $rows[$i - 1]['allTime']);
        }
    }

    public function testEventNameGroupsDetailedHintActionsRows(): void
    {
        $rawAll = loadFixture('1_Events_getName.json');
        $rawWeek = loadFixture('1_Events_getName_week.json');
        $rawMonth = loadFixture('1_Events_getName_month.json');
        $parsed = parseEventNameGroupsDetailed($rawAll, $rawWeek, $rawMonth);

        $rows = $parsed['hintActions'];
        $byName = [];
        foreach ($rows as $r) {
            $byName[$r['label']] = $r;
        }

        $this->assertSame(count(\ADDON_HINT_ACTION_NAMES), count($rows));
        $this->assertContains('hint_link', array_keys($byName));
        $this->assertContains('hint_expand', array_keys($byName));
        $this->assertContains('hint_dismiss_this', array_keys($byName));
        $this->assertContains('hint_disable_all', array_keys($byName));
        $this->assertContains('hint_toggle_system', array_keys($byName));
        $this->assertContains('hint_reset_dismissed', array_keys($byName));

        // hint_link headline row directly mirrors the hintClicks aggregate.
        $this->assertSame(
            ['label' => 'hint_link', 'allTime' => 2454, 'week' => 45, 'month' => 81],
            $byName['hint_link'],
        );
        $this->assertSame(
            ['label' => 'hint_expand', 'allTime' => 9391, 'week' => 233, 'month' => 414],
            $byName['hint_expand'],
        );
    }

    public function testEventNameGroupsDetailedWhatsnewViewsRowsCapped(): void
    {
        $rawAll = loadFixture('1_Events_getName.json');
        $rawWeek = loadFixture('1_Events_getName_week.json');
        $rawMonth = loadFixture('1_Events_getName_month.json');
        $parsed = parseEventNameGroupsDetailed($rawAll, $rawWeek, $rawMonth);

        // whatsnewViews tables are capped to ADDON_WHATSNEW_VIEWS_LIMIT top
        // version pairs by all-time count desc.
        $this->assertLessThanOrEqual(\ADDON_WHATSNEW_VIEWS_LIMIT, count($parsed['whatsnewViews']));
        $this->assertNotEmpty($parsed['whatsnewViews']);
        $first = $parsed['whatsnewViews'][0];
        $this->assertSame('whatsnew_update_1_14_0_to_1_15_2', $first['label']);
        $this->assertSame(2153, $first['allTime']);
    }

    public function testEventNameGroupsDetailedSkipsTemplateLiteralNoise(): void
    {
        // Malformed `${encodeURIComponent(name)}` rows from old addon builds
        // must not surface in any breakdown table or headline aggregate.
        // The noise name is filtered by eventNameRowsToMap(); the only rows
        // that appear are the configured ADDON_*_ACTION_NAMES, all with 0
        // counts since the only input fixture is the noise row.
        $noiseRow = [
            [
                'label' => '${encodeURIComponent(name)} - Click',
                'nb_events' => 999,
                'Events_EventName' => '${encodeURIComponent(name)}',
                'Events_EventAction' => 'Click',
            ],
        ];

        $parsed = parseEventNameGroupsDetailed($noiseRow, $noiseRow, $noiseRow);

        // No row label should contain the template-literal `$` leak.
        foreach (['bannerActions', 'hintActions', 'whatsnewActions', 'whatsnewViews'] as $group) {
            foreach ($parsed[$group] as $row) {
                $this->assertStringNotContainsString('$', $row['label'], "noise leaked into {$group}");
            }
        }

        // Every headline aggregate must be zeroed — the noise row's
        // 999 clicks never reach any group.
        $zeros = ['allTime' => 0, 'week' => 0, 'month' => 0];
        $this->assertSame($zeros, $parsed['donationClicks']);
        $this->assertSame($zeros, $parsed['shares']);
        $this->assertSame($zeros, $parsed['altClicks']);
        $this->assertSame($zeros, $parsed['techForPalestine']);
        $this->assertSame($zeros, $parsed['hintClicks']);
        $this->assertSame($zeros, $parsed['whatsnewViewsTotal']);
        $this->assertSame($zeros, $parsed['whatsnewEngagementTotal']);
    }

    // -----------------------------------------------------------------------
    // VisitFrequency.get → parseFrequency
    // -----------------------------------------------------------------------

    public function testVisitFrequencyExactValues(): void
    {
        $raw = loadFixture('1_VisitFrequency_get.json');
        $freq = parseFrequency($raw);

        $this->assertSame(88848, $freq['newVisits']);
        $this->assertSame(6, $freq['returningVisits']);
    }

    // -----------------------------------------------------------------------
    // Live.getCounters → parseLiveCounters
    // -----------------------------------------------------------------------

    public function testLiveCountersExactValues(): void
    {
        $raw = loadFixture('1_Live_getCounters.json');
        $live = parseLiveCounters($raw);

        $this->assertSame(2, $live['visits']);
        $this->assertSame(4, $live['actions']);
    }

    // -----------------------------------------------------------------------
    // Referrers.getReferrerType → parseRankingRows
    // -----------------------------------------------------------------------

    public function testReferrerTypesProducesExactRows(): void
    {
        $raw = loadFixture('1_Referrers_getReferrerType.json');
        $rows = parseRankingRows($raw, 'Referrers.getReferrerType', 10);

        $this->assertCount(3, $rows);
        $this->assertSame('Direct Entry', $rows[0]['label']);
        $this->assertSame(88267, $rows[0]['visits']);
        $this->assertSame('Campaigns', $rows[1]['label']);
        $this->assertSame(392, $rows[1]['visits']);
        $this->assertSame('AI Assistants', $rows[2]['label']);
        $this->assertSame(5, $rows[2]['visits']);
    }

    // -----------------------------------------------------------------------
    // Referrers.getWebsites — addon returns empty (no referrer from bg.gif)
    // -----------------------------------------------------------------------

    public function testTopBlockedSitesEmptyForAddon(): void
    {
        $raw = loadFixture('1_Referrers_getWebsites.json');
        $rows = parseRankingRows($raw, 'Referrers.getWebsites', 10);

        $this->assertEmpty($rows);
    }

    // -----------------------------------------------------------------------
    // UserCountry.getCountry — geography
    // -----------------------------------------------------------------------

    public function testTopCountriesExactValues(): void
    {
        $raw = loadFixture('1_UserCountry_getCountry.json');
        $rows = parseRankingRows($raw, 'UserCountry.getCountry', 10);

        $this->assertCount(10, $rows);
        $this->assertSame('Egypt', $rows[0]['label']);
        $this->assertSame(24805, $rows[0]['visits']);
        $this->assertArrayHasKey('logo', $rows[0]);
        $this->assertSame('United States', $rows[1]['label']);
        $this->assertSame(14546, $rows[1]['visits']);
    }

    // -----------------------------------------------------------------------
    // UserCountry.getContinent
    // -----------------------------------------------------------------------

    public function testTopContinentsExactValues(): void
    {
        $raw = loadFixture('1_UserCountry_getContinent.json');
        $rows = parseRankingRows($raw, 'UserCountry.getContinent', 10);

        $this->assertCount(8, $rows);
        $this->assertSame('Africa', $rows[0]['label']);
        $this->assertSame(29489, $rows[0]['visits']);
    }

    // -----------------------------------------------------------------------
    // DevicesDetection.getBrowsers
    // -----------------------------------------------------------------------

    public function testTopBrowsersChromeFirst(): void
    {
        $raw = loadFixture('1_DevicesDetection_getBrowsers.json');
        $rows = parseRankingRows($raw, 'DevicesDetection.getBrowsers', 10);

        $this->assertCount(10, $rows);
        $this->assertSame('Chrome', $rows[0]['label']);
        $this->assertSame(62553, $rows[0]['visits']);
    }

    // -----------------------------------------------------------------------
    // DevicesDetection.getType — preserves zero-value rows
    // -----------------------------------------------------------------------

    public function testDeviceTypesPreservesZeroCounts(): void
    {
        $raw = loadFixture('1_DevicesDetection_getType.json');
        $rows = parseRankingRows($raw, 'DevicesDetection.getType', 15);

        $labels = array_map(fn(array $r): string => $r['label'], $rows);
        $this->assertContains('Camera', $labels);
        $this->assertContains('Car browser', $labels);

        foreach ($rows as $row) {
            $this->assertIsInt($row['visits']);
            $this->assertIsString($row['label']);
        }
    }

    // -----------------------------------------------------------------------
    // Marketing site: Events.getAction has correct action event names
    // -----------------------------------------------------------------------

    public function testMarketingEventActionsStructure(): void
    {
        $raw = loadFixture('2_Events_getAction.json');
        $labels = array_map(fn(array $r): string => $r['label'] ?? '', $raw);

        // secondaryDimension=eventName splits rows by event name — labels
        // carry the per-name suffix (download.android, kofi, etc.), not
        // the bare "engagement" category suffix the eventCategory query
        // produced. The parser filters on Events_EventAction and surfaces
        // Events_EventName as the row label.
        $this->assertContains('download_click - download.android', $labels);
        $this->assertContains('donation_click - kofi', $labels);
    }

    public function testParseEventActionsReturnsPerNameRows(): void
    {
        $raw = loadFixture('2_Events_getAction.json');
        $rows = parseEventActions($raw, 'download_click');

        $byName = [];
        foreach ($rows as $r) {
            $byName[$r['label']] = $r['events'];
        }

        // Per-platform download rows from the refreshed snapshot
        $this->assertSame(5, $byName['download.android']);
        $this->assertSame(5, $byName['download.chrome']);
        $this->assertSame(4, $byName['download.firefox']);
        $this->assertSame(2, $byName['download.ios']);
    }

    public function testParseEventActionsDonationRows(): void
    {
        $raw = loadFixture('2_Events_getAction.json');
        $rows = parseEventActions($raw, 'donation_click');

        $this->assertCount(1, $rows);
        $this->assertSame('kofi', $rows[0]['label']);
        $this->assertSame(3, $rows[0]['events']);
    }

    public function testParseEventActionsSkipsRowMissingEventName(): void
    {
        // A row matching the action filter but lacking Events_EventName
        // must be skipped (not fallback-labeled, not thrown). Matomo
        // legitimately omits Events_EventName for events without a name.
        $rowWithoutName = [
            'label' => 'download_click - engagement',
            'nb_events' => 7,
            'Events_EventAction' => 'download_click',
            'Events_EventName' => '',
        ];
        $rowWithName = [
            'label' => 'download_click - download.chrome',
            'nb_events' => 5,
            'Events_EventAction' => 'download_click',
            'Events_EventName' => 'download.chrome',
        ];

        $rows = parseEventActions([$rowWithoutName, $rowWithName], 'download_click');

        $this->assertCount(1, $rows);
        $this->assertSame('download.chrome', $rows[0]['label']);
        $this->assertSame(5, $rows[0]['events']);
    }

    // -----------------------------------------------------------------------
    // Marketing site: VisitsSummary
    // -----------------------------------------------------------------------

    public function testMarketingVisitorSummary(): void
    {
        $raw = loadFixture('2_VisitsSummary_get.json');
        $parsed = parsePeriodSummary($raw, 'allTime');

        $this->assertGreaterThan(0, $parsed['visits']);
        $this->assertArrayHasKey('visits', $parsed);
        $this->assertArrayHasKey('uniqueVisitors', $parsed);
        $this->assertArrayHasKey('actions', $parsed);
    }

    // -----------------------------------------------------------------------
    // Device types — ensure 0-values are preserved (not null)
    // -----------------------------------------------------------------------

    public function testOsVersionsMaintained(): void
    {
        $raw = loadFixture('1_DevicesDetection_getOsVersions.json');
        $rows = parseRankingRows($raw, 'DevicesDetection.getOsVersions', 10);

        $this->assertCount(10, $rows);
        $this->assertSame('Windows 10', $rows[0]['label']);
        $this->assertSame(45329, $rows[0]['visits']);
    }

    // -----------------------------------------------------------------------
    // DonationDto mapping — Valinor schema for donation data rows
    // -----------------------------------------------------------------------

    public function testDonationDtoDefaultsOnEmptyRow(): void
    {
        $dto = getMapper()->map(\DonationDto::class, []);

        $this->assertSame(0.0, $dto->amount);
        $this->assertSame('USD', $dto->currency);
        $this->assertSame('', $dto->timestamp);
        $this->assertSame('Donation', $dto->type);
    }

    // -----------------------------------------------------------------------
    // DTO shape validation — Valinor should reject type mismatch
    // -----------------------------------------------------------------------

    public function testPageTitleDtoRejectsStringInsteadOfInt(): void
    {
        $badRow = ['label' => 'test', 'nb_hits' => 'not-an-int'];

        $this->expectException(\CuyZ\Valinor\Mapper\MappingError::class);
        getMapper()->map(\PageTitleRowDto::class, $badRow);
    }

    public function testEventNameRowDtoDefaultsOnMissingName(): void
    {
        $row = ['nb_events' => 42];

        $dto = getMapper()->map(\EventNameRowDto::class, $row);

        $this->assertSame('', $dto->Events_EventName);
        $this->assertSame(42, $dto->nb_events);
    }
}
