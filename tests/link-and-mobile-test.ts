/**
 * Puppeteer Link Checker & Mobile-Friendliness Test Suite
 * 
 * This script:
 * 1. Crawls all internal links starting from the homepage
 * 2. Checks for 404 errors and broken links
 * 3. Validates mobile-friendliness of all pages
 * 
 * Run with: npx ts-node tests/link-and-mobile-test.ts
 */

import puppeteer, { Browser, Page } from "puppeteer";
import * as fs from "fs";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";
const MOBILE_VIEWPORT = { width: 375, height: 667, isMobile: true, hasTouch: true };
const DESKTOP_VIEWPORT = { width: 1280, height: 800, isMobile: false, hasTouch: false };

// URLs to skip (external, API routes, etc.)
const SKIP_PATTERNS = [
    /^mailto:/,
    /^tel:/,
    /^javascript:/,
    /^#/,
    /^\/?api\//,
    /^https?:\/\/(?!localhost)/,  // Skip external URLs
    /\.pdf$/,
    /\.png$/,
    /\.jpg$/,
    /\.jpeg$/,
    /\.gif$/,
    /\.svg$/,
    /\.webp$/,
    /\.ico$/,
];

interface LinkCheckResult {
    url: string;
    status: number;
    redirectedTo?: string;
    error?: string;
    foundOn: string;
}

interface MobileCheckResult {
    url: string;
    passed: boolean;
    issues: string[];
    viewportWidth: number;
    hasHorizontalScroll: boolean;
    hasTinyText: boolean;
    hasTooCloseButtons: boolean;
    hasUnresponsiveImages: boolean;
    screenshotPath?: string;
}

interface _TestSummary {
    totalLinksChecked: number;
    brokenLinks: LinkCheckResult[];
    workingLinks: LinkCheckResult[];
    mobileFriendlyPages: MobileCheckResult[];
    mobileUnfriendlyPages: MobileCheckResult[];
}

const visitedUrls = new Set<string>();
const linkResults: LinkCheckResult[] = [];
const mobileResults: MobileCheckResult[] = [];
const urlsToVisit: { url: string; foundOn: string }[] = [];

function normalizeUrl(url: string, baseUrl: string): string | null {
    try {
        // Handle relative URLs
        if (url.startsWith('/')) {
            return new URL(url, BASE_URL).href;
        }
        if (!url.startsWith('http')) {
            return new URL(url, baseUrl).href;
        }
        return url;
    } catch {
        return null;
    }
}

function shouldSkipUrl(url: string): boolean {
    return SKIP_PATTERNS.some(pattern => pattern.test(url));
}

function isInternalUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        const base = new URL(BASE_URL);
        return parsed.hostname === base.hostname || parsed.hostname === 'localhost';
    } catch {
        return false;
    }
}

async function extractLinks(page: Page, currentUrl: string): Promise<string[]> {
    const links = await page.evaluate(() => {
        const anchors = Array.from(document.querySelectorAll('a[href]'));
        return anchors.map(a => a.getAttribute('href') || '').filter(Boolean);
    });

    const normalizedLinks: string[] = [];
    for (const link of links) {
        if (shouldSkipUrl(link)) continue;

        const normalized = normalizeUrl(link, currentUrl);
        if (normalized && isInternalUrl(normalized)) {
            // Remove query strings and hash for deduplication
            const cleanUrl = normalized.split('?')[0].split('#')[0];
            normalizedLinks.push(cleanUrl);
        }
    }

    return [...new Set(normalizedLinks)];
}

async function checkLink(page: Page, url: string, foundOn: string): Promise<LinkCheckResult> {
    try {
        const response = await page.goto(url, {
            // `networkidle0` is unreliable on some dynamic pages in dev mode.
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });

        const status = response?.status() || 0;
        const finalUrl = page.url();

        return {
            url,
            status,
            redirectedTo: finalUrl !== url ? finalUrl : undefined,
            foundOn
        };
    } catch (error) {
        return {
            url,
            status: 0,
            error: error instanceof Error ? error.message : String(error),
            foundOn
        };
    }
}

async function checkMobileFriendliness(page: Page, url: string): Promise<MobileCheckResult> {
    const issues: string[] = [];

    try {
        // Set mobile viewport
        await page.setViewport(MOBILE_VIEWPORT);
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Wait for any lazy-loaded content
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Check for horizontal scroll (content wider than viewport)
        const hasHorizontalScroll = await page.evaluate(() => {
            return document.documentElement.scrollWidth > document.documentElement.clientWidth;
        });

        if (hasHorizontalScroll) {
            issues.push('Page has horizontal scroll - content is wider than mobile viewport');
        }

        // Check for any elements that are too wide
        const wideElements = await page.evaluate(() => {
            const viewportWidth = window.innerWidth;
            const allElements = document.querySelectorAll('*');
            const problems: string[] = [];

            allElements.forEach(el => {
                if (
                    el.classList.contains('leaflet-tile') ||
                    !!el.closest('.leaflet-container')
                ) {
                    return;
                }

                const rect = el.getBoundingClientRect();
                if (rect.width > viewportWidth + 5) { // 5px tolerance
                    const tagName = el.tagName.toLowerCase();
                    const className = el.className || 'no-class';
                    if (!problems.some(p => p.includes(tagName))) {
                        problems.push(`${tagName}.${String(className).slice(0, 30)}... (width: ${Math.round(rect.width)}px)`);
                    }
                }
            });

            return problems.slice(0, 5); // Return max 5 examples
        });

        if (wideElements.length > 0) {
            issues.push(`Elements too wide for mobile: ${wideElements.join(', ')}`);
        }

        // Check for tiny text (less than 12px)
        const hasTinyText = await page.evaluate(() => {
            const textElements = document.querySelectorAll('p, span, a, li, td, th, label, small');
            let tinyCount = 0;

            textElements.forEach(el => {
                const style = window.getComputedStyle(el);
                const fontSize = parseFloat(style.fontSize);
                const rect = el.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';

                if (isVisible && fontSize < 11 && el.textContent && el.textContent.trim().length > 0) {
                    tinyCount++;
                }
            });

            return tinyCount > 25; // Flag only widespread readability issues
        });

        if (hasTinyText) {
            issues.push('Many text elements have font-size smaller than 12px');
        }

        // Check for buttons/links too close together (less than 8px apart)
        const hasTooCloseButtons = await page.evaluate(() => {
            const clickables = Array.from(document.querySelectorAll('a, button, input, select, textarea'));
            const rects = clickables.map(el => el.getBoundingClientRect());

            let tooCloseCount = 0;
            for (let i = 0; i < rects.length; i++) {
                for (let j = i + 1; j < rects.length; j++) {
                    const r1 = rects[i];
                    const r2 = rects[j];

                    // Check if they're vertically adjacent
                    if (r1.width > 0 && r2.width > 0 && r1.height > 0 && r2.height > 0) {
                        const verticalGap = Math.min(
                            Math.abs(r1.bottom - r2.top),
                            Math.abs(r2.bottom - r1.top)
                        );
                        const horizontalGap = Math.min(
                            Math.abs(r1.right - r2.left),
                            Math.abs(r2.right - r1.left)
                        );

                        // If elements are close in both dimensions
                        if (verticalGap < 8 && horizontalGap < r1.width && horizontalGap < r2.width) {
                            tooCloseCount++;
                        }
                    }
                }
            }

            return tooCloseCount > 5;
        });

        if (hasTooCloseButtons) {
            issues.push('Multiple clickable elements are too close together (tap target issue)');
        }

        // Check for images without responsive sizing
        const hasUnresponsiveImages = await page.evaluate(() => {
            const images = document.querySelectorAll('img');
            let unresponsiveCount = 0;

            images.forEach(img => {
                if (
                    img.classList.contains('leaflet-tile') ||
                    !!img.closest('.leaflet-container')
                ) {
                    return;
                }

                const rect = img.getBoundingClientRect();
                const viewportWidth = window.innerWidth;

                // Check if image is overflowing
                if (rect.width > viewportWidth) {
                    unresponsiveCount++;
                }
            });

            return unresponsiveCount > 0;
        });

        if (hasUnresponsiveImages) {
            issues.push('Some images are wider than the mobile viewport');
        }

        // Check if viewport meta tag exists
        const hasViewportMeta = await page.evaluate(() => {
            const meta = document.querySelector('meta[name="viewport"]');
            return !!meta;
        });

        if (!hasViewportMeta) {
            issues.push('Missing viewport meta tag');
        }

        // Check viewport meta content
        const viewportContent = await page.evaluate(() => {
            const meta = document.querySelector('meta[name="viewport"]');
            return meta?.getAttribute('content') || '';
        });

        if (viewportContent && !viewportContent.includes('width=device-width')) {
            issues.push('Viewport meta tag does not include width=device-width');
        }

        // Take screenshot if there are issues
        let screenshotPath: string | undefined;
        if (issues.length > 0) {
            const urlPath = new URL(url).pathname.replace(/\//g, '_') || 'home';
            screenshotPath = `mobile_issue_${urlPath}.png`;
            try {
                await page.screenshot({ path: screenshotPath, fullPage: true });
            } catch (e) {
                console.log(`  Could not save screenshot: ${e}`);
            }
        }

        return {
            url,
            passed: issues.length === 0,
            issues,
            viewportWidth: MOBILE_VIEWPORT.width,
            hasHorizontalScroll,
            hasTinyText,
            hasTooCloseButtons,
            hasUnresponsiveImages,
            screenshotPath
        };

    } catch (error) {
        return {
            url,
            passed: false,
            issues: [`Error checking page: ${error instanceof Error ? error.message : String(error)}`],
            viewportWidth: MOBILE_VIEWPORT.width,
            hasHorizontalScroll: false,
            hasTinyText: false,
            hasTooCloseButtons: false,
            hasUnresponsiveImages: false
        };
    }
}

async function crawlAndCheck(browser: Browser): Promise<void> {
    const page = await browser.newPage();

    // Start with homepage
    urlsToVisit.push({ url: BASE_URL, foundOn: 'initial' });

    // Also add known routes to ensure coverage
    const knownRoutes = [
        '/',
        '/auta',
        '/auth/login',
        '/auth/register',
        '/kredity',
        '/kredity/uspech',
        '/obchodne-podmienky',
        '/ochrana-udajov',
        '/pridat-inzerat',
        '/ceny',
        '/kalkulacka-leasingu',
        '/predajcovia',
        '/moj-ucet',
        '/admin',
    ];

    for (const route of knownRoutes) {
        const fullUrl = `${BASE_URL}${route}`;
        if (!visitedUrls.has(fullUrl)) {
            urlsToVisit.push({ url: fullUrl, foundOn: 'known-route' });
        }
    }

    console.log('\n🔍 Phase 1: Crawling and checking all links for 404s...\n');

    // Phase 1: Crawl all links
    while (urlsToVisit.length > 0) {
        const { url, foundOn } = urlsToVisit.shift()!;

        // Skip if already visited
        if (visitedUrls.has(url)) continue;
        visitedUrls.add(url);

        console.log(`  Checking: ${url}`);

        // Set desktop viewport for initial crawl
        await page.setViewport(DESKTOP_VIEWPORT);

        const result = await checkLink(page, url, foundOn);
        linkResults.push(result);

        if (result.status === 200 || result.status === 304) {
            console.log(`    ✅ ${result.status}`);

            // Extract more links from this page
            const newLinks = await extractLinks(page, url);
            for (const link of newLinks) {
                if (!visitedUrls.has(link) && !urlsToVisit.some(u => u.url === link)) {
                    urlsToVisit.push({ url: link, foundOn: url });
                }
            }
        } else if (result.status === 404) {
            console.log(`    ❌ 404 NOT FOUND`);
        } else if (result.status === 0) {
            console.log(`    ⚠️ Error: ${result.error}`);
        } else {
            console.log(`    ⚠️ Status: ${result.status}`);
        }
    }

    await page.close();
}

async function checkAllPagesForMobile(browser: Browser): Promise<void> {
    const page = await browser.newPage();

    // Get list of working pages to check for mobile
    const workingPages = linkResults.filter(r => r.status === 200 || r.status === 304);

    console.log('\n📱 Phase 2: Checking mobile-friendliness of all pages...\n');

    for (const link of workingPages) {
        console.log(`  Checking mobile: ${link.url}`);

        const result = await checkMobileFriendliness(page, link.url);
        mobileResults.push(result);

        if (result.passed) {
            console.log(`    ✅ Mobile-friendly`);
        } else {
            console.log(`    ❌ Mobile issues found:`);
            result.issues.forEach(issue => console.log(`      - ${issue}`));
        }
    }

    await page.close();
}

async function runTests(): Promise<void> {
    console.log('\n' + '='.repeat(60));
    console.log('🧪 AUTOBAZAR123 LINK CHECKER & MOBILE-FRIENDLINESS TEST');
    console.log('='.repeat(60));
    console.log(`\nBase URL: ${BASE_URL}`);
    console.log(`Started at: ${new Date().toISOString()}\n`);

    let browser: Browser | null = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
        });

        // Phase 1: Crawl and check all links
        await crawlAndCheck(browser);

        // Phase 2: Check mobile-friendliness
        await checkAllPagesForMobile(browser);

        await browser.close();

    } catch (error) {
        console.error('\n❌ Test runner error:', error);
        if (browser) await browser.close();
        process.exit(1);
    }

    // Print summary
    printSummary();
}

function printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));

    // Link check summary
    const brokenLinks = linkResults.filter(r => r.status === 404 || r.status === 0);
    const workingLinks = linkResults.filter(r => r.status === 200 || r.status === 304);
    const otherStatus = linkResults.filter(r => r.status !== 200 && r.status !== 304 && r.status !== 404 && r.status !== 0);

    console.log('\n📎 LINK CHECK RESULTS:');
    console.log(`  Total links checked: ${linkResults.length}`);
    console.log(`  ✅ Working: ${workingLinks.length}`);
    console.log(`  ❌ Broken (404/Error): ${brokenLinks.length}`);
    console.log(`  ⚠️ Other status: ${otherStatus.length}`);

    if (brokenLinks.length > 0) {
        console.log('\n  🔴 BROKEN LINKS:');
        brokenLinks.forEach(link => {
            console.log(`    URL: ${link.url}`);
            console.log(`    Status: ${link.status}${link.error ? ` (${link.error})` : ''}`);
            console.log(`    Found on: ${link.foundOn}`);
            console.log('');
        });
    }

    // Mobile check summary
    const mobileFriendly = mobileResults.filter(r => r.passed);
    const mobileUnfriendly = mobileResults.filter(r => !r.passed);

    console.log('\n📱 MOBILE-FRIENDLINESS RESULTS:');
    console.log(`  Total pages checked: ${mobileResults.length}`);
    console.log(`  ✅ Mobile-friendly: ${mobileFriendly.length}`);
    console.log(`  ❌ Has issues: ${mobileUnfriendly.length}`);

    if (mobileUnfriendly.length > 0) {
        console.log('\n  🔴 PAGES WITH MOBILE ISSUES:');
        mobileUnfriendly.forEach(result => {
            console.log(`\n    URL: ${result.url}`);
            console.log('    Issues:');
            result.issues.forEach(issue => console.log(`      - ${issue}`));
            if (result.screenshotPath) {
                console.log(`    Screenshot: ${result.screenshotPath}`);
            }
        });
    }

    // Save results to JSON file
    const resultsData = {
        timestamp: new Date().toISOString(),
        baseUrl: BASE_URL,
        linkResults: {
            total: linkResults.length,
            broken: brokenLinks,
            working: workingLinks.map(l => l.url),
        },
        mobileResults: {
            total: mobileResults.length,
            failed: mobileUnfriendly,
            passed: mobileFriendly.map(r => r.url),
        }
    };

    fs.writeFileSync('test-results.json', JSON.stringify(resultsData, null, 2));
    console.log('\n📄 Results saved to test-results.json');

    // Final verdict
    console.log('\n' + '='.repeat(60));
    if (brokenLinks.length === 0 && mobileUnfriendly.length === 0) {
        console.log('✅ ALL TESTS PASSED!');
        console.log('   No broken links and all pages are mobile-friendly.');
    } else {
        console.log('❌ TESTS FAILED!');
        if (brokenLinks.length > 0) {
            console.log(`   - ${brokenLinks.length} broken link(s) found`);
        }
        if (mobileUnfriendly.length > 0) {
            console.log(`   - ${mobileUnfriendly.length} page(s) with mobile issues`);
        }
        process.exit(1);
    }
    console.log('='.repeat(60) + '\n');
}

// Run the tests
runTests();
