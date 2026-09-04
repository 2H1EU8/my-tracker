const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

(async () => {
  const extensionPath = path.resolve('.output/chrome-mv3');
  const userDataDir = '/tmp/test-user-data-dir3';
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`]
  });

  const page = context.pages()[0] || await context.newPage();
  await page.goto('chrome://newtab');
  await page.waitForLoadState('domcontentloaded');
  await page.waitForSelector('text=My Tracker', { timeout: 10000 });
  await page.click('button[aria-label="Import AI Plan"]');
  
  const planFile = path.resolve('test-ai-plan.json');
  // Write the file (same as before)
  const planData = {
    $schema: "https://my-tracker.local/schemas/my-tracker-ai-plan.schema.json",
    format: "my-tracker/ai-plan",
    schemaVersion: "1.0.0",
    title: "M4 Automated QA",
    goals: [{
      externalKey: "goal-m4",
      title: "M4 Imported Goal",
      phases: [{
        externalKey: "phase-m4",
        title: "M4 Imported Phase",
        tasks: [{
          externalKey: "task-m4",
          title: "M4 Imported Task"
        }]
      }]
    }]
  };
  fs.writeFileSync(planFile, JSON.stringify(planData));

  await page.setInputFiles('input[type="file"]', planFile);
  await page.click('button:has-text("Confirm Import")');
  
  await page.waitForTimeout(1000);
  
  const text = await page.evaluate(() => document.body.innerText);
  console.log("TEXT EXTRACTED:\n", text);
  
  await context.close();
})();
