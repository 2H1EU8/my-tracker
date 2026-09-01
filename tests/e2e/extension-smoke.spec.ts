import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { expect, test } from "./extension.fixture";

test("@smoke @boundary production package owns New Tab and stays local", async ({
  extensionApp,
}) => {
  const manifest = JSON.parse(
    await readFile(resolve(process.cwd(), ".output/chrome-mv3/manifest.json"), "utf8"),
  ) as {
    chrome_url_overrides?: { newtab?: string };
    host_permissions?: string[];
    permissions?: string[];
  };

  expect(extensionApp.page.url()).toBe(
    `chrome-extension://${extensionApp.extensionId}/newtab.html`,
  );
  expect(manifest.chrome_url_overrides?.newtab).toBe("newtab.html");
  expect(manifest.host_permissions ?? []).toEqual([]);
  expect(new Set(manifest.permissions ?? [])).toEqual(
    new Set(["alarms", "notifications"]),
  );
  expect(extensionApp.externalRequests).toEqual([]);
});
