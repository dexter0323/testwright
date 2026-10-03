# TestWright

AI-assisted Playwright UI and API test harness for multiple apps. Describe the flow you want tested; OpenCode uses app manifests and repo conventions to explore, author, run, and help debug TypeScript Playwright tests.

## Quick start

```sh
moon setup
moon run install-browsers
moon run test -- app=todomvc suite=ui
```

## Useful commands

```sh
moon run typecheck lint
moon run test -- app=todomvc suite=ui
moon run check
moon run docs-build
moon run docs -- --serve
```

Read the [documentation](docs/content/index.md) for setup, architecture, app manifests, writing tests, OpenCode browser workflows, and diagnostics. Node.js 26.10.0, pnpm 12.8.1, Moon 2.5.6, and Python 3.14.8 (used by MkDocs) are pinned in `.prototools`. Each app's manifest and tests live under `apps/<app>/`; Moon, pnpm, and Playwright configuration is shared at the repository root. Local run diagnostics are written under ignored `.logs/<app>/runs/<run-id>/`.
