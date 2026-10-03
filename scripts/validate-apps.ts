import { listAppIds, loadAppManifest } from "./app-manifest.ts";

const appId = process.argv[2];
if (appId) {
  try {
    await loadAppManifest(appId);
    console.log(`App manifest valid: apps/${appId}/app.manifest.yml`);
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
} else {
  const appIds = listAppIds();
  if (appIds.length === 0) {
    console.error(
      "No app folders found under apps/. Create one with: moon run app-setup",
    );
    process.exit(1);
  }
  const errors = [];
  for (const appId of appIds) {
    try {
      await loadAppManifest(appId);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
  }
  if (errors.length) {
    console.error(
      `Found ${errors.length} app validation error(s):\n${errors.map((error) => `- ${error}`).join("\n")}`,
    );
    process.exit(1);
  }
  console.log(`Validated ${appIds.length} app manifest(s).`);
}
