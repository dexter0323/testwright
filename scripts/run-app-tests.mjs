import { spawnSync } from "node:child_process";
import { loadAppManifest } from "./app-manifest.mjs";

const [appId, suite] = process.argv.slice(2);
if (!appId || !suite || !["ui", "api", "journeys", "all"].includes(suite)) {
  console.error(
    "Usage: node scripts/run-app-tests.mjs <app-id> <ui|api|journeys>",
  );
  process.exit(2);
}

const manifestPath = `apps/${appId}/app.manifest.yml`;
let manifest;
try {
  manifest = await loadAppManifest(appId);
} catch (error) {
  console.error(error.message);
  process.exit(2);
}

const suites = manifest.testing.suites;
const missingEnvironment = manifest.environment.required.filter(
  (name) => !process.env[name],
);
if (missingEnvironment.length) {
  console.error(
    `App "${appId}" is missing required environment variables: ${missingEnvironment.join(", ")}.`,
  );
  process.exit(2);
}
if (suite !== "all" && !suites.includes(suite)) {
  console.log(
    `App "${appId}" does not declare a "${suite}" suite. Declared suites: ${suites.join(", ") || "none"}.`,
  );
  process.exit(2);
}

const selectedSuites = suite === "all" ? suites : [suite];
const targetName =
  process.env[`APP_${appId.toUpperCase().replaceAll("-", "_")}_TARGET`] ??
  manifest.testing.defaultTarget;
if (!manifest.targets[targetName]) {
  console.error(
    `Target "${targetName}" is not declared for app "${appId}". Allowed targets: ${Object.keys(manifest.targets).join(", ")}.`,
  );
  process.exit(2);
}
let exitCode = 0;
for (const selectedSuite of selectedSuites) {
  const result = spawnSync(
    "pnpm",
    ["exec", "playwright", "test", `--project=${appId}-${selectedSuite}`],
    {
      stdio: "inherit",
      shell: process.platform === "win32",
      env: {
        ...process.env,
        [`APP_${appId.toUpperCase().replaceAll("-", "_")}_TARGET`]: targetName,
      },
    },
  );
  if (result.status !== 0) exitCode = result.status ?? 1;
}
process.exit(exitCode);
