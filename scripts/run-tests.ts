import { spawnSync } from "node:child_process";
import { loadAppManifest, type AppSuite } from "./app-manifest.ts";

function readOptions(args: string[]): Record<string, string> {
  const options: Record<string, string> = {};
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument.startsWith("--")) {
      const [key, ...valueParts] = argument.slice(2).split("=");
      const value = valueParts.length ? valueParts.join("=") : args[++index];
      if (value === undefined) throw new Error(`Missing value for --${key}`);
      options[key.replaceAll("-", "_")] = value;
    } else {
      const [key, ...valueParts] = argument.split("=");
      if (!valueParts.length) {
        console.error(
          `Unexpected argument "${argument}". Use app=<id> suite=<ui|api|journeys|all>.`,
        );
        process.exit(2);
      }
      options[key] = valueParts.join("=");
    }
  }
  return options;
}

const options = readOptions(process.argv.slice(2));
const isCiInvocation = process.env.TESTWRIGHT_NON_INTERACTIVE === "1";
const appId = options.app;
const suite = options.suite ?? "all";
if (!appId || !["ui", "api", "journeys", "all"].includes(suite)) {
  console.error(
    "Usage: moon run test -- app=<app-id> [suite=<ui|api|journeys|all>]",
  );
  process.exit(2);
}

let manifest;
try {
  manifest = await loadAppManifest(appId);
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(2);
}

const missingEnvironment = manifest.environment.required.filter(
  (name) => !process.env[name],
);
if (missingEnvironment.length) {
  console.error(
    `App "${appId}" is missing required environment variables: ${missingEnvironment.join(", ")}.`,
  );
  process.exit(2);
}

const targetName =
  options.target ??
  process.env[`APP_${appId.toUpperCase().replaceAll("-", "_")}_TARGET`] ??
  manifest.testing.defaultTarget;
if (!manifest.targets[targetName]) {
  console.error(
    `Target "${targetName}" is not declared for app "${appId}". Allowed targets: ${Object.keys(manifest.targets).join(", ")}.`,
  );
  process.exit(2);
}

const headed = options.headed === "true" || options.headed === "1";
if (!isCiInvocation && process.stdin.isTTY && process.stdout.isTTY) {
  const { createInterface } = await import("node:readline/promises");
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  const confirmed = await terminal.question(
    `Run ${appId} suite=${suite} against target "${targetName}" (${manifest.targets[targetName].baseUrl})? [Y/n] `,
  );
  terminal.close();
  if (
    confirmed.trim() &&
    !["y", "yes"].includes(confirmed.trim().toLowerCase())
  ) {
    console.log("Cancelled test run.");
    process.exit(0);
  }
}

if (suite !== "all" && !manifest.testing.suites.includes(suite as AppSuite)) {
  console.error(
    `App "${appId}" does not declare a "${suite}" suite. Declared suites: ${manifest.testing.suites.join(", ")}.`,
  );
  process.exit(2);
}

const playwrightArgs = ["exec", "playwright", "test"];
if (headed) playwrightArgs.push("--headed");

const result = spawnSync("pnpm", playwrightArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    TESTWRIGHT_APP: appId,
    TESTWRIGHT_SUITE: suite,
    TESTWRIGHT_NON_INTERACTIVE: isCiInvocation
      ? "1"
      : process.env.TESTWRIGHT_NON_INTERACTIVE,
    [`APP_${appId.toUpperCase().replaceAll("-", "_")}_TARGET`]: targetName,
  },
});
process.exit(result.status ?? 1);
