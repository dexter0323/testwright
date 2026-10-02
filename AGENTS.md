# TestWright agent guide

TestWright is a multi-app Playwright UI/API test harness. Use TypeScript for committed tests, Moon for repository tasks/toolchain management, and app manifests as the entry point for app-specific context.

## Start with the target app

1. Identify the app from the user request; ask if ambiguous.
2. Read `apps/<app>/app.manifest.yml` and its `moon.yml` before exploring.
3. Follow manifest targets and source links. Never infer that an external source repo is checked out locally.
4. Default to the manifest's non-production target. Do not navigate to production unless the user explicitly requests it.

Before adding an app folder, use `moon run root:app-setup`. Do not hand-create an app manifest or folder. App test tasks validate all app manifests and workspace registration before running; resolve validation errors rather than bypassing the check.

## Writing tests

- Import `test` and `expect` from `shared/fixtures/test`.
- Use Playwright Test TypeScript specs under `apps/<app>/tests/{ui,api,journeys}`.
- Use accessible, user-facing locators and web-first assertions.
- Keep tests isolated, parallel-safe, and responsible for the data they create.
- Use direct API setup/assertions for reliable preconditions and server-side postconditions when available.
- Do not invent API coverage for an app with no API. Keep Markdown flow plans for complex or review-worthy scenarios, not every test.
- Do not use fixed sleeps, silently skip tests, or weaken assertions to make failures pass.

## Browser exploration and interactive requests

For requests such as “click the Accept button in the open app”, use the configured Playwright MCP browser interaction tools when available; inspect the current page before acting. Use Playwright CLI for compact exploration, recording, and reproducible command-driven workflows. For committed tests, use Playwright Test.

Before destructive or irreversible actions (delete, submit payment, send, accept a binding agreement), make sure the target and requested action are explicit; clarify if not.

## Running and debugging

- Use Moon targets, for example `moon run todomvc:test-ui` or `moon run todomvc:test-api`.
- Build/serve documentation with `moon run root:docs-build` and `moon run root:docs -- --serve`.
- Inspect `.logs/<app>/runs/<run-id>/` plus Playwright traces/screenshots/reports when debugging.
- Never copy credentials, cookies, authorization headers, or tokens into logs, plans, reports, or commits.

## Agent responsibilities

- Planner: explore safely and identify expected behaviors; write a plan only when it adds review value.
- Generator: implement a focused TypeScript test, run its Moon target, and report the command/result.
- Healer: reproduce and classify the cause first. Preserve assertion intent; if evidence indicates an application or environment bug, report it instead of hiding it in the test.
- Review generated changes as normal code. A green result alone is not evidence that the test is meaningful.
