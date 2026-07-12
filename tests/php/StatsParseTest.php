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

        $this->assertSame(88836, $parsed['visits']);
        $this->assertSame(181757, $parsed['actions']);
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
    // Events.getName → parseEventNameGroups (grouped investor sums)
    // -----------------------------------------------------------------------

    public function testEventNameGroupsSums(): void
    {
        $raw = loadFixture('1_Events_getName.json');
        $grouped = parseEventNameGroups($raw);

        $this->assertSame(594, $grouped['donationClicks']);
        $this->assertSame(463, $grouped['shares']);
        $this->assertSame(6054, $grouped['bannerEngagement']);
        $this->assertSame(12925, $grouped['hintEngagement']);
        $this->assertSame(88, $grouped['whatsnewEngagement']);
        $this->assertSame(4231, $grouped['whatsnewViews']);
    }

    // -----------------------------------------------------------------------
    // VisitFrequency.get → parseFrequency
    // -----------------------------------------------------------------------

    public function testVisitFrequencyExactValues(): void
    {
        $raw = loadFixture('1_VisitFrequency_get.json');
        $freq = parseFrequency($raw);

        $this->assertSame(88830, $freq['newVisits']);
        $this->assertSame(6, $freq['returningVisits']);
    }

    // -----------------------------------------------------------------------
    // Live.getCounters → parseLiveCounters
    // -----------------------------------------------------------------------

    public function testLiveCountersExactValues(): void
    {
        $raw = loadFixture('1_Live_getCounters.json');
        $live = parseLiveCounters($raw);

        $this->assertSame(9, $live['visits']);
        $this->assertSame(18, $live['actions']);
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
