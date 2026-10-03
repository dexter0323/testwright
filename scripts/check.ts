import { spawnSync } from "node:child_process";

const steps: Array<[string, string[]]> = [
  ["pnpm", ["exec", "prettier", "--check", "."]],
  ["node", ["scripts/validate-apps.ts"]],
  ["pnpm", ["exec", "tsc", "--noEmit"]],
  ["pnpm", ["exec", "eslint", "."]],
  ["node", ["scripts/run-tests.ts", "app=todomvc", "suite=ui"]],
];

for (const [command, args] of steps) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  if (result.status !== 0) process.exit(result.status ?? 1);
}
