import { randomUUID } from "node:crypto";

export default function globalSetup(): void {
  process.env.TESTWRIGHT_RUN_ID ??= `${new Date().toISOString().replaceAll(":", "-")}-${randomUUID().slice(0, 8)}`;
}
