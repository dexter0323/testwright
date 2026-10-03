import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { stringify } from "yaml";
import {
  appIdPattern,
  listAppIds,
  validateAppManifest,
  type AppSuite,
} from "./app-manifest.ts";

const args = process.argv.slice(2).filter((arg) => arg !== "--");
const readOptions = (name: string): string[] =>
  args
    .filter((arg) => arg.startsWith(`--${name}=`))
    .map((arg) => arg.slice(name.length + 3));
const readOption = (name: string): string | undefined => readOptions(name)[0];
const initialId = readOption("id");
const isInteractive = Boolean(stdin.isTTY && stdout.isTTY);

if (!isInteractive && !initialId) {
  console.error(
    "App setup needs a terminal for prompts. Use --id=<kebab-case-id> to start in a non-interactive context.",
  );
  process.exit(2);
}

const rl = isInteractive
  ? createInterface({ input: stdin, output: stdout })
  : null;
const ask = async (
  label: string,
  initial = "",
  required = false,
): Promise<string> => {
  let value = initial.trim();
  if (rl)
    value =
      (
        await rl.question(`${label}${initial ? ` [${initial}]` : ""}: `)
      ).trim() || initial.trim();
  if (required && !value) throw new Error(`${label} is required.`);
  return value;
};
const askList = async (
  label: string,
  initial = "",
  required = false,
): Promise<string[]> => {
  const value = await ask(label, initial, required);
  return [
    ...new Set(
      value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
};
try {
  const id = await ask("App ID (lowercase kebab-case)", initialId ?? "", true);
  if (!appIdPattern.test(id))
    throw new Error(
      "App ID must be lowercase kebab-case starting with a letter.",
    );

  const appRoot = join(import.meta.dirname, "..", "apps", id);
  if (listAppIds().includes(id))
    throw new Error(`apps/${id} already exists; refusing to overwrite it.`);

  const displayName = await ask(
    "Display name",
    readOption("display-name") ?? "",
    true,
  );
  const description = await ask(
    "Short description",
    readOption("description") ?? "",
    true,
  );
  const targetName = await ask(
    "Default target name",
    readOption("target-name") ?? "staging",
    true,
  );
  const baseUrl = await ask(
    `Base URL for ${targetName}`,
    readOption("base-url") ?? "",
    true,
  );
  const localPath = await ask(
    "Local application source path (optional)",
    readOption("local-path") ?? "",
  );
  const repositoryUrl = await ask(
    "Remote source repository URL (optional)",
    readOption("repository-url") ?? "",
  );
  const suites = await askList(
    "Suites (comma-separated: ui, api, journeys)",
    readOption("suites") ?? "ui",
    true,
  );
  const extraTargets = readOptions("target").map((value) => {
    const splitAt = value.indexOf("=");
    if (splitAt <= 0)
      throw new Error(
        `Invalid --target=${value}. Use --target=name=https://example.test.`,
      );
    return { name: value.slice(0, splitAt), url: value.slice(splitAt + 1) };
  });
  if (extraTargets.some((target) => target.name === targetName))
    throw new Error(
      `Target "${targetName}" was specified as both the default and an extra target.`,
    );
  if (rl) {
    while (
      (await ask("Add another target? (y/N)", "n")).toLowerCase() === "y"
    ) {
      const name = await ask("  Target name", "", true);
      const url = await ask(`  Base URL for ${name}`, "", true);
      extraTargets.push({ name, url });
    }
  }
  const auth = await ask(
    "Authentication strategy (none, ui, api, storage-state, custom)",
    readOption("auth") ?? "none",
    true,
  );
  const dataStrategy = await ask(
    "Test data strategy",
    readOption("data-strategy") ?? "isolated-per-test",
    true,
  );
  const appEntryPoints = await askList(
    "Application entry points (comma-separated paths/URLs)",
    readOption("entry-points") ?? "",
  );
  const apiSpecs = await askList(
    "API contracts/specs (comma-separated paths/URLs)",
    readOption("api-specs") ?? "",
  );
  const testGuidance = await askList(
    "App test guidance references (comma-separated paths/URLs)",
    readOption("test-guidance") ?? "",
  );
  const relatedDocs = await askList(
    "Related application documentation (comma-separated paths/URLs)",
    readOption("related-docs") ?? "",
  );
  const requiredEnvironment = await askList(
    "Required environment variable names (comma-separated; values are never requested)",
    readOption("required-env") ?? "",
  );
  const optionalEnvironment = await askList(
    "Optional environment variable names (comma-separated)",
    readOption("optional-env") ?? "",
  );
  const defaultTarget = targetName;
  if (["prod", "production"].includes(defaultTarget.toLowerCase())) {
    throw new Error(
      "The default test target cannot be production. Add production as a named optional target if needed and select it explicitly for an approved test run.",
    );
  }

  const targets = [{ name: targetName, url: baseUrl }, ...extraTargets];
  const manifest = {
    id,
    displayName,
    description,
    targets: Object.fromEntries(
      targets.map(({ name, url }) => [name, { baseUrl: url }]),
    ),
    source: {
      localPath: localPath || null,
      repositoryUrl: repositoryUrl || null,
    },
    discovery: { appEntryPoints, apiSpecs, testGuidance, relatedDocs },
    environment: {
      required: requiredEnvironment,
      optional: optionalEnvironment,
    },
    testing: {
      defaultTarget,
      suites: suites as AppSuite[],
      auth,
      dataStrategy,
    },
  };
  const manifestErrors = validateAppManifest(manifest, id);
  if (manifestErrors.length)
    throw new Error(
      `App information is incomplete or invalid:\n${manifestErrors.map((error) => `- ${error}`).join("\n")}`,
    );

  await mkdir(join(appRoot, "tests/ui"), { recursive: true });
  if (suites.includes("api"))
    await mkdir(join(appRoot, "tests/api"), { recursive: true });
  if (suites.includes("journeys"))
    await mkdir(join(appRoot, "tests/journeys"), { recursive: true });
  await mkdir(join(appRoot, "fixtures"), { recursive: true });
  await mkdir(join(appRoot, "data"), { recursive: true });
  await writeFile(join(appRoot, "app.manifest.yml"), stringify(manifest));
  if (suites.includes("ui")) {
    await writeFile(
      join(appRoot, "tests/seed.spec.ts"),
      `import { expect, test } from '../../../shared/fixtures/test.ts';\n\ntest(${JSON.stringify(`${displayName} target is available`)}, async ({ page }) => {\n  await page.goto('./');\n  await expect(page.locator('body')).toBeVisible();\n});\n`,
    );
  }
  for (const suite of suites.filter(
    (value) => value === "api" || value === "journeys",
  )) {
    await writeFile(join(appRoot, `tests/${suite}/.gitkeep`), "");
  }

  console.log(`Created apps/${id} with manifest and starter files.`);
  console.log(
    `Review apps/${id}/app.manifest.yml and add target-specific expectations before relying on the seed test.`,
  );
  console.log(`Run: moon run test -- app=${id} suite=${suites[0]}`);
} catch (error) {
  console.error(
    `App setup failed: ${error instanceof Error ? error.message : String(error)}`,
  );
  process.exitCode = 1;
} finally {
  rl?.close();
}
