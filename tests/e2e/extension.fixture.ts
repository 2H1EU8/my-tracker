import { existsSync } from "node:fs";
import { resolve } from "node:path";
import {
  chromium,
  expect,
  test as base,
  type BrowserContext,
  type Page,
} from "@playwright/test";

const extensionPath = resolve(process.cwd(), ".output/chrome-mv3");

interface ExtensionApp {
  context: BrowserContext;
  extensionId: string;
  openNewTab: () => Promise<Page>;
  page: Page;
  externalRequests: readonly string[];
}

interface ExtensionFixtures {
  extensionApp: ExtensionApp;
}

function isExternalRequest(url: string): boolean {
  return !(
    url.startsWith("chrome-extension://") ||
    url.startsWith("chrome://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  );
}

async function navigateToExtensionNewTab(context: BrowserContext): Promise<Page> {
  const page = await context.newPage();
  await page.goto("chrome://newtab/");
  await page.waitForURL(/^chrome-extension:\/\//);
  await expect(page.getByText("My Tracker", { exact: true })).toBeVisible();
  await expect(page.getByText(/^Inbox · \d+$/)).toBeVisible();
  await expect(page.getByText(/^Goals · \d+$/)).toBeVisible();
  return page;
}

export const test = base.extend<ExtensionFixtures>({
  extensionApp: async ({}, use, testInfo) => {
    if (!existsSync(resolve(extensionPath, "manifest.json"))) {
      throw new Error(
        "Production extension not found. Run `pnpm build` before Playwright.",
      );
    }

    const externalRequests: string[] = [];
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const context = await chromium.launchPersistentContext("", {
      channel: "chromium",
      headless: process.env.PW_HEADED !== "1",
      viewport: { width: 1440, height: 960 },
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
      ],
    });

    context.on("request", (request) => {
      if (isExternalRequest(request.url())) {
        externalRequests.push(request.url());
      }
    });
    context.on("page", (page) => {
      page.on("console", (message) => {
        if (message.type() === "error") {
          consoleErrors.push(message.text());
        }
      });
      page.on("pageerror", (error) => pageErrors.push(error.message));
    });

    await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
    const page = await navigateToExtensionNewTab(context);
    const extensionId = new URL(page.url()).hostname;

    try {
      await use({
        context,
        extensionId,
        externalRequests,
        openNewTab: () => navigateToExtensionNewTab(context),
        page,
      });
    } finally {
      const failed = testInfo.status !== testInfo.expectedStatus;
      if (failed) {
        const tracePath = testInfo.outputPath("trace.zip");
        await context.tracing.stop({ path: tracePath });
        await testInfo.attach("trace", {
          contentType: "application/zip",
          path: tracePath,
        });

        const activePage = context
          .pages()
          .find(
            (candidate) =>
              !candidate.isClosed() && candidate.url().startsWith("chrome-extension://"),
          );
        if (activePage !== undefined) {
          await testInfo.attach("failure.png", {
            body: await activePage.screenshot({ fullPage: true }),
            contentType: "image/png",
          });
          await testInfo.attach("aria-snapshot.yml", {
            body: await activePage.locator("body").ariaSnapshot(),
            contentType: "text/yaml",
          });
        }

        await testInfo.attach("browser-errors.json", {
          body: Buffer.from(JSON.stringify({ consoleErrors, pageErrors }, null, 2)),
          contentType: "application/json",
        });
        await testInfo.attach("external-requests.json", {
          body: Buffer.from(JSON.stringify(externalRequests, null, 2)),
          contentType: "application/json",
        });
      } else {
        await context.tracing.stop();
      }
      await context.close();
    }
  },
});

export { expect } from "@playwright/test";
