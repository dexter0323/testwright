# Logs and debugging

Each test run writes ignored diagnostics under:

```text
.logs/<app>/runs/<run-id>/
  playwright.log
  worker-<n>/
    api.log
    ui.log
    console.log
    network.log
```

Each Playwright worker writes its surface/browser logs into its own subdirectory to avoid parallel-write collisions. The reporter writes shared `playwright.log`. Set `TESTWRIGHT_RUN_ID` in CI or multi-command debug sessions to correlate related commands; otherwise the local runner process ID is used. Surface-specific logs are created as applicable; for TodoMVC, API logs may be absent because it has no API suite.

Playwright's HTML report is written to `playwright-report/`; traces, screenshots, videos, and test output are written under `test-results/`. These local outputs are ignored. CI uploads the HTML report and test artifacts for debugging.

Never put credentials, cookies, bearer tokens, or password values into logs. Network URLs redact common secret query parameters, but the logger does not capture headers or bodies. Add narrowly scoped, reviewed API diagnostics if an app needs them.

For a failure, inspect the Playwright failure and trace first, then correlate the run’s `playwright.log`, `console.log`, `network.log`, and surface log.
