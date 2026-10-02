# Troubleshooting

## Moon selects an unexpected Node or pnpm

Check `.prototools`, then run `moon setup` from the repository root. Toolchains are pinned to keep developer and CI versions consistent.

## Browser executable is missing

Run `moon run root:install-browsers`. Install only the browser projects configured in Playwright.

## TodoMVC demo is unavailable

The demo is hosted externally. Check network access and the configured `TODOMVC_BASE_URL`. An external demo outage is distinct from a framework/test failure.

## A Moon API task says no suite is declared

That app has no API suite in its manifest. The starter TodoMVC app is UI-only. Add API tests only when the app provides a documented API target.

## Playwright cannot load an app

Run `moon run root:validate-apps`. It checks required manifest fields, configured target, test suites, per-app Moon project file, and explicit Moon workspace registration. Create new apps with `moon run root:app-setup`.

## Need more failure evidence

Inspect the test trace in `test-results/`, the HTML report in `playwright-report/`, and the matching app/run directory under `.logs/`.
