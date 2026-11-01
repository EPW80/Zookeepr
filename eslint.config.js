import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "node_modules", "coverage"] },
  js.configs.recommended,
  {
    files: ["**/*.ts"],
    extends: [tseslint.configs.strict],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["public/**/*.js"],
    languageOptions: { globals: globals.browser, sourceType: "module" },
  },
  {
    files: ["eslint.config.js"],
    languageOptions: { globals: globals.node },
  },
);
