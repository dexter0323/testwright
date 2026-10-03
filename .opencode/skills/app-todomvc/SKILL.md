---
name: app-todomvc
description: TodoMVC demo target, app setup, and testing notes for TestWright.
---

# TodoMVC

- Read `apps/todomvc/app.manifest.yml` for target and source metadata.
- Target: `https://demo.playwright.dev/todomvc` (public third-party demo; not an API service).
- Suite: UI only. Do not invent API tests for this app.
- Run: `moon run test -- app=todomvc suite=ui`.
- Browser state is isolated per Playwright test.
- Keep tests self-contained; do not depend on todos left by a prior test.
