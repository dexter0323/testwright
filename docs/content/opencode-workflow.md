# OpenCode workflow

Describe the outcome you want, for example: “In the ERP staging app, create an order with a valid item and verify it appears in the order list.” OpenCode should identify the app, load its manifest and relevant skill, inspect the configured target, create a TypeScript test, run the focused Moon task, and report the result.

## Browser tools

- **Playwright MCP:** interactive, headed browser sessions and frequent requests such as inspecting/clicking a control in an app. OpenCode's `playwright` MCP server is configured to save generated artifacts under ignored `.logs/mcp/`.
- **Playwright CLI:** concise command-oriented browser exploration, recording, snapshots, and session control.
- **Playwright Test:** deterministic execution of committed tests locally and in CI.

Playwright Test is headless by default. To show the browser during a local Moon test, pass `headed=true`, for example `moon run test -- app=todomvc suite=ui headed=true`. With no flag it stays headless. Direct Playwright CLI usage also supports `pnpm exec playwright test --headed`.

The agent should choose an appropriate browser tool for the request. MCP/CLI exploration is not itself a CI check.

OpenCode's Playwright MCP server is configured in `opencode.json`. For GitHub Pages deployment, enable Pages for the repository with **Settings → Pages → Build and deployment → GitHub Actions**. Private repositories require a GitHub plan that supports Pages for private repositories; repository visibility remains private by default.

## Roles and quality bar

- Planner: explores safely and proposes scenarios; a plan file is created only when it adds human review value.
- Generator: writes focused TypeScript and runs the suite.
- Healer: reproduces and diagnoses first; preserves assertion intent and reports app/environment failures instead of hiding them.

Review AI-authored diffs as normal code. Never accept a “fix” solely because it turns a red run green.
