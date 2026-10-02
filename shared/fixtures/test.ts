import { test as base, expect } from "@playwright/test";
import { appendFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

function redact(message: string): string {
  return message
    .replace(/(bearer\s+)[^\s,;]+/gi, "$1[REDACTED]")
    .replace(
      /([?&](?:access_token|refresh_token|id_token|token|api[_-]?key|client_secret|password|secret|code)=)[^&#\s]*/gi,
      "$1[REDACTED]",
    )
    .replace(
      /\b(password|token|secret|api[_-]?key)(\s*[:=]\s*)[^\s,;]+/gi,
      "$1$2[REDACTED]",
    );
}

export const test = base.extend({
  page: async ({ page }, use, testInfo) => {
    const appId = testInfo.project.name.replace(/-(ui|api|journeys)$/, "");
    const runId = process.env.TESTWRIGHT_RUN_ID ?? `local-${process.pid}`;
    const directory = join(
      process.cwd(),
      ".logs",
      appId,
      "runs",
      runId,
      `worker-${testInfo.workerIndex}`,
    );
    const uiLog = join(directory, "ui.log");
    const consoleLog = join(directory, "console.log");
    const networkLog = join(directory, "network.log");

    await mkdir(directory, { recursive: true });
    const record = (file: string, message: string) =>
      appendFile(file, `${new Date().toISOString()} ${message}\n`, "utf8");

    page.on("console", (message) => {
      void record(
        consoleLog,
        `[${message.type()}] ${redact(message.text())}`,
      ).catch(() => undefined);
    });
    page.on("pageerror", (error) => {
      void record(consoleLog, `[pageerror] ${redact(error.message)}`).catch(
        () => undefined,
      );
    });
    page.on("requestfailed", (request) => {
      void record(
        networkLog,
        `[failed] ${request.method()} ${redact(request.url())} ${redact(request.failure()?.errorText ?? "")}`,
      ).catch(() => undefined);
    });
    page.on("response", (response) => {
      if (response.status() >= 400) {
        void record(
          networkLog,
          `[${response.status()}] ${response.request().method()} ${redact(response.url())}`,
        ).catch(() => undefined);
      }
    });

    await record(uiLog, `[start] ${testInfo.title}`);
    await use(page);
    await record(uiLog, `[${testInfo.status}] ${testInfo.title}`);
  },
});

export { expect };
