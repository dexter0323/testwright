# App manifests

Create apps with `moon run app-setup`. The interactive command requests app identity, targets, suites, source locations, discovery references, environment variable names, auth strategy, and test-data strategy; it validates the manifest and creates standard test folders. App directories do not need their own `moon.yml` or `package.json`; Moon, pnpm, and Playwright configuration are shared at the root. Review/enrich discovery references afterward. Avoid hand-creating manifests so every app has the same shape. The setup script also accepts non-interactive flags such as `--id`, `--display-name`, and `--base-url`.

Test runs depend on manifest validation. Missing or malformed manifests cause the validation task and Playwright project loading to fail with a repair hint. Use `moon run validate-apps` to validate all apps.

Each app has a committed `apps/<app>/app.manifest.yml`. Treat it as the concise discovery map for developers and AI agents—not as a copy of all application documentation.

The manifest can describe:

- App ID, name, and purpose.
- Safe test targets and their base URLs.
- Local checkout path and remote source repository URL.
- API contracts (for example OpenAPI files), entry points, and app-specific testing guidance.
- Available suites, auth strategy, and test-data strategy.
- Required/optional environment variable names (values belong in local secrets or CI settings).
- Required/optional environment variable names (values belong in local secrets or CI settings).

Use repository-relative paths for checked-in docs/contracts. A remote repository URL is a reference; the agent must not assume it is cloned locally. Credentials belong in environment variables or a secret manager. The manifest may name variables in `environment`/`secrets` guidance but never contain values. Targets should be explicitly allow-listed; an agent may select a named target with `APP_<APP_ID>_TARGET`, but cannot supply an undeclared URL through an environment override.

Keep suite declarations accurate. Moon/API commands should report an absent suite clearly rather than create fake test coverage.

See `apps/todomvc/app.manifest.yml` for the starter manifest.
