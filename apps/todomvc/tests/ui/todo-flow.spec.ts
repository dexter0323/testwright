import { expect, test } from "../../../../shared/fixtures/test";

test("user can add, complete, and remove a todo", async ({ page }) => {
  await page.goto("./");

  const input = page.getByPlaceholder("What needs to be done?");
  await input.fill("Prepare a release");
  await input.press("Enter");

  const todo = page
    .getByRole("listitem")
    .filter({ hasText: "Prepare a release" });
  await expect(todo).toBeVisible();
  await todo.getByRole("checkbox").check();
  await expect(todo).toHaveClass(/completed/);

  await todo.hover();
  await todo.getByRole("button", { name: "Delete" }).click();
  await expect(todo).toHaveCount(0);
});
