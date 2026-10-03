# Writing tests

Playwright Test executes TypeScript `.spec.ts` files. Markdown is optional planning/context for flows whose requirements benefit from separate review; it is not an executable test format.

Browser mode is independent of test code: the default runner is headless, and `moon run test -- app=<id> suite=ui headed=true` shows the browser during execution.

## UI example

```ts
import { expect, test } from "../../../../shared/fixtures/test";

test("user can add a todo", async ({ page }) => {
  await page.goto("./");
  const input = page.getByPlaceholder("What needs to be done?");
  await input.fill("Review the test");
  await input.press("Enter");
  await expect(
    page.getByRole("listitem").filter({ hasText: "Review the test" }),
  ).toBeVisible();
});
```

## API and journey tests

Use the Playwright `request` fixture for direct API checks. Use API setup and postcondition checks around a UI interaction when the app exposes a stable API. Do not invent an API suite for apps with no API; the TodoMVC demo is UI-only.

## Conventions

- Prefer role, label, placeholder, and text locators that represent the user interface.
- Use web-first assertions such as `await expect(locator).toBeVisible()`.
- Avoid fixed sleeps. Use Playwright auto-waiting and assertions.
- Keep each test independent and safe to run in parallel.
- Clean up test-created server-side data when applicable.
- Make assertions verify a meaningful outcome, not merely that an action ran.
- Add a Markdown plan only for complex, high-value, or ambiguous requirements.
