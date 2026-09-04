import { expect, test } from "./extension.fixture";
import * as path from "path";
import * as fs from "fs";

test("@m4 @smoke AI plan can be imported", async ({ extensionApp }) => {
  const planFile = path.join(process.cwd(), "test-ai-plan.json");
  const planData = {
    $schema: "https://my-tracker.local/schemas/my-tracker-ai-plan.schema.json",
    format: "my-tracker/ai-plan",
    schemaVersion: "1.0.0",
    title: "M4 Automated QA",
    goals: [
      {
        externalKey: "goal-m4",
        title: "M4 Imported Goal",
        phases: [
          {
            externalKey: "phase-m4",
            title: "M4 Imported Phase",
            tasks: [
              {
                externalKey: "task-m4",
                title: "M4 Imported Task"
              }
            ]
          }
        ]
      }
    ]
  };
  fs.writeFileSync(planFile, JSON.stringify(planData));

  // Click the Import AI Plan button
  await extensionApp.page.getByRole("button", { name: "Import AI Plan" }).click();
  
  const dialog = extensionApp.page.getByRole("dialog", { name: "Import AI Plan" });
  await expect(dialog).toBeVisible();

  // Find the file input and upload
  await dialog.locator('input[type="file"]').setInputFiles(planFile);

  // According to M4 reqs, we should see a preview, then confirm
  const confirmBtn = dialog.getByRole("button", { name: "Confirm Import" });
  await expect(confirmBtn).toBeEnabled();
  await confirmBtn.click();

  // Expect a success message
  await expect(dialog.getByText(/Imported \d+ goals/)).toBeVisible();
  await dialog.getByRole("button", { name: "Close" }).click();

  // Expect the Goal to be visible on the main page
  await expect(extensionApp.page.getByText("M4 Imported Goal")).toBeVisible();
  
  // Clean up
  if (fs.existsSync(planFile)) fs.unlinkSync(planFile);
});
