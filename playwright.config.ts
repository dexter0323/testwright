import { defineConfig } from "@playwright/test";
import { readdirSync } from "node:fs";
import { readAppManifestSync } from "./scripts/app-manifest.ts";

const globalSetup = `${import.meta.dirname}/shared/global-setup.ts`;
process.env.TESTWRIGHT_RUN_ID ??= `run-${new Date().toISOString().replaceAll(":", "-")}-${process.pid}`;

function createProjects() {
  const appDirectories = readdirSync(`${import.meta.dirname}/apps`, {
    withFileTypes: true,
  });
  const projects = [];
  for (const entry of appDirectories.filter((item) => item.isDirectory())) {
    const manifest = readAppManifestSync(entry.name);

    const target = manifest.targets[manifest.testing.defaultTarget];
    const envKey = `APP_${entry.name.toUpperCase().replaceAll("-", "_")}_TARGET`;
    const selectedTarget =
      process.env[envKey] ?? manifest.testing.defaultTarget;
    if (!manifest.targets[selectedTarget]) {
      throw new Error(
        `Target "${selectedTarget}" is not declared for app "${entry.name}". Allowed targets: ${Object.keys(manifest.targets).join(", ")}.`,
      );
    }
    const baseURL = manifest.targets[selectedTarget].baseUrl;

    for (const suite of manifest.testing.suites) {
      if (
        process.env.TESTWRIGHT_APP &&
        process.env.TESTWRIGHT_APP !== entry.name
      )
        continue;
      if (
        process.env.TESTWRIGHT_SUITE &&
        process.env.TESTWRIGHT_SUITE !== "all" &&
        process.env.TESTWRIGHT_SUITE !== suite
      )
        continue;
      const suiteMatch =
        suite === "ui"
          ? [
              `**/${entry.name}/tests/seed.spec.ts`,
              `**/${entry.name}/tests/ui/**/*.spec.ts`,
            ]
          : [`**/${entry.name}/tests/${suite}/**/*.spec.ts`];
      projects.push({
        name: `${entry.name}-${suite}`,
        testMatch: suiteMatch,
        use: { browserName: "chromium" as const, baseURL },
      });
    }
  }
  if (projects.length === 0)
    throw new Error(
      "No Playwright app projects found. Add an app with: moon run app-setup",
    );
  return projects;
}

function verifyCliAppSelection(): void {
  const appId = process.env.TESTWRIGHT_APP;
  const suite = process.env.TESTWRIGHT_SUITE ?? "all";
  if (!appId) return;
  const manifest = readAppManifestSync(appId);
  if (
    suite !== "all" &&
    !manifest.testing.suites.includes(
      suite as (typeof manifest.testing.suites)[number],
    )
  ) {
    throw new Error(
      `App "${appId}" does not declare suite "${suite}". Declared suites: ${manifest.testing.suites.join(", ")}.`,
    );
  }
  const requiredEnvironment = manifest.environment.required.filter(
    (name) => !process.env[name],
  );
  if (requiredEnvironment.length) {
    throw new Error(
      `App "${appId}" is missing required environment variables: ${requiredEnvironment.join(", ")}.`,
    );
  }
  const targetName =
    process.env[`APP_${appId.toUpperCase().replaceAll("-", "_")}_TARGET`] ??
    manifest.testing.defaultTarget;
  if (!manifest.targets[targetName]) {
    throw new Error(
      `Target "${targetName}" is not declared for app "${appId}". Allowed targets: ${Object.keys(manifest.targets).join(", ")}.`,
    );
  }
  if (["prod", "production"].includes(targetName.toLowerCase())) {
    throw new Error(
      "Production testing is not enabled by the generic runner. Use a purpose-built reviewed workflow for production checks.",
    );
  }
  process.env[`APP_${appId.toUpperCase().replaceAll("-", "_")}_TARGET`] =
    targetName;
  process.env.TESTWRIGHT_APP = appId;
}

const projectList = createProjects();
verifyCliAppSelection();

export default defineConfig({
  globalSetup,
  testDir: "./apps",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    [`${import.meta.dirname}/shared/reporters/diagnostics-reporter.ts`],
  ],
  outputDir: "test-results",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: projectList,
});
