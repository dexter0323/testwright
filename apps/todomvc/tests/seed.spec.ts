import { expect, test } from "../../../shared/fixtures/test";

test("TodoMVC demo is available", async ({ page }) => {
  await page.goto("./");
  await expect(page.getByPlaceholder("What needs to be done?")).toBeVisible();
});
