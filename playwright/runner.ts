import { chromium, firefox, webkit, Browser, Page } from "playwright-core";
import { tests } from "./tests";
import { TestDefinition } from "./types";
import { withTimeout } from "./timeoutHelper";
import { takeScreenshot } from "./arena/helpers/takeScreenshot";

/**
 * Base options for all tests.
 * Per-test interfaces can extend this with additional fields.
 */
export interface RunOptions {
  test: string;  // Which test to run
  site?: string;
  browser: "chromium" | "firefox" | "webkit";
  runs: number;
  headless: boolean;
  slow?: boolean;
  saveOrder?: boolean;
  submitOrder?: boolean;
  returnIdoc?: boolean;
  timeoutMs?: number;
  reference?: string;
  productCategory?: string;
  configureValues?: Record<string, ConfigureValue>;
  screenshots?: {
    configure: boolean;
    basket: boolean;
    confirmation: boolean;
    unsubmittedOrders: boolean
  };

  url?: string;
  environment?: "dev" | "qa" | "prod";

  username?: string;
  password?: string;
}

/**
 * runTest has an optional logging callback
 * so messages can be streamed back to the UI live
 */
export async function runTest(options: RunOptions, onLog?: (message: string) => void): Promise<string> {
  let browserInstance: Browser | null = null;
  let page: Page | null = null;

  // Helper to send logs either via callback or console
  const log = (message: string) => {
    if (onLog) onLog(message);
    else console.log(message);
  };

  try {
    log(`Launching browser: ${options.browser}...`);

    /* Launch browser */
    browserInstance = await { chromium, firefox, webkit }[options.browser].launch({
      headless: options.headless,

    });

    const context = await browserInstance.newContext({
      viewport: {
        width: 1920,
        height: 4000,
      },
    });

    page = await context.newPage();

    log(`Looking up test: ${options.test}`);
    /* Lookup test */
    const test: TestDefinition | undefined = tests[options.test]?.[options.site!];

    if (!test) {
      throw new Error(`Test not found: ${options.test} for site ${options.site}`);
    }

    const isSlow =
      options.slow ?? test.slow ?? false;

    const effectiveTimeout =
      options.timeoutMs ??
      (isSlow ? 180_000 : 60_000);

    log(
      `Executing test: ${options.test} ` +
      `(timeout ${effectiveTimeout}ms, slow=${isSlow})`
    );

    const result = await withTimeout(
      test.run(page, options, log),
      effectiveTimeout
    );

    log(`Closing browser...`);
    await browserInstance.close();


    if (result?.success === false) {
      const failMessage = `Test "${options.test}" completed with failures`;
      log(failMessage);
      return failMessage;
    }

    const successMessage = `Test "${options.test}" completed successfully`;
    log(successMessage);
    return successMessage;

  } catch (err: any) {

    if (page) {
      const screenshotPath = await takeScreenshot(
        page,
        'Failed',
        log
      );

      log(`Screenshot saved: ${screenshotPath}`);
    }

    if (browserInstance) {
      await browserInstance.close();
    }

    log(`Error: ${err.message}`);
    throw err;
  }
}
