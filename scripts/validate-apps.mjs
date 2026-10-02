import { readdir } from "node:fs/promises";
import { join } from "node:path";
import { loadAppManifest, validateRegisteredApps } from "./app-manifest.mjs";

const appId = process.argv[2];
if (appId) {
  try {
    await loadAppManifest(appId);
    console.log(`App manifest valid: apps/${appId}/app.manifest.yml`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
} else {
  let appFolders = [];
  try {
    appFolders = (
      await readdir(join(process.cwd(), "apps"), { withFileTypes: true })
    ).filter((entry) => entry.isDirectory());
  } catch (error) {
    console.error(`Unable to read apps/: ${error.message}`);
    process.exit(1);
  }
  if (appFolders.length === 0) {
    console.error(
      "No app folders found under apps/. Create one with: moon run root:app-setup",
    );
    process.exit(1);
  }
  const errors = await validateRegisteredApps();
  if (errors.length) {
    console.error(
      `Found ${errors.length} app validation error(s):\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log(`Validated ${appFolders.length} app manifest(s).`);
}
