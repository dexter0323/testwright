# Getting started

## Requirements

- Git
- Moon 2.x
- Proto (Moon uses it to install the pinned Node.js and pnpm toolchains)

Node.js 26.10.0, pnpm 12.8.1, Moon 2.5.6, and Python 3.14.8 (for MkDocs) are pinned in `.prototools` and Moon's toolchain config. Let Moon/Proto select/install those versions; avoid installing separate project versions globally.

## Setup and run

```sh
moon setup
moon run install-browsers
moon run test -- app=todomvc suite=ui
```

The first browser install downloads Chromium. The TodoMVC example uses the public demo at `https://demo.playwright.dev/todomvc` and therefore requires network access. Tests and repository tooling scripts are TypeScript and run directly with Node 26's native type stripping; there is no separate script transpiler.

## Common commands

| Command                                             | Purpose                                                          |
| --------------------------------------------------- | ---------------------------------------------------------------- |
| `moon run test -- app=todomvc suite=ui`             | Run TodoMVC UI suite                                             |
| `moon run test -- app=erp suite=api`                | Select an app and API suite                                      |
| `moon run test -- app=todomvc suite=ui headed=true` | Show the browser during UI tests; omitted means headless         |
| `moon run test-ci -- app=erp suite=api`             | Same selection without terminal interactivity (for CI)           |
| `moon run test -- app=erp`                          | Run all suites declared for an app                               |
| `moon run app-setup`                                | Interactively add a standardized app manifest and test folders   |
| `moon run validate-apps`                            | Validate app manifests                                           |
| `moon run check`                                    | Run app validation, type, lint, format, and TodoMVC smoke checks |
| `moon run install-browsers`                         | Install Chromium locally                                         |
| `moon run typecheck`                                | Type-check Playwright code                                       |
| `moon run lint`                                     | Lint TypeScript                                                  |
| `moon run docs-build`                               | Build documentation                                              |
| `moon run docs -- --serve`                          | Serve documentation locally                                      |

## Environment configuration

Copy `.env.example` values into your local environment as needed. Do not commit credentials, browser storage state, or private logs. To choose another environment, pass `target=<name>` to the selected-app test command; the name must exist in the app manifest.
