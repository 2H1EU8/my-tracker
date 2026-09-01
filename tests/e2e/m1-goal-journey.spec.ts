import { expect, test } from "./extension.fixture";
import {
  createGoal,
  createPhase,
  createTask,
  openGoal,
  statusColumn,
} from "./journey-helpers";

test("@smoke @m1 creates, moves, and reopens a goal hierarchy", async ({
  extensionApp,
}) => {
  const goalTitle = "M1 E2E goal";
  const phaseTitle = "M1 E2E phase";
  const taskTitle = "M1 E2E task";

  await createGoal(extensionApp.page, goalTitle);
  await openGoal(extensionApp.page, goalTitle);
  await createPhase(extensionApp.page, phaseTitle);
  await createTask(extensionApp.page, "Todo", taskTitle);

  const todoTask = statusColumn(extensionApp.page, "Todo").locator(".task-card", {
    hasText: taskTitle,
  });
  await todoTask.dragTo(statusColumn(extensionApp.page, "In Progress"));
  await expect(
    statusColumn(extensionApp.page, "In Progress").getByRole("button", {
      name: `Open task details for ${taskTitle}`,
    }),
  ).toBeVisible();

  await extensionApp.page.close();
  const reopened = await extensionApp.openNewTab();
  await openGoal(reopened, goalTitle);
  await expect(
    statusColumn(reopened, "In Progress").getByRole("button", {
      name: `Open task details for ${taskTitle}`,
    }),
  ).toBeVisible();
});
