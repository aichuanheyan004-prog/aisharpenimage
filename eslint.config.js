import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default [
  { ignores: ["dist", "node_modules"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module"
      }
    },
    rules: {
      "no-unused-vars": "off"
    }
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node
    }
  }
];
