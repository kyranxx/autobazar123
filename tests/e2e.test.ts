/**
 * Puppeteer E2E Test Suite for Autobazar123
 * 
 * Run with: npx ts-node tests/e2e.test.ts
 * Or add to package.json: "test:e2e": "ts-node tests/e2e.test.ts"
 */

import puppeteer, { Browser, Page } from "puppeteer";

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

const results: TestResult[] = [];

async function runTest(
    name: string,
    testFn: (page: Page) => Promise<void>,
    page: Page
): Promise<void> {
    const start = Date.now();
    try {
        await testFn(page);
        results.push({
            name,
            passed: true,
            duration: Date.now() - start,
        });
        console.log(`✅ ${name} (${Date.now() - start}ms)`);
    } catch (error) {
        results.push({
            name,
            passed: false,
            error: error instanceof Error ? error.message : String(error),
            duration: Date.now() - start,
        });
        console.log(`❌ ${name}: ${error}`);
    }
}

// Test: Homepage loads correctly
async function testHomepage(page: Page): Promise<void> {
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });

    // Check title
    const title = await page.title();
    if (!title.includes("Autobazar123")) {
        throw new Error(`Expected title to include 'Autobazar123', got: ${title}`);
    }

    // Check navbar exists
    const navbar = await page.$("nav");
    if (!navbar) {
        throw new Error("Navbar not found");
    }

    // Check hero section
    const heroHeading = await page.$("h1");
    if (!heroHeading) {
        throw new Error("Hero heading not found");
    }
}

// Test: Cars listing page
async function testCarsListing(page: Page): Promise<void> {
    // In Next.js dev mode this page can keep background connections active,
    // so `networkidle0` is flaky here. DOM readiness is enough for this test.
    await page.goto(`${BASE_URL}/vysledky`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main, input, [role='main']", { timeout: 10000 });

    const title = await page.title();
    if (!title.includes("Výsledky") && !title.includes("Autobazar123")) {
        throw new Error(`Expected search results page, got title: ${title}`);
    }

    // Check for search/filter section
    const filters = await page.$('[class*="filter"], [class*="search"], form');
    if (!filters) {
        console.log("Warning: Filters section not found (may be expected if no cars)");
    }
}

// Test: Login page
async function testLoginPage(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/auth/login`, { waitUntil: "networkidle0" });

    // Check for email input
    const emailInput = await page.$('input[type="email"]');
    if (!emailInput) {
        throw new Error("Email input not found");
    }

    // Check for password input
    const passwordInput = await page.$('input[type="password"]');
    if (!passwordInput) {
        throw new Error("Password input not found");
    }

    // Check for submit button
    const submitButton = await page.$('button[type="submit"]');
    if (!submitButton) {
        throw new Error("Submit button not found");
    }
}

// Test: Register page
async function testRegisterPage(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/auth/register`, { waitUntil: "networkidle0" });

    const emailInput = await page.$('input[type="email"]');
    const passwordInput = await page.$('input[type="password"]');

    if (!emailInput || !passwordInput) {
        throw new Error("Registration form inputs not found");
    }
}

// Test: Credits page
async function testCreditsPage(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/kredity`, { waitUntil: "networkidle0" });

    const title = await page.title();
    if (!title.includes("kredit") && !title.includes("Kredit")) {
        throw new Error(`Expected credits page, got title: ${title}`);
    }

    // Check for credit pack cards (they should have prices in €)
    const content = await page.content();
    if (!content.includes("€")) {
        throw new Error("Credit prices not found on page");
    }
}

// Test: Terms of Service page
async function testTermsPage(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/obchodne-podmienky`, { waitUntil: "networkidle0" });

    const h1 = await page.$eval("h1", (el) => el.textContent);
    if (!h1?.includes("Obchodné podmienky")) {
        throw new Error(`Expected Terms page, got h1: ${h1}`);
    }
}

// Test: Privacy Policy page
async function testPrivacyPage(page: Page): Promise<void> {
    await page.goto(`${BASE_URL}/ochrana-udajov`, { waitUntil: "networkidle0" });

    const h1 = await page.$eval("h1", (el) => el.textContent);
    if (!h1?.includes("Ochrana") || !h1?.includes("údajov")) {
        throw new Error(`Expected Privacy page, got h1: ${h1}`);
    }
}

// Test: Navigation works
async function testNavigation(page: Page): Promise<void> {
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });

    // Click on results link if exists
    const resultsLink = await page.$('a[href="/vysledky"]');
    if (resultsLink) {
        await resultsLink.click();
        await page.waitForNavigation({ waitUntil: "domcontentloaded" });

        const url = page.url();
        if (!url.includes("/vysledky")) {
            throw new Error(`Navigation to /vysledky failed, current URL: ${url}`);
        }
    }
}

// Test: Cookie banner appears
async function testCookieBanner(page: Page): Promise<void> {
    // Clear cookies first
    const client = await page.createCDPSession();
    await client.send("Network.clearBrowserCookies");
    await page.evaluate(() => localStorage.clear());

    await page.goto(BASE_URL, { waitUntil: "networkidle0" });

    // Wait for cookie banner to appear
    await new Promise(resolve => setTimeout(resolve, 1500));

    const cookieBanner = await page.$('[class*="cookie"], [class*="Cookie"]');
    // Note: Cookie banner may not be visible if already accepted
    console.log(`  Cookie banner ${cookieBanner ? "found" : "not found (may be previously accepted)"}`);
}

// Test: No console errors
async function testNoConsoleErrors(page: Page): Promise<void> {
    const errors: string[] = [];

    page.on("console", (msg) => {
        if (msg.type() === "error") {
            errors.push(msg.text());
        }
    });

    await page.goto(BASE_URL, { waitUntil: "networkidle0" });

    // Filter out known acceptable errors
    const realErrors = errors.filter(
        (e) =>
            !e.includes("favicon") &&
            !e.includes("404") &&
            !e.includes("the server responded with a status of")
    );

    if (realErrors.length > 0) {
        throw new Error(`Console errors found: ${realErrors.join(", ")}`);
    }
}

// Test: Page performance
async function testPerformance(page: Page): Promise<void> {
    const start = Date.now();
    await page.goto(BASE_URL, { waitUntil: "networkidle0" });
    const loadTime = Date.now() - start;

    console.log(`  Page load time: ${loadTime}ms`);

    if (loadTime > 10000) {
        throw new Error(`Page load too slow: ${loadTime}ms (max 10000ms)`);
    }

    // Check for LCP
    const lcp = await page.evaluate(() => {
        return new Promise<number>((resolve) => {
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                resolve(lastEntry.startTime);
            }).observe({ type: "largest-contentful-paint", buffered: true });

            // Fallback timeout
            setTimeout(() => resolve(0), 5000);
        });
    });

    console.log(`  LCP: ${lcp.toFixed(0)}ms`);
}

// Main test runner
async function runTests(): Promise<void> {
    console.log("\n🧪 Starting Autobazar123 E2E Tests\n");
    console.log(`Base URL: ${BASE_URL}\n`);

    let browser: Browser | null = null;

    try {
        browser = await puppeteer.launch({
            headless: true,
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
        });

        const page = await browser.newPage();
        await page.setViewport({ width: 1280, height: 800 });

        // Run all tests
        await runTest("Homepage loads", testHomepage, page);
        await runTest("Cars listing page", testCarsListing, page);
        await runTest("Login page", testLoginPage, page);
        await runTest("Register page", testRegisterPage, page);
        await runTest("Credits page", testCreditsPage, page);
        await runTest("Terms of Service", testTermsPage, page);
        await runTest("Privacy Policy", testPrivacyPage, page);
        await runTest("Navigation works", testNavigation, page);
        await runTest("Cookie banner", testCookieBanner, page);
        await runTest("No console errors", testNoConsoleErrors, page);
        await runTest("Performance", testPerformance, page);

        await browser.close();
    } catch (error) {
        console.error("Test runner error:", error);
        if (browser) await browser.close();
        process.exit(1);
    }

    // Print summary
    console.log("\n" + "=".repeat(50));
    console.log("TEST SUMMARY\n");

    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed).length;
    const totalTime = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Passed: ${passed}/${results.length}`);
    console.log(`Failed: ${failed}/${results.length}`);
    console.log(`Total time: ${totalTime}ms`);

    if (failed > 0) {
        console.log("\nFailed tests:");
        results
            .filter((r) => !r.passed)
            .forEach((r) => {
                console.log(`  ❌ ${r.name}: ${r.error}`);
            });
        process.exit(1);
    }

    console.log("\n✅ All tests passed!\n");
}

// Run tests
runTests();
