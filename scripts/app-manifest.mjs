import { access, readFile, readdir } from "node:fs/promises";
import { constants } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

export const appIdPattern = /^[a-z][a-z0-9-]*$/;
const supportedSuites = new Set(["ui", "api", "journeys"]);
const supportedAuth = new Set(["none", "ui", "api", "storage-state", "custom"]);

export async function loadAppManifest(appId) {
  if (!appIdPattern.test(appId))
    throw new Error(
      `Invalid app id "${appId}". Use lowercase kebab-case starting with a letter.`,
    );

  const appRoot = join(process.cwd(), "apps", appId);
  const manifestPath = join(appRoot, "app.manifest.yml");
  let manifest;
  try {
    manifest = parse(await readFile(manifestPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT")
      throw new Error(
        `Manifest missing: ${manifestPath}. Create it with: moon run root:app-setup`,
      );
    throw new Error(`Unable to parse ${manifestPath}: ${error.message}`);
  }

  const errors = validateAppManifest(manifest, appId);
  if (errors.length)
    throw new Error(
      `Invalid app manifest ${manifestPath}:\n${errors.map((message) => `- ${message}`).join("\n")}`,
    );
  return manifest;
}

export function validateAppManifest(manifest, expectedId) {
  const errors = [];
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
    return ["manifest root must be a YAML mapping"];
  if (manifest.id !== expectedId)
    errors.push(`id must equal app folder name "${expectedId}"`);
  if (!appIdPattern.test(manifest.id ?? ""))
    errors.push("id must be lowercase kebab-case starting with a letter");
  if (typeof manifest.displayName !== "string" || !manifest.displayName.trim())
    errors.push("displayName is required");
  if (typeof manifest.description !== "string" || !manifest.description.trim())
    errors.push("description is required");
  if (
    !manifest.targets ||
    typeof manifest.targets !== "object" ||
    Array.isArray(manifest.targets) ||
    !Object.keys(manifest.targets).length
  ) {
    errors.push(
      "targets must define at least one named environment with a baseUrl",
    );
  } else {
    for (const [name, target] of Object.entries(manifest.targets)) {
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
    typeof manifest.testing?.defaultTarget !== "string" ||
    !manifest.targets?.[manifest.testing.defaultTarget]
  ) {
    errors.push(
      "testing.defaultTarget must name a target defined under targets",
    );
  }
  if (
    ["prod", "production"].includes(
      String(manifest.testing?.defaultTarget).toLowerCase(),
    )
  ) {
    errors.push(
      "testing.defaultTarget cannot be a production target; production must require an explicit target selection",
    );
  }
  if (
    !Array.isArray(manifest.testing?.suites) ||
    manifest.testing.suites.length === 0
  )
    errors.push("testing.suites must include at least one suite");
  else
    for (const suite of manifest.testing.suites)
      if (!supportedSuites.has(suite))
        errors.push(`unsupported suite "${suite}"; use ui, api, or journeys`);
  if (!supportedAuth.has(manifest.testing?.auth))
    errors.push(
      "testing.auth must be one of none, ui, api, storage-state, custom",
    );
  if (
    typeof manifest.testing?.dataStrategy !== "string" ||
    !manifest.testing.dataStrategy.trim()
  )
    errors.push("testing.dataStrategy is required");
  if (!manifest.source || typeof manifest.source !== "object")
    errors.push("source mapping is required (use null for unknown paths/URLs)");
  else {
    for (const key of ["localPath", "repositoryUrl"]) {
      const value = manifest.source[key];
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
  if (!manifest.discovery || typeof manifest.discovery !== "object")
    errors.push("discovery mapping is required");
  else
    for (const key of [
      "appEntryPoints",
      "apiSpecs",
      "testGuidance",
      "relatedDocs",
    ]) {
      if (!Array.isArray(manifest.discovery[key]))
        errors.push(`discovery.${key} must be a list (use [] when empty)`);
    }
  if (!manifest.environment || typeof manifest.environment !== "object")
    errors.push("environment mapping is required");
  else
    for (const key of ["required", "optional"]) {
      if (!Array.isArray(manifest.environment[key]))
        errors.push(
          `environment.${key} must be a list of variable names (use [] when empty)`,
        );
      else
        for (const variable of manifest.environment[key])
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

export async function validateRegisteredApps() {
  const appRoots = await readdir(join(process.cwd(), "apps"), {
    withFileTypes: true,
  });
  const errors = [];
  for (const entry of appRoots.filter((item) => item.isDirectory())) {
    try {
      await loadAppManifest(entry.name);
      await access(
        join(process.cwd(), "apps", entry.name, "moon.yml"),
        constants.R_OK,
      );
    } catch (error) {
      errors.push(error.message);
    }
  }
  const workspaceConfig = await readFile(
    join(process.cwd(), ".moon/workspace.yml"),
    "utf8",
  );
  const workspace = parse(workspaceConfig);
  const declaredSources = workspace.projects?.sources ?? {};
  for (const entry of appRoots.filter((item) => item.isDirectory())) {
    if (declaredSources[entry.name] !== `apps/${entry.name}`) {
      errors.push(
        `App "${entry.name}" has a manifest but is not explicitly registered in .moon/workspace.yml under projects.sources.`,
      );
    }
  }
  return errors;
}
