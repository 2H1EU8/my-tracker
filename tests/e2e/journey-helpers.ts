import { expect, type Locator, type Page } from "@playwright/test";

export async function createGoal(page: Page, title: string): Promise<void> {
  await page.getByRole("button", { name: "New goal" }).click();
  const dialog = page.getByRole("dialog", { name: "Create goal" });
  await dialog.getByLabel("Goal title").fill(title);
  await dialog.getByRole("button", { name: "Create goal", exact: true }).click();
  await expect(page.getByRole("button", { name: new RegExp(`^Open goal ${title}`) })).toBeVisible();
}

export async function openGoal(page: Page, title: string): Promise<void> {
  const goal = page.getByRole("button", { name: new RegExp(`^Open goal ${title}`) });
  await goal.press("Enter");
  await expect(page.getByRole("button", { name: "Back to goals" })).toBeVisible();
}

export async function createPhase(page: Page, title: string): Promise<void> {
  await page.getByRole("button", { name: "Create phase" }).click();
  const dialog = page.getByRole("dialog", { name: "Create phase" });
  await dialog.getByLabel("Phase title").fill(title);
  await dialog.getByRole("button", { name: "Create phase", exact: true }).click();
  await expect(page.getByRole("heading", { name: title, exact: true })).toBeVisible();
}

export function statusColumn(page: Page, status: "Todo" | "In Progress" | "Done"): Locator {
  return page.locator(".kanban-column").filter({
    has: page.getByRole("heading", { name: new RegExp(`^${status} ·`) }),
  });
}

export async function createTask(
  page: Page,
  status: "Todo" | "In Progress" | "Done",
  title: string,
): Promise<void> {
  const column = statusColumn(page, status);
  await column.locator(".kanban-column-header button").click();
  const dialog = page.getByRole("dialog", { name: `Create task in ${status}` });
  await dialog.getByLabel("Task title").fill(title);
  await dialog.getByRole("button", { name: "Create task", exact: true }).click();
  await expect(column.getByRole("button", { name: `Open task details for ${title}` })).toBeVisible();
}

export async function createNote(page: Page, body: string): Promise<void> {
  await page.getByRole("button", { name: "New note" }).click();
  const dialog = page.getByRole("dialog", { name: "New Note" });
  await dialog.getByLabel("Note content").fill(body);
  await dialog.getByRole("button", { name: "Create note", exact: true }).click();
  await expect(page.getByText(body, { exact: true })).toBeVisible();
}
