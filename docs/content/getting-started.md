# Getting started

## Requirements

- Git
- Moon 2.x
- Proto (Moon uses it to install the pinned Node.js and pnpm toolchains)

Node.js 26.10.0, pnpm 12.8.1, and Moon 2.5.6 are pinned in `.prototools`. Let Moon/Proto select/install those versions; avoid installing separate project versions globally.

## Setup and run

```sh
moon setup
moon run root:install-browsers
moon run todomvc:test-ui
```

The first browser install downloads Chromium. The TodoMVC example uses the public demo at `https://demo.playwright.dev/todomvc` and therefore requires network access.

## Common commands

| Command                             | Purpose                                                                                                            |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `moon run todomvc:test-ui`          | Run TodoMVC UI suite                                                                                               |
| `moon run root:app-setup`           | Interactively add a standardized app and manifest; pass `-- --id=...` and metadata flags for non-interactive setup |
| `moon run root:validate-apps`       | Validate app manifests and Moon workspace registration                                                             |
| `moon run root:check`               | Run manifest, type, lint, format, and example smoke checks                                                         |
| `moon run root:install-browsers`    | Install Chromium locally                                                                                           |
| `moon run root:install-browsers-ci` | Install Chromium and OS dependencies on Linux CI                                                                   |
| `moon run todomvc:test-api`         | Reports that TodoMVC has no API suite; add an API suite to apps that expose an API                                 |
| `moon run todomvc:test-journeys`    | Reports that TodoMVC has no journey suite; add journeys when the app has cross-layer flows                         |
| `moon run root:typecheck`           | Type-check Playwright code                                                                                         |
| `moon run root:lint`                | Lint TypeScript                                                                                                    |
| `moon run root:docs-build`          | Build documentation                                                                                                |
| `moon run root:docs -- --serve`     | Serve documentation locally                                                                                        |

## Environment configuration

Copy `.env.example` values into your local environment as needed. Do not commit credentials, browser storage state, or private logs. To choose a different app environment, set `APP_<APP_ID>_TARGET` to a target name declared in that app's manifest; arbitrary URLs cannot be introduced through environment overrides.
