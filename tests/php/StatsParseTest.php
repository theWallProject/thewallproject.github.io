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

        $this->assertSame(88416, $parsed['visits']);
        $this->assertSame(180885, $parsed['actions']);
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

        $this->assertSame(94873, $hits);
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

        // Exact counts from frozen fixture
        $this->assertSame(34489, $byName['allow_month']);
        $this->assertSame(20366, $byName['dismiss_close']);
        $this->assertSame(9357, $byName['hint_expand']);
        $this->assertSame(3980, $byName['support_pal']);
        $this->assertSame(2451, $byName['hint_link']);
        $this->assertSame(2152, $byName['whatsnew_update_1_14_0_to_1_15_2']);
        $this->assertSame(841, $byName['show_bds_guide']);
        $this->assertSame(827, $byName['show_alternatives']);
        $this->assertSame(587, $byName['options_vote_sadaqah']);
        $this->assertSame(63, $byName['donation_bricks']);
        $this->assertSame(227, $byName['options_donate']);
        $this->assertSame(225, $byName['support_ko_fi']);
        $this->assertSame(23, $byName['whatsnew_donate_monthly']);
        $this->assertSame(55, $byName['whatsnew_donation_image']);
        $this->assertSame(97, $byName['share_li']);
        $this->assertSame(47, $byName['share_fb']);
        $this->assertSame(39, $byName['share_tw']);
        $this->assertSame(59, $byName['whatsnew_youtube_telpshow']);
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

        $this->assertSame(593, $grouped['donationClicks']);
        $this->assertSame(462, $grouped['shares']);
        $this->assertSame(6046, $grouped['bannerEngagement']);
        $this->assertSame(12885, $grouped['hintEngagement']);
        $this->assertSame(87, $grouped['whatsnewEngagement']);
        $this->assertSame(4220, $grouped['whatsnewViews']);
    }

    // -----------------------------------------------------------------------
    // VisitFrequency.get → parseFrequency
    // -----------------------------------------------------------------------

    public function testVisitFrequencyExactValues(): void
    {
        $raw = loadFixture('1_VisitFrequency_get.json');
        $freq = parseFrequency($raw);

        $this->assertSame(88410, $freq['newVisits']);
        $this->assertSame(6, $freq['returningVisits']);
    }

    // -----------------------------------------------------------------------
    // Live.getCounters → parseLiveCounters
    // -----------------------------------------------------------------------

    public function testLiveCountersExactValues(): void
    {
        $raw = loadFixture('1_Live_getCounters.json');
        $live = parseLiveCounters($raw);

        $this->assertSame(6, $live['visits']);
        $this->assertSame(11, $live['actions']);
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
        $this->assertSame(88012, $rows[0]['visits']);
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
        $this->assertSame(24729, $rows[0]['visits']);
        $this->assertArrayHasKey('logo', $rows[0]);
        $this->assertSame('United States', $rows[1]['label']);
        $this->assertSame(14506, $rows[1]['visits']);
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
        $this->assertSame(29392, $rows[0]['visits']);
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
        $this->assertSame(62378, $rows[0]['visits']);
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

        $this->assertContains('download_click - engagement', $labels);
        $this->assertContains('donation_click - engagement', $labels);
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
        $this->assertSame(45196, $rows[0]['visits']);
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
