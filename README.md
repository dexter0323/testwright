# TestWright

AI-assisted Playwright UI and API test harness for multiple apps. Describe the flow you want tested; OpenCode uses app manifests and repo conventions to explore, author, run, and help debug TypeScript Playwright tests.

## Quick start

```sh
moon setup
moon run root:install-browsers
moon run todomvc:test-ui
```

## Useful commands

```sh
moon run root:typecheck root:lint
moon run todomvc:test-ui
moon run root:check
moon run root:docs-build
moon run root:docs -- --serve
```

Read the [documentation](docs/content/index.md) for setup, architecture, app manifests, writing tests, OpenCode browser workflows, and diagnostics. Node.js 26.10.0, pnpm 12.8.1, and Moon 2.5.6 are pinned in `.prototools`. Local run diagnostics are written under ignored `.logs/<app>/runs/<run-id>/`.
