# Architecture

```text
apps/<app>/                 App-owned manifest, setup, data, and suites
shared/                     Reusable Playwright fixtures/reporters/helpers
.opencode/                  Agent definitions and on-demand workflow skills
.moon/                      Workspace mapping and pinned toolchains
docs/content/               Maintained MkDocs source
.logs/<app>/runs/<run-id>/  Ignored app-specific diagnostics
```

## Moon projects and Playwright projects

Moon projects identify repo units and provide commands such as `moon run todomvc:test-ui`. Playwright projects select test configurations (suite, browser, or environment) inside the shared `playwright.config.ts`. An app can have multiple Playwright projects while remaining one Moon project.

## Test surfaces

- **UI:** browser interactions and user-visible outcomes.
- **API:** direct HTTP behavior using Playwright's `request` fixture.
- **Journeys:** a user flow that combines UI behavior with reliable API setup or server-side verification.

The test harness itself is Playwright Test. CLI/MCP are agent-facing exploration tools; they do not replace committed tests or CI assertions.
