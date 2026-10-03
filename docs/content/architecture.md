# Architecture

```text
apps/<app>/                 App-owned manifest, setup, data, and suites
shared/                     Reusable Playwright fixtures/reporters/helpers
.opencode/                  Agent definitions and on-demand workflow skills
.moon/                      Workspace mapping and pinned toolchains
docs/content/               Maintained MkDocs source
.logs/<app>/runs/<run-id>/  Ignored app-specific diagnostics
```

## One Moon project, many apps

Moon manages one root workspace project, its shared toolchain, and shared tasks. App directories under `apps/` are app/test boundaries with manifests; they do not have their own Moon project or package manifest. Select an app and suite with `moon run test -- app=todomvc suite=ui`; use `suite=all` to run the app's declared suites. Since the workspace project is the default, commands have no project prefix.

Playwright projects are generated from app manifests and configure the runner per app/suite. They are distinct from Moon projects.

## Test surfaces

- **UI:** browser interactions and user-visible outcomes.
- **API:** direct HTTP behavior using Playwright's `request` fixture.
- **Journeys:** a user flow that combines UI behavior with reliable API setup or server-side verification.

The test harness itself is Playwright Test. CLI/MCP are agent-facing exploration tools; they do not replace committed tests or CI assertions.
