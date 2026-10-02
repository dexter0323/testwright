export type AppSuite = "ui" | "api" | "journeys";

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
    auth: "none" | "ui" | "api" | "storage-state" | "custom";
    dataStrategy: string;
  };
};

export const appIdPattern: RegExp;
export function loadAppManifest(appId: string): Promise<AppManifest>;
export function validateAppManifest(
  manifest: unknown,
  expectedId: string,
): string[];
export function validateRegisteredApps(): Promise<string[]>;
