import { defineConfig } from "@playwright/test";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { validateAppManifest } from "./scripts/app-manifest.mjs";

const globalSetup = resolve(__dirname, "shared/global-setup.ts");
process.env.TESTWRIGHT_RUN_ID ??= `run-${new Date().toISOString().replaceAll(":", "-")}-${process.pid}`;

type AppManifest = {
  id: string;
  targets: Record<string, { baseUrl: string }>;
  testing: { defaultTarget: string; suites: Array<"ui" | "api" | "journeys"> };
};

function createProjects() {
  const appDirectories = readdirSync(resolve(__dirname, "apps"), {
    withFileTypes: true,
  });
  const projects = [];
  for (const entry of appDirectories.filter((item) => item.isDirectory())) {
    const manifestPath = resolve(
      __dirname,
      "apps",
      entry.name,
      "app.manifest.yml",
    );
    let manifest: AppManifest;
    try {
      manifest = parse(readFileSync(manifestPath, "utf8")) as AppManifest;
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT")
        throw new Error(
          `App "${entry.name}" has no manifest. Create it with: moon run root:app-setup`,
        );
      throw new Error(
        `Unable to parse ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
    const errors = validateAppManifest(manifest, entry.name);
    if (errors.length)
      throw new Error(
        `Invalid app manifest ${manifestPath}:\n${errors.map((item) => `- ${item}`).join("\n")}`,
      );

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
      "No Playwright app projects found. Add an app with: moon run root:app-setup",
    );
  return projects;
}

const projectList = createProjects();
const workspace = parse(
  readFileSync(resolve(__dirname, ".moon/workspace.yml"), "utf8"),
) as { projects?: { sources?: Record<string, string> } };
const registeredSources = workspace.projects?.sources ?? {};
for (const project of projectList) {
  const appId = project.name.slice(0, project.name.lastIndexOf("-"));
  if (registeredSources[appId] !== `apps/${appId}`) {
    throw new Error(
      `App "${appId}" is not registered in .moon/workspace.yml. Re-run app setup or add projects.sources.${appId}: apps/${appId}.`,
    );
  }
}

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
    [resolve(__dirname, "shared/reporters/diagnostics-reporter.ts")],
  ],
  outputDir: "test-results",
  use: {
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: projectList,
});
