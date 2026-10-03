import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";

export default [
  {
    files: ["**/*.ts", "**/*.mts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { project: "./tsconfig.json" },
    },
    plugins: { "@typescript-eslint": tsPlugin },
    rules: { "@typescript-eslint/no-floating-promises": "error" },
  },
  {
    ignores: [
      "node_modules/**",
      ".venv/**",
      "test-results/**",
      "playwright-report/**",
      "docs/site/**",
    ],
  },
];
