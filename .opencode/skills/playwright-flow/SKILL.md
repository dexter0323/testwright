---
name: playwright-flow
description: Turn plain-language UI/API flow requests into reviewed Playwright tests using app manifests, browser tools, and Moon.
---

# Playwright flow workflow

When asked to test a flow:

1. Select the app. If it does not exist, ask for setup details and use `moon run root:app-setup` to create its manifest and starter layout. Do not run tests before its manifest validates.
2. Read the app's `app.manifest.yml`, project `moon.yml`, and relevant app guidance.
3. Confirm the target environment and expected outcome. Ask only for information needed to safely and correctly test the requested flow.
4. Explore with Playwright MCP for an interactive current browser session, or Playwright CLI for efficient command-oriented exploration. Use a target explicitly declared in the manifest.
5. Draft/update an app-local Markdown plan only when requirements are complex, ambiguous, or benefit from separate human review. Keep simple flows documented by the test title and assertions.
6. Write TypeScript under `apps/<app>/tests/ui`, `api`, or `journeys`, importing the shared `test` and `expect` fixture.
7. Run the focused Moon task for the app/suite and inspect the result. For a failure, inspect the run's `.logs/<app>/runs/<run-id>/` files and Playwright artifacts.
8. Report files changed, environment used, exact test command, pass/fail result, and remaining issue. Do not claim success without an executed check.

## Safety and quality

- Inspect current UI state before interacting with a user-opened page. Confirm ambiguous targets before action.
- Get explicit confirmation for destructive or irreversible actions unless the user clearly requested that action on the stated test target.
- Do not use production unless explicitly requested and configured in the app manifest.
- Never log or expose secrets, cookies, or authorization headers.
- Preserve assertion intent. Never hide an application/environment failure by skipping a test, softening an assertion, or adding arbitrary sleeps.
- API tests use Playwright's `request` fixture. Add API coverage only when the app has a documented API target/spec.
