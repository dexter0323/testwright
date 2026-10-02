import type {
  FullConfig,
  FullResult,
  Reporter,
  TestCase,
  TestResult,
} from "@playwright/test/reporter";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

export default class DiagnosticsReporter implements Reporter {
  private runId = `local-${process.pid}`;

  onBegin(_config: FullConfig): void {
    this.runId = process.env.TESTWRIGHT_RUN_ID ?? this.runId;
  }

  async onTestEnd(test: TestCase, result: TestResult): Promise<void> {
    const projectName = test.parent.project()?.name ?? "root";
    const appId = projectName.replace(/-(ui|api|journeys)$/, "");
    const directory = join(process.cwd(), ".logs", appId, "runs", this.runId);
    const workerDirectory = join(directory, `worker-${result.workerIndex}`);
    const file = join(directory, "playwright.log");
    const message = `${new Date().toISOString()} [${result.status}] ${test.titlePath().join(" › ")} (${result.duration}ms)\n`;
    await mkdir(directory, { recursive: true });
    await appendFile(file, message, "utf8");

    const surface = test.location.file.includes("/api/") ? "api.log" : "ui.log";
    await mkdir(workerDirectory, { recursive: true });
    await appendFile(join(workerDirectory, surface), message, "utf8");
  }

  onEnd(_result: FullResult): void {}
}
