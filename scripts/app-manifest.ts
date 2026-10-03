import { readFileSync, readdirSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

export type AppSuite = "ui" | "api" | "journeys";
export type AppAuth = "none" | "ui" | "api" | "storage-state" | "custom";
export type AppManifest = {
  id: string;
  displayName: string;
  description: string;
  targets: Record<string, { baseUrl: string }>;
  source: { localPath: string | null; repositoryUrl: string | null };
  discovery: {
    appEntryPoints: string[];
    apiSpecs: string[];
    testGuidance: string[];
    relatedDocs: string[];
  };
  environment: { required: string[]; optional: string[] };
  testing: {
    defaultTarget: string;
    suites: AppSuite[];
    auth: AppAuth;
    dataStrategy: string;
  };
};

export const appIdPattern = /^[a-z][a-z0-9-]*$/;
const supportedSuites = new Set<AppSuite>(["ui", "api", "journeys"]);
const supportedAuth = new Set<AppAuth>([
  "none",
  "ui",
  "api",
  "storage-state",
  "custom",
]);
const appsPath = join(import.meta.dirname, "..", "apps");

export function listAppIds(): string[] {
  return readdirSync(appsPath, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();
}

export async function loadAppManifest(appId: string): Promise<AppManifest> {
  if (!appIdPattern.test(appId))
    throw new Error(
      `Invalid app id "${appId}". Use lowercase kebab-case starting with a letter.`,
    );

  const appRoot = join(appsPath, appId);
  const manifestPath = join(appRoot, "app.manifest.yml");
  let manifest: AppManifest;
  try {
    manifest = parse(await readFile(manifestPath, "utf8")) as AppManifest;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      throw new Error(
        `Manifest missing: ${manifestPath}. Create it with: moon run app-setup`,
      );
    throw new Error(
      `Unable to parse ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const errors = validateAppManifest(manifest, appId);
  if (errors.length)
    throw new Error(
      `Invalid app manifest ${manifestPath}:\n${errors.map((message) => `- ${message}`).join("\n")}`,
    );
  return manifest;
}

export function readAppManifestSync(appId: string): AppManifest {
  if (!appIdPattern.test(appId))
    throw new Error(
      `Invalid app id "${appId}". Use lowercase kebab-case starting with a letter.`,
    );
  const manifestPath = join(appsPath, appId, "app.manifest.yml");
  let manifest: AppManifest;
  try {
    manifest = parse(readFileSync(manifestPath, "utf8")) as AppManifest;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT")
      throw new Error(
        `App "${appId}" has no manifest at apps/${appId}/app.manifest.yml. Create it with: moon run app-setup`,
      );
    throw new Error(
      `Unable to parse ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  const errors = validateAppManifest(manifest, appId);
  if (errors.length)
    throw new Error(
      `Invalid app manifest ${manifestPath}:\n${errors.map((message) => `- ${message}`).join("\n")}`,
    );
  return manifest;
}

export function validateAppManifest(
  manifest: unknown,
  expectedId: string,
): string[] {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
    return ["manifest root must be a YAML mapping"];
  const app = manifest as Partial<AppManifest>;
  if (app.id !== expectedId)
    errors.push(`id must equal app folder name "${expectedId}"`);
  if (!appIdPattern.test(app.id ?? ""))
    errors.push("id must be lowercase kebab-case starting with a letter");
  if (typeof app.displayName !== "string" || !app.displayName.trim())
    errors.push("displayName is required");
  if (typeof app.description !== "string" || !app.description.trim())
    errors.push("description is required");
  if (
    !app.targets ||
    typeof app.targets !== "object" ||
    Array.isArray(app.targets) ||
    !Object.keys(app.targets).length
  ) {
    errors.push(
      "targets must define at least one named environment with a baseUrl",
    );
  } else {
    for (const [name, target] of Object.entries(app.targets)) {
      if (typeof target?.baseUrl !== "string")
        errors.push(`targets.${name}.baseUrl is required`);
      else {
        try {
          const url = new URL(target.baseUrl);
          if (!["http:", "https:"].includes(url.protocol))
            errors.push(`targets.${name}.baseUrl must use HTTP or HTTPS`);
        } catch {
          errors.push(`targets.${name}.baseUrl must be an absolute URL`);
        }
      }
    }
  }
  if (
    typeof app.testing?.defaultTarget !== "string" ||
    !app.targets?.[app.testing.defaultTarget]
  ) {
    errors.push(
      "testing.defaultTarget must name a target defined under targets",
    );
  }
  if (
    ["prod", "production"].includes(
      String(app.testing?.defaultTarget).toLowerCase(),
    )
  ) {
    errors.push(
      "testing.defaultTarget cannot be a production target; production must require an explicit target selection",
    );
  }
  if (!Array.isArray(app.testing?.suites) || app.testing.suites.length === 0)
    errors.push("testing.suites must include at least one suite");
  else
    for (const suite of app.testing.suites)
      if (!supportedSuites.has(suite))
        errors.push(`unsupported suite "${suite}"; use ui, api, or journeys`);
  if (!supportedAuth.has(app.testing?.auth as AppAuth))
    errors.push(
      "testing.auth must be one of none, ui, api, storage-state, custom",
    );
  if (
    typeof app.testing?.dataStrategy !== "string" ||
    !app.testing.dataStrategy.trim()
  )
    errors.push("testing.dataStrategy is required");
  if (!app.source || typeof app.source !== "object")
    errors.push("source mapping is required (use null for unknown paths/URLs)");
  else {
    for (const key of ["localPath", "repositoryUrl"] as const) {
      const value = app.source[key];
      if (value !== null && typeof value !== "string")
        errors.push(`source.${key} must be a string or null`);
      if (key === "repositoryUrl" && typeof value === "string") {
        try {
          const url = new URL(value);
          if (!["http:", "https:"].includes(url.protocol))
            errors.push("source.repositoryUrl must use HTTP or HTTPS");
        } catch {
          errors.push("source.repositoryUrl must be an absolute URL");
        }
      }
      if (
        key === "localPath" &&
        typeof value === "string" &&
        value.trim() === ""
      )
        errors.push("source.localPath must be null or a non-empty path");
    }
  }
  if (!app.discovery || typeof app.discovery !== "object")
    errors.push("discovery mapping is required");
  else
    for (const key of [
      "appEntryPoints",
      "apiSpecs",
      "testGuidance",
      "relatedDocs",
    ] as const) {
      if (!Array.isArray(app.discovery[key]))
        errors.push(`discovery.${key} must be a list (use [] when empty)`);
    }
  if (!app.environment || typeof app.environment !== "object")
    errors.push("environment mapping is required");
  else
    for (const key of ["required", "optional"] as const) {
      if (!Array.isArray(app.environment[key]))
        errors.push(
          `environment.${key} must be a list of variable names (use [] when empty)`,
        );
      else
        for (const variable of app.environment[key])
          if (
            typeof variable !== "string" ||
            !/^[A-Z][A-Z0-9_]*$/.test(variable)
          )
            errors.push(
              `environment.${key} entries must be uppercase variable names`,
            );
    }
  return errors;
}
