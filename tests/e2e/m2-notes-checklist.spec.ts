import { expect, test } from "./extension.fixture";
import {
  createGoal,
  createNote,
  createPhase,
  createTask,
  openGoal,
  statusColumn,
} from "./journey-helpers";

test("@smoke @m2 keeps a note and checklist state after reopening", async ({
  extensionApp,
}) => {
  const goalTitle = "M2 E2E goal";
  const phaseTitle = "M2 E2E phase";
  const taskTitle = "M2 E2E task";
  const noteBody = "M2 E2E persistent note";
  const checklistTitle = "M2 E2E checklist item";

  await createNote(extensionApp.page, noteBody);
  await createGoal(extensionApp.page, goalTitle);
  await openGoal(extensionApp.page, goalTitle);
  await createPhase(extensionApp.page, phaseTitle);
  await createTask(extensionApp.page, "Todo", taskTitle);

  await extensionApp.page
    .getByRole("button", { name: `Open task details for ${taskTitle}` })
    .click();
  let details = extensionApp.page.getByRole("dialog", { name: taskTitle });
  await details.locator(".checklist-heading button").click();
  const createDialog = extensionApp.page.getByRole("dialog", {
    name: "New Checklist Item",
  });
  await createDialog.getByLabel("Item title").fill(checklistTitle);
  await createDialog.getByRole("button", { name: "Add item" }).click();

  // The workspace refresh intentionally remounts the task card after a create.
  // Reopen the task detail instead of relying on a stale dialog instance.
  await extensionApp.page
    .getByRole("button", { name: `Open task details for ${taskTitle}` })
    .click();
  details = extensionApp.page.getByRole("dialog", { name: taskTitle });

  const checkbox = details.getByRole("checkbox", { name: new RegExp(checklistTitle) });
  // The controlled checkbox commits asynchronously. Click first, then let the
  // web-first assertion wait for the persisted state to reach the DOM.
  await checkbox.click();
  await expect(checkbox).toBeChecked();
  await expect(details.getByText("1 / 1 complete")).toBeVisible();
  await details.getByRole("button", { name: "Close task details" }).click();
  await expect(statusColumn(extensionApp.page, "Todo").getByText("1 of 1 checked")).toBeVisible();

  await extensionApp.page.close();
  const reopened = await extensionApp.openNewTab();
  await expect(reopened.getByText(noteBody, { exact: true })).toBeVisible();
  await openGoal(reopened, goalTitle);
  await reopened
    .getByRole("button", { name: `Open task details for ${taskTitle}` })
    .click();
  const reopenedDetails = reopened.getByRole("dialog", { name: taskTitle });
  await expect(
    reopenedDetails.getByRole("checkbox", { name: new RegExp(checklistTitle) }),
  ).toBeChecked();
  await expect(statusColumn(reopened, "Todo").getByText("1 of 1 checked")).toBeVisible();
});
